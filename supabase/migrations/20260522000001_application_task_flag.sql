-- ============================================================
-- KREWTREE — Task flagging
--
-- Adds is_flagged to application_task so a recruiter can mark a
-- specific task as "needs follow-up." The applicant card surfaces
-- the flag when any of their tasks are flagged, using the task
-- label as the tooltip context.
-- ============================================================

ALTER TABLE application_task
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index — most rows are unflagged, so this stays small and
-- speeds up the "any flagged tasks on this application?" lookup the
-- applicant list/kanban performs.
CREATE INDEX IF NOT EXISTS idx_application_task_flagged
  ON application_task (application_id)
  WHERE is_flagged = TRUE;
