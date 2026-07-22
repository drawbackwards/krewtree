-- ============================================================
-- KREWTREE — Multi-seat team accounts (notification fan-out)
--
-- Company-directed notifications are all addressed to the organization id
-- (company_id) with a 'company.*' key. Pre-multi-seat that id was the single
-- company user, so notify_user() delivered to exactly the right person. Now a
-- company has many seats, so those notifications must fan out to every member.
--
-- Rather than touch the ~10 generator functions, we make the fan-out a single
-- change in the shared helper: notify_user() now dispatches a 'company.*'
-- notification to every company_members row (each with its own dedup key so the
-- per-user unique constraint doesn't collapse the fan-out), and delegates the
-- actual per-user insert to notify_one(). Worker-directed notifications are
-- unchanged. (Assignment-based routing is a deliberate follow-up.)
-- ============================================================

-- Per-user insert respecting the recipient's in-app preference. This is the
-- original notify_user body, unchanged.
CREATE OR REPLACE FUNCTION public.notify_one(
  p_user_id uuid,
  p_key text,
  p_title text,
  p_body text,
  p_link text,
  p_dedup_key text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_mandatory boolean;
  v_default   boolean;
  v_override  boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT mandatory_inapp, default_inapp
    INTO v_mandatory, v_default
    FROM notification_type
   WHERE key = p_key AND active;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT enabled
    INTO v_override
    FROM notification_preference
   WHERE user_id = p_user_id AND notification_key = p_key AND channel = 'inapp';

  IF v_mandatory OR COALESCE(v_override, v_default) THEN
    INSERT INTO notifications (user_id, type, title, body, link, dedup_key)
    VALUES (p_user_id, p_key, p_title, p_body, p_link, p_dedup_key)
    ON CONFLICT (dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
  END IF;
END;
$function$;

-- notify_user() keeps its signature (every generator calls it) but now fans out
-- company-directed notifications across all seats.
CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_key text,
  p_title text,
  p_body text,
  p_link text,
  p_dedup_key text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- A 'company.*' notification is addressed to the organization; deliver it to
  -- every seat. Per-member dedup key keeps each row distinct under the unique
  -- constraint. Falls through to a single insert if the id isn't a company with
  -- members (defensive; backfill guarantees at least the owner seat).
  IF p_key LIKE 'company.%'
     AND EXISTS (SELECT 1 FROM company_members WHERE company_id = p_user_id) THEN
    FOR r IN SELECT user_id FROM company_members WHERE company_id = p_user_id LOOP
      PERFORM notify_one(
        r.user_id, p_key, p_title, p_body, p_link,
        CASE WHEN p_dedup_key IS NULL THEN NULL
             ELSE p_dedup_key || ':' || r.user_id::text END
      );
    END LOOP;
    RETURN;
  END IF;

  PERFORM notify_one(p_user_id, p_key, p_title, p_body, p_link, p_dedup_key);
END;
$function$;
