-- Per-application notes authored by company users.
-- One row per note; author_id references auth.users so we can derive author name later.

CREATE TABLE IF NOT EXISTS application_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name     TEXT NOT NULL,                -- snapshot at write time (company_name / first_name / email)
  text            TEXT NOT NULL CHECK (length(text) > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_notes_application
  ON application_notes (application_id, created_at DESC);

ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;

-- Companies can read notes on applications to their jobs.
DROP POLICY IF EXISTS "company_read" ON application_notes;
CREATE POLICY "company_read"
  ON application_notes FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

-- Companies can insert notes on applications to their jobs. author_id must be the caller.
DROP POLICY IF EXISTS "company_insert" ON application_notes;
CREATE POLICY "company_insert"
  ON application_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

-- Authors can delete their own notes.
DROP POLICY IF EXISTS "author_delete" ON application_notes;
CREATE POLICY "author_delete"
  ON application_notes FOR DELETE
  USING (author_id = auth.uid());
