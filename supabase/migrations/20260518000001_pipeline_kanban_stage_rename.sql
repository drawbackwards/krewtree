-- Rename kanban_stage values to match semantic type names used in the frontend.
-- 'new'      → 'screening'
-- 'reviewed' → 'assessment'
-- Adds 'withdrawn' and 'archived' as valid terminal states.
--
-- The frontend translation shim (DB_TO_STAGE / STAGE_TO_DB in applicantService.ts)
-- is removed after this migration runs, since DB values now match app values 1:1.

-- Drop existing CHECK constraint
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_kanban_stage_check;

-- Remap existing rows
UPDATE applications SET kanban_stage = 'screening'  WHERE kanban_stage = 'new';
UPDATE applications SET kanban_stage = 'assessment' WHERE kanban_stage = 'reviewed';

-- Install new CHECK with full value set
ALTER TABLE applications
  ADD CONSTRAINT applications_kanban_stage_check
  CHECK (kanban_stage IN (
    'screening', 'assessment', 'interview', 'offer',
    'hired', 'rejected', 'withdrawn', 'archived'
  ));
