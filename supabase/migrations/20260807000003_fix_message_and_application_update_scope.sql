-- ============================================================
-- RLS audit fix #3 (MEDIUM) — UPDATE column-scope enforcement
--
-- RLS USING/WITH CHECK can gate WHICH rows an UPDATE touches, but not WHICH
-- COLUMNS. Two policies intended to allow only a narrow mutation actually let a
-- party rewrite the whole row. Postgres has no column-scoped UPDATE in RLS, so
-- these are enforced with BEFORE UPDATE triggers instead.
--
--   a) message.party_mark_read — meant for read_at only, but either party could
--      rewrite body / sent_by / application context of ANY message in the
--      thread (including the other party's). Trigger: only read_at may change.
--
--   b) applications.worker_update — a worker could set arbitrary status /
--      current_stage_id on their own application (e.g. self-set 'terminal_hired',
--      which fires the hired notification, or re-activate a rejected app).
--      The only legitimate worker write is withdrawal. Trigger: a worker-actor
--      update may only set status='terminal_withdrawn' (+ free-text notes);
--      job/company/worker/stage/boost are frozen. Company-member and system
--      (service_role / NULL auth) updates are unaffected.
-- ============================================================

-- ── a) message: only read_at may change on UPDATE ───────────
CREATE OR REPLACE FUNCTION public.enforce_message_update_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.id, NEW.company_id, NEW.worker_id, NEW.application_id,
      NEW.application_task_id, NEW.body, NEW.sent_by, NEW.sent_at)
     IS DISTINCT FROM
     (OLD.id, OLD.company_id, OLD.worker_id, OLD.application_id,
      OLD.application_task_id, OLD.body, OLD.sent_by, OLD.sent_at)
  THEN
    RAISE EXCEPTION 'message: only read_at may be updated'
      USING errcode = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_message_update_scope ON public.message;
CREATE TRIGGER trg_enforce_message_update_scope
  BEFORE UPDATE ON public.message
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_scope();

-- ── b) applications: worker-actor updates may only withdraw ──
-- The worker-actor branch fires only when the caller is the application's
-- worker AND not a member of its company. System writes (auth.uid() IS NULL)
-- and company-member writes fall through untouched.
CREATE OR REPLACE FUNCTION public.enforce_worker_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (select auth.uid()) = OLD.worker_id
     AND NOT is_company_member(OLD.company_id) THEN
    IF NEW.status <> 'terminal_withdrawn'
       OR NEW.job_id      <> OLD.job_id
       OR NEW.company_id  <> OLD.company_id
       OR NEW.worker_id   <> OLD.worker_id
       OR NEW.current_stage_id IS DISTINCT FROM OLD.current_stage_id
       OR NEW.is_boosted        IS DISTINCT FROM OLD.is_boosted
    THEN
      RAISE EXCEPTION 'applications: a worker may only withdraw their own application'
        USING errcode = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_worker_application_update ON public.applications;
CREATE TRIGGER trg_enforce_worker_application_update
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_worker_application_update();
