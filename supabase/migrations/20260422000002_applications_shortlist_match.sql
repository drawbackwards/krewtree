-- Add columns the company applicant UI needs:
--   is_shortlisted      — per-application favorite flag
--   match_score         — 0-100, populated by trigger on insert (see migration 004)
--   status_updated_at   — stamped whenever kanban_stage changes; drives "N since last login"

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS is_shortlisted   BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_score      INTEGER      NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Stamp status_updated_at on kanban_stage change
CREATE OR REPLACE FUNCTION stamp_status_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kanban_stage IS DISTINCT FROM OLD.kanban_stage THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER stamp_applications_status_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION stamp_status_updated_at();

-- Index to make "recent applicants for my company" cheap
CREATE INDEX idx_applications_company_recent
  ON applications (job_id, status_updated_at DESC);
