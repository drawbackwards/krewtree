-- Pipeline task messages: attach a message (subject + body + optional calendar link)
-- to a task template. The message can be configured to auto-send on stage entry,
-- or sent manually by the employer from the applicant drawer.
--
-- Message fields are snapshotted from the template onto application_task at
-- instantiation time (so editing a template later doesn't change in-flight tasks).
-- Actually sent messages are recorded in application_message — separate table so
-- the row survives even if the task or template is later deleted.

-- ── Template message columns ────────────────────────────────────────────────

ALTER TABLE pipeline_stage_task_template
  ADD COLUMN IF NOT EXISTS message_subject TEXT,
  ADD COLUMN IF NOT EXISTS message_body    TEXT,
  ADD COLUMN IF NOT EXISTS calendar_link   TEXT,
  ADD COLUMN IF NOT EXISTS auto_send       BOOLEAN NOT NULL DEFAULT false;

-- A template either has both subject+body or neither.
ALTER TABLE pipeline_stage_task_template
  DROP CONSTRAINT IF EXISTS template_message_complete;
ALTER TABLE pipeline_stage_task_template
  ADD CONSTRAINT template_message_complete
  CHECK (
    (message_subject IS NULL AND message_body IS NULL)
    OR (message_subject IS NOT NULL AND message_body IS NOT NULL)
  );

-- ── Application task message snapshot columns ───────────────────────────────

ALTER TABLE application_task
  ADD COLUMN IF NOT EXISTS message_subject TEXT,
  ADD COLUMN IF NOT EXISTS message_body    TEXT,
  ADD COLUMN IF NOT EXISTS calendar_link   TEXT,
  ADD COLUMN IF NOT EXISTS auto_send       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_sent_at TIMESTAMPTZ;

ALTER TABLE application_task
  DROP CONSTRAINT IF EXISTS task_message_complete;
ALTER TABLE application_task
  ADD CONSTRAINT task_message_complete
  CHECK (
    (message_subject IS NULL AND message_body IS NULL)
    OR (message_subject IS NOT NULL AND message_body IS NOT NULL)
  );

-- ── application_message ──────────────────────────────────────────────────────
-- Permanent record of every message sent through the pipeline. One row per send.
-- application_task_id is nullable so the message survives if the task is deleted
-- and to allow ad-hoc messages in the future.

CREATE TABLE IF NOT EXISTS application_message (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id       UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  application_task_id  UUID        REFERENCES application_task(id) ON DELETE SET NULL,
  subject              TEXT        NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  body                 TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  calendar_link        TEXT,
  sent_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by              UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_application_message_app_time
  ON application_message (application_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_message_task
  ON application_message (application_task_id);

ALTER TABLE application_message ENABLE ROW LEVEL SECURITY;

-- Companies can read messages for their applications.
DROP POLICY IF EXISTS "company_read_messages" ON application_message;
CREATE POLICY "company_read_messages"
  ON application_message FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

-- Companies can send (insert) messages on their applications.
DROP POLICY IF EXISTS "company_send_messages" ON application_message;
CREATE POLICY "company_send_messages"
  ON application_message FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

-- Workers can read messages on their own applications.
DROP POLICY IF EXISTS "worker_read_own_messages" ON application_message;
CREATE POLICY "worker_read_own_messages"
  ON application_message FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      WHERE a.worker_id = auth.uid()
    )
  );

-- Workers can mark their own messages as read (UPDATE limited to read_at column
-- enforced at the application layer for now).
DROP POLICY IF EXISTS "worker_mark_read" ON application_message;
CREATE POLICY "worker_mark_read"
  ON application_message FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      WHERE a.worker_id = auth.uid()
    )
  );
