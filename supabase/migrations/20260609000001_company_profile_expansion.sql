-- ============================================================
-- KREWTREE — Company Profile Expansion (Phase 1)
-- Adds the columns and tables needed for the company signup
-- refinement and the upcoming company profile creation flow.
-- ============================================================

-- ── company_profiles: new columns ─────────────────────────
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS phone                 TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone_public          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_public          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS address_public        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hq_city               TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hq_state              TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hq_street             TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hq_postal_code        TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_area_radius   INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS service_area_override TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS additional_industries TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contract_types        TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS facebook_url          TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url         TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url          TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url           TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_url            TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS regulix_connected     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_complete_pct  INTEGER NOT NULL DEFAULT 0;

-- ── company_licenses ──────────────────────────────────────
-- One row per license entry. Verification record is separate
-- from user-entered data so we can add verifiers (ROC, CSLB)
-- later without migration pain.
CREATE TABLE IF NOT EXISTS company_licenses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  license_type          TEXT NOT NULL,
  jurisdiction          TEXT NOT NULL,                   -- US state code
  license_number        TEXT NOT NULL,
  expiration_date       DATE,
  verification_status   TEXT NOT NULL DEFAULT 'unverified'
                          CHECK (verification_status IN ('unverified','pending','verified','failed','expired')),
  verification_payload  JSONB,
  verified_at           TIMESTAMPTZ,
  verifier              TEXT,
  display_order         INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_licenses_company ON company_licenses(company_id);

CREATE TRIGGER set_company_licenses_updated_at
  BEFORE UPDATE ON company_licenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── company_additional_locations ──────────────────────────
CREATE TABLE IF NOT EXISTS company_additional_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  street        TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  state         TEXT NOT NULL DEFAULT '',
  postal_code   TEXT NOT NULL DEFAULT '',
  radius        INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_additional_locations_company
  ON company_additional_locations(company_id);

CREATE TRIGGER set_company_additional_locations_updated_at
  BEFORE UPDATE ON company_additional_locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── company_photos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  caption       TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_photos_company ON company_photos(company_id);

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE company_licenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_additional_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_photos                ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read" ON company_licenses FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON company_licenses FOR ALL
  USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

CREATE POLICY "authenticated_read" ON company_additional_locations FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON company_additional_locations FOR ALL
  USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

CREATE POLICY "authenticated_read" ON company_photos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON company_photos FOR ALL
  USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

-- ── handle_new_user trigger ───────────────────────────────
-- Replaces whatever lived in the Supabase project before so behavior
-- is deterministic going forward. Reads role + identity fields from
-- raw_user_meta_data set by AuthContext.signUp(), then writes the
-- user_roles row plus the matching worker_profiles or company_profiles
-- row. Idempotent via ON CONFLICT.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_role         TEXT;
  v_first_name   TEXT;
  v_last_name    TEXT;
  v_company_name TEXT;
  v_industry     TEXT;
  v_phone        TEXT;
  v_hq_city      TEXT;
  v_hq_state     TEXT;
BEGIN
  v_role         := COALESCE(NEW.raw_user_meta_data->>'role', '');
  v_first_name   := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name    := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
  v_industry     := COALESCE(NEW.raw_user_meta_data->>'industry', '');
  v_phone        := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_hq_city      := COALESCE(NEW.raw_user_meta_data->>'hq_city', '');
  v_hq_state     := COALESCE(NEW.raw_user_meta_data->>'hq_state', '');

  IF v_role = 'company' THEN
    INSERT INTO user_roles (id, role)
      VALUES (NEW.id, 'company')
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO company_profiles (
      id, name, industry, phone, hq_city, hq_state
    )
      VALUES (
        NEW.id, v_company_name, v_industry, v_phone, v_hq_city, v_hq_state
      )
      ON CONFLICT (id) DO NOTHING;
  ELSIF v_role = 'worker' THEN
    INSERT INTO user_roles (id, role)
      VALUES (NEW.id, 'worker')
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO worker_profiles (id, first_name, last_name)
      VALUES (NEW.id, v_first_name, v_last_name)
      ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── setup_company_profile: keep callable for backward compat ──
-- The trigger above is now the canonical signup path; this RPC stays
-- for any direct-invocation callers but is updated to accept the
-- expanded fields so callers can stay in sync.
DROP FUNCTION IF EXISTS setup_company_profile(UUID, TEXT);
CREATE OR REPLACE FUNCTION setup_company_profile(
  p_user_id      UUID,
  p_name         TEXT DEFAULT '',
  p_industry     TEXT DEFAULT '',
  p_phone        TEXT DEFAULT '',
  p_hq_city      TEXT DEFAULT '',
  p_hq_state     TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (id, role)
    VALUES (p_user_id, 'company')
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO company_profiles (id, name, industry, phone, hq_city, hq_state)
    VALUES (p_user_id, p_name, p_industry, p_phone, p_hq_city, p_hq_state)
    ON CONFLICT (id) DO NOTHING;
END;
$$;
