-- ============================================================
-- KREWTREE — Soft delete for companies (Phase 4)
-- A company that opts to delete their account:
--   1. company_profiles.deleted_at is set (drives "missing" rendering)
--   2. All of their open/paused jobs flip to status='closed'
--   3. Their active applications transition to status='terminal_archived'
--      so workers see them as archived in their history
--
-- A nightly job (not added in this migration) hard-deletes rows whose
-- deleted_at is more than 30 days in the past.
-- ============================================================

CREATE OR REPLACE FUNCTION soft_delete_company()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID := auth.uid();
BEGIN
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Guard: only run if a company_profiles row exists for the caller and is not
  -- already deleted. Workers calling this is a no-op since they don't have
  -- a company_profiles row.
  IF NOT EXISTS (
    SELECT 1 FROM company_profiles
    WHERE id = v_company_id AND deleted_at IS NULL
  ) THEN
    RETURN;
  END IF;

  -- 1. Mark the company deleted.
  UPDATE company_profiles
  SET deleted_at = NOW()
  WHERE id = v_company_id;

  -- 2. Close all open + paused jobs.
  UPDATE jobs
  SET status = 'closed'
  WHERE company_id = v_company_id
    AND status IN ('active', 'paused');

  -- 3. Archive active applications attached to those jobs.
  UPDATE applications
  SET status = 'terminal_archived'
  WHERE status = 'active'
    AND job_id IN (SELECT id FROM jobs WHERE company_id = v_company_id);
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_company() TO authenticated;
