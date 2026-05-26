-- Deduplicate template-sourced application_task rows that may have been
-- inserted twice by concurrent calls to instantiateTemplatesForStage(), then
-- enforce uniqueness so it cannot happen again.

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id, template_task_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM application_task
  WHERE source = 'template'
    AND template_task_id IS NOT NULL
)
DELETE FROM application_task
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS application_task_template_unique
  ON application_task (application_id, template_task_id)
  WHERE source = 'template' AND template_task_id IS NOT NULL;
