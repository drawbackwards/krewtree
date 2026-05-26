-- ============================================================
-- KREWTREE — Multi-note task model
--
-- Replaces the single-string `application_task.notes` field with an
-- append-only `application_task_note` table. Each save is now its
-- own row with its own timestamp, so the drawer can render a
-- timeline of notes per task and the Log tab can record each
-- addition as a separate event.
--
-- Migrates any existing single-note rows into the new table before
-- dropping the legacy columns added two migrations ago, so the
-- handful of test notes created during the previous single-note
-- prototype carry forward instead of being silently lost.
-- ============================================================

-- ── New table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS application_task_note (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_task_id UUID        NOT NULL REFERENCES application_task (id) ON DELETE CASCADE,
  application_id      UUID        NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  body                TEXT        NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID        REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_application_task_note_task_time
  ON application_task_note (application_task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_task_note_app
  ON application_task_note (application_id);

-- ── Migrate legacy single-note data ──────────────────────────────────────────
--
-- Only runs while the legacy column still exists (guarded by IF EXISTS check
-- inside the DO block) so this migration is idempotent against partial state.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'application_task' AND column_name = 'notes'
  ) THEN
    INSERT INTO application_task_note (application_task_id, application_id, body, created_at, created_by)
    SELECT
      id,
      application_id,
      notes,
      COALESCE(notes_updated_at, updated_at),
      notes_updated_by
    FROM application_task
    WHERE notes IS NOT NULL AND length(trim(notes)) > 0;
  END IF;
END $$;

-- ── Drop legacy columns ──────────────────────────────────────────────────────

ALTER TABLE application_task
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS notes_updated_at,
  DROP COLUMN IF EXISTS notes_updated_by;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE application_task_note ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_read_task_notes" ON application_task_note;
CREATE POLICY "company_read_task_notes"
  ON application_task_note FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_write_task_notes" ON application_task_note;
CREATE POLICY "company_write_task_notes"
  ON application_task_note FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );
