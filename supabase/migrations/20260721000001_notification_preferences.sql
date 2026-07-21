-- ============================================================
-- KREWTREE — Notification preferences + in-app notification generation
--
-- Two halves:
--   1. notification_preferences — one row per auth user (both personas),
--      a boolean per (event × channel). In-app + email default ON; SMS
--      defaults OFF (opt-in). No row = all defaults. The UI only surfaces
--      the columns relevant to the viewer's persona; the rest keep defaults.
--   2. Generation triggers — the `notifications` table (seeded in the base
--      schema) has never been written to. These SECURITY DEFINER triggers
--      populate it on the events workers/companies care about, each gated on
--      the recipient's *_inapp preference via notify_user(). Email/SMS are
--      stored now but NOT delivered — the send infra ships separately.
--
-- Event → recipient:
--   application    → company (a worker applied to its job)
--   message        → the party who is NOT the sender
--   status_change  → worker (hired / rejected / advanced a pipeline stage)
--   review         → worker (received worker_feedback; body stays generic so
--                    it never leaks commentary/company — workers only ever see
--                    their aggregate rating)
--   job_alert      → toggle only this pass; no generator (needs saved-search
--                    matching + cron).
-- ============================================================

-- ── 1. Preferences table ─────────────────────────────────────

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- in-app (drives whether a notifications row is created)
  application_inapp   boolean NOT NULL DEFAULT true,
  message_inapp       boolean NOT NULL DEFAULT true,
  status_change_inapp boolean NOT NULL DEFAULT true,
  review_inapp        boolean NOT NULL DEFAULT true,
  job_alert_inapp     boolean NOT NULL DEFAULT true,
  -- email (stored now, delivered once the send infra lands)
  application_email   boolean NOT NULL DEFAULT true,
  message_email       boolean NOT NULL DEFAULT true,
  status_change_email boolean NOT NULL DEFAULT true,
  review_email        boolean NOT NULL DEFAULT true,
  job_alert_email     boolean NOT NULL DEFAULT true,
  -- sms (stored now, delivered later; opt-in)
  application_sms     boolean NOT NULL DEFAULT false,
  message_sms         boolean NOT NULL DEFAULT false,
  status_change_sms   boolean NOT NULL DEFAULT false,
  review_sms          boolean NOT NULL DEFAULT false,
  job_alert_sms       boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Owner-only. auth.uid() wrapped in a subselect per the perf convention.
CREATE POLICY "notification_preferences_select"
  ON public.notification_preferences FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "notification_preferences_insert"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "notification_preferences_update"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 2. Gate helper ───────────────────────────────────────────
-- Inserts a notification only if the recipient's in-app toggle for this type
-- is on (missing row = default on). SECURITY DEFINER so triggers can write
-- rows for a user other than the caller (bypasses the notifications RLS).

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text,
  p_link    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT CASE p_type
           WHEN 'application'   THEN application_inapp
           WHEN 'message'       THEN message_inapp
           WHEN 'status_change' THEN status_change_inapp
           WHEN 'review'        THEN review_inapp
           WHEN 'job_alert'     THEN job_alert_inapp
           ELSE true
         END
    INTO v_enabled
    FROM notification_preferences
   WHERE user_id = p_user_id;

  -- No preferences row yet → default on.
  IF COALESCE(v_enabled, true) THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (p_user_id, p_type, p_title, p_body, p_link);
  END IF;
END;
$$;

-- ── 3. application → notify the company ───────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker_name text;
  v_job_title   text;
BEGIN
  SELECT NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
    INTO v_worker_name
    FROM worker_profiles WHERE id = NEW.worker_id;

  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;

  PERFORM notify_user(
    NEW.company_id,
    'application',
    'New application',
    COALESCE(v_worker_name, 'A candidate') || ' applied to ' || COALESCE(v_job_title, 'your job'),
    '/site/pipeline'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_application ON public.applications;
CREATE TRIGGER trg_notify_on_application
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application();

-- ── 4. message → notify the non-sender ───────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient   uuid;
  v_sender_name text;
BEGIN
  IF NEW.sent_by = NEW.company_id THEN
    v_recipient := NEW.worker_id;
    SELECT name INTO v_sender_name FROM company_profiles WHERE id = NEW.company_id;
  ELSE
    v_recipient := NEW.company_id;
    SELECT NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
      INTO v_sender_name
      FROM worker_profiles WHERE id = NEW.worker_id;
  END IF;

  PERFORM notify_user(
    v_recipient,
    'message',
    'New message from ' || COALESCE(v_sender_name, 'someone'),
    LEFT(NEW.body, 140),
    '/site/messages?dm=' || NEW.sent_by::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_message ON public.message;
CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON public.message
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- ── 5. status_change → notify the worker ─────────────────────
-- Fires on hire, rejection, or a forward move to a new active pipeline stage.
-- Worker-initiated/administrative terminals (withdrawn, archived) are skipped
-- to avoid notifying the worker about their own or back-office actions.

CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_title  text;
  v_stage_name text;
  v_title      text;
  v_body       text;
BEGIN
  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;
  v_job_title := COALESCE(v_job_title, 'a job');

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'terminal_hired' THEN
      v_title := 'You''ve been hired!';
      v_body  := 'Congratulations — you were hired for ' || v_job_title || '.';
    ELSIF NEW.status = 'terminal_rejected' THEN
      v_title := 'Application update';
      v_body  := 'Your application for ' || v_job_title || ' was not selected this time.';
    ELSE
      -- terminal_withdrawn / terminal_archived → no worker notification.
      RETURN NEW;
    END IF;
  ELSIF NEW.current_stage_id IS DISTINCT FROM OLD.current_stage_id
        AND NEW.status = 'active' THEN
    SELECT stage_el ->> 'name'
      INTO v_stage_name
      FROM jobs j,
           jsonb_array_elements(j.pipeline_snapshot -> 'stages') AS stage_el
     WHERE j.id = NEW.job_id
       AND (stage_el ->> 'id')::uuid = NEW.current_stage_id
     LIMIT 1;

    v_title := 'Application update';
    v_body  := 'Your application for ' || v_job_title
               || COALESCE(' advanced to ' || v_stage_name, ' moved forward') || '.';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM notify_user(NEW.worker_id, 'status_change', v_title, v_body, '/site/dashboard/worker');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_status_change ON public.applications;
CREATE TRIGGER trg_notify_on_status_change
  AFTER UPDATE OF status, current_stage_id ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- ── 6. review → notify the worker (generic body, no leak) ────

CREATE OR REPLACE FUNCTION public.notify_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_user(
    NEW.worker_id,
    'review',
    'New feedback',
    'You received new feedback on your profile.',
    '/site/profile/' || NEW.worker_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_review ON public.worker_feedback;
CREATE TRIGGER trg_notify_on_review
  AFTER INSERT ON public.worker_feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_review();
