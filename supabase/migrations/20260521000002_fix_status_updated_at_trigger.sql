-- ============================================================
-- FIX stamp_status_updated_at trigger after kanban_stage drop
--
-- 20260521000001_drop_kanban_stage removed applications.kanban_stage but
-- left behind stamp_status_updated_at() (from 20260422000002), which still
-- references NEW.kanban_stage / OLD.kanban_stage. Every UPDATE on
-- applications now errors with:
--   record "new" has no field "kanban_stage"
-- which blocks shortlist / reject / hire / stage-move from the UI.
--
-- The intent of the original trigger was: stamp status_updated_at when the
-- applicant moves between kanban columns. Post-migration that's a change to
-- current_stage_id. We also stamp on status transitions (active ↔ terminal)
-- so the existing trigger from 20260414000001 becomes redundant — fold both
-- into one trigger to avoid double-stamping.
-- ============================================================

CREATE OR REPLACE FUNCTION stamp_status_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_stage_id IS DISTINCT FROM OLD.current_stage_id
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END $$;

-- The 20260414000001 trigger covered status-only changes; now folded into the
-- function above. Drop it so we don't double-stamp.
DROP TRIGGER IF EXISTS trg_application_status_updated_at ON applications;
DROP FUNCTION IF EXISTS set_application_status_updated_at();
