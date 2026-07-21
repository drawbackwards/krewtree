-- ============================================================
-- KREWTREE — entity-specific notification deep links (2026-07-22)
-- A notification about a specific person or job should open THAT person/job,
-- not a general list. Repoints:
--   • new application / withdrew / flagged  → /site/profile/<workerId>
--     (company viewers get that worker's applications + pipeline context)
--   • hired / not-selected / position-closed → /site/jobs/<jobId>
--   • job reactivated                        → /site/jobs/<jobId>
-- (closing-soon, auto-closed, saved-closed, applied-job-updated already link to
-- the specific job.) Recreates the affected generator functions; existing rows
-- keep their prior (list) link since the target entity isn't stored on the row.
-- ============================================================

-- New application → the applicant's profile.
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
    '/site/profile/' || NEW.worker_id::text);
  RETURN NEW;
END; $$;

-- Status transitions: worker hired/not-selected → the job; company withdrew → applicant.
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_job_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;
  v_job_title := COALESCE(v_job_title, 'a job');
  IF NEW.status = 'terminal_hired' THEN
    PERFORM notify_user(NEW.worker_id, 'worker.pipeline.hired', 'You''ve been hired!',
      'Congratulations — you were hired for ' || v_job_title || '.', '/site/jobs/' || NEW.job_id::text);
  ELSIF NEW.status = 'terminal_rejected' THEN
    PERFORM notify_user(NEW.worker_id, 'worker.pipeline.not_selected', 'Application update',
      'Your application for ' || v_job_title || ' was not selected this time.', '/site/jobs/' || NEW.job_id::text);
  ELSIF NEW.status = 'terminal_withdrawn' THEN
    PERFORM notify_user(NEW.company_id, 'company.applicants.withdrew', 'Applicant withdrew',
      'An applicant withdrew from ' || v_job_title || '.', '/site/profile/' || NEW.worker_id::text);
  END IF;
  RETURN NEW;
END; $$;

-- Applicant flagged → the applicant's profile.
CREATE OR REPLACE FUNCTION public.notify_on_task_flagged()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id  uuid;
  v_worker_id   uuid;
  v_worker_name text;
BEGIN
  IF NEW.is_flagged IS NOT TRUE OR OLD.is_flagged IS NOT DISTINCT FROM NEW.is_flagged THEN
    RETURN NEW;
  END IF;
  SELECT a.company_id, a.worker_id,
         NULLIF(TRIM(COALESCE(wp.first_name, '') || ' ' || COALESCE(wp.last_name, '')), '')
    INTO v_company_id, v_worker_id, v_worker_name
    FROM applications a
    LEFT JOIN worker_profiles wp ON wp.id = a.worker_id
   WHERE a.id = NEW.application_id;
  PERFORM notify_user(v_company_id, 'company.pipeline.flagged', 'Applicant flagged',
    COALESCE(v_worker_name, 'An applicant') || ' was flagged for attention.',
    '/site/profile/' || v_worker_id::text);
  RETURN NEW;
END; $$;

-- Job closed → savers (job) + active applicants (position closed → the job).
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
      '/site/jobs/' || NEW.id::text);
  END LOOP;
  RETURN NEW;
END; $$;

-- Job reactivated → the job.
CREATE OR REPLACE FUNCTION public.notify_on_job_reactivated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'paused' AND NEW.status = 'active' THEN
    PERFORM notify_user(NEW.company_id, 'company.jobs.reactivated', 'Job reactivated',
      COALESCE(NEW.title, 'A job') || ' was reactivated and is live again.', '/site/jobs/' || NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;
