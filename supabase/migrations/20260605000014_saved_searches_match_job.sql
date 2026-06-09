-- Discover saved searches gain an optional match-to-job anchor. ON DELETE
-- SET NULL: if the referenced job is later removed, the saved search keeps
-- its other filters but quietly forgets the job (better than cascade-
-- deleting the whole saved search).
ALTER TABLE public.company_discover_saved_searches
  ADD COLUMN IF NOT EXISTS match_job_id UUID
    REFERENCES public.jobs(id) ON DELETE SET NULL;
