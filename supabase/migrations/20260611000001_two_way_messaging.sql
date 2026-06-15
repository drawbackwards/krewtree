-- Two-way messaging on application threads.
--
-- application_message (created in 20260518000003) only allowed companies to
-- send. This migration turns each application into a two-way thread:
--   * workers can insert (reply on) their own applications
--   * companies can mark worker-sent messages as read
--
-- Sender identity: sent_by = auth user who sent the message. Worker-sent
-- messages always carry sent_by = the application's worker_id (enforced by
-- the insert policy below). Company-sent messages carry the company user id,
-- or NULL for legacy auto-sends — so "sent by the worker" is the reliable
-- test: sent_by = applications.worker_id.

-- Workers can send (insert) messages on their own applications.
-- sent_by must be the caller so workers can't spoof another sender.
DROP POLICY IF EXISTS "worker_send_messages" ON application_message;
CREATE POLICY "worker_send_messages"
  ON application_message FOR INSERT
  WITH CHECK (
    sent_by = auth.uid()
    AND application_id IN (
      SELECT a.id FROM applications a
      WHERE a.worker_id = auth.uid()
    )
  );

-- Companies can mark messages as read on applications for their jobs
-- (UPDATE limited to read_at at the application layer, matching the
-- existing worker_mark_read policy style).
DROP POLICY IF EXISTS "company_mark_read" ON application_message;
CREATE POLICY "company_mark_read"
  ON application_message FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

-- Unread lookups filter on read_at IS NULL across all of a user's
-- applications; partial index keeps the nav badge query cheap.
CREATE INDEX IF NOT EXISTS idx_application_message_unread
  ON application_message (application_id)
  WHERE read_at IS NULL;
