-- ============================================================
-- Make active job listings and company profiles publicly readable.
-- Workers must still be authenticated + verified to apply.
-- ============================================================

-- ── jobs ──────────────────────────────────────────────────────
-- Drop the authenticated-only policy and replace with one that
-- allows anon users to read active jobs.
-- auth.uid() returns NULL for anon, so `company_id = auth.uid()`
-- is safely false for unauthenticated requests.
DROP POLICY IF EXISTS "active_jobs_read" ON jobs;

CREATE POLICY "public_active_jobs_read" ON jobs
  FOR SELECT
  USING (status = 'active' OR company_id = auth.uid());

-- ── company_profiles ──────────────────────────────────────────
-- Jobs JOIN to company_profiles, so that table also needs public read.
DROP POLICY IF EXISTS "authenticated_read" ON company_profiles;

CREATE POLICY "public_read" ON company_profiles
  FOR SELECT
  USING (TRUE);
