-- ============================================================
-- KREWTREE — Task notes timestamp
--
-- Adds notes_updated_at and notes_updated_by to application_task so
-- the drawer can surface "notes added 3h ago by Jane" inline with the
-- task, and the Log tab can record each save as its own event.
--
-- The existing updated_at column ticks on every row change (state,
-- flag, due-date, etc.), so it cannot stand in for "when did the
-- notes specifically change." A dedicated column keeps this signal
-- precise and survives unrelated updates.
-- ============================================================

ALTER TABLE application_task
  ADD COLUMN IF NOT EXISTS notes_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes_updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;
