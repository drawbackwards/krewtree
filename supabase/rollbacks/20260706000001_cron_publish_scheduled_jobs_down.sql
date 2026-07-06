-- Rollback: unregister the auto-publish sweep.
-- Leaves pg_cron and publish_scheduled_jobs() in place (other jobs may
-- depend on the extension); only removes this schedule.

do $$
begin
  perform cron.unschedule('krewtree-publish-scheduled-jobs')
  from cron.job
  where jobname = 'krewtree-publish-scheduled-jobs';
end;
$$;
