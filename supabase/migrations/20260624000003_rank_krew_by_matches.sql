-- ============================================================
-- rank_krew_by_matches RPC
--
-- The "sort by matches" / "strong matches only" path in getKrew used
-- to fetch the entire krew unpaginated (range 0..9999), call
-- compute_krew_match_counts over all of it, then sort/filter/paginate
-- in JS. That transfers the whole crew and scores everyone on every
-- request. This function does the filtering, match scoring, ranking,
-- pagination, and total-count in Postgres and returns just the visible
-- page of rows — one round trip, no client-side sort.
--
-- The per-(worker, job) signal logic mirrors compute_krew_match_counts
-- exactly (location substring, skill overlap, trade substring; jobs the
-- worker already applied to are excluded). Keep the two in sync.
--
-- SECURITY INVOKER (default): krew_relationships / worker_profiles /
-- jobs RLS still applies; auth.uid() scopes to the calling company.
-- ============================================================

create or replace function public.rank_krew_by_matches(
  p_search text default null,
  p_sources text[] default null,
  p_list_id uuid default null,
  p_regulix_only boolean default false,
  p_strong_only boolean default false,
  p_sort_dir text default 'desc',
  p_page integer default 1,
  p_page_size integer default 25
)
returns table (
  worker_id uuid,
  first_name text,
  last_name text,
  primary_trade text,
  avatar_url text,
  is_regulix_ready boolean,
  source text,
  last_interaction_at timestamptz,
  matches integer,
  strong_matches integer,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  with
  -- The company's krew, after cheap relational filters (search, source,
  -- regulix, list membership). One row per worker.
  candidates as (
    select
      kr.worker_id as wid,
      kr.source,
      kr.last_interaction_at,
      wp.first_name,
      wp.last_name,
      wp.primary_trade,
      wp.avatar_url,
      wp.is_regulix_ready,
      wp.city
    from krew_relationships kr
    join worker_profiles wp on wp.id = kr.worker_id
    where kr.company_id = auth.uid()
      and kr.in_krew = true
      and (p_regulix_only is not true or wp.is_regulix_ready = true)
      and (p_sources is null or kr.source = any(p_sources))
      and (
        p_search is null or p_search = '' or
        wp.first_name ilike '%' || p_search || '%' or
        wp.last_name  ilike '%' || p_search || '%'
      )
      and (
        p_list_id is null or exists (
          select 1 from krew_list_memberships m
          where m.list_id = p_list_id and m.worker_id = kr.worker_id
        )
      )
  ),
  open_jobs as (
    select j.id, j.title, j.location, coalesce(j.skills, '{}'::text[]) as skills
    from jobs j
    where j.company_id = auth.uid()
      and j.status = 'active'
  ),
  worker_skill_arr as (
    select ws.worker_id as wid,
           array_agg(distinct lower(btrim(ws.name)))
             filter (where btrim(ws.name) <> '') as skill_names
    from worker_skills ws
    where ws.worker_id in (select wid from candidates)
    group by ws.worker_id
  ),
  -- One row per (worker, job) candidate pair with the three signal scores.
  pairs as (
    select
      c.wid,
      case
        when btrim(c.city) <> '' and btrim(j.location) <> ''
         and position(lower(btrim(c.city)) in lower(j.location)) > 0
        then 1 else 0
      end as loc,
      (
        select count(*)::int
        from unnest(j.skills) js
        where lower(btrim(js)) = any(coalesce(s.skill_names, '{}'::text[]))
      ) as skill_overlap,
      case
        when btrim(c.primary_trade) <> '' and btrim(j.title) <> ''
         and position(lower(btrim(c.primary_trade)) in lower(j.title)) > 0
        then 1 else 0
      end as trade_overlap
    from candidates c
    cross join open_jobs j
    left join worker_skill_arr s on s.wid = c.wid
    where not exists (
      select 1 from applications a
      where a.worker_id = c.wid and a.job_id = j.id
    )
  ),
  -- LEFT JOIN keeps workers with zero candidate pairs; the null-pair row
  -- fails every FILTER predicate so their counts come out 0.
  scored as (
    select
      c.wid, c.first_name, c.last_name, c.primary_trade, c.avatar_url,
      c.is_regulix_ready, c.source, c.last_interaction_at,
      count(*) filter (
        where p.loc = 1 or p.skill_overlap > 0 or p.trade_overlap = 1
      )::int as matches,
      count(*) filter (
        where (p.loc = 1 and (p.skill_overlap >= 1 or p.trade_overlap = 1))
           or p.skill_overlap >= 2
      )::int as strong_matches
    from candidates c
    left join pairs p on p.wid = c.wid
    group by c.wid, c.first_name, c.last_name, c.primary_trade, c.avatar_url,
             c.is_regulix_ready, c.source, c.last_interaction_at
  ),
  pruned as (
    select * from scored
    where p_strong_only is not true or strong_matches > 0
  )
  select
    pr.wid,
    pr.first_name, pr.last_name, pr.primary_trade, pr.avatar_url,
    pr.is_regulix_ready, pr.source, pr.last_interaction_at,
    pr.matches, pr.strong_matches,
    count(*) over () as total_count
  from pruned pr
  order by
    -- last_interaction_at is the stable tiebreaker so equal-match workers
    -- don't shuffle between requests (matches the old JS sort).
    case when p_sort_dir = 'asc'  then pr.matches end asc,
    case when p_sort_dir <> 'asc' then pr.matches end desc,
    pr.last_interaction_at desc nulls last
  limit  greatest(p_page_size, 1)
  offset (greatest(p_page, 1) - 1) * greatest(p_page_size, 1)
$$;

grant execute on function public.rank_krew_by_matches(
  text, text[], uuid, boolean, boolean, text, integer, integer
) to authenticated;
