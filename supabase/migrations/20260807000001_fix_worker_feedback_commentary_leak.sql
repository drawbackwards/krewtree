-- ============================================================
-- RLS audit fix #1 (HIGH) — worker_feedback private commentary leak
--
-- Problem: worker_feedback / worker_feedback_pill had a SELECT policy of
-- `is_any_company_member()` and no column-level grant, so Supabase's default
-- full-table SELECT for `authenticated` let ANY company user read EVERY
-- company's private `commentary` (and negative pills) directly via PostgREST —
-- bypassing the per-row masking that only lives inside get_worker_feedback_history.
-- The spec guarantees commentary "never leaves the author."
--
-- Fix, two parts:
--   1. Base-table SELECT is narrowed to the AUTHOR (is_company_member of the
--      reviewing company). Direct table reads now return only your own rows.
--      Every client direct read (feedbackService) is already scoped to the
--      caller's own reviewing_company_id, so this is behaviour-neutral for them.
--   2. The cross-company aggregate/history/top-pills signal is preserved by
--      moving those three read RPCs to SECURITY DEFINER with an explicit
--      is_any_company_member() gate. They keep masking commentary + own-only
--      fields per row — now via is_company_member(reviewing_company_id) so a
--      teammate (not just the founding owner) sees their company's authorship.
--      Workers still get NOTHING from history/top-pills; their aggregate comes
--      from get_worker_feedback_aggregate (self-or-company gated).
-- ============================================================

-- ── 1. Narrow base-table reads to the author ─────────────────
DROP POLICY IF EXISTS "company_read" ON worker_feedback;
CREATE POLICY "author_read" ON worker_feedback FOR SELECT
  USING (is_company_member(reviewing_company_id));

DROP POLICY IF EXISTS "company_read" ON worker_feedback_pill;
CREATE POLICY "author_read" ON worker_feedback_pill FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM worker_feedback f
      WHERE f.id = worker_feedback_pill.feedback_id
        AND is_company_member(f.reviewing_company_id)
    )
  );

-- ── 2a. Aggregate: SECURITY DEFINER, self-or-any-company gate ─
-- (previously DEFINER but gated on the pre-multiseat company_profiles idiom).
CREATE OR REPLACE FUNCTION public.get_worker_feedback_aggregate(p_worker_id uuid)
RETURNS TABLE (average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    round(avg(star_rating)::numeric, 1) AS average_rating,
    count(*) AS review_count
  FROM worker_feedback
  WHERE worker_id = p_worker_id
    AND (
      p_worker_id = (select auth.uid())
      OR is_any_company_member()
    )
$$;
GRANT EXECUTE ON FUNCTION public.get_worker_feedback_aggregate(uuid) TO authenticated;

-- ── 2b. Top pills: SECURITY DEFINER, company-only gate ───────
CREATE OR REPLACE FUNCTION public.get_worker_feedback_top_pills(p_worker_id uuid)
RETURNS TABLE (
  pill_id uuid,
  slug text,
  label text,
  sentiment text,
  cnt bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fp.id,
    fp.slug,
    fp.label,
    fp.sentiment,
    count(*) AS cnt
  FROM worker_feedback f
  JOIN worker_feedback_pill wfp ON wfp.feedback_id = f.id
  JOIN feedback_pill fp ON fp.id = wfp.pill_id
  WHERE f.worker_id = p_worker_id
    AND is_any_company_member()
  GROUP BY fp.id, fp.slug, fp.label, fp.sentiment, fp.display_order
  ORDER BY fp.sentiment, count(*) DESC, fp.display_order ASC
$$;
GRANT EXECUTE ON FUNCTION public.get_worker_feedback_top_pills(uuid) TO authenticated;

-- ── 2c. History: SECURITY DEFINER, company-only gate ─────────
-- Same shape as 20260707000005 (numeric star_rating + application_id), but no
-- longer relies on the permissive base policy. Author-scoped fields now use
-- is_company_member(reviewing_company_id) for multi-seat correctness.
DROP FUNCTION IF EXISTS public.get_worker_feedback_history(uuid);
CREATE FUNCTION public.get_worker_feedback_history(p_worker_id uuid)
RETURNS TABLE (
  id uuid,
  application_id uuid,
  job_id uuid,
  job_title text,
  star_rating numeric,
  would_hire_again text,
  created_at timestamptz,
  is_own boolean,
  is_editable boolean,
  commentary text,
  positive_pills text[],
  negative_pills text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    CASE WHEN is_company_member(f.reviewing_company_id) THEN f.application_id ELSE NULL END
      AS application_id,
    f.job_id,
    j.title AS job_title,
    f.star_rating,
    f.would_hire_again,
    f.created_at,
    is_company_member(f.reviewing_company_id) AS is_own,
    (is_company_member(f.reviewing_company_id) AND now() < f.locked_at) AS is_editable,
    CASE
      WHEN is_company_member(f.reviewing_company_id) THEN f.commentary
      ELSE NULL
    END AS commentary,
    coalesce(
      array_agg(fp.label ORDER BY fp.display_order) FILTER (WHERE fp.sentiment = 'positive'),
      ARRAY[]::text[]
    ) AS positive_pills,
    coalesce(
      array_agg(fp.label ORDER BY fp.display_order) FILTER (WHERE fp.sentiment = 'negative'),
      ARRAY[]::text[]
    ) AS negative_pills
  FROM worker_feedback f
  LEFT JOIN jobs j ON j.id = f.job_id
  LEFT JOIN worker_feedback_pill wfp ON wfp.feedback_id = f.id
  LEFT JOIN feedback_pill fp ON fp.id = wfp.pill_id
  WHERE f.worker_id = p_worker_id
    AND is_any_company_member()
  GROUP BY f.id, j.title
  ORDER BY f.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.get_worker_feedback_history(uuid) TO authenticated;
