-- ============================================================
-- KREWTREE — application_log company INSERT policy
--
-- The original application_log migration shipped with a SELECT
-- policy only, so every appendLog() call from the company client
-- was silently rejected by RLS. The Log tab and the new
-- task_notes_updated event both depend on the company being able
-- to write entries for their own applications.
-- ============================================================

DROP POLICY IF EXISTS "company_write_log" ON application_log;
CREATE POLICY "company_write_log"
  ON application_log FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );
