-- Add status history columns for dashboard delta calculations
-- Jobs: track when a job was paused/closed so we can reconstruct historical counts
-- Applications: track when status last changed for interview scheduling deltas

-- ── Jobs ────────────────────────────────────────────────────────────────────────

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Backfill from updated_at for jobs already in paused/closed state
UPDATE jobs SET paused_at = updated_at WHERE status = 'paused' AND paused_at IS NULL;
UPDATE jobs SET closed_at = updated_at WHERE status = 'closed' AND closed_at IS NULL;

-- Trigger: auto-set paused_at / closed_at on status transitions
CREATE OR REPLACE FUNCTION set_job_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Entering paused
    IF NEW.status = 'paused' THEN
      NEW.paused_at := NOW();
    END IF;
    -- Leaving paused
    IF OLD.status = 'paused' AND NEW.status <> 'paused' THEN
      NEW.paused_at := NULL;
    END IF;
    -- Entering closed
    IF NEW.status = 'closed' THEN
      NEW.closed_at := NOW();
    END IF;
    -- Leaving closed (reopened)
    IF OLD.status = 'closed' AND NEW.status <> 'closed' THEN
      NEW.closed_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_status_timestamps ON jobs;
CREATE TRIGGER trg_job_status_timestamps
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_status_timestamps();

-- ── Applications ────────────────────────────────────────────────────────────────

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- Backfill from updated_at for existing rows
UPDATE applications SET status_updated_at = updated_at WHERE status_updated_at IS NULL;

-- Trigger: auto-set status_updated_at on status change
CREATE OR REPLACE FUNCTION set_application_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_status_updated_at ON applications;
CREATE TRIGGER trg_application_status_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_status_updated_at();
