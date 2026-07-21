-- ============================================================
-- Scope-down of in-app notification generation (2026-07-21)
--
-- Follows 20260721000001. Two event types no longer create bell entries:
--   • message — messages already surface via the Messages nav badge, so a
--     second in-app alert is redundant. The "New messages" preference row
--     stays in Settings (email/SMS opt-in for when those channels ship); only
--     the bell/trigger is removed.
--   • review — worker feedback is never shown to the worker (they see only an
--     aggregate rating), so notifying them of "new feedback" is misleading.
--     The worker "New feedback" preference row is removed from the UI too.
--
-- The application and status_change triggers and notify_user() are untouched.
-- The message_*/review_* preference columns remain (harmless; message email/sms
-- are still used by the retained "New messages" row).
-- ============================================================

DROP TRIGGER IF EXISTS trg_notify_on_message ON public.message;
DROP FUNCTION IF EXISTS public.notify_on_message();

DROP TRIGGER IF EXISTS trg_notify_on_review ON public.worker_feedback;
DROP FUNCTION IF EXISTS public.notify_on_review();
