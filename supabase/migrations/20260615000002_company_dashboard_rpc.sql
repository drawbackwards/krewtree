-- Company dashboard aggregates in a single round trip.
--
-- The dashboard page previously fired 6 separate queries on mount for read-only
-- aggregates: two application COUNTs for the "new applicants" stat card, plus the
-- profile row and three license/photo/benefit COUNTs for the completeness widget.
-- This RPC returns all of it as one jsonb payload. SECURITY INVOKER so the
-- caller's RLS still gates every table; the company's own id is auth.uid()
-- (company_profiles.id and applications.company_id both equal the company user id),
-- so the function takes no arguments — matching get_unread_message_count() etc.
--
-- The "this week" / "yesterday" windows mirror the old client-side UTC math:
-- week = Monday 00:00 UTC of the current week; yesterday = the prior UTC day.

create or replace function public.get_company_dashboard()
returns jsonb
language sql
security invoker
stable
set search_path = ''
as $$
  with me as (
    select (select auth.uid()) as cid
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
$$;

grant execute on function public.get_company_dashboard() to authenticated;
