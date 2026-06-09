-- ============================================================
-- KREWTREE — Photo reports (Phase 4 polish, spec §4.5)
-- A worker viewing a public company profile can flag a photo
-- for review. v1 only logs the report; admin processing and the
-- moderation queue come once the admin role exists (spec §10 #2).
-- ============================================================

CREATE TABLE IF NOT EXISTS photo_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id     UUID NOT NULL REFERENCES company_photos(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_reports_photo    ON photo_reports(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_reports_reporter ON photo_reports(reporter_id);

ALTER TABLE photo_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a report on a photo, but only
-- referencing themselves as the reporter.
CREATE POLICY "report_insert_self" ON photo_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Reporters can see their own reports (so the UI can show "you reported this");
-- admin read access is added separately when the admin role lands.
CREATE POLICY "report_read_self" ON photo_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
