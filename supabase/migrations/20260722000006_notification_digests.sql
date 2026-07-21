-- ============================================================
-- KREWTREE — Notification digests (2026-07-22)
-- Introduces a per-category "email digest" opt-in: a distinct, email-only
-- catalog entry on every subject card EXCEPT Account and Regulix, so a user
-- overwhelmed by a category's per-event alerts can switch to a batched summary
-- right where those alerts live. `is_digest` drives both the email-only shape
-- and the tinted inline UI treatment.
--
-- Digests are email-only (default_inapp=false); since email delivery isn't
-- built yet they generate nothing for now — the existing digest crons call
-- notify_user (in-app) which now suppresses them, and they stay scheduled as
-- placeholders for when the email send path lands.
-- ============================================================

ALTER TABLE public.notification_type
  ADD COLUMN IF NOT EXISTS is_digest boolean NOT NULL DEFAULT false;

-- Existing digests → flagged + email-only.
UPDATE public.notification_type
   SET is_digest = true, default_inapp = false, default_sms = false, default_email = true
 WHERE key IN (
   'worker.jobs.weekly_digest',
   'company.applicants.daily_summary',
   'company.pipeline.needs_attention_digest'
 );

-- New per-category digests for the cards that lacked one (Messages, worker
-- Applications, company Jobs). Account + Regulix intentionally get none.
INSERT INTO public.notification_type
  (key, persona, subject, label, description, mandatory_inapp,
   default_inapp, default_email, default_sms, is_badge, is_digest, sort_order)
VALUES
  ('worker.messages.digest', 'worker', 'Messages', 'Message digest',
   'Get a daily email summary of unread messages instead of individual alerts.',
   false, false, true, false, false, true, 15),
  ('worker.pipeline.digest', 'worker', 'Applications', 'Application updates digest',
   'Get a daily email summary of changes to your applications.',
   false, false, true, false, false, true, 39),
  ('company.messages.digest', 'company', 'Messages', 'Message digest',
   'Get a daily email summary of unread messages from workers.',
   false, false, true, false, false, true, 25),
  ('company.jobs.digest', 'company', 'Jobs', 'Job activity digest',
   'Get a daily email summary of activity on your job posts.',
   false, false, true, false, false, true, 39);
