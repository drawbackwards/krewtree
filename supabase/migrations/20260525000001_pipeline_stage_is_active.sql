-- ============================================================
-- KREWTREE — Pipeline stage active flag
--
-- Adds is_active to pipeline_stage so a company can disable a stage
-- without losing its name, order, or task templates. Disabled stages
-- are hidden from the kanban, stage picker, and new-job snapshots,
-- but remain visible in settings so they can be re-enabled later.
-- ============================================================

ALTER TABLE pipeline_stage
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_active
  ON pipeline_stage (pipeline_id, sort_order)
  WHERE is_active = TRUE;
