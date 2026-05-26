-- ============================================================
-- KREWTREE — Task note edit tracking
--
-- Adds updated_at / updated_by to application_task_note so the
-- drawer can mark edited notes with an "(edited)" indicator and
-- the Log tab can record edits as their own events.
--
-- Also grants the company role UPDATE on rows for their own
-- applications — the original notes-table migration only set up
-- SELECT + INSERT, so editing would otherwise be silently blocked
-- by RLS.
-- ============================================================

ALTER TABLE application_task_note
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "company_update_task_notes" ON application_task_note;
CREATE POLICY "company_update_task_notes"
  ON application_task_note FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  )
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );
