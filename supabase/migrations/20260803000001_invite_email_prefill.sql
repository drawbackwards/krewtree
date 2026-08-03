-- ============================================================
-- KREWTREE — Invite email prefill + enforcement
--
-- The invite link carries only the token; the invited email lives in
-- company_invites (row is RLS-protected, token is stored hashed) so the browser
-- can't look it up directly. get_invite_email() lets the join page prefill and
-- lock the email for a valid pending token, and accept_company_invite() now
-- enforces that the accepting user's email actually matches the invite — so the
-- locked field is a real constraint, not just cosmetic.
-- ============================================================

-- ── get_invite_email ─────────────────────────────────────────
-- Returns the invited email for a valid, pending, unexpired token, else NULL.
-- Callable by anon (the invitee is logged out on the join page). Revealing the
-- email to a token holder is fine: the token is the secret, same as accept.
CREATE OR REPLACE FUNCTION public.get_invite_email(p_token text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT email FROM company_invites
   WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex')
     AND status = 'pending'
     AND expires_at > now();
$$;
REVOKE ALL ON FUNCTION public.get_invite_email(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invite_email(text) TO anon, authenticated;

-- ── accept_company_invite (recreated: + email match) ─────────
-- Unchanged from 20260723000004 except it now requires the calling user's
-- auth email to equal the invited email. This keeps a user from accepting an
-- invite that was addressed to someone else.
CREATE OR REPLACE FUNCTION public.accept_company_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash    text;
  v_invite  company_invites%ROWTYPE;
  v_cap     integer;
  v_members integer;
  v_uid     uuid := (select auth.uid());
  v_email   text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_hash := encode(digest(p_token, 'sha256'), 'hex');
  SELECT * INTO v_invite FROM company_invites
    WHERE token_hash = v_hash AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  -- The invite is addressed to a specific email; the accepting account must own
  -- it. v_invite.email is stored lower+trimmed (see create_company_invite).
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF lower(btrim(coalesce(v_email, ''))) <> v_invite.email THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  -- Seat cap guards the accept side too (invites may outnumber the cap over
  -- time; the seat is only consumed on accept).
  SELECT seat_cap INTO v_cap FROM company_profiles WHERE id = v_invite.company_id;
  SELECT count(*) INTO v_members FROM company_members WHERE company_id = v_invite.company_id;
  IF v_members >= coalesce(v_cap, 10)
     AND NOT EXISTS (SELECT 1 FROM company_members
                     WHERE company_id = v_invite.company_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'seat_cap_reached';
  END IF;

  INSERT INTO company_members (company_id, user_id, role)
    VALUES (v_invite.company_id, v_uid, v_invite.role)
    ON CONFLICT (company_id, user_id) DO NOTHING;

  -- Route the new seat to the company app. DO NOTHING keeps an existing role
  -- (e.g. a pre-existing worker) intact rather than clobbering it.
  INSERT INTO user_roles (id, role) VALUES (v_uid, 'company')
    ON CONFLICT (id) DO NOTHING;

  UPDATE company_invites SET status = 'accepted' WHERE id = v_invite.id;
  RETURN v_invite.company_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_company_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_company_invite(text) TO authenticated;
