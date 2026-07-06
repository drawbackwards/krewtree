-- ============================================================
-- KREWTREE — Register the scheduled-job auto-publish sweep
--
-- publish_scheduled_jobs() (20260623000002) flips due jobs from
-- 'scheduled' → 'active'. Until now nothing invoked it, so scheduled
-- jobs never went live on their own. This migration enables pg_cron
-- and registers a once-a-minute sweep so "Schedule for later" actually
-- publishes at the chosen time.
--
-- Notes:
--   - pg_cron ships in shared_preload_libraries on Supabase hosted
--     projects (all plans), so `create extension` succeeds there.
--   - Cron jobs run as the role that registers them (postgres/owner),
--     which owns publish_scheduled_jobs() and can execute it despite
--     the revoke-from-public grants in 20260623000002.
--   - The block is idempotent: it unschedules any prior definition
--     before (re)scheduling, so this migration is safe to re-run.
-- ============================================================

create extension if not exists pg_cron;

do $$
begin
  -- Drop a prior registration (by name) so re-running is safe.
  perform cron.unschedule('krewtree-publish-scheduled-jobs')
  from cron.job
  where jobname = 'krewtree-publish-scheduled-jobs';

  -- Every minute: promote jobs whose publish_at has arrived.
  perform cron.schedule(
    'krewtree-publish-scheduled-jobs',
    '* * * * *',
    'select publish_scheduled_jobs()'
  );
end;
$$;
