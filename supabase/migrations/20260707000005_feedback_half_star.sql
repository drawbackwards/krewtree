-- ============================================================
-- Allow half-star ratings (0.5 increments). star_rating becomes numeric(2,1),
-- constrained to 0.5 … 5.0 on the half. The old integer CHECK is dropped first
-- (otherwise it would keep rejecting 0.5/1.5/… after the type change).
--
-- The history RPC declared star_rating as integer, which would round the new
-- halves away, so it's recreated returning numeric. avg()-based aggregates and
-- the matching bonus already used numeric, so they need no change.
-- ============================================================

ALTER TABLE worker_feedback DROP CONSTRAINT IF EXISTS worker_feedback_star_rating_check;
ALTER TABLE worker_feedback ALTER COLUMN star_rating TYPE numeric(2, 1);
ALTER TABLE worker_feedback ADD CONSTRAINT worker_feedback_star_rating_check
  CHECK (star_rating >= 0.5 AND star_rating <= 5.0 AND (star_rating * 2) % 1 = 0);

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
SET search_path = public
AS $$
  SELECT
    f.id,
    CASE WHEN f.reviewing_company_id = (select auth.uid()) THEN f.application_id ELSE NULL END
      AS application_id,
    f.job_id,
    j.title AS job_title,
    f.star_rating,
    f.would_hire_again,
    f.created_at,
    (f.reviewing_company_id = (select auth.uid())) AS is_own,
    (f.reviewing_company_id = (select auth.uid()) AND now() < f.locked_at) AS is_editable,
    CASE
      WHEN f.reviewing_company_id = (select auth.uid()) THEN f.commentary
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
  GROUP BY f.id, j.title
  ORDER BY f.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_worker_feedback_history(uuid) TO authenticated;
