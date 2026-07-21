-- ============================================================
-- KREWTREE — digests are opt-in (default off)
-- The digest is presented as an "opt in to a daily email summary" prompt, so
-- its email preference should start OFF; the user turns it on deliberately.
-- ============================================================
UPDATE public.notification_type
   SET default_email = false
 WHERE is_digest = true;
