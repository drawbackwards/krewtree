-- ============================================================
-- KREWTREE — fix notification deep links (2026-07-22)
-- Company applicant/pipeline notifications linked to /site/pipeline, which is
-- the pipeline STAGE EDITOR (no applicants) — a dead-end from a "new
-- application" alert. Repoint them to the Applicants list (/site/dashboard/
-- applicants). Recreates the affected generator functions (bodies unchanged
-- except the link) and repoints existing rows.
-- ============================================================

-- New application → company.
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
    '/site/dashboard/applicants');
  RETURN NEW;
END; $$;

-- Status transitions: worker hired/not-selected (dashboard) + company withdrew.
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_job_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
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
      'An applicant withdrew from ' || v_job_title || '.', '/site/dashboard/applicants');
  END IF;
  RETURN NEW;
END; $$;

-- Applicant flagged → company.
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
    COALESCE(v_worker_name, 'An applicant') || ' was flagged for attention.', '/site/dashboard/applicants');
  RETURN NEW;
END; $$;

-- Company daily digest: needs-attention now also points at the applicants list.
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
        v_flagged || ' flagged applicant(s) need attention.', '/site/dashboard/applicants',
        'needs_attention:' || r.id::text || ':' || v_day);
    END IF;
  END LOOP;
END; $$;

-- Repoint notifications already created with the old link.
UPDATE public.notifications SET link = '/site/dashboard/applicants' WHERE link = '/site/pipeline';
