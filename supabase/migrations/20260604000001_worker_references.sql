-- ─── Worker References ──────────────────────────────────────────────────────
-- Self-reported professional references on the worker profile.
-- Hidden on the public profile; revealed to a company once the worker has
-- submitted any application to a job at that company. Access is tied to the
-- (company, worker) relationship and persists through terminal application
-- states. Consent is section-level and gates company-side visibility.
-- ────────────────────────────────────────────────────────────────────────────

-- Section-level consent timestamp + denormalized count for the public-profile
-- "X references available on application" indicator. The count is maintained
-- by upsert_worker_profile in the same call that replaces the reference rows.
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS references_consent_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS references_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.worker_references (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  company       TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT worker_references_at_least_one_contact
    CHECK (COALESCE(phone, '') <> '' OR COALESCE(email, '') <> '')
);

CREATE INDEX IF NOT EXISTS idx_worker_references_worker
  ON public.worker_references(worker_id);

DROP TRIGGER IF EXISTS worker_references_set_updated_at ON public.worker_references;
CREATE TRIGGER worker_references_set_updated_at
  BEFORE UPDATE ON public.worker_references
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.worker_references ENABLE ROW LEVEL SECURITY;

-- Worker fully owns their references.
CREATE POLICY "own_all" ON public.worker_references
  FOR ALL
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

-- A company reads a worker's references once the worker has applied to any
-- job at that company AND the worker has section-level consent confirmed.
-- Access persists across terminal application states by design (per spec).
CREATE POLICY "company_read" ON public.worker_references
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.worker_id = worker_references.worker_id
        AND j.company_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.worker_profiles wp
      WHERE wp.id = worker_references.worker_id
        AND wp.references_consent_confirmed_at IS NOT NULL
    )
  );
