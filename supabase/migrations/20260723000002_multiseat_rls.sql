-- ============================================================
-- KREWTREE — Multi-seat team accounts (RLS rewrite)
--
-- Companion to 20260723000001. Now that company_members exists, "who may act as
-- this company" changes from "the one user whose id equals company_id" to "any
-- member of the company." Every company-scoped policy is rewritten from
-- `company_id = (select auth.uid())` (and the id/subquery variants) to
-- `is_company_member(company_id)`.
--
-- SAFE FOR EXISTING ACCOUNTS: the backfill made each founder the sole owner, and
-- for a founder auth.uid() == company_id, so is_company_member(company_id) is
-- true exactly where the old check was — single-owner companies are unaffected.
--
-- Role gating: all seats (owner/admin/member) get every PRODUCT action (jobs,
-- applicants, pipeline, messaging, templates, krew, feedback, profile edits).
-- Only destructive/ownership actions are gated higher — company_profiles delete
-- is owner-only. Seat management lives on company_members (gated in ...000001).
--
-- Worker-side and self-scoped policies (worker_*, saved_*, notifications,
-- application worker rows, note author_delete) are deliberately NOT touched.
-- ============================================================

-- ── Helper: is the caller a seat of ANY company? ─────────────
-- Replaces the old "EXISTS (company_profiles WHERE id = auth.uid())" idiom used
-- by feedback reads to mean "the caller is a company user." SECURITY DEFINER to
-- bypass RLS on company_members inside other tables' policy subqueries.
CREATE OR REPLACE FUNCTION is_any_company_member()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members WHERE user_id = (select auth.uid())
  )
$$;
GRANT EXECUTE ON FUNCTION is_any_company_member() TO authenticated;

-- ── company_profiles ─────────────────────────────────────────
DROP POLICY IF EXISTS "public_read" ON company_profiles;
CREATE POLICY "public_read" ON company_profiles FOR SELECT
  USING (deleted_at IS NULL OR is_company_member(id));

DROP POLICY IF EXISTS "own_update" ON company_profiles;
CREATE POLICY "own_update" ON company_profiles FOR UPDATE
  USING (is_company_member(id));

-- Deleting the company is an owner-only action.
DROP POLICY IF EXISTS "own_delete" ON company_profiles;
CREATE POLICY "own_delete" ON company_profiles FOR DELETE
  USING (company_role(id) = 'owner');
-- own_insert is left unchanged (self-insert at signup; id = auth.uid()).

-- ── jobs ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_active_jobs_read" ON jobs;
CREATE POLICY "public_active_jobs_read" ON jobs FOR SELECT
  USING (status = 'active' OR is_company_member(company_id));

DROP POLICY IF EXISTS "company_insert" ON jobs;
CREATE POLICY "company_insert" ON jobs FOR INSERT
  WITH CHECK (is_company_member(company_id));

DROP POLICY IF EXISTS "company_update" ON jobs;
CREATE POLICY "company_update" ON jobs FOR UPDATE
  USING (is_company_member(company_id));

DROP POLICY IF EXISTS "company_delete" ON jobs;
CREATE POLICY "company_delete" ON jobs FOR DELETE
  USING (is_company_member(company_id));

-- ── applications (company side only; worker_* policies untouched) ─
DROP POLICY IF EXISTS "company_read" ON applications;
CREATE POLICY "company_read" ON applications FOR SELECT
  USING (is_company_member(company_id));

DROP POLICY IF EXISTS "company_update" ON applications;
CREATE POLICY "company_update" ON applications FOR UPDATE
  USING (is_company_member(company_id));

-- ── application child tables (probe through applications) ─────
-- application_events
DROP POLICY IF EXISTS "company_insert" ON application_events;
CREATE POLICY "company_insert" ON application_events FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "parties_read" ON application_events;
CREATE POLICY "parties_read" ON application_events FOR SELECT
  USING (application_id IN (
    SELECT id FROM applications
    WHERE worker_id = (select auth.uid()) OR is_company_member(company_id)
  ));

-- application_log
DROP POLICY IF EXISTS "company_read_log" ON application_log;
CREATE POLICY "company_read_log" ON application_log FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_write_log" ON application_log;
CREATE POLICY "company_write_log" ON application_log FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));

-- application_notes (author_delete stays author-scoped — NOT touched)
DROP POLICY IF EXISTS "company_read" ON application_notes;
CREATE POLICY "company_read" ON application_notes FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_insert" ON application_notes;
CREATE POLICY "company_insert" ON application_notes FOR INSERT
  WITH CHECK (
    author_id = (select auth.uid())
    AND application_id IN (SELECT id FROM applications WHERE is_company_member(company_id))
  );

-- application_stage_notes
DROP POLICY IF EXISTS "company_read_stage_notes" ON application_stage_notes;
CREATE POLICY "company_read_stage_notes" ON application_stage_notes FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_update_stage_notes" ON application_stage_notes;
CREATE POLICY "company_update_stage_notes" ON application_stage_notes FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_write_stage_notes" ON application_stage_notes;
CREATE POLICY "company_write_stage_notes" ON application_stage_notes FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));

-- application_task
DROP POLICY IF EXISTS "company_read_tasks" ON application_task;
CREATE POLICY "company_read_tasks" ON application_task FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_write_tasks" ON application_task;
CREATE POLICY "company_write_tasks" ON application_task FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_update_tasks" ON application_task;
CREATE POLICY "company_update_tasks" ON application_task FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_delete_tasks" ON application_task;
CREATE POLICY "company_delete_tasks" ON application_task FOR DELETE
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));

-- application_task_note
DROP POLICY IF EXISTS "company_read_task_notes" ON application_task_note;
CREATE POLICY "company_read_task_notes" ON application_task_note FOR SELECT
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_write_task_notes" ON application_task_note;
CREATE POLICY "company_write_task_notes" ON application_task_note FOR INSERT
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_update_task_notes" ON application_task_note;
CREATE POLICY "company_update_task_notes" ON application_task_note FOR UPDATE
  USING (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)))
  WITH CHECK (application_id IN (SELECT id FROM applications WHERE is_company_member(company_id)));

-- ── company profile child tables (own_write ALL) ─────────────
DROP POLICY IF EXISTS "own_write" ON company_additional_locations;
CREATE POLICY "own_write" ON company_additional_locations FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "own_write" ON company_benefits;
CREATE POLICY "own_write" ON company_benefits FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "own_write" ON company_licenses;
CREATE POLICY "own_write" ON company_licenses FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "own_write" ON company_perks;
CREATE POLICY "own_write" ON company_perks FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "own_write" ON company_photos;
CREATE POLICY "own_write" ON company_photos FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

-- ── company_discover_saved_searches ──────────────────────────
DROP POLICY IF EXISTS "company_own_discover_searches" ON company_discover_saved_searches;
CREATE POLICY "company_own_discover_searches" ON company_discover_saved_searches FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

-- ── pipeline ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "company_own" ON company_pipeline;
CREATE POLICY "company_own" ON company_pipeline FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "company_own" ON pipeline_stage;
CREATE POLICY "company_own" ON pipeline_stage FOR ALL
  USING (pipeline_id IN (SELECT id FROM company_pipeline WHERE is_company_member(company_id)))
  WITH CHECK (pipeline_id IN (SELECT id FROM company_pipeline WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_manage_templates" ON pipeline_stage_task_template;
CREATE POLICY "company_manage_templates" ON pipeline_stage_task_template FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

-- ── job_templates / message_templates ────────────────────────
DROP POLICY IF EXISTS "company_read" ON job_templates;
CREATE POLICY "company_read" ON job_templates FOR SELECT USING (is_company_member(company_id));
DROP POLICY IF EXISTS "company_insert" ON job_templates;
CREATE POLICY "company_insert" ON job_templates FOR INSERT WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "company_update" ON job_templates;
CREATE POLICY "company_update" ON job_templates FOR UPDATE USING (is_company_member(company_id));
DROP POLICY IF EXISTS "company_delete" ON job_templates;
CREATE POLICY "company_delete" ON job_templates FOR DELETE USING (is_company_member(company_id));

DROP POLICY IF EXISTS "company_read" ON message_templates;
CREATE POLICY "company_read" ON message_templates FOR SELECT USING (is_company_member(company_id));
DROP POLICY IF EXISTS "company_insert" ON message_templates;
CREATE POLICY "company_insert" ON message_templates FOR INSERT WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "company_update" ON message_templates;
CREATE POLICY "company_update" ON message_templates FOR UPDATE USING (is_company_member(company_id));
DROP POLICY IF EXISTS "company_delete" ON message_templates;
CREATE POLICY "company_delete" ON message_templates FOR DELETE USING (is_company_member(company_id));

-- ── analytics / view events / interviews (probe through jobs) ─
DROP POLICY IF EXISTS "company_read" ON job_analytics;
CREATE POLICY "company_read" ON job_analytics FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE is_company_member(company_id)));
DROP POLICY IF EXISTS "company_write" ON job_analytics;
CREATE POLICY "company_write" ON job_analytics FOR ALL
  USING (job_id IN (SELECT id FROM jobs WHERE is_company_member(company_id)))
  WITH CHECK (job_id IN (SELECT id FROM jobs WHERE is_company_member(company_id)));

DROP POLICY IF EXISTS "company_read" ON job_view_event;
CREATE POLICY "company_read" ON job_view_event FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE is_company_member(company_id)));

DROP POLICY IF EXISTS "Company can manage their own interviews" ON interviews;
CREATE POLICY "Company can manage their own interviews" ON interviews FOR ALL
  USING (job_id IN (SELECT id FROM jobs WHERE is_company_member(company_id)))
  WITH CHECK (job_id IN (SELECT id FROM jobs WHERE is_company_member(company_id)));

-- ── krew (saved talent lists) ────────────────────────────────
DROP POLICY IF EXISTS "krew_lists_company_select" ON krew_lists;
CREATE POLICY "krew_lists_company_select" ON krew_lists FOR SELECT USING (is_company_member(company_id));
DROP POLICY IF EXISTS "krew_lists_company_insert" ON krew_lists;
CREATE POLICY "krew_lists_company_insert" ON krew_lists FOR INSERT WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "krew_lists_company_update" ON krew_lists;
CREATE POLICY "krew_lists_company_update" ON krew_lists FOR UPDATE
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "krew_lists_company_delete" ON krew_lists;
CREATE POLICY "krew_lists_company_delete" ON krew_lists FOR DELETE USING (is_company_member(company_id));

DROP POLICY IF EXISTS "krew_rel_company_select" ON krew_relationships;
CREATE POLICY "krew_rel_company_select" ON krew_relationships FOR SELECT USING (is_company_member(company_id));
DROP POLICY IF EXISTS "krew_rel_company_insert" ON krew_relationships;
CREATE POLICY "krew_rel_company_insert" ON krew_relationships FOR INSERT WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "krew_rel_company_update" ON krew_relationships;
CREATE POLICY "krew_rel_company_update" ON krew_relationships FOR UPDATE
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
DROP POLICY IF EXISTS "krew_rel_company_delete" ON krew_relationships;
CREATE POLICY "krew_rel_company_delete" ON krew_relationships FOR DELETE USING (is_company_member(company_id));

DROP POLICY IF EXISTS "krew_mem_company_select" ON krew_list_memberships;
CREATE POLICY "krew_mem_company_select" ON krew_list_memberships FOR SELECT
  USING (EXISTS (SELECT 1 FROM krew_lists l WHERE l.id = krew_list_memberships.list_id AND is_company_member(l.company_id)));
DROP POLICY IF EXISTS "krew_mem_company_insert" ON krew_list_memberships;
CREATE POLICY "krew_mem_company_insert" ON krew_list_memberships FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM krew_lists l WHERE l.id = krew_list_memberships.list_id AND is_company_member(l.company_id)));
DROP POLICY IF EXISTS "krew_mem_company_delete" ON krew_list_memberships;
CREATE POLICY "krew_mem_company_delete" ON krew_list_memberships FOR DELETE
  USING (EXISTS (SELECT 1 FROM krew_lists l WHERE l.id = krew_list_memberships.list_id AND is_company_member(l.company_id)));

-- ── worker_feedback / worker_feedback_pill ───────────────────
-- "any company can read the aggregate rows" → "any company MEMBER can".
DROP POLICY IF EXISTS "company_read" ON worker_feedback;
CREATE POLICY "company_read" ON worker_feedback FOR SELECT USING (is_any_company_member());
DROP POLICY IF EXISTS "company_read" ON worker_feedback_pill;
CREATE POLICY "company_read" ON worker_feedback_pill FOR SELECT USING (is_any_company_member());

-- Author actions: the reviewing company is now a membership, not an identity.
DROP POLICY IF EXISTS "company_insert" ON worker_feedback;
CREATE POLICY "company_insert" ON worker_feedback FOR INSERT
  WITH CHECK (
    is_company_member(reviewing_company_id)
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = worker_feedback.application_id
        AND is_company_member(a.company_id)
        AND a.worker_id = worker_feedback.worker_id
        AND a.status = 'terminal_hired'
    )
  );
DROP POLICY IF EXISTS "author_update" ON worker_feedback;
CREATE POLICY "author_update" ON worker_feedback FOR UPDATE
  USING (is_company_member(reviewing_company_id) AND now() < locked_at)
  WITH CHECK (is_company_member(reviewing_company_id) AND now() < locked_at);

DROP POLICY IF EXISTS "author_insert" ON worker_feedback_pill;
CREATE POLICY "author_insert" ON worker_feedback_pill FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM worker_feedback f
    WHERE f.id = worker_feedback_pill.feedback_id
      AND is_company_member(f.reviewing_company_id)
      AND now() < f.locked_at
  ));
DROP POLICY IF EXISTS "author_delete" ON worker_feedback_pill;
CREATE POLICY "author_delete" ON worker_feedback_pill FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM worker_feedback f
    WHERE f.id = worker_feedback_pill.feedback_id
      AND is_company_member(f.reviewing_company_id)
      AND now() < f.locked_at
  ));

-- ── worker_resumes / worker_references (applied-company read) ─
DROP POLICY IF EXISTS "company_applied_read" ON worker_resumes;
CREATE POLICY "company_applied_read" ON worker_resumes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications a
    WHERE a.worker_id = worker_resumes.worker_id AND is_company_member(a.company_id)
  ));

DROP POLICY IF EXISTS "company_read" ON worker_references;
CREATE POLICY "company_read" ON worker_references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.worker_id = worker_references.worker_id AND is_company_member(a.company_id)
    )
    AND EXISTS (
      SELECT 1 FROM worker_profiles wp
      WHERE wp.id = worker_references.worker_id AND wp.references_consent_confirmed_at IS NOT NULL
    )
  );

-- ── message: company party is now a membership ───────────────
-- Drop the table CHECK that required sent_by to equal company_id or worker_id;
-- a seat's sent_by is neither. Validity is enforced by the INSERT policy below.
ALTER TABLE message DROP CONSTRAINT IF EXISTS message_sender_is_party;

DROP POLICY IF EXISTS "party_read_messages" ON message;
CREATE POLICY "party_read_messages" ON message FOR SELECT
  USING (is_company_member(company_id) OR (select auth.uid()) = worker_id);
DROP POLICY IF EXISTS "party_mark_read" ON message;
CREATE POLICY "party_mark_read" ON message FOR UPDATE
  USING (is_company_member(company_id) OR (select auth.uid()) = worker_id);
DROP POLICY IF EXISTS "party_send_messages" ON message;
CREATE POLICY "party_send_messages" ON message FOR INSERT
  WITH CHECK (
    sent_by = (select auth.uid())
    AND (is_company_member(company_id) OR (select auth.uid()) = worker_id)
    AND (
      application_id IS NULL
      OR EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = message.application_id
          AND a.company_id = message.company_id
          AND a.worker_id = message.worker_id
      )
    )
  );
