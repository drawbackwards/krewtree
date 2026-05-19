-- Pipeline task system: task templates, task instances, stage notes, and event log.
-- All stage references use stage_type TEXT (matching kanban_stage values) rather than
-- a pipeline_stage UUID FK. The full pipeline configuration system (company-default
-- pipelines, job-level snapshots) is future work; this migration wires the task and
-- note surfaces that the drawer UI needs now.

-- ── pipeline_stage_task_template ────────────────────────────────────────────
-- Ordered checklist of tasks per stage, defined at the company level.
-- Snapshotted into job pipelines on job creation (future sprint).

CREATE TABLE IF NOT EXISTS pipeline_stage_task_template (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID        NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  stage_type     TEXT        NOT NULL
                             CHECK (stage_type IN ('screening', 'assessment', 'interview', 'offer')),
  label          TEXT        NOT NULL
                             CHECK (length(label) BETWEEN 1 AND 200),
  is_required    BOOLEAN     NOT NULL DEFAULT false,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_template_company_stage
  ON pipeline_stage_task_template (company_id, stage_type, display_order);

ALTER TABLE pipeline_stage_task_template ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_manage_templates" ON pipeline_stage_task_template;
CREATE POLICY "company_manage_templates"
  ON pipeline_stage_task_template FOR ALL
  USING  (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- ── application_task ─────────────────────────────────────────────────────────
-- Task instances per application. Created when an application enters a stage
-- (template tasks) or added ad-hoc by the employer at any point.

CREATE TABLE IF NOT EXISTS application_task (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage_type          TEXT        NOT NULL
                                  CHECK (stage_type IN ('screening', 'assessment', 'interview', 'offer')),
  source              TEXT        NOT NULL CHECK (source IN ('template', 'ad_hoc')),
  template_task_id    UUID        REFERENCES pipeline_stage_task_template(id) ON DELETE SET NULL,
  label               TEXT        NOT NULL CHECK (length(label) BETWEEN 1 AND 200),
  is_required         BOOLEAN     NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  completed_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  skipped_at          TIMESTAMPTZ,
  skipped_by          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes               TEXT,
  due_date            DATE,
  display_order       INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT task_mutual_exclusion CHECK (completed_at IS NULL OR skipped_at IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_application_task_app_stage
  ON application_task (application_id, stage_type, display_order);

ALTER TABLE application_task ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_read_tasks" ON application_task;
CREATE POLICY "company_read_tasks"
  ON application_task FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_write_tasks" ON application_task;
CREATE POLICY "company_write_tasks"
  ON application_task FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_update_tasks" ON application_task;
CREATE POLICY "company_update_tasks"
  ON application_task FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_delete_tasks" ON application_task;
CREATE POLICY "company_delete_tasks"
  ON application_task FOR DELETE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION touch_application_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_task_updated_at ON application_task;
CREATE TRIGGER trg_application_task_updated_at
  BEFORE UPDATE ON application_task
  FOR EACH ROW EXECUTE FUNCTION touch_application_task_updated_at();

-- ── application_stage_notes ──────────────────────────────────────────────────
-- One free-text notes row per (application, stage). Upserted on save.

CREATE TABLE IF NOT EXISTS application_stage_notes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage_type     TEXT        NOT NULL
                             CHECK (stage_type IN (
                               'screening', 'assessment', 'interview', 'offer',
                               'hired', 'rejected', 'withdrawn', 'archived'
                             )),
  notes          TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT unique_application_stage_notes UNIQUE (application_id, stage_type)
);

CREATE INDEX IF NOT EXISTS idx_stage_notes_application
  ON application_stage_notes (application_id);

ALTER TABLE application_stage_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_read_stage_notes" ON application_stage_notes;
CREATE POLICY "company_read_stage_notes"
  ON application_stage_notes FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_write_stage_notes" ON application_stage_notes;
CREATE POLICY "company_write_stage_notes"
  ON application_stage_notes FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_update_stage_notes" ON application_stage_notes;
CREATE POLICY "company_update_stage_notes"
  ON application_stage_notes FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION touch_stage_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stage_notes_updated_at ON application_stage_notes;
CREATE TRIGGER trg_stage_notes_updated_at
  BEFORE UPDATE ON application_stage_notes
  FOR EACH ROW EXECUTE FUNCTION touch_stage_notes_updated_at();

-- ── application_log ──────────────────────────────────────────────────────────
-- Reverse-chronological event log shown in the Log tab of the applicant drawer.
-- Append-only — rows are never updated or deleted.

CREATE TABLE IF NOT EXISTS application_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type     TEXT        NOT NULL,
  actor          TEXT        NOT NULL DEFAULT 'System',
  actor_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  description    TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_log_app_time
  ON application_log (application_id, created_at DESC);

ALTER TABLE application_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_read_log" ON application_log;
CREATE POLICY "company_read_log"
  ON application_log FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );
