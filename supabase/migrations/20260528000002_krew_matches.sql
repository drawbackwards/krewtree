-- ─── My Krew: matches column aggregation ───────────────────────────────────
-- For a set of workers, return how many of the calling company's currently-
-- active jobs each one matches against. Signals: skill overlap (jobs.skills
-- ∩ worker_skills.name), city ↔ job.location substring, and trade ↔ job.title
-- substring as a fallback when neither side has a skills array filled out.
-- Jobs the worker has already applied to are excluded.
--
-- Returns two counts so the UI can render both the badge ("matches") and the
-- "Strong matches only" filter without a second round-trip:
--   match         = at least one signal present
--   strong match  = location AND (skill ≥ 1 OR trade), OR skill overlap ≥ 2
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.compute_krew_match_counts(
  p_worker_ids UUID[]
)
RETURNS TABLE(worker_id UUID, matches INT, strong_matches INT)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH
  -- Caller's active jobs. RLS already restricts to their own rows for non-
  -- active rows, but the explicit company_id = auth.uid() guard avoids leaking
  -- counts against other companies' active (public-readable) postings.
  open_jobs AS (
    SELECT j.id,
           j.title,
           j.location,
           COALESCE(j.skills, '{}'::TEXT[]) AS skills
    FROM public.jobs j
    WHERE j.company_id = auth.uid()
      AND j.status = 'active'
  ),
  -- Pre-aggregate each worker's skill names (lowercased, trimmed) so the
  -- per-pair overlap is a single ANY() check, not a join inside the cross.
  worker_skill_arr AS (
    SELECT ws.worker_id AS wid,
           ARRAY_AGG(DISTINCT lower(btrim(ws.name)))
             FILTER (WHERE btrim(ws.name) <> '') AS skill_names
    FROM public.worker_skills ws
    WHERE ws.worker_id = ANY(p_worker_ids)
    GROUP BY ws.worker_id
  ),
  workers AS (
    SELECT wp.id AS wid,
           wp.city,
           wp.primary_trade,
           COALESCE(s.skill_names, '{}'::TEXT[]) AS skill_names
    FROM public.worker_profiles wp
    LEFT JOIN worker_skill_arr s ON s.wid = wp.id
    WHERE wp.id = ANY(p_worker_ids)
  ),
  -- One row per (worker, job) candidate pair, with the three signal scores.
  -- NOT EXISTS strips out jobs the worker has already applied to so they
  -- don't inflate the count.
  pairs AS (
    SELECT
      w.wid,
      j.id AS jid,
      CASE
        WHEN btrim(w.city) <> ''
         AND btrim(j.location) <> ''
         AND position(lower(btrim(w.city)) IN lower(j.location)) > 0
        THEN 1 ELSE 0
      END AS loc,
      (
        SELECT COUNT(*)::INT
        FROM unnest(j.skills) AS js
        WHERE lower(btrim(js)) = ANY(w.skill_names)
      ) AS skill_overlap,
      CASE
        WHEN btrim(w.primary_trade) <> ''
         AND btrim(j.title) <> ''
         AND position(lower(btrim(w.primary_trade)) IN lower(j.title)) > 0
        THEN 1 ELSE 0
      END AS trade_overlap
    FROM workers w
    CROSS JOIN open_jobs j
    WHERE NOT EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.worker_id = w.wid AND a.job_id = j.id
    )
  )
  SELECT
    w.wid AS worker_id,
    -- LEFT JOIN guarantees one row per worker; FILTER returns 0 when pairs is
    -- empty (the NULL row from the outer join fails every predicate).
    COUNT(*) FILTER (
      WHERE p.loc = 1 OR p.skill_overlap > 0 OR p.trade_overlap = 1
    )::INT AS matches,
    COUNT(*) FILTER (
      WHERE (p.loc = 1 AND (p.skill_overlap >= 1 OR p.trade_overlap = 1))
         OR p.skill_overlap >= 2
    )::INT AS strong_matches
  FROM workers w
  LEFT JOIN pairs p ON p.wid = w.wid
  GROUP BY w.wid;
$$;

GRANT EXECUTE ON FUNCTION public.compute_krew_match_counts(UUID[]) TO authenticated;
