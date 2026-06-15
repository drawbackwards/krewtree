-- ============================================================
-- search_jobs RPC
--
-- The public jobs board previously fetched EVERY active job (full
-- descriptions, company profiles, analytics) and filtered, sorted,
-- distance-computed, and paginated client-side at 5 rows per page.
-- This function does all of that in Postgres and returns just the
-- matching page of job ids (plus distance and the total match count),
-- so the client fetches full rows for only the visible page.
--
-- SECURITY INVOKER: the jobs RLS policy (public_active_jobs_read)
-- still applies; we additionally pin status = 'active' since this
-- feeds the public board. Distance is plain haversine — at the point
-- jobs volume makes that slow, swap the body to PostGIS without
-- changing the signature.
-- ============================================================

create or replace function public.search_jobs(
  p_search text default null,
  p_industries text[] default null,
  p_types text[] default null,
  p_sponsored_only boolean default false,
  p_regulix_only boolean default false,
  p_pay_min numeric default null,
  p_pay_max numeric default null,
  p_anchor_lat double precision default null,
  p_anchor_lng double precision default null,
  p_radius_mi numeric default null,
  p_sort text default 'recent',
  p_page integer default 1,
  p_page_size integer default 5
)
returns table (job_id uuid, distance_mi numeric, total_count bigint)
language sql
stable
set search_path = public
as $$
  with base as (
    select
      j.id,
      j.created_at,
      j.pay_max,
      j.total_applicants,
      case
        when p_anchor_lat is not null and p_anchor_lng is not null
         and j.latitude is not null and j.longitude is not null
        then (3958.8 * acos(least(1.0, greatest(-1.0,
               cos(radians(p_anchor_lat)) * cos(radians(j.latitude)) *
               cos(radians(j.longitude) - radians(p_anchor_lng)) +
               sin(radians(p_anchor_lat)) * sin(radians(j.latitude))
             ))))::numeric
      end as distance_mi
    from jobs j
    join company_profiles cp on cp.id = j.company_id
    where j.status = 'active'
      and (p_search is null or p_search = '' or (
            j.title ilike '%' || p_search || '%'
         or j.industry ilike '%' || p_search || '%'
         or cp.name ilike '%' || p_search || '%'
         or exists (select 1 from unnest(j.skills) sk where sk ilike '%' || p_search || '%')
      ))
      and (p_industries is null or j.industry_slug = any(p_industries))
      and (p_types is null or j.type = any(p_types))
      and (not p_sponsored_only or j.is_sponsored)
      and (not p_regulix_only or j.regulix_ready_applicants > 0)
      and (p_pay_min is null or j.pay_min >= p_pay_min)
      and (p_pay_max is null or j.pay_max <= p_pay_max)
  ),
  filtered as (
    select * from base
    where p_radius_mi is null
       or (distance_mi is not null and distance_mi <= p_radius_mi)
  )
  select
    f.id,
    f.distance_mi,
    count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'nearest' then coalesce(f.distance_mi, 1e9::numeric) end asc,
    case when p_sort = 'pay' then f.pay_max end desc nulls last,
    case when p_sort = 'applicants' then f.total_applicants end desc,
    f.created_at desc
  limit greatest(p_page_size, 1)
  offset (greatest(p_page, 1) - 1) * greatest(p_page_size, 1)
$$;

-- The jobs board is public — anon needs execute too.
grant execute on function public.search_jobs(text, text[], text[], boolean, boolean, numeric, numeric, double precision, double precision, numeric, text, integer, integer) to anon, authenticated;

-- Facet counts for the filter sidebar (jobs per industry / per type),
-- replacing a client-side tally over the full job list.
create or replace function public.get_job_facet_counts()
returns table (industry_slug text, job_type text, job_count bigint)
language sql
stable
set search_path = public
as $$
  select j.industry_slug, j.type as job_type, count(*) as job_count
  from jobs j
  where j.status = 'active'
  group by j.industry_slug, j.type
$$;

grant execute on function public.get_job_facet_counts() to anon, authenticated;
