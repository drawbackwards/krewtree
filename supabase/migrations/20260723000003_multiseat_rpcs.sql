-- ============================================================
-- KREWTREE — Multi-seat team accounts (RPC signatures)
--
-- The dashboard/messaging aggregate RPCs assumed auth.uid() == the company id
-- and "unread = not sent by me." Under seats neither holds: a seat's uid is not
-- the company id, and a company-side message may be sent by any teammate.
--
-- Fix, persona-free: take an optional p_company_id. When it is NULL the caller
-- is a worker (uid == worker_id); when it is set the caller is a company seat
-- viewing that company. "Sent by the other party" is expressed structurally as
-- sent_by = worker_id (worker-sent) vs sent_by <> worker_id (company-sent), so
-- no seat identity is needed for unread math. RLS still authorizes every row.
-- ============================================================

-- ── get_company_dashboard(p_company_id) ──────────────────────
DROP FUNCTION IF EXISTS public.get_company_dashboard();
CREATE OR REPLACE FUNCTION public.get_company_dashboard(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with me as (
    select p_company_id as cid
  ),
  bounds as (
    select
      (date_trunc('week', timezone('UTC', now())) at time zone 'UTC') as week_start,
      (date_trunc('day',  timezone('UTC', now())) at time zone 'UTC') as today_start,
      (date_trunc('day',  timezone('UTC', now())) at time zone 'UTC') - interval '1 day' as yesterday_start
  ),
  prof as (
    select p.*
    from public.company_profiles p, me
    where p.id = me.cid
  ),
  lic as (select count(*) as c from public.company_licenses l, me where l.company_id = me.cid),
  pho as (select count(*) as c from public.company_photos  p, me where p.company_id  = me.cid),
  ben as (select count(*) as c from public.company_benefits b, me where b.company_id = me.cid),
  app_week as (
    select count(*) as c
    from public.applications a, me, bounds
    where a.company_id = me.cid
      and a.created_at >= bounds.week_start
  ),
  app_yest as (
    select count(*) as c
    from public.applications a, me, bounds
    where a.company_id = me.cid
      and a.created_at >= bounds.yesterday_start
      and a.created_at <  bounds.today_start
  )
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'new_applicants_week',      (select c from app_week),
      'new_applicants_yesterday', (select c from app_yest)
    ),
    'completeness', jsonb_build_object(
      'pct', coalesce((select profile_complete_pct from prof), 0),
      'items', jsonb_build_object(
        'basics', coalesce((
          select btrim(coalesce(name, '')) <> ''
             and btrim(coalesce(industry, '')) <> ''
             and btrim(coalesce(hq_city, '')) <> ''
             and btrim(coalesce(phone, '')) <> ''
          from prof
        ), false),
        'logo',        coalesce((select logo_url is not null and btrim(logo_url) <> '' from prof), false),
        'description', coalesce((select length(btrim(coalesce(description, ''))) >= 40 from prof), false),
        'website',     coalesce((select btrim(coalesce(website, '')) <> '' from prof), false),
        'founded',     coalesce((select founded is not null and founded <> 0 from prof), false),
        'size',        coalesce((select btrim(coalesce(size, '')) <> '' from prof), false),
        'licenses',    (select c from lic) > 0,
        'photos',      (select c from pho) > 0,
        'benefits',    (select c from ben) > 0
      )
    )
  );
$function$;
GRANT EXECUTE ON FUNCTION public.get_company_dashboard(uuid) TO authenticated;

-- ── get_conversation_summaries(p_company_id) ─────────────────
DROP FUNCTION IF EXISTS public.get_conversation_summaries();
CREATE OR REPLACE FUNCTION public.get_conversation_summaries(p_company_id uuid DEFAULT NULL)
 RETURNS TABLE(company_id uuid, company_name text, company_logo text, worker_id uuid, worker_first_name text, worker_last_name text, worker_avatar text, last_message_id uuid, last_application_id uuid, last_job_id uuid, last_job_title text, last_body text, last_sent_at timestamp with time zone, last_sent_by uuid, last_read_at timestamp with time zone, unread_count bigint, message_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with threads as (
    select
      m.company_id as t_company_id,
      m.worker_id as t_worker_id,
      count(*) as message_count,
      count(*) filter (
        where m.read_at is null
          and case
                when p_company_id is not null then m.sent_by = m.worker_id
                else m.sent_by <> m.worker_id
              end
      ) as unread_count
    from message m
    where p_company_id is null or m.company_id = p_company_id
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
$function$;
GRANT EXECUTE ON FUNCTION public.get_conversation_summaries(uuid) TO authenticated;

-- ── get_unread_message_count(p_company_id) ───────────────────
DROP FUNCTION IF EXISTS public.get_unread_message_count();
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_company_id uuid DEFAULT NULL)
 RETURNS bigint
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select count(*)
  from message m
  where m.read_at is null
    and (p_company_id is null or m.company_id = p_company_id)
    and case
          when p_company_id is not null then m.sent_by = m.worker_id
          else m.sent_by <> m.worker_id
        end
$function$;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO authenticated;
