-- Add interview_answers column to store responses to pre-interview questions
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS interview_answers JSONB NOT NULL DEFAULT '[]';
