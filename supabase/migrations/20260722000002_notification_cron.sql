-- ============================================================
-- KREWTREE — Notifications v2: time-based / digest generators (pg_cron)
--
-- Follows 20260722000001. Each sweep is a SECURITY DEFINER function that routes
-- through notify_user() with a stable dedup_key, so re-runs never double-send
-- (notify_user does INSERT ... ON CONFLICT (dedup_key) DO NOTHING). Mirrors the
-- proven publish_scheduled_jobs pattern (20260706000001): extension guard,
-- service_role grant, cron.schedule.
--
-- NOTE: the auto-close sweep also introduces the previously-missing behavior of
-- closing jobs when their closing_at passes; the jobs-closed trigger from
-- 20260722000001 then fires the saved_closed / position_closed worker alerts.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── 1. Jobs closing soon (company + savers) ──────────────────
CREATE OR REPLACE FUNCTION public.notify_jobs_closing_soon()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, company_id, title FROM jobs
     WHERE status = 'active' AND closing_at IS NOT NULL
       AND closing_at > now() AND closing_at <= now() + interval '7 days'
  LOOP
    PERFORM notify_user(r.company_id, 'company.jobs.closing_soon', 'Job closing soon',
      COALESCE(r.title, 'A job') || ' is closing within 7 days.',
      '/site/jobs/' || r.id::text, 'closing_soon:' || r.id::text);

    PERFORM notify_user(s.worker_id, 'worker.jobs.saved_closing_soon', 'Saved job closing soon',
      'A job you saved, ' || COALESCE(r.title, 'a job') || ', is closing within 7 days.',
      '/site/jobs/' || r.id::text, 'saved_closing:' || r.id::text || ':' || s.worker_id::text)
    FROM saved_jobs s WHERE s.job_id = r.id;
  END LOOP;
END; $$;

-- ── 2. Auto-close jobs past their closing date (company) ─────
CREATE OR REPLACE FUNCTION public.auto_close_expired_jobs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, company_id, title FROM jobs
     WHERE status = 'active' AND closing_at IS NOT NULL AND closing_at <= now()
  LOOP
    -- Flip to closed; the AFTER UPDATE OF status trigger notifies savers /
    -- active applicants (saved_closed / position_closed).
    UPDATE jobs SET status = 'closed' WHERE id = r.id;
    PERFORM notify_user(r.company_id, 'company.jobs.auto_closed', 'Job auto-closed',
      COALESCE(r.title, 'A job') || ' was automatically closed — its closing date passed.',
      '/site/jobs/' || r.id::text, 'auto_closed:' || r.id::text);
  END LOOP;
END; $$;

-- ── 3. Certification / license expiry (worker + company) ─────
CREATE OR REPLACE FUNCTION public.notify_credentials_expiring()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  -- Worker certifications
  FOR r IN SELECT id, worker_id, cert_name, expiry_date FROM worker_certifications WHERE expiry_date IS NOT NULL LOOP
    IF r.expiry_date < CURRENT_DATE THEN
      PERFORM notify_user(r.worker_id, 'worker.account.cert_expired', 'Certification expired',
        COALESCE(NULLIF(r.cert_name, ''), 'A certification') || ' has expired.',
        '/site/profile/' || r.worker_id::text, 'cert_expired:' || r.id::text);
    ELSIF r.expiry_date <= CURRENT_DATE + 30 THEN
      PERFORM notify_user(r.worker_id, 'worker.account.cert_expiring', 'Certification expiring',
        COALESCE(NULLIF(r.cert_name, ''), 'A certification') || ' expires within 30 days.',
        '/site/profile/' || r.worker_id::text, 'cert_expiring:' || r.id::text);
    END IF;
  END LOOP;

  -- Company licenses
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

-- ── 4. Jobs paused 14 days (company) ─────────────────────────
CREATE OR REPLACE FUNCTION public.notify_jobs_paused_long()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, company_id, title FROM jobs
     WHERE status = 'paused' AND paused_at IS NOT NULL AND paused_at <= now() - interval '14 days'
  LOOP
    PERFORM notify_user(r.company_id, 'company.jobs.paused_14_days', 'Job paused for 14 days',
      COALESCE(r.title, 'A job') || ' has been paused for 14 days — resume or close it.',
      '/site/dashboard/jobs', 'paused14:' || r.id::text);
  END LOOP;
END; $$;

-- ── 5. Account deletion grace ending (company) ───────────────
-- Hard delete is 30 days after deleted_at (hard_delete_expired_companies);
-- warn once when within 5 days of that.
CREATE OR REPLACE FUNCTION public.notify_deletion_grace_ending()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM company_profiles
     WHERE deleted_at IS NOT NULL AND deleted_at <= now() - interval '25 days'
  LOOP
    PERFORM notify_user(r.id, 'company.account.deletion_grace_ending', 'Account deletion approaching',
      'Your account is scheduled for permanent deletion soon. Sign in to restore it.',
      '/site/settings/account', 'deletion_grace:' || r.id::text);
  END LOOP;
END; $$;

-- ── 6. Company daily digests (summary + needs-attention + stalled) ──
CREATE OR REPLACE FUNCTION public.notify_company_daily_digests()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_new int;
  v_flagged int;
  v_stalled int;
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

    SELECT count(*) INTO v_stalled FROM applications
      WHERE company_id = r.id AND status = 'active' AND status_updated_at <= now() - interval '7 days';
    IF v_stalled > 0 THEN
      PERFORM notify_user(r.id, 'company.pipeline.stalled', 'Applicants stalled',
        v_stalled || ' applicant(s) have been in a stage over a week.', '/site/pipeline',
        'stalled:' || r.id::text || ':' || v_day);
    END IF;

    SELECT count(*) INTO v_flagged FROM application_task t
      JOIN applications a ON a.id = t.application_id
      WHERE a.company_id = r.id AND t.is_flagged = true;
    IF v_flagged > 0 OR v_stalled > 0 THEN
      PERFORM notify_user(r.id, 'company.pipeline.needs_attention_digest', 'Needs attention',
        v_flagged || ' flagged and ' || v_stalled || ' stalled applicant(s) need attention.',
        '/site/pipeline', 'needs_attention:' || r.id::text || ':' || v_day);
    END IF;
  END LOOP;
END; $$;

-- ── 7. Weekly worker job digest ──────────────────────────────
-- Lightweight first cut: notify each worker of jobs posted in the last 7 days.
-- (Not yet skill-matched — real recommendations arrive with matching.)
CREATE OR REPLACE FUNCTION public.notify_worker_weekly_digest()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_count int;
  v_week text := to_char(now(), 'IYYY-IW');
BEGIN
  SELECT count(*) INTO v_count FROM jobs
    WHERE status = 'active' AND created_at >= now() - interval '7 days';
  IF v_count = 0 THEN
    RETURN;
  END IF;
  FOR r IN SELECT id FROM worker_profiles LOOP
    PERFORM notify_user(r.id, 'worker.jobs.weekly_digest', 'Your weekly job recommendations',
      v_count || ' new job(s) were posted this week that may fit you.', '/site/jobs',
      'weekly_digest:' || r.id::text || ':' || v_week);
  END LOOP;
END; $$;

-- ── Grants (cron runs these as owner; keep off public) ───────
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'notify_jobs_closing_soon()', 'auto_close_expired_jobs()', 'notify_credentials_expiring()',
    'notify_jobs_paused_long()', 'notify_deletion_grace_ending()', 'notify_company_daily_digests()',
    'notify_worker_weekly_digest()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, authenticated, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END $$;

-- ── Schedules (re-register idempotently) ─────────────────────
DO $$
DECLARE
  j RECORD;
BEGIN
  FOR j IN SELECT * FROM (VALUES
    ('krewtree-notify-closing-soon',     '0 7 * * *',   'SELECT notify_jobs_closing_soon()'),
    ('krewtree-auto-close-jobs',         '0 * * * *',   'SELECT auto_close_expired_jobs()'),
    ('krewtree-notify-credentials',      '30 7 * * *',  'SELECT notify_credentials_expiring()'),
    ('krewtree-notify-paused-jobs',      '0 8 * * *',   'SELECT notify_jobs_paused_long()'),
    ('krewtree-notify-deletion-grace',   '15 8 * * *',  'SELECT notify_deletion_grace_ending()'),
    ('krewtree-company-daily-digests',   '0 9 * * *',   'SELECT notify_company_daily_digests()'),
    ('krewtree-worker-weekly-digest',    '0 8 * * 1',   'SELECT notify_worker_weekly_digest()')
  ) AS v(name, sched, cmd)
  LOOP
    BEGIN
      PERFORM cron.unschedule(j.name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(j.name, j.sched, j.cmd);
  END LOOP;
END $$;
