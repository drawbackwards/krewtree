-- ============================================================
-- KREWTREE — Scheduled job publishing
-- A company can schedule a job to auto-publish at a future time.
-- The job is stored with status = 'scheduled' and a publish_at
-- timestamp; a scheduled DB function flips it to 'active' when the
-- time arrives. The public board (search_jobs) already pins
-- status = 'active', so scheduled jobs stay off the board until the
-- flip — no RPC change needed.
--
-- Scheduling the flip is handled either by:
--   - Supabase pg_cron extension (enable in dashboard → Database →
--     Extensions → pg_cron, then:
--     cron.schedule('krewtree-publish-scheduled-jobs', '* * * * *',
--       'SELECT publish_scheduled_jobs()'))
--   - or a Vercel Cron Job that calls a server route hitting this
--     function via the service_role key.
-- Until that schedule is registered, scheduled jobs can still be
-- published manually via the "Publish now" action.
-- ============================================================

alter table jobs add column if not exists publish_at timestamptz;

-- Allow the new 'scheduled' status (inline CHECK is auto-named jobs_status_check).
alter table jobs drop constraint if exists jobs_status_check;
alter table jobs add constraint jobs_status_check
  check (status in ('active', 'paused', 'closed', 'scheduled'));

-- Partial index keeps the cron sweep cheap — only scheduled rows are scanned.
create index if not exists jobs_scheduled_publish_at_idx
  on jobs (publish_at) where status = 'scheduled';

create or replace function publish_scheduled_jobs()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with flipped as (
    update jobs
    set status = 'active', publish_at = null, updated_at = now()
    where status = 'scheduled'
      and publish_at is not null
      and publish_at <= now()
    returning id
  )
  select count(*) into v_count from flipped;
  return v_count;
end;
$$;

-- Restrict to service_role so a cron / serverless function can call it
-- but ordinary clients cannot.
revoke execute on function publish_scheduled_jobs() from public;
revoke execute on function publish_scheduled_jobs() from authenticated, anon;
grant  execute on function publish_scheduled_jobs() to service_role;
