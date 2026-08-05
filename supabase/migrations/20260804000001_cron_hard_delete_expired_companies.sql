-- ============================================================
-- KREWTREE — Register the expired-company hard-delete sweep
--
-- hard_delete_expired_companies() (20260609000006) permanently removes
-- company accounts whose soft-delete grace period (30 days) has passed.
-- Until now nothing invoked it, so soft-deleted companies were never
-- actually purged. This migration registers a daily sweep.
--
-- Mirrors the proven publish_scheduled_jobs cron pattern
-- (20260706000001): extension guard, unschedule-before-schedule for
-- idempotency. The job runs as the registering role (postgres/owner),
-- which can execute the function despite its revoke-from-public grants.
--
-- Runs daily at 04:00 UTC — a purge on a 30-day grace period does not
-- need finer granularity.
-- ============================================================

create extension if not exists pg_cron;

do $$
begin
  -- Drop a prior registration (by name) so re-running is safe.
  perform cron.unschedule('krewtree-hard-delete-companies')
  from cron.job
  where jobname = 'krewtree-hard-delete-companies';

  -- Daily 04:00 UTC: purge companies past their 30-day grace period.
  perform cron.schedule(
    'krewtree-hard-delete-companies',
    '0 4 * * *',
    'select hard_delete_expired_companies()'
  );
end;
$$;
