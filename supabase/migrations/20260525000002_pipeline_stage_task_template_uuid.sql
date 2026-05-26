-- ============================================================
-- KREWTREE — Convert pipeline_stage_task_template.stage_id to UUID
--
-- The pre-pipeline-foundation table stored stage_id as a TEXT enum
-- ('screening' | 'assessment' | 'interview' | 'offer') and migration
-- 20260521000001 only renamed the column without dropping the CHECK
-- constraint or backfilling values. As a result, the settings UI
-- (which writes pipeline_stage UUIDs) hits constraint 23514 on insert,
-- and existing rows like 'screening' don't match any pipeline_stage.id.
--
-- This migration:
--   1. Drops the stage_type CHECK constraint.
--   2. Rewrites existing slug rows to the matching pipeline_stage UUID
--      (case-insensitive name match within the same company).
--   3. Deletes any template rows that can't be matched (orphans).
--
-- Column stays TEXT to stay consistent with application_task.stage_id
-- and application_stage_notes.stage_id, which are also TEXT-of-UUID
-- per the May 2026 pivot.
-- ============================================================

ALTER TABLE pipeline_stage_task_template
  DROP CONSTRAINT IF EXISTS pipeline_stage_task_template_stage_type_check;

UPDATE pipeline_stage_task_template ptt
SET stage_id = ps.id::text
FROM pipeline_stage ps
JOIN company_pipeline cp ON cp.id = ps.pipeline_id
WHERE cp.company_id = ptt.company_id
  AND LOWER(ps.name) = LOWER(ptt.stage_id);

DELETE FROM pipeline_stage_task_template
WHERE stage_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
