-- ============================================================
-- Per-job analytics: view-event capture + read RPC
--
-- Companies had no per-job performance surface, and the one existing counter
-- (job_analytics.views_total) was dead: increment_job_view() had no callers, so
-- views were always 0, and nothing recorded WHERE a viewer came from or WHAT
-- they searched to find a job.
--
-- This migration:
--   1. Adds job_view_event — one row per landed job view, with a traffic
--      `source` and (for search traffic) the `search_keyword`.
--   2. Replaces increment_job_view with track_job_view, which both keeps the
--      views_total counter alive (JobPostsPage reads it) and logs an event row.
--   3. Adds get_job_analytics(job_id) — a single-round-trip jsonb aggregate for
--      the new Job Analytics page, mirroring get_company_dashboard's
--      SECURITY INVOKER + RLS-gated pattern (20260615000002).
-- ============================================================

-- ── 1. job_view_event ─────────────────────────────────────────
CREATE TABLE job_view_event (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source         TEXT        NOT NULL DEFAULT 'direct',
  search_keyword TEXT,
  viewer_id      UUID,  -- nullable: anonymous (logged-out) views are counted too
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics reads always scope by job and by time window.
CREATE INDEX idx_job_view_event_job ON job_view_event(job_id, created_at);

ALTER TABLE job_view_event ENABLE ROW LEVEL SECURITY;

-- Only the owning company can read its jobs' view events. No INSERT policy:
-- writes go exclusively through track_job_view() (SECURITY DEFINER).
CREATE POLICY "company_read" ON job_view_event FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = (select auth.uid())));

-- ── 2. track_job_view ─────────────────────────────────────────
-- Supersedes increment_job_view (which had no callers). SECURITY DEFINER so
-- anonymous visitors on the public job-detail route can be counted.
DROP FUNCTION IF EXISTS increment_job_view(UUID);

CREATE OR REPLACE FUNCTION track_job_view(
  p_job_id         UUID,
  p_source         TEXT DEFAULT 'direct',
  p_search_keyword TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source  TEXT;
  v_keyword TEXT;
BEGIN
  -- Normalize source to a known set; anything unexpected falls back to 'direct'.
  v_source := CASE lower(coalesce(p_source, 'direct'))
    WHEN 'search'          THEN 'search'
    WHEN 'browse'          THEN 'browse'
    WHEN 'company_profile' THEN 'company_profile'
    WHEN 'landing'         THEN 'landing'
    WHEN 'similar'         THEN 'similar'
    ELSE 'direct'
  END;

  -- Keep keywords only for search traffic; trim + cap length.
  v_keyword := NULL;
  IF v_source = 'search' AND btrim(coalesce(p_search_keyword, '')) <> '' THEN
    v_keyword := left(btrim(p_search_keyword), 120);
  END IF;

  -- (a) keep the aggregate counter alive (JobPostsPage / JOB_SELECT read it)
  INSERT INTO public.job_analytics (job_id, views_total)
    VALUES (p_job_id, 1)
    ON CONFLICT (job_id) DO UPDATE
      SET views_total = public.job_analytics.views_total + 1,
          updated_at  = NOW();

  -- (b) log the event for source / keyword / time-series breakdowns
  INSERT INTO public.job_view_event (job_id, source, search_keyword, viewer_id)
    VALUES (p_job_id, v_source, v_keyword, (select auth.uid()));
END;
$$;

GRANT EXECUTE ON FUNCTION track_job_view(UUID, TEXT, TEXT) TO anon, authenticated;

-- ── 3. get_job_analytics ──────────────────────────────────────
-- SECURITY INVOKER: the caller's RLS gates every table, and the explicit
-- company_id guard means a company only ever gets data for a job it owns
-- (any other job id resolves to no owned row -> null payload).
CREATE OR REPLACE FUNCTION get_job_analytics(p_job_id UUID)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  WITH owned AS (
    SELECT j.id, j.created_at
    FROM public.jobs j
    WHERE j.id = p_job_id
      AND j.company_id = (select auth.uid())
  ),
  -- 14-day zero-filled day axis (oldest -> newest), matching the client chart.
  days AS (
    SELECT generate_series(0, 13) AS n
  ),
  day_axis AS (
    SELECT
      d.n,
      (date_trunc('day', timezone('UTC', now())) at time zone 'UTC')
        - make_interval(days => (13 - d.n)) AS day_start
    FROM days d
  ),
  views AS (
    SELECT count(*) AS c
    FROM public.job_view_event e, owned
    WHERE e.job_id = owned.id
  ),
  views_by_day AS (
    SELECT coalesce(
      jsonb_agg(
        (SELECT count(*)
           FROM public.job_view_event e, owned
          WHERE e.job_id = owned.id
            AND e.created_at >= a.day_start
            AND e.created_at <  a.day_start + interval '1 day')
        ORDER BY a.n
      ),
      '[]'::jsonb
    ) AS arr
    FROM day_axis a
  ),
  apps AS (
    SELECT count(*) AS c
    FROM public.applications ap, owned
    WHERE ap.job_id = owned.id
  ),
  apps_by_day AS (
    SELECT coalesce(
      jsonb_agg(
        (SELECT count(*)
           FROM public.applications ap, owned
          WHERE ap.job_id = owned.id
            AND ap.created_at >= a.day_start
            AND ap.created_at <  a.day_start + interval '1 day')
        ORDER BY a.n
      ),
      '[]'::jsonb
    ) AS arr
    FROM day_axis a
  ),
  -- Average hours between the job being posted and each application.
  ttl AS (
    SELECT coalesce(
      avg(extract(epoch FROM (ap.created_at - owned.created_at)) / 3600.0),
      0
    ) AS hours
    FROM public.applications ap, owned
    WHERE ap.job_id = owned.id
  ),
  -- Active applicants grouped by their current pipeline stage.
  funnel_stages AS (
    SELECT
      ps.id          AS stage_id,
      ps.name        AS stage_name,
      ps.sort_order  AS sort_order,
      count(ap.id)   AS c
    FROM public.applications ap
    JOIN owned ON ap.job_id = owned.id
    JOIN public.pipeline_stage ps ON ps.id = ap.current_stage_id
    WHERE ap.status = 'active'
    GROUP BY ps.id, ps.name, ps.sort_order
  ),
  funnel AS (
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'stage_id',   stage_id,
          'stage_name', stage_name,
          'sort_order', sort_order,
          'count',      c
        )
        ORDER BY sort_order
      ),
      '[]'::jsonb
    ) AS arr
    FROM funnel_stages
  ),
  -- Terminal outcomes (hired / rejected) appended after the live stages.
  outcomes AS (
    SELECT
      count(*) FILTER (WHERE ap.status = 'terminal_hired')    AS hired,
      count(*) FILTER (WHERE ap.status = 'terminal_rejected') AS rejected
    FROM public.applications ap, owned
    WHERE ap.job_id = owned.id
  ),
  sources AS (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object('source', s.source, 'count', s.c) ORDER BY s.c DESC),
      '[]'::jsonb
    ) AS arr
    FROM (
      SELECT e.source, count(*) AS c
      FROM public.job_view_event e, owned
      WHERE e.job_id = owned.id
      GROUP BY e.source
    ) s
  ),
  keywords AS (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object('keyword', k.search_keyword, 'count', k.c) ORDER BY k.c DESC),
      '[]'::jsonb
    ) AS arr
    FROM (
      SELECT lower(e.search_keyword) AS search_keyword, count(*) AS c
      FROM public.job_view_event e, owned
      WHERE e.job_id = owned.id
        AND e.source = 'search'
        AND e.search_keyword IS NOT NULL
      GROUP BY lower(e.search_keyword)
      ORDER BY count(*) DESC
      LIMIT 10
    ) k
  )
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM owned) THEN NULL ELSE
    jsonb_build_object(
      'kpis', jsonb_build_object(
        'views_total',             (SELECT c FROM views),
        'applications_total',      (SELECT c FROM apps),
        'conversion_rate',         CASE WHEN (SELECT c FROM views) > 0
                                     THEN round((SELECT c FROM apps)::numeric * 100 / (SELECT c FROM views), 1)
                                     ELSE 0 END,
        'avg_time_to_apply_hours', round((SELECT hours FROM ttl)::numeric, 1)
      ),
      'views_by_day',        (SELECT arr FROM views_by_day),
      'applications_by_day', (SELECT arr FROM apps_by_day),
      'funnel',              (SELECT arr FROM funnel),
      'outcomes', jsonb_build_object(
        'hired',    (SELECT hired FROM outcomes),
        'rejected', (SELECT rejected FROM outcomes)
      ),
      'sources',  (SELECT arr FROM sources),
      'keywords', (SELECT arr FROM keywords)
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION get_job_analytics(UUID) TO authenticated;
