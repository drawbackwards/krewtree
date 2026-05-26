-- ============================================================
-- KREWTREE — Stage on application_log
--
-- Adds stage_id to application_log so the Log tab can render a
-- stage pill alongside each entry (matching the drawer header's
-- stage pill). Nullable because some events have no associated
-- stage (e.g. application_created fires before any pipeline
-- stage is entered).
--
-- We store stage_id at write time rather than deriving at read
-- time, since the applicant's current stage may have moved on
-- by the time the log is viewed — the goal is to show where
-- the event *happened*, not where the applicant sits now.
-- ============================================================

ALTER TABLE application_log
  ADD COLUMN IF NOT EXISTS stage_id UUID
    REFERENCES pipeline_stage (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_application_log_stage
  ON application_log (stage_id)
  WHERE stage_id IS NOT NULL;
