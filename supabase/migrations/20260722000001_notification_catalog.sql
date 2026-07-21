-- ============================================================
-- KREWTREE — Notifications v2: catalog + overrides + data-driven generation
--
-- Replaces the flat notification_preferences table (5 events × 3 channels as
-- columns) and the hardcoded notify_user() CASE with a scalable model:
--   • notification_type   — seeded catalog (one row per event type), the single
--                           source of truth for the settings UI AND the gate
--                           (persona, subject, label, mandatory-in-app, per-
--                           channel defaults). is_badge marks message events
--                           whose "in-app" channel is the Messages nav badge,
--                           not a bell entry (never generated here).
--   • notification_preference — lean per-(user,key,channel) OVERRIDES; a row
--                           exists only where the user deviates from a default.
--   • notify_user(key,…)  — data-driven choke-point: in-app fires if the type
--                           is mandatory OR the user's override/default is on.
--                           Optional dedup_key makes cron sweeps idempotent.
--
-- This migration also carries the event-driven TRIGGER generators (Phase 3).
-- Time-based / digest generators live in 20260722000002 (cron).
-- ============================================================

-- ── 0. Retire the flat model ─────────────────────────────────
DROP TABLE IF EXISTS public.notification_preferences CASCADE;

-- notify_user is recreated below with a new signature; drop the old first so
-- the CASE-based body can't linger.
DROP FUNCTION IF EXISTS public.notify_user(uuid, text, text, text, text);

-- ── 1. Catalog ───────────────────────────────────────────────
CREATE TABLE public.notification_type (
  key             text PRIMARY KEY,
  persona         text NOT NULL CHECK (persona IN ('worker', 'company')),
  subject         text NOT NULL,
  label           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  mandatory_inapp boolean NOT NULL DEFAULT false,
  default_inapp   boolean NOT NULL DEFAULT true,
  default_email   boolean NOT NULL DEFAULT true,
  default_sms     boolean NOT NULL DEFAULT false,
  is_badge        boolean NOT NULL DEFAULT false,
  sort_order      integer NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true
);

ALTER TABLE public.notification_type ENABLE ROW LEVEL SECURITY;
-- Reference data: any authenticated user may read (they render their own grid).
CREATE POLICY "notification_type_read"
  ON public.notification_type FOR SELECT TO authenticated USING (true);

-- ── 2. Per-user overrides ────────────────────────────────────
CREATE TABLE public.notification_preference (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_key text NOT NULL REFERENCES public.notification_type(key) ON DELETE CASCADE,
  channel          text NOT NULL CHECK (channel IN ('inapp', 'email', 'sms')),
  enabled          boolean NOT NULL,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_key, channel)
);

ALTER TABLE public.notification_preference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_preference_select"
  ON public.notification_preference FOR SELECT
  USING (user_id = (select auth.uid()));
CREATE POLICY "notification_preference_insert"
  ON public.notification_preference FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "notification_preference_update"
  ON public.notification_preference FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "notification_preference_delete"
  ON public.notification_preference FOR DELETE
  USING (user_id = (select auth.uid()));

-- ── 3. notifications: catalog-keyed type + dedup ─────────────
-- Clear old test rows (old-format type values) so the FK to the catalog is
-- clean, then swap the hardcoded CHECK for a catalog FK and add dedup support.
DELETE FROM public.notifications;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dedup_key text;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_fkey
  FOREIGN KEY (type) REFERENCES public.notification_type(key) ON DELETE CASCADE;

-- One notification per dedup_key (when set); lets cron sweeps INSERT ... ON
-- CONFLICT DO NOTHING so re-runs never double-send. NULL keys are unconstrained.
CREATE UNIQUE INDEX idx_notifications_dedup ON public.notifications(dedup_key)
  WHERE dedup_key IS NOT NULL;

-- ── 4. Data-driven gate ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id   uuid,
  p_key       text,
  p_title     text,
  p_body      text,
  p_link      text,
  p_dedup_key text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mandatory boolean;
  v_default   boolean;
  v_override  boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT mandatory_inapp, default_inapp
    INTO v_mandatory, v_default
    FROM notification_type
   WHERE key = p_key AND active;

  -- Unknown/inactive key → nothing to send.
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT enabled
    INTO v_override
    FROM notification_preference
   WHERE user_id = p_user_id AND notification_key = p_key AND channel = 'inapp';

  IF v_mandatory OR COALESCE(v_override, v_default) THEN
    INSERT INTO notifications (user_id, type, title, body, link, dedup_key)
    VALUES (p_user_id, p_key, p_title, p_body, p_link, p_dedup_key)
    ON CONFLICT (dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
  END IF;
END;
$$;

-- ── 5. Seed the catalog ──────────────────────────────────────
-- Columns: key, persona, subject, label, description, mandatory, d_inapp,
-- d_email, d_sms, is_badge, sort_order.
INSERT INTO public.notification_type
  (key, persona, subject, label, description, mandatory_inapp, default_inapp, default_email, default_sms, is_badge, sort_order)
VALUES
  -- Worker · Messages
  ('worker.messages.new_message', 'worker', 'Messages', 'New message received',
   'In-app shows an unread badge on your Messages tab. Email and SMS coming soon.',
   false, true, true, false, true, 10),
  -- Worker · Jobs
  ('worker.jobs.new_match', 'worker', 'Jobs', 'New job matches your skills',
   'When a newly posted job matches your skills.', false, true, true, false, false, 20),
  ('worker.jobs.saved_closing_soon', 'worker', 'Jobs', 'Saved job closing soon',
   'A job you saved is closing within 7 days.', false, true, true, false, false, 21),
  ('worker.jobs.saved_closed', 'worker', 'Jobs', 'Saved job was closed',
   'A job you saved has been closed.', false, true, true, false, false, 22),
  ('worker.jobs.applied_job_updated', 'worker', 'Jobs', 'Job you applied to was updated',
   'The title, description, or closing date changed on a job you applied to.', false, true, true, false, false, 23),
  ('worker.jobs.weekly_digest', 'worker', 'Jobs', 'Weekly job recommendations',
   'A weekly digest of jobs recommended for you.', false, true, true, false, false, 24),
  -- Worker · Pipeline
  ('worker.pipeline.in_review', 'worker', 'Pipeline', 'Application in review',
   'A company started reviewing your application.', false, true, true, false, false, 30),
  ('worker.pipeline.offer', 'worker', 'Pipeline', 'You received an offer',
   'A company extended you an offer.', true, true, true, false, false, 31),
  ('worker.pipeline.hired', 'worker', 'Pipeline', 'You''ve been hired',
   'A company hired you.', true, true, true, false, false, 32),
  ('worker.pipeline.not_selected', 'worker', 'Pipeline', 'Application not selected',
   'A company decided not to move forward with your application.', true, true, true, false, false, 33),
  ('worker.pipeline.position_closed', 'worker', 'Pipeline', 'Position closed',
   'A position you applied to was closed and your application is no longer active.', true, true, true, false, false, 34),
  -- Worker · Account
  ('worker.account.password_changed', 'worker', 'Account', 'Password changed',
   'Your account password was changed.', true, true, true, false, false, 40),
  ('worker.account.email_changed', 'worker', 'Account', 'Email changed',
   'Your account email was changed.', true, true, true, false, false, 41),
  ('worker.account.phone_changed', 'worker', 'Account', 'Phone number changed',
   'Your account phone number was changed.', true, true, true, false, false, 42),
  ('worker.account.new_device_signin', 'worker', 'Account', 'New sign-in from a new device',
   'Your account was signed in from a new device.', true, true, true, false, false, 43),
  ('worker.account.profile_completeness_low', 'worker', 'Account', 'Profile completeness dropped',
   'Your profile completeness dropped below the recommended level.', false, true, true, false, false, 44),
  ('worker.account.cert_expiring', 'worker', 'Account', 'Certification expiring',
   'One of your certifications expires within 30 days.', false, true, true, false, false, 45),
  ('worker.account.cert_expired', 'worker', 'Account', 'Certification expired',
   'One of your certifications has expired.', false, true, true, false, false, 46),
  -- Worker · Regulix
  ('worker.regulix.reviews_imported', 'worker', 'Regulix', 'Regulix reviews imported',
   'Your Regulix reviews were imported successfully.', false, true, true, false, false, 50),
  ('worker.regulix.connection_severed', 'worker', 'Regulix', 'Regulix connection severed',
   'Your Regulix connection expired or was revoked.', false, true, true, false, false, 51),

  -- Company · Applicants
  ('company.applicants.new_application', 'company', 'Applicants', 'New application received',
   'A worker applied to one of your jobs.', false, true, true, false, false, 10),
  ('company.applicants.new_application_regulix_ready', 'company', 'Applicants', 'New application — Regulix Ready',
   'A Regulix Ready worker applied to one of your jobs (higher-signal alert).', false, true, true, false, false, 11),
  ('company.applicants.boosted', 'company', 'Applicants', 'Applicant boosted their application',
   'An applicant paid to boost their application.', false, true, true, false, false, 12),
  ('company.applicants.withdrew', 'company', 'Applicants', 'Applicant withdrew',
   'An applicant withdrew their application.', false, true, true, false, false, 13),
  ('company.applicants.daily_summary', 'company', 'Applicants', 'Daily applicant activity summary',
   'A daily rollup of applicant activity across your active jobs.', false, true, true, false, false, 14),
  -- Company · Messages
  ('company.messages.new_message', 'company', 'Messages', 'New message from a worker',
   'In-app shows an unread badge on your Messages tab. Email and SMS coming soon.',
   false, true, true, false, true, 20),
  -- Company · Jobs
  ('company.jobs.closing_soon', 'company', 'Jobs', 'Job nearing its closing date',
   'One of your jobs is nearing its closing date.', false, true, true, false, false, 30),
  ('company.jobs.auto_closed', 'company', 'Jobs', 'Job auto-closed',
   'A job was automatically closed when its closing date was reached.', false, true, true, false, false, 31),
  ('company.jobs.boost_ended', 'company', 'Jobs', 'Paid job boost ended',
   'A paid boost on one of your jobs has ended.', false, true, true, false, false, 32),
  ('company.jobs.paused_14_days', 'company', 'Jobs', 'Job paused for 14 days',
   'A job has been paused for 14 days — resume or close it.', false, true, true, false, false, 33),
  -- Company · Pipeline
  ('company.pipeline.flagged', 'company', 'Pipeline', 'Applicant flagged for attention',
   'An applicant was flagged for attention.', false, true, true, false, false, 40),
  ('company.pipeline.stalled', 'company', 'Pipeline', 'Applicants stalled in a stage',
   'Applicants have been in a stage longer than your pipeline average.', false, true, true, false, false, 41),
  ('company.pipeline.needs_attention_digest', 'company', 'Pipeline', 'Daily needs-attention digest',
   'A daily digest of flagged and stalled applicants.', false, true, true, false, false, 42),
  -- Company · Account
  ('company.account.password_changed', 'company', 'Account', 'Password changed',
   'Your account password was changed.', true, true, true, false, false, 50),
  ('company.account.email_changed', 'company', 'Account', 'Email changed',
   'Your account email was changed.', true, true, true, false, false, 51),
  ('company.account.phone_changed', 'company', 'Account', 'Phone number changed',
   'Your account phone number was changed.', true, true, true, false, false, 52),
  ('company.account.new_device_signin', 'company', 'Account', 'New sign-in from a new device',
   'Your account was signed in from a new device.', true, true, true, false, false, 53),
  ('company.account.email_verification_required', 'company', 'Account', 'Verify your email',
   'Verify your email to unlock posting jobs and messaging workers.', false, true, true, false, false, 54),
  ('company.account.profile_completeness_low', 'company', 'Account', 'Company profile completeness dropped',
   'Your company profile completeness dropped below the recommended level.', false, true, true, false, false, 55),
  ('company.account.license_expiring', 'company', 'Account', 'License expiring',
   'One of your company licenses expires within 30 days.', false, true, true, false, false, 56),
  ('company.account.license_expired', 'company', 'Account', 'License expired',
   'One of your company licenses has expired.', false, true, true, false, false, 57),
  ('company.account.deletion_grace_ending', 'company', 'Account', 'Account deletion grace ending',
   'Your account deletion grace period is ending soon.', true, true, true, false, false, 58),
  ('company.account.payment_charge_failed', 'company', 'Account', 'Payment charge failed',
   'A charge to your payment method failed.', true, true, true, false, false, 59),
  ('company.account.payment_method_expiring', 'company', 'Account', 'Payment method expiring',
   'Your payment method expires within 30 days.', true, true, true, false, false, 60),
  ('company.account.boost_payment_succeeded', 'company', 'Account', 'Boost payment succeeded',
   'A boost payment was processed successfully.', false, true, true, false, false, 61),
  ('company.account.boost_payment_failed', 'company', 'Account', 'Boost payment failed',
   'A boost payment failed.', true, true, true, false, false, 62),
  -- Company · Regulix
  ('company.regulix.new_jobs_available', 'company', 'Regulix', 'New jobs available from Regulix',
   'New jobs are available to pull from Regulix.', false, true, true, false, false, 70),
  ('company.regulix.connection_severed', 'company', 'Regulix', 'Regulix connection severed',
   'Your Regulix connection expired or was revoked.', false, true, true, false, false, 71);

-- ── 6. Trigger generators (Phase 3) ──────────────────────────
-- Replace the two v1 functions and add the rest. All SECURITY DEFINER, all
-- route through notify_user(). Event-driven → no dedup_key (fire once/event).

DROP TRIGGER IF EXISTS trg_notify_on_application ON public.applications;
DROP TRIGGER IF EXISTS trg_notify_on_status_change ON public.applications;
DROP FUNCTION IF EXISTS public.notify_on_application();
DROP FUNCTION IF EXISTS public.notify_on_status_change();

-- New application → company (+ Regulix-Ready higher-signal variant).
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_worker_name text;
  v_job_title   text;
  v_regulix     boolean;
BEGIN
  SELECT NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''),
         COALESCE(is_regulix_ready, false)
    INTO v_worker_name, v_regulix
    FROM worker_profiles WHERE id = NEW.worker_id;
  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;

  PERFORM notify_user(
    NEW.company_id, 'company.applicants.new_application', 'New application',
    COALESCE(v_worker_name, 'A candidate') || ' applied to ' || COALESCE(v_job_title, 'your job'),
    '/site/pipeline');

  IF v_regulix THEN
    PERFORM notify_user(
      NEW.company_id, 'company.applicants.new_application_regulix_ready', 'New Regulix Ready application',
      COALESCE(v_worker_name, 'A Regulix Ready candidate') || ' applied to ' || COALESCE(v_job_title, 'your job'),
      '/site/pipeline');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_application
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application();

-- Application status transitions → worker (hired/not-selected) or company (withdrew).
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_job_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;
  v_job_title := COALESCE(v_job_title, 'a job');

  IF NEW.status = 'terminal_hired' THEN
    PERFORM notify_user(NEW.worker_id, 'worker.pipeline.hired', 'You''ve been hired!',
      'Congratulations — you were hired for ' || v_job_title || '.', '/site/dashboard/worker');
  ELSIF NEW.status = 'terminal_rejected' THEN
    PERFORM notify_user(NEW.worker_id, 'worker.pipeline.not_selected', 'Application update',
      'Your application for ' || v_job_title || ' was not selected this time.', '/site/dashboard/worker');
  ELSIF NEW.status = 'terminal_withdrawn' THEN
    PERFORM notify_user(NEW.company_id, 'company.applicants.withdrew', 'Applicant withdrew',
      'An applicant withdrew from ' || v_job_title || '.', '/site/pipeline');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_status_change
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- Applicant boosted → company.
CREATE OR REPLACE FUNCTION public.notify_on_application_boost()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_worker_name text;
  v_job_title   text;
BEGIN
  IF NEW.is_boosted IS NOT TRUE OR OLD.is_boosted IS NOT DISTINCT FROM NEW.is_boosted THEN
    RETURN NEW;
  END IF;
  SELECT NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
    INTO v_worker_name FROM worker_profiles WHERE id = NEW.worker_id;
  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;
  PERFORM notify_user(NEW.company_id, 'company.applicants.boosted', 'Application boosted',
    COALESCE(v_worker_name, 'An applicant') || ' boosted their application for ' || COALESCE(v_job_title, 'your job') || '.',
    '/site/pipeline');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_application_boost
  AFTER UPDATE OF is_boosted ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_boost();

-- Job closed → workers who saved it (saved_closed) and workers with an active
-- application (position_closed). Fires for both manual and cron auto-close.
CREATE OR REPLACE FUNCTION public.notify_on_job_closed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_job_title text := COALESCE(NEW.title, 'a job');
  r RECORD;
BEGIN
  IF NEW.status <> 'closed' OR OLD.status = 'closed' THEN
    RETURN NEW;
  END IF;

  FOR r IN SELECT worker_id FROM saved_jobs WHERE job_id = NEW.id LOOP
    PERFORM notify_user(r.worker_id, 'worker.jobs.saved_closed', 'Saved job closed',
      'A job you saved, ' || v_job_title || ', has been closed.', '/site/jobs/' || NEW.id::text);
  END LOOP;

  FOR r IN SELECT worker_id FROM applications WHERE job_id = NEW.id AND status = 'active' LOOP
    PERFORM notify_user(r.worker_id, 'worker.pipeline.position_closed', 'Position closed',
      'The position for ' || v_job_title || ' was closed; your application is no longer active.',
      '/site/dashboard/worker');
  END LOOP;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_job_closed
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_job_closed();

-- Job content updated (title/description/closing date) → active applicants.
CREATE OR REPLACE FUNCTION public.notify_on_job_updated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_job_title text := COALESCE(NEW.title, 'a job');
  r RECORD;
BEGIN
  IF NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.closing_at IS NOT DISTINCT FROM OLD.closing_at THEN
    RETURN NEW;
  END IF;
  FOR r IN SELECT worker_id FROM applications WHERE job_id = NEW.id AND status = 'active' LOOP
    PERFORM notify_user(r.worker_id, 'worker.jobs.applied_job_updated', 'Job updated',
      v_job_title || ', a job you applied to, was updated.', '/site/jobs/' || NEW.id::text);
  END LOOP;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_job_updated
  AFTER UPDATE OF title, description, closing_at ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_job_updated();

-- Applicant task flagged for attention → company.
CREATE OR REPLACE FUNCTION public.notify_on_task_flagged()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_worker_name text;
BEGIN
  IF NEW.is_flagged IS NOT TRUE OR OLD.is_flagged IS NOT DISTINCT FROM NEW.is_flagged THEN
    RETURN NEW;
  END IF;
  SELECT a.company_id,
         NULLIF(TRIM(COALESCE(wp.first_name, '') || ' ' || COALESCE(wp.last_name, '')), '')
    INTO v_company_id, v_worker_name
    FROM applications a
    LEFT JOIN worker_profiles wp ON wp.id = a.worker_id
   WHERE a.id = NEW.application_id;
  PERFORM notify_user(v_company_id, 'company.pipeline.flagged', 'Applicant flagged',
    COALESCE(v_worker_name, 'An applicant') || ' was flagged for attention.', '/site/pipeline');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_task_flagged
  AFTER UPDATE OF is_flagged ON public.application_task
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_task_flagged();

-- Regulix state (worker): reviews imported (→true) / connection severed (→false).
CREATE OR REPLACE FUNCTION public.notify_on_worker_regulix()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.regulix_reviews_imported IS TRUE AND OLD.regulix_reviews_imported IS DISTINCT FROM TRUE THEN
    PERFORM notify_user(NEW.worker_id, 'worker.regulix.reviews_imported', 'Regulix reviews imported',
      'Your Regulix reviews were imported successfully.', '/site/dashboard/worker');
  END IF;
  IF NEW.regulix_connected IS FALSE AND OLD.regulix_connected IS DISTINCT FROM FALSE THEN
    PERFORM notify_user(NEW.worker_id, 'worker.regulix.connection_severed', 'Regulix connection severed',
      'Your Regulix connection expired or was revoked.', '/site/dashboard/worker');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_worker_regulix
  AFTER UPDATE OF regulix_connected, regulix_reviews_imported ON public.worker_integrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_worker_regulix();

-- Regulix connection severed (company).
CREATE OR REPLACE FUNCTION public.notify_on_company_regulix()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.regulix_connected IS FALSE AND OLD.regulix_connected IS DISTINCT FROM FALSE THEN
    PERFORM notify_user(NEW.id, 'company.regulix.connection_severed', 'Regulix connection severed',
      'Your Regulix connection expired or was revoked.', '/site/dashboard/company');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_company_regulix
  AFTER UPDATE OF regulix_connected ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_company_regulix();

-- Profile completeness crossed below 80% → the owner (worker or company).
CREATE OR REPLACE FUNCTION public.notify_on_worker_profile_pct()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.profile_complete_pct >= 80 AND NEW.profile_complete_pct < 80 THEN
    PERFORM notify_user(NEW.id, 'worker.account.profile_completeness_low', 'Complete your profile',
      'Your profile completeness dropped below 80%. A complete profile gets more views.',
      '/site/profile/' || NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_worker_profile_pct
  AFTER UPDATE OF profile_complete_pct ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_worker_profile_pct();

CREATE OR REPLACE FUNCTION public.notify_on_company_profile_pct()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.profile_complete_pct >= 80 AND NEW.profile_complete_pct < 80 THEN
    PERFORM notify_user(NEW.id, 'company.account.profile_completeness_low', 'Complete your profile',
      'Your company profile completeness dropped below 80%.', '/site/settings/profile');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_company_profile_pct
  AFTER UPDATE OF profile_complete_pct ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_company_profile_pct();
