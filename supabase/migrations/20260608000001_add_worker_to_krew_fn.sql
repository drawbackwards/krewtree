-- ─── My Krew: single-round-trip add ────────────────────────────────────────
-- The service-layer addWorkerToKrew() previously needed two round-trips: a
-- SELECT to check whether a relationship row already existed (so we'd know
-- whether to preserve its original `source`), and then an UPDATE or INSERT.
--
-- Folding both halves into one INSERT … ON CONFLICT lets PostgREST do the
-- work in a single network call. The CONFLICT clause only touches `in_krew`
-- and `removed_at`; `source` is never overwritten on re-add, matching the
-- previous attribution-history behavior.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.add_worker_to_krew(
  p_worker_id UUID,
  p_source    TEXT DEFAULT 'manual_add'
)
RETURNS VOID
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.krew_relationships (company_id, worker_id, in_krew, source, removed_at)
  VALUES (auth.uid(), p_worker_id, TRUE, p_source, NULL)
  ON CONFLICT (company_id, worker_id) DO UPDATE
    SET in_krew    = TRUE,
        removed_at = NULL;
  -- `source` deliberately omitted from the SET — re-adding a referral or
  -- past-hire worker keeps the original attribution intact.
$$;

GRANT EXECUTE ON FUNCTION public.add_worker_to_krew(UUID, TEXT) TO authenticated;
