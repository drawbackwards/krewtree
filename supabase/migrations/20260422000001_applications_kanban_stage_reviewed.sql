-- Rename kanban stage "screening" → "reviewed" to match TS types + product copy.
-- Drop the old CHECK, remap existing rows, install new CHECK.

ALTER TABLE applications DROP CONSTRAINT applications_kanban_stage_check;

UPDATE applications SET kanban_stage = 'reviewed' WHERE kanban_stage = 'screening';

ALTER TABLE applications
  ADD CONSTRAINT applications_kanban_stage_check
  CHECK (kanban_stage IN ('new', 'reviewed', 'interview', 'offer', 'hired', 'rejected'));
