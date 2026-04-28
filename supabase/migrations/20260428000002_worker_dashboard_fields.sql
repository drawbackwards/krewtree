-- Worker dashboard fields
-- Adds new columns and tables required by the worker dashboard spec.

-- ── Jobs ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS closing_at  timestamptz,
  ADD COLUMN IF NOT EXISTS start_date  date,
  ADD COLUMN IF NOT EXISTS end_date    date;

-- ── Applications ──────────────────────────────────────────────────────────────

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS application_source text
    CHECK (application_source IN (
      'dashboard_saved', 'dashboard_recommended', 'job_browse', 'job_detail'
    ));

-- ── Worker preferences (nudge dismissal state) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.worker_preferences (
  worker_id                   uuid PRIMARY KEY
                                REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  regulix_nudge_dismissed_at  timestamptz,
  updated_at                  timestamptz DEFAULT now()
);

ALTER TABLE public.worker_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "worker_preferences_select"
  ON public.worker_preferences FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "worker_preferences_insert"
  ON public.worker_preferences FOR INSERT
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "worker_preferences_update"
  ON public.worker_preferences FOR UPDATE
  USING (worker_id = auth.uid());

-- ── Worker integrations (Regulix connection state) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.worker_integrations (
  worker_id                uuid PRIMARY KEY
                             REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  regulix_connected        boolean NOT NULL DEFAULT false,
  regulix_reviews_imported boolean NOT NULL DEFAULT false,
  updated_at               timestamptz DEFAULT now()
);

ALTER TABLE public.worker_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "worker_integrations_select"
  ON public.worker_integrations FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "worker_integrations_insert"
  ON public.worker_integrations FOR INSERT
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "worker_integrations_update"
  ON public.worker_integrations FOR UPDATE
  USING (worker_id = auth.uid());
