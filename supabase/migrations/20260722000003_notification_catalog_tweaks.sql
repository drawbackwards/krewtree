-- ============================================================
-- KREWTREE — Notifications v2 catalog tweaks (2026-07-22)
--   • Drop the worker "Regulix reviews imported" event (keep only the
--     connection-severed Regulix alert for workers).
--   • Rename the worker "Pipeline" subject to "Applications" (worker-facing
--     copy; the company Pipeline subject is unchanged).
-- Follows 20260722000001/2.
-- ============================================================

-- Remove the worker reviews-imported event (FK cascade drops any prefs/rows).
DELETE FROM public.notification_type WHERE key = 'worker.regulix.reviews_imported';

-- Narrow the worker Regulix trigger to connection-severed only, dropping the
-- now-removed reviews-imported branch.
CREATE OR REPLACE FUNCTION public.notify_on_worker_regulix()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.regulix_connected IS FALSE AND OLD.regulix_connected IS DISTINCT FROM FALSE THEN
    PERFORM notify_user(NEW.worker_id, 'worker.regulix.connection_severed', 'Regulix connection severed',
      'Your Regulix connection expired or was revoked.', '/site/dashboard/worker');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_on_worker_regulix ON public.worker_integrations;
CREATE TRIGGER trg_notify_on_worker_regulix
  AFTER UPDATE OF regulix_connected ON public.worker_integrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_worker_regulix();

-- Worker-facing rename: Pipeline → Applications (company Pipeline untouched).
UPDATE public.notification_type
   SET subject = 'Applications'
 WHERE persona = 'worker' AND subject = 'Pipeline';
