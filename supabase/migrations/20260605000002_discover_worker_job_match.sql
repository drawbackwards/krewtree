-- ─── Discover: per-job worker match scoring ────────────────────────────────
-- For a set of workers and ONE specific active job belonging to the calling
-- company, return each worker's match signals against that job:
--   location_match  : worker city appears as substring of job location
--   trade_match     : worker primary_trade appears as substring of job title
--   matched_skills  : the subset of job.skills the worker also lists
--   score           : ranking value used by the Discover "Match to job" sort
--                     skills weighted 2x because they're exact-token signals
--                     while location/trade are looser substring checks
--
-- Mirrors the per-pair signal logic in compute_krew_match_counts but exposes
-- the individual fields so the UI can label the pill with what fired.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.compute_worker_job_match(
  p_worker_ids UUID[],
  p_job_id UUID
)
RETURNS TABLE(
  worker_id UUID,
  location_match BOOLEAN,
  trade_match BOOLEAN,
  matched_skills TEXT[],
  score INT
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH
  -- Resolve the job and gate to the caller's own active postings. Returns
  -- zero rows (and therefore an empty result set) if the job belongs to
  -- another company or isn't active — by design.
  job AS (
    SELECT j.id,
           j.title,
           j.location,
           COALESCE(j.skills, '{}'::TEXT[]) AS skills
    FROM public.jobs j
    WHERE j.id = p_job_id
      AND j.company_id = auth.uid()
      AND j.status = 'active'
  ),
  -- Pre-aggregate each worker's skill names (lowercased, trimmed) so the
  -- overlap is a single ANY() check below.
  worker_skill_arr AS (
    SELECT ws.worker_id AS wid,
           ARRAY_AGG(DISTINCT lower(btrim(ws.name)))
             FILTER (WHERE btrim(ws.name) <> '') AS names
    FROM public.worker_skills ws
    WHERE ws.worker_id = ANY(p_worker_ids)
    GROUP BY ws.worker_id
  )
  SELECT
    wp.id AS worker_id,
    (
      btrim(wp.city) <> ''
      AND btrim(j.location) <> ''
      AND position(lower(btrim(wp.city)) IN lower(j.location)) > 0
    ) AS location_match,
    (
      btrim(wp.primary_trade) <> ''
      AND btrim(j.title) <> ''
      AND position(lower(btrim(wp.primary_trade)) IN lower(j.title)) > 0
    ) AS trade_match,
    -- Preserve the job's skill casing in the returned array (workers see the
    -- requirement labels the company wrote, not their own normalization).
    COALESCE(
      ARRAY(
        SELECT js
        FROM unnest(j.skills) AS js
        WHERE lower(btrim(js)) = ANY(COALESCE(s.names, '{}'::TEXT[]))
      ),
      '{}'::TEXT[]
    ) AS matched_skills,
    (
      (CASE WHEN btrim(wp.city) <> ''
              AND btrim(j.location) <> ''
              AND position(lower(btrim(wp.city)) IN lower(j.location)) > 0
            THEN 1 ELSE 0 END)
      + (CASE WHEN btrim(wp.primary_trade) <> ''
                AND btrim(j.title) <> ''
                AND position(lower(btrim(wp.primary_trade)) IN lower(j.title)) > 0
              THEN 1 ELSE 0 END)
      + (
          SELECT 2 * COUNT(*)::INT
          FROM unnest(j.skills) AS js
          WHERE lower(btrim(js)) = ANY(COALESCE(s.names, '{}'::TEXT[]))
        )
    ) AS score
  FROM public.worker_profiles wp
  CROSS JOIN job j
  LEFT JOIN worker_skill_arr s ON s.wid = wp.id
  WHERE wp.id = ANY(p_worker_ids);
$$;

GRANT EXECUTE ON FUNCTION public.compute_worker_job_match(UUID[], UUID) TO authenticated;
