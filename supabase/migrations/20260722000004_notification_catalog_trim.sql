-- ============================================================
-- KREWTREE — Notifications v2 catalog trim (2026-07-22)
-- Drops events without scaffolding, relaxes worker application alerts from
-- mandatory to optional, and reworks "job paused 14 days" into "job
-- reactivated". Follows 20260722000001/2/3.
-- ============================================================

-- ── 1. Remove events we don't support ────────────────────────
DELETE FROM public.notification_type WHERE key IN (
  'worker.pipeline.offer',                          -- no offer signal in the data model
  'worker.account.cert_expiring',                   -- certs are "earned", expirations not tracked
  'worker.account.cert_expired',
  'company.applicants.boosted',                     -- no paid-boost backing
  'company.applicants.new_application_regulix_ready',
  'company.pipeline.stalled',
  'company.account.boost_payment_succeeded',        -- no billing
  'company.account.boost_payment_failed',
  'company.regulix.new_jobs_available'
);

-- ── 2. Worker application (pipeline) alerts become optional ──
UPDATE public.notification_type
   SET mandatory_inapp = false
 WHERE key LIKE 'worker.pipeline.%';

-- ── 3. "Job paused 14 days" → "Job reactivated" ──────────────
DELETE FROM public.notification_type WHERE key = 'company.jobs.paused_14_days';
INSERT INTO public.notification_type
  (key, persona, subject, label, description, mandatory_inapp, default_inapp, default_email, default_sms, is_badge, sort_order)
VALUES
  ('company.jobs.reactivated', 'company', 'Jobs', 'Job reactivated',
   'A paused job you posted was set back to active.', false, true, true, false, false, 33);

-- ── 4. Generator fixes ───────────────────────────────────────

-- New-application trigger: drop the Regulix-Ready variant.
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_worker_name text;
  v_job_title   text;
BEGIN
  SELECT NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
    INTO v_worker_name FROM worker_profiles WHERE id = NEW.worker_id;
  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;
  PERFORM notify_user(
    NEW.company_id, 'company.applicants.new_application', 'New application',
    COALESCE(v_worker_name, 'A candidate') || ' applied to ' || COALESCE(v_job_title, 'your job'),
    '/site/pipeline');
  RETURN NEW;
END; $$;

-- Applicant-boost trigger removed entirely.
DROP TRIGGER IF EXISTS trg_notify_on_application_boost ON public.applications;
DROP FUNCTION IF EXISTS public.notify_on_application_boost();

-- Job reactivated (paused → active) → company.
CREATE OR REPLACE FUNCTION public.notify_on_job_reactivated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'paused' AND NEW.status = 'active' THEN
    PERFORM notify_user(NEW.company_id, 'company.jobs.reactivated', 'Job reactivated',
      COALESCE(NEW.title, 'A job') || ' was reactivated and is live again.', '/site/dashboard/jobs');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_on_job_reactivated ON public.jobs;
CREATE TRIGGER trg_notify_on_job_reactivated
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_job_reactivated();

-- Drop the paused-14-days cron + function.
DO $$ BEGIN PERFORM cron.unschedule('krewtree-notify-paused-jobs'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP FUNCTION IF EXISTS public.notify_jobs_paused_long();

-- Credential expiry sweep: company licenses only (drop the worker-cert branch).
CREATE OR REPLACE FUNCTION public.notify_credentials_expiring()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, company_id, license_type, expiration_date FROM company_licenses WHERE expiration_date IS NOT NULL LOOP
    IF r.expiration_date < CURRENT_DATE THEN
      PERFORM notify_user(r.company_id, 'company.account.license_expired', 'License expired',
        COALESCE(NULLIF(r.license_type, ''), 'A license') || ' has expired.',
        '/site/settings/profile', 'license_expired:' || r.id::text);
    ELSIF r.expiration_date <= CURRENT_DATE + 30 THEN
      PERFORM notify_user(r.company_id, 'company.account.license_expiring', 'License expiring',
        COALESCE(NULLIF(r.license_type, ''), 'A license') || ' expires within 30 days.',
        '/site/settings/profile', 'license_expiring:' || r.id::text);
    END IF;
  END LOOP;
END; $$;

-- Company daily digest: drop the stalled-applicant notification; needs-attention
-- is now flagged-only.
CREATE OR REPLACE FUNCTION public.notify_company_daily_digests()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_new int;
  v_flagged int;
  v_day text := to_char(CURRENT_DATE, 'YYYY-MM-DD');
BEGIN
  FOR r IN SELECT id FROM company_profiles WHERE deleted_at IS NULL LOOP
    SELECT count(*) INTO v_new FROM applications
      WHERE company_id = r.id AND created_at >= now() - interval '24 hours';
    IF v_new > 0 THEN
      PERFORM notify_user(r.id, 'company.applicants.daily_summary', 'Daily applicant summary',
        v_new || ' new application(s) in the last day.', '/site/dashboard/applicants',
        'daily_summary:' || r.id::text || ':' || v_day);
    END IF;

    SELECT count(*) INTO v_flagged FROM application_task t
      JOIN applications a ON a.id = t.application_id
      WHERE a.company_id = r.id AND t.is_flagged = true;
    IF v_flagged > 0 THEN
      PERFORM notify_user(r.id, 'company.pipeline.needs_attention_digest', 'Needs attention',
        v_flagged || ' flagged applicant(s) need attention.', '/site/pipeline',
        'needs_attention:' || r.id::text || ':' || v_day);
    END IF;
  END LOOP;
END; $$;
