-- ============================================================
-- Message summary RPCs
--
-- getConversations() previously downloaded every message row the
-- caller could see (entire history, 3-level joins) just to derive
-- per-thread last-message + unread counts client-side, and the nav
-- badge re-fetched all unread rows on every route change. These two
-- functions push that aggregation into Postgres so the client gets
-- one row per thread / one integer back.
--
-- Both run SECURITY INVOKER (the default): RLS on application_message,
-- direct_message, applications, jobs, and the profile tables scopes
-- every row to the caller, so the functions add no new data exposure.
-- p_persona tells the unread math which side of the thread the viewer
-- is on ('worker' | 'company').
-- ============================================================

create or replace function public.get_conversation_summaries(p_persona text)
returns table (
  kind text,
  application_id uuid,
  job_id uuid,
  job_title text,
  company_id uuid,
  company_name text,
  company_logo text,
  worker_id uuid,
  worker_first_name text,
  worker_last_name text,
  worker_avatar text,
  last_message_id uuid,
  last_subject text,
  last_body text,
  last_calendar_link text,
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
  with app_threads as (
    select
      m.application_id as thread_app_id,
      count(*) as message_count,
      count(*) filter (
        where m.read_at is null
          and (case when m.sent_by = a.worker_id then 'worker' else 'company' end) <> p_persona
      ) as unread_count
    from application_message m
    join applications a on a.id = m.application_id
    group by m.application_id
  ),
  direct_threads as (
    select
      d.company_id as thread_company_id,
      d.worker_id as thread_worker_id,
      count(*) as message_count,
      count(*) filter (
        where d.read_at is null
          and (case when d.sent_by = d.worker_id then 'worker' else 'company' end) <> p_persona
      ) as unread_count
    from direct_message d
    group by d.company_id, d.worker_id
  )
  select
    'application'::text as kind,
    a.id,
    j.id,
    j.title,
    cp.id,
    cp.name,
    cp.logo_url,
    wp.id,
    wp.first_name,
    wp.last_name,
    wp.avatar_url,
    lm.id,
    lm.subject,
    lm.body,
    lm.calendar_link,
    lm.sent_at,
    lm.sent_by,
    lm.read_at,
    t.unread_count,
    t.message_count
  from app_threads t
  join applications a on a.id = t.thread_app_id
  join jobs j on j.id = a.job_id
  join company_profiles cp on cp.id = j.company_id
  join worker_profiles wp on wp.id = a.worker_id
  cross join lateral (
    select m.id, m.subject, m.body, m.calendar_link, m.sent_at, m.sent_by, m.read_at
    from application_message m
    where m.application_id = t.thread_app_id
    order by m.sent_at desc
    limit 1
  ) lm

  union all

  select
    'direct'::text,
    null,
    null,
    null,
    cp.id,
    cp.name,
    cp.logo_url,
    wp.id,
    wp.first_name,
    wp.last_name,
    wp.avatar_url,
    lm.id,
    ''::text,
    lm.body,
    null,
    lm.sent_at,
    lm.sent_by,
    lm.read_at,
    t.unread_count,
    t.message_count
  from direct_threads t
  join company_profiles cp on cp.id = t.thread_company_id
  join worker_profiles wp on wp.id = t.thread_worker_id
  cross join lateral (
    select d.id, d.body, d.sent_at, d.sent_by, d.read_at
    from direct_message d
    where d.company_id = t.thread_company_id
      and d.worker_id = t.thread_worker_id
    order by d.sent_at desc
    limit 1
  ) lm

  order by 16 desc -- last_sent_at, newest activity first
$$;

create or replace function public.get_unread_message_count(p_persona text)
returns bigint
language sql
stable
set search_path = public
as $$
  select
    coalesce((
      select count(*)
      from application_message m
      join applications a on a.id = m.application_id
      where m.read_at is null
        and (case when m.sent_by = a.worker_id then 'worker' else 'company' end) <> p_persona
    ), 0)
    +
    coalesce((
      select count(*)
      from direct_message d
      where d.read_at is null
        and d.sent_by <> (select auth.uid())
    ), 0)
$$;

grant execute on function public.get_conversation_summaries(text) to authenticated;
grant execute on function public.get_unread_message_count(text) to authenticated;
