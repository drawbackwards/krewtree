-- ============================================================
-- Performance: missing indexes + RLS rewrite for scale
--
-- Three problems fixed here, found in the 2026-06-12 perf audit:
--
-- 1. applications has no company_id. Every company-side RLS policy on the
--    application child tables (tasks, notes, messages, log) re-derives it
--    with a 2-table join subquery (applications JOIN jobs) on every query.
--    We denormalize company_id onto applications (kept in sync by trigger,
--    jobs.company_id is immutable in practice) and collapse those policies
--    to a single indexed-subquery probe.
--
-- 2. Every policy calls auth.uid() bare, so Postgres re-evaluates it per
--    row. Wrapping it as (select auth.uid()) makes it a one-time InitPlan
--    per statement — Supabase's #1 documented RLS performance fix. A DO
--    block rewrites all public-schema policies in place.
--
-- 3. Missing indexes. Notably: 20260521000001 dropped application_task's
--    stage_type column, which silently destroyed the table's only
--    application_id index (Postgres drops indexes containing dropped
--    columns) — recreated here against stage_id. Plus FK/filter indexes
--    across the schema, and removal of two redundant ones.
-- ============================================================

-- ── 1. Denormalize company_id onto applications ──────────────────────────────

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES company_profiles(id);

UPDATE applications a
SET company_id = j.company_id
FROM jobs j
WHERE j.id = a.job_id
  AND a.company_id IS DISTINCT FROM j.company_id;

CREATE OR REPLACE FUNCTION set_application_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  SELECT company_id INTO NEW.company_id FROM jobs WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_application_company_id ON applications;
CREATE TRIGGER trg_set_application_company_id
  BEFORE INSERT OR UPDATE OF job_id ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_company_id();

-- Every application has a job and every job has a company, so this is safe
-- after the backfill above.
ALTER TABLE applications ALTER COLUMN company_id SET NOT NULL;

-- ── 2. Wrap bare auth.uid() in all public-schema policies ────────────────────
-- Runs BEFORE the explicit policy rewrites below so those (already written
-- wrapped) aren't touched twice.

DO $$
DECLARE
  r RECORD;
  new_qual TEXT;
  new_check TEXT;
  stmt TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual, '') LIKE '%auth.uid()%'
        OR coalesce(with_check, '') LIKE '%auth.uid()%')
  LOOP
    new_qual := replace(r.qual, 'auth.uid()', '(select auth.uid())');
    new_check := replace(r.with_check, 'auth.uid()', '(select auth.uid())');
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF r.qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF r.with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE stmt;
  END LOOP;
END;
$$;

-- ── 3. Collapse company-side join subqueries via applications.company_id ─────

-- applications itself: direct equality, no subquery at all.
DROP POLICY IF EXISTS "company_read" ON applications;
CREATE POLICY "company_read" ON applications FOR SELECT
  USING (company_id = (select auth.uid()));

DROP POLICY IF EXISTS "company_update" ON applications;
CREATE POLICY "company_update" ON applications FOR UPDATE
  USING (company_id = (select auth.uid()));

-- application_events
DROP POLICY IF EXISTS "parties_read" ON application_events;
CREATE POLICY "parties_read" ON application_events FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications
      WHERE worker_id = (select auth.uid())
         OR company_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "company_insert" ON application_events;
CREATE POLICY "company_insert" ON application_events FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications WHERE company_id = (select auth.uid())
    )
  );

-- application_task
DROP POLICY IF EXISTS "company_read_tasks" ON application_task;
CREATE POLICY "company_read_tasks" ON application_task FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_write_tasks" ON application_task;
CREATE POLICY "company_write_tasks" ON application_task FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_update_tasks" ON application_task;
CREATE POLICY "company_update_tasks" ON application_task FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_delete_tasks" ON application_task;
CREATE POLICY "company_delete_tasks" ON application_task FOR DELETE
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

-- application_stage_notes
DROP POLICY IF EXISTS "company_read_stage_notes" ON application_stage_notes;
CREATE POLICY "company_read_stage_notes" ON application_stage_notes FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_write_stage_notes" ON application_stage_notes;
CREATE POLICY "company_write_stage_notes" ON application_stage_notes FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_update_stage_notes" ON application_stage_notes;
CREATE POLICY "company_update_stage_notes" ON application_stage_notes FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

-- application_log
DROP POLICY IF EXISTS "company_read_log" ON application_log;
CREATE POLICY "company_read_log" ON application_log FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_write_log" ON application_log;
CREATE POLICY "company_write_log" ON application_log FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

-- application_message
DROP POLICY IF EXISTS "company_read_messages" ON application_message;
CREATE POLICY "company_read_messages" ON application_message FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_send_messages" ON application_message;
CREATE POLICY "company_send_messages" ON application_message FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_mark_read" ON application_message;
CREATE POLICY "company_mark_read" ON application_message FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

-- application_notes
DROP POLICY IF EXISTS "company_read" ON application_notes;
CREATE POLICY "company_read" ON application_notes FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_insert" ON application_notes;
CREATE POLICY "company_insert" ON application_notes FOR INSERT
  WITH CHECK (
    author_id = (select auth.uid())
    AND application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid()))
  );

-- application_task_note
DROP POLICY IF EXISTS "company_read_task_notes" ON application_task_note;
CREATE POLICY "company_read_task_notes" ON application_task_note FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_write_task_notes" ON application_task_note;
CREATE POLICY "company_write_task_notes" ON application_task_note FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

DROP POLICY IF EXISTS "company_update_task_notes" ON application_task_note;
CREATE POLICY "company_update_task_notes" ON application_task_note FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())))
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE company_id = (select auth.uid())));

-- worker_references: company side, one EXISTS probe on indexed columns.
DROP POLICY IF EXISTS "company_read" ON worker_references;
CREATE POLICY "company_read" ON worker_references
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      WHERE a.worker_id = worker_references.worker_id
        AND a.company_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM worker_profiles wp
      WHERE wp.id = worker_references.worker_id
        AND wp.references_consent_confirmed_at IS NOT NULL
    )
  );

-- ── 4. Missing indexes ────────────────────────────────────────────────────────

-- applications: company-side list queries (filter company, newest first) and
-- the kanban grouping by stage.
CREATE INDEX IF NOT EXISTS idx_applications_company_created
  ON applications (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_stage
  ON applications (job_id, current_stage_id);

-- application_task: replaces the (application_id, stage_type, display_order)
-- index destroyed by the stage_type column drop in 20260521000001.
CREATE INDEX IF NOT EXISTS idx_application_task_app_stage
  ON application_task (application_id, stage_id, display_order);
-- FK ON DELETE SET NULL from pipeline_stage_task_template scans without this.
CREATE INDEX IF NOT EXISTS idx_application_task_template
  ON application_task (template_task_id) WHERE template_task_id IS NOT NULL;

-- direct_message: both existing indexes lead with company_id, so the
-- worker-side inbox / unread badge / RLS check couldn't use either.
CREATE INDEX IF NOT EXISTS idx_direct_message_worker_time
  ON direct_message (worker_id, sent_at DESC);

-- jobs: public browse is status + newest first; company dashboard is
-- company + status.
CREATE INDEX IF NOT EXISTS idx_jobs_status_created
  ON jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company_status
  ON jobs (company_id, status);

-- interviews: zero indexes beyond the PK.
CREATE INDEX IF NOT EXISTS idx_interviews_job ON interviews (job_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant ON interviews (applicant_id);

-- company_reviews: zero indexes at all.
CREATE INDEX IF NOT EXISTS idx_company_reviews_company ON company_reviews (company_id);
CREATE INDEX IF NOT EXISTS idx_company_reviews_worker ON company_reviews (worker_id);

-- RLS-policy / FK columns that were unindexed (per-row scans on every check).
CREATE INDEX IF NOT EXISTS idx_worker_resumes_worker ON worker_resumes (worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_portfolio_worker ON worker_portfolio_items (worker_id);
CREATE INDEX IF NOT EXISTS idx_company_benefits_company ON company_benefits (company_id);
CREATE INDEX IF NOT EXISTS idx_company_perks_company ON company_perks (company_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs (job_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_worker_reviews_reviewer ON worker_reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorser ON skill_endorsements (endorser_id);
CREATE INDEX IF NOT EXISTS idx_discover_saved_match_job
  ON company_discover_saved_searches (match_job_id);

-- Soft-delete sweep (hard_delete_expired_companies) and "exclude deleted"
-- filters; partial keeps it tiny.
CREATE INDEX IF NOT EXISTS idx_company_profiles_deleted
  ON company_profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- Notification feed sorts newest first; extends the (user_id, is_read) index.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- ── 5. Drop redundant indexes ─────────────────────────────────────────────────

-- Covered by idx_applications_company_recent (job_id, status_updated_at DESC).
DROP INDEX IF EXISTS idx_applications_job;
-- Covered by the UNIQUE (worker_id, job_id) constraint's index.
DROP INDEX IF EXISTS idx_saved_jobs_worker;
