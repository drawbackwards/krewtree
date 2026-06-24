/* ============================================================
   KREWTREE — Drop the structured calendar_link field everywhere
   Calendar (and any other) links now live inline in the message body
   rather than as a separate, specially-rendered field. Remove the
   column from the messaging + pipeline tables and from the
   conversation-summary RPC's return shape.
   ============================================================ */

alter table message                       drop column if exists calendar_link;
alter table application_task              drop column if exists calendar_link;
alter table pipeline_stage_task_template  drop column if exists calendar_link;

/* get_conversation_summaries returned last_calendar_link; the return
   type changes, so drop + recreate without it. */

drop function if exists public.get_conversation_summaries();

create function public.get_conversation_summaries()
returns table (
  company_id uuid,
  company_name text,
  company_logo text,
  worker_id uuid,
  worker_first_name text,
  worker_last_name text,
  worker_avatar text,
  last_message_id uuid,
  last_application_id uuid,
  last_job_id uuid,
  last_job_title text,
  last_body text,
  last_sent_at timestamptz,
  last_sent_by uuid,
  last_read_at timestamptz,
  unread_count bigint,
  message_count bigint
)
language sql
stable
set search_path = public
as $$
  with threads as (
    select
      m.company_id as t_company_id,
      m.worker_id as t_worker_id,
      count(*) as message_count,
      count(*) filter (
        where m.read_at is null and m.sent_by <> (select auth.uid())
      ) as unread_count
    from message m
    group by m.company_id, m.worker_id
  )
  select
    cp.id,
    cp.name,
    cp.logo_url,
    wp.id,
    wp.first_name,
    wp.last_name,
    wp.avatar_url,
    lm.id,
    lm.application_id,
    lm.job_id,
    lm.job_title,
    lm.body,
    lm.sent_at,
    lm.sent_by,
    lm.read_at,
    t.unread_count,
    t.message_count
  from threads t
  join company_profiles cp on cp.id = t.t_company_id
  join worker_profiles wp on wp.id = t.t_worker_id
  cross join lateral (
    select m.id, m.application_id, j.id as job_id, j.title as job_title,
           m.body, m.sent_at, m.sent_by, m.read_at
    from message m
    left join applications a on a.id = m.application_id
    left join jobs j on j.id = a.job_id
    where m.company_id = t.t_company_id
      and m.worker_id = t.t_worker_id
    order by m.sent_at desc
    limit 1
  ) lm
  order by lm.sent_at desc
$$;

grant execute on function public.get_conversation_summaries() to authenticated;
