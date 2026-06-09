-- Saved searches for the company-side Discover page. Mirrors the worker-side
-- saved_searches table but scoped by company and using the Discover filter
-- vocabulary (skills array + regulix + sort).

CREATE TABLE IF NOT EXISTS company_discover_saved_searches (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label         TEXT        NOT NULL,
  query         TEXT        NOT NULL DEFAULT '',
  skills        TEXT[]      NOT NULL DEFAULT '{}',
  regulix_only  BOOLEAN     NOT NULL DEFAULT FALSE,
  sort          TEXT        NOT NULL DEFAULT 'recent',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_discover_saved_searches_company
  ON company_discover_saved_searches(company_id);

ALTER TABLE company_discover_saved_searches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_discover_saved_searches'
      AND policyname = 'company_own_discover_searches'
  ) THEN
    CREATE POLICY "company_own_discover_searches" ON company_discover_saved_searches
      FOR ALL
      USING  (company_id = auth.uid())
      WITH CHECK (company_id = auth.uid());
  END IF;
END $$;
