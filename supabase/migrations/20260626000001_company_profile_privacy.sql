-- ============================================================
-- Company profile privacy hardening (beta blocker)
--
-- Before this, company_profiles had a USING(TRUE) SELECT policy and the
-- anon role held table-wide SELECT, so anyone with the public anon key
-- could read phone / hq_street / hq_postal_code for every company
-- REGARDLESS of the phone_public / address_public toggles (RLS is
-- row-level and cannot mask columns), and soft-deleted companies stayed
-- publicly readable during the 30-day grace window. The privacy toggles
-- were only honored in the client (getPublicCompanyProfile), so they were
-- trivially bypassable.
--
-- Fix, three parts:
--   1. The row policy now hides soft-deleted companies from everyone but
--      the owner. Embeds for active jobs still resolve company name/logo
--      (those rows are not soft-deleted).
--   2. anon loses its table-wide SELECT and is re-granted every column
--      EXCEPT phone / hq_street / hq_postal_code, so the raw contact
--      fields cannot be read directly with the anon key. authenticated
--      keeps full column access so a company can still read its OWN
--      profile (getCompanyProfile / completeness recompute / settings);
--      cross-account authenticated reads of these columns are a separate,
--      lower-severity item tracked in the RLS audit.
--   3. company_public_profiles is the masked public read surface: it
--      honors the *_public flags, assembles the address, and drops
--      soft-deleted rows. getPublicCompanyProfile now reads it, so the
--      toggles are enforced server-side for anon AND authenticated viewers.
--
-- NOTE: because anon now has a column-level grant, any NEW public-facing
-- column added to company_profiles must also be added to the GRANT below,
-- or anon reads of it will fail. This is secure-by-default and intentional.
-- ============================================================

-- 1. Row policy: hide soft-deleted companies from non-owners.
DROP POLICY IF EXISTS "public_read" ON company_profiles;

CREATE POLICY "public_read" ON company_profiles
  FOR SELECT
  USING (deleted_at IS NULL OR id = (SELECT auth.uid()));

-- 2. Column-level read grant for anon (every column except the sensitive
--    contact fields). The table-wide grant must be revoked first: a
--    column-level REVOKE cannot subtract from a table-level SELECT grant.
REVOKE SELECT ON company_profiles FROM anon;

GRANT SELECT (
  id, name, logo_url, location, industry, is_verified, description, size,
  website, tagline, culture, mission, team_size, founded, headquarters,
  avg_rating, review_count, created_at, updated_at,
  phone_public, email_public, address_public,
  hq_city, hq_state, service_area_radius, service_area_override,
  additional_industries, contract_types,
  facebook_url, instagram_url, linkedin_url, youtube_url, tiktok_url,
  regulix_connected, deleted_at, profile_complete_pct
) ON company_profiles TO anon;

-- 3. Masked public read surface. security_invoker stays OFF (the default),
--    so the view reads the base table as its owner and can resolve the
--    sensitive columns into their masked form; callers only need SELECT on
--    the view, not on the underlying contact columns.
CREATE OR REPLACE VIEW company_public_profiles AS
  SELECT
    id, name, tagline, logo_url, industry, additional_industries, size,
    founded, description, website,
    CASE WHEN phone_public THEN phone ELSE '' END AS phone,
    CASE
      WHEN address_public
      THEN concat_ws(', ',
             nullif(hq_street, ''), nullif(hq_city, ''),
             nullif(hq_state, ''), nullif(hq_postal_code, ''))
      ELSE ''
    END AS hq_full_address,
    hq_city, hq_state,
    service_area_radius, service_area_override, contract_types,
    facebook_url, instagram_url, linkedin_url, youtube_url, tiktok_url,
    is_verified, regulix_connected
  FROM company_profiles
  WHERE deleted_at IS NULL;

GRANT SELECT ON company_public_profiles TO anon, authenticated;
