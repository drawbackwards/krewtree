-- ============================================================
-- DROP kanban_stage — Align applications with pipeline-foundation spec
-- May 2026 pivot completion: remove the semantic-type enum from applications
-- and application_task; use current_stage_id (UUID) + status (new enum) instead.
--
-- Depends on: 20260519000001_pipeline_foundation (adds current_stage_id,
--   pipeline_snapshot, company_pipeline, pipeline_stage)
-- ============================================================

-- ── 1. Add status column (new enum) to applications ───────────
-- The old `status` column ('Applied'/'Viewed'/etc.) becomes the new
-- pipeline-foundation status. Rename old column first.

ALTER TABLE applications RENAME COLUMN status TO legacy_worker_status;

ALTER TABLE applications
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN (
    'active',
    'terminal_hired',
    'terminal_rejected',
    'terminal_withdrawn',
    'terminal_archived'
  ));

-- ── 2. Populate status from kanban_stage ──────────────────────

UPDATE applications SET status = CASE kanban_stage
  WHEN 'hired'     THEN 'terminal_hired'
  WHEN 'rejected'  THEN 'terminal_rejected'
  WHEN 'withdrawn' THEN 'terminal_withdrawn'
  WHEN 'archived'  THEN 'terminal_archived'
  ELSE                   'active'
END;

-- ── 3. Ensure current_stage_id is set for all active applications ─
-- The pipeline_foundation migration populated this; NULL means no
-- pipeline was found — fall back to the first stage of the job's snapshot.

UPDATE applications a
SET current_stage_id = (
  SELECT (stage_el ->> 'id')::uuid
  FROM   jsonb_array_elements(
           (SELECT pipeline_snapshot -> 'stages' FROM jobs WHERE id = a.job_id)
         ) AS stage_el
  ORDER BY (stage_el ->> 'order')::int ASC
  LIMIT 1
)
WHERE current_stage_id IS NULL
  AND status = 'active';

-- ── 4. Make current_stage_id NOT NULL for active applications ─
-- Terminal applications may have current_stage_id = NULL (their last stage
-- was recorded at terminal time; allow NULL for terminal only).
-- Enforce via check constraint rather than column NOT NULL to allow terminal nulls.

ALTER TABLE applications
  ADD CONSTRAINT active_requires_stage_id
  CHECK (status != 'active' OR current_stage_id IS NOT NULL);

-- ── 5. Drop kanban_stage ──────────────────────────────────────

ALTER TABLE applications DROP COLUMN kanban_stage;
ALTER TABLE applications DROP COLUMN legacy_worker_status;

-- ── 6. Migrate application_task.stage_type → stage_id (UUID) ─
-- stage_type was an enum ('screening'|'assessment'|'interview'|'offer').
-- Replace with a text column storing the pipeline_stage.id UUID from the
-- job's pipeline snapshot (positional: screening=1, assessment=2, etc.)

ALTER TABLE application_task ADD COLUMN stage_id TEXT;

UPDATE application_task t
SET stage_id = (
  SELECT stage_el ->> 'id'
  FROM   jobs j,
         jsonb_array_elements(j.pipeline_snapshot -> 'stages') AS stage_el
  WHERE  j.id = (SELECT job_id FROM applications WHERE id = t.application_id)
    AND  (stage_el ->> 'order')::int = CASE t.stage_type
           WHEN 'screening'  THEN 1
           WHEN 'assessment' THEN 2
           WHEN 'interview'  THEN 3
           WHEN 'offer'      THEN 4
           ELSE 1
         END
  LIMIT 1
);

ALTER TABLE application_task DROP COLUMN stage_type;

-- ── 7. Migrate application_stage_notes.stage_type → stage_id ─

ALTER TABLE application_stage_notes ADD COLUMN stage_id TEXT;

UPDATE application_stage_notes n
SET stage_id = (
  SELECT stage_el ->> 'id'
  FROM   jobs j,
         jsonb_array_elements(j.pipeline_snapshot -> 'stages') AS stage_el
  WHERE  j.id = (SELECT job_id FROM applications WHERE id = n.application_id)
    AND  (stage_el ->> 'order')::int = CASE n.stage_type
           WHEN 'screening'  THEN 1
           WHEN 'assessment' THEN 2
           WHEN 'interview'  THEN 3
           WHEN 'offer'      THEN 4
           ELSE 1
         END
  LIMIT 1
);

ALTER TABLE application_stage_notes DROP COLUMN stage_type;

-- ── 8. Update unique constraint on application_stage_notes ───

ALTER TABLE application_stage_notes
  DROP CONSTRAINT IF EXISTS application_stage_notes_application_id_stage_type_key;

ALTER TABLE application_stage_notes
  ADD CONSTRAINT application_stage_notes_application_id_stage_id_key
  UNIQUE (application_id, stage_id);

-- ── 9. Migrate pipeline_stage_task_template.stage_type → stage_id ─
-- Templates are sparse pre-launch so no data migration is needed.
-- Rename the column to match the new model and remove enum constraint.

ALTER TABLE pipeline_stage_task_template RENAME COLUMN stage_type TO stage_id;
