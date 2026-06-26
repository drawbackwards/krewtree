-- ============================================================
-- Worker contact privacy hardening (RLS audit warnings)
--
-- Two over-broad reads, both fixed to "owner OR a company the worker has
-- applied to" — the same gate already used for worker_references.
--
-- 1. worker_profiles.phone — the table's SELECT policy is USING(TRUE) TO
--    authenticated, so ANY signed-in user (any other worker, any company,
--    even one the worker never applied to) could read every worker's phone.
--    RLS is row-level and can't mask a single column, so: authenticated
--    loses its table-wide SELECT and is re-granted every column EXCEPT
--    phone, and phone is read through a viewer-aware view that returns it
--    only to the worker themselves or to companies they applied to.
--
-- 2. resumes storage bucket — it was public=TRUE (files served at permanent
--    unauthenticated getPublicUrl links) with a resume_public_read policy
--    letting any authenticated user read any resume. Now private, read-gated
--    to the owner (via the existing resume_owner_write FOR ALL policy) and
--    applied-to companies; the app fetches time-limited signed URLs.
--
-- NOTE: authenticated now has a column-level grant on worker_profiles, so
-- any NEW column added to the table must also be added to the GRANT below
-- (and to the view) or authenticated reads of it will fail. Secure-by-default.
-- ============================================================

-- ── 1. worker_profiles.phone ────────────────────────────────
-- Re-grant authenticated every column except phone. A column-level REVOKE
-- can't subtract from a table-level SELECT grant, so revoke the table grant
-- first. (anon has no SELECT policy on worker_profiles, so it can't read the
-- table at all — no anon change needed.)
REVOKE SELECT ON worker_profiles FROM authenticated;

GRANT SELECT (
  id, first_name, last_name, city, region, primary_trade, bio, avatar_url,
  is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked,
  is_premium, references_count, references_consent_confirmed_at,
  latitude, longitude, created_at, updated_at
) ON worker_profiles TO authenticated;

-- Viewer-aware masked mirror. phone is returned only to the worker themselves
-- or to a company the worker has applied to; everyone else gets ''. The other
-- columns are unmasked (worker profiles are discoverable by companies).
-- security_invoker stays OFF (default) so the view reads phone as its owner;
-- callers only need SELECT on the view. NOT granted to anon.
CREATE OR REPLACE VIEW worker_profiles_secure AS
  SELECT
    id, first_name, last_name, city, region, primary_trade, bio, avatar_url,
    is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked,
    is_premium, references_count, references_consent_confirmed_at,
    latitude, longitude, created_at, updated_at,
    CASE
      WHEN id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM applications a
          WHERE a.worker_id = worker_profiles.id
            AND a.company_id = (SELECT auth.uid())
        )
      THEN phone
      ELSE ''
    END AS phone
  FROM worker_profiles;

GRANT SELECT ON worker_profiles_secure TO authenticated;

-- ── 2. resumes storage bucket ───────────────────────────────
-- Private bucket: files are no longer served at public getPublicUrl links;
-- the app uses short-lived createSignedUrl, which is subject to the policies
-- below.
UPDATE storage.buckets SET public = FALSE WHERE id = 'resumes';

-- Owner read+write is already covered by resume_owner_write (FOR ALL, scoped
-- to the worker's own folder). Replace the blanket authenticated-read policy
-- with one that only lets a company read a resume when the owning worker has
-- applied to it. Resume paths are `<worker_id>/<file>`.
DROP POLICY IF EXISTS "resume_public_read" ON storage.objects;

CREATE POLICY "resume_company_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.worker_id::text = (storage.foldername(name))[1]
        AND a.company_id = (SELECT auth.uid())
    )
  );
