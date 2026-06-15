-- Remove subjects from messages.
--
-- With application context shown per-bubble ("Re: <job title>" in the
-- timestamp footer), subject dividers in the feed were redundant — so
-- messages no longer carry a subject at all. Subjects remain a pipeline
-- concept only: template / task snapshot labels and "Sent: <subject>"
-- log entries are untouched; the text just never ships on the message.

ALTER TABLE message DROP COLUMN subject;

-- get_conversation_summaries returned last_subject; return type changes,
-- so drop + recreate.

DROP FUNCTION IF EXISTS public.get_conversation_summaries();

CREATE FUNCTION public.get_conversation_summaries()
RETURNS TABLE (
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
  last_calendar_link text,
  last_sent_at timestamptz,
  last_sent_by uuid,
  last_read_at timestamptz,
  unread_count bigint,
  message_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
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
    lm.calendar_link,
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
           m.body, m.calendar_link, m.sent_at, m.sent_by, m.read_at
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

GRANT EXECUTE ON FUNCTION public.get_conversation_summaries() TO authenticated;
