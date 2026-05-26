-- ============================================================
-- KREWTREE — task_label + note_body on application_log
--
-- The Log tab needs to render each entry as structured data:
-- action + task name + (optional) note body + stage pill +
-- timestamp. Until now we only stored a free-form description
-- string, which forced the UI to regex-parse it to surface the
-- task name and made it impossible to show the actual note body.
--
-- Both columns are denormalized snapshots taken at write time:
-- if the task is later renamed or the note edited, the log keeps
-- the value as it was when the event happened (audit log
-- semantics).
-- ============================================================

ALTER TABLE application_log
  ADD COLUMN IF NOT EXISTS task_label TEXT,
  ADD COLUMN IF NOT EXISTS note_body  TEXT;
