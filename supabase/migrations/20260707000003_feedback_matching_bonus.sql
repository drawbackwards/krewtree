-- ============================================================
-- Feed Worker Feedback into company-facing worker ranking (bounded bonus).
--
-- Only surfaces that rank WORKERS are touched — a worker's aggregate rating is
-- meaningful there. Surfaces that rank jobs-for-one-worker (getWorkerMatches,
-- getNewJobsForYou) or only count matches (compute_krew_match_counts) are left
-- alone: the signal would be constant across their rows. Worker-facing job
-- recommendations are deliberately untouched.
--
-- The bonus is intentionally BOUNDED so skills/location keep dominating:
--   bonus = clamp(avg_rating - 3.0, 0, 2) * 0.5   → range 0.0 … 1.0
-- capped below a single skill match (worth 2), and applied only to workers who
-- already have a base match, so it nudges ordering a few positions without ever
-- surfacing a non-matching worker. Workers with no feedback get +0 (neutral, no
-- penalty). The aggregate spans all companies' feedback — the calling company
-- can read the rows (SECURITY INVOKER + RLS), which is the intended signal.
-- ============================================================

-- ── 1. Discover "match to job": add the bounded bonus to the per-worker score ─
-- score changes int → numeric to carry the fractional bonus, so the function is
-- dropped and recreated (return type change).
DROP FUNCTION IF EXISTS public.compute_worker_job_match(uuid[], uuid);

CREATE FUNCTION public.compute_worker_job_match(
  p_worker_ids UUID[],
  p_job_id UUID
)
RETURNS TABLE(
  worker_id UUID,
  location_match BOOLEAN,
  trade_match BOOLEAN,
  matched_skills TEXT[],
  score NUMERIC
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH
  job AS (
    SELECT j.id, j.title, j.location, COALESCE(j.skills, '{}'::TEXT[]) AS skills
    FROM public.jobs j
    WHERE j.id = p_job_id
      AND j.company_id = auth.uid()
      AND j.status = 'active'
  ),
  worker_skill_arr AS (
    SELECT ws.worker_id AS wid,
           ARRAY_AGG(DISTINCT lower(btrim(ws.name)))
             FILTER (WHERE btrim(ws.name) <> '') AS names
    FROM public.worker_skills ws
    WHERE ws.worker_id = ANY(p_worker_ids)
    GROUP BY ws.worker_id
  ),
  -- Aggregate feedback rating per worker (all companies' feedback; the caller
  -- is a company so RLS lets it read the rows). Fuels the bounded bonus.
  worker_fb AS (
    SELECT wf.worker_id AS wid, avg(wf.star_rating)::numeric AS avg_rating
    FROM public.worker_feedback wf
    WHERE wf.worker_id = ANY(p_worker_ids)
    GROUP BY wf.worker_id
  ),
  base AS (
    SELECT
      wp.id AS worker_id,
      (
        btrim(wp.city) <> '' AND btrim(j.location) <> ''
        AND position(lower(btrim(wp.city)) IN lower(j.location)) > 0
      ) AS location_match,
      (
        btrim(wp.primary_trade) <> '' AND btrim(j.title) <> ''
        AND position(lower(btrim(wp.primary_trade)) IN lower(j.title)) > 0
      ) AS trade_match,
      COALESCE(
        ARRAY(
          SELECT js FROM unnest(j.skills) AS js
          WHERE lower(btrim(js)) = ANY(COALESCE(s.names, '{}'::TEXT[]))
        ),
        '{}'::TEXT[]
      ) AS matched_skills,
      (
        (CASE WHEN btrim(wp.city) <> '' AND btrim(j.location) <> ''
                AND position(lower(btrim(wp.city)) IN lower(j.location)) > 0
              THEN 1 ELSE 0 END)
        + (CASE WHEN btrim(wp.primary_trade) <> '' AND btrim(j.title) <> ''
                  AND position(lower(btrim(wp.primary_trade)) IN lower(j.title)) > 0
                THEN 1 ELSE 0 END)
        + (SELECT 2 * COUNT(*)::INT FROM unnest(j.skills) AS js
           WHERE lower(btrim(js)) = ANY(COALESCE(s.names, '{}'::TEXT[])))
      ) AS base_score,
      fb.avg_rating
    FROM public.worker_profiles wp
    CROSS JOIN job j
    LEFT JOIN worker_skill_arr s ON s.wid = wp.id
    LEFT JOIN worker_fb fb ON fb.wid = wp.id
    WHERE wp.id = ANY(p_worker_ids)
  )
  SELECT
    b.worker_id,
    b.location_match,
    b.trade_match,
    b.matched_skills,
    (
      b.base_score
      + CASE
          WHEN b.base_score > 0
            THEN round(least(greatest(coalesce(b.avg_rating, 0) - 3.0, 0), 2) * 0.5, 2)
          ELSE 0
        END
    )::numeric AS score
  FROM base b;
$$;

GRANT EXECUTE ON FUNCTION public.compute_worker_job_match(UUID[], UUID) TO authenticated;

-- ── 2. My Krew ranking: feedback as a bounded secondary sort key ──────────────
-- Primary ordering stays `matches` (the count of matched jobs); within a tier,
-- higher-rated workers rank first, before the last-interaction tiebreaker. This
-- never moves a worker across match-count tiers, so it's bounded by design.
-- Body-only change → CREATE OR REPLACE (signature/returns unchanged).
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
  -- Aggregate feedback rating per candidate worker → bounded secondary sort key.
  worker_fb as (
    select wf.worker_id as wid, avg(wf.star_rating)::numeric as avg_rating
    from worker_feedback wf
    where wf.worker_id in (select wid from candidates)
    group by wf.worker_id
  ),
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
  scored as (
    select
      c.wid, c.first_name, c.last_name, c.primary_trade, c.avatar_url,
      c.is_regulix_ready, c.source, c.last_interaction_at,
      f.avg_rating as feedback_avg,
      count(*) filter (
        where p.loc = 1 or p.skill_overlap > 0 or p.trade_overlap = 1
      )::int as matches,
      count(*) filter (
        where (p.loc = 1 and (p.skill_overlap >= 1 or p.trade_overlap = 1))
           or p.skill_overlap >= 2
      )::int as strong_matches
    from candidates c
    left join pairs p on p.wid = c.wid
    left join worker_fb f on f.wid = c.wid
    group by c.wid, c.first_name, c.last_name, c.primary_trade, c.avatar_url,
             c.is_regulix_ready, c.source, c.last_interaction_at, f.avg_rating
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
    case when p_sort_dir = 'asc'  then pr.matches end asc,
    case when p_sort_dir <> 'asc' then pr.matches end desc,
    -- Bounded feedback bonus: reorder within a match tier by rating, above the
    -- stable last-interaction tiebreaker.
    pr.feedback_avg desc nulls last,
    pr.last_interaction_at desc nulls last
  limit  greatest(p_page_size, 1)
  offset (greatest(p_page, 1) - 1) * greatest(p_page_size, 1)
$$;

grant execute on function public.rank_krew_by_matches(
  text, text[], uuid, boolean, boolean, text, integer, integer
) to authenticated;
