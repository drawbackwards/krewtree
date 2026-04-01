-- Add missing job fields that PostJobPage collects but were not persisted

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS experience_level        TEXT,
  ADD COLUMN IF NOT EXISTS pre_interview_questions TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS urgent_hiring           BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regulix_preferred       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_pause_limit        INTEGER;
