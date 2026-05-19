-- Per-stage SLA thresholds. NULL = no SLA tracking for that stage.
-- slaState is derived live in the application layer from
-- (now - stage_entered_at) compared against these thresholds.
--
-- Approaching threshold should be < breached. If only one is set, the other is
-- ignored (e.g. only `breached_hours` set means "no approaching warning, just
-- straight to breached after N hours").

ALTER TABLE company_pipeline_stage
  ADD COLUMN IF NOT EXISTS sla_hours_approaching INTEGER,
  ADD COLUMN IF NOT EXISTS sla_hours_breached    INTEGER;

ALTER TABLE company_pipeline_stage
  DROP CONSTRAINT IF EXISTS sla_hours_positive;
ALTER TABLE company_pipeline_stage
  ADD CONSTRAINT sla_hours_positive
  CHECK (
    (sla_hours_approaching IS NULL OR sla_hours_approaching > 0)
    AND (sla_hours_breached IS NULL OR sla_hours_breached > 0)
  );

ALTER TABLE company_pipeline_stage
  DROP CONSTRAINT IF EXISTS sla_hours_ordered;
ALTER TABLE company_pipeline_stage
  ADD CONSTRAINT sla_hours_ordered
  CHECK (
    sla_hours_approaching IS NULL
    OR sla_hours_breached IS NULL
    OR sla_hours_approaching < sla_hours_breached
  );
