-- ============================================================
-- KREWTREE — Multi-seat team accounts (invite create/accept)
--
-- Owners/admins invite teammates by email; the invitee opens a tokenized link,
-- signs in (or signs up as a company user), and accept_company_invite() turns
-- the pending invite into a membership. Only the SHA-256 hash of the token is
-- stored, so a leaked DB row can't be replayed as a link.
--
-- Both are SECURITY DEFINER (they must write company_members / read invites
-- across the pair), so they authorize explicitly: create checks the caller is
-- an owner/admin of the company; accept validates the token + seat cap.
-- ============================================================

-- ── create_company_invite ────────────────────────────────────
-- Returns the raw token ONCE so the caller can build the link; only its hash is
-- persisted. Enforces the soft seat cap against members + outstanding invites.
CREATE OR REPLACE FUNCTION public.create_company_invite(
  p_company_id uuid,
  p_email text,
  p_role text
)
RETURNS TABLE(invite_id uuid, token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token   text;
  v_hash    text;
  v_cap     integer;
  v_used    integer;
  v_id      uuid;
BEGIN
  IF company_role(p_company_id) NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'not_authorized' USING errcode = 'insufficient_privilege';
  END IF;
  IF p_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;
  IF btrim(coalesce(p_email, '')) = '' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  SELECT seat_cap INTO v_cap FROM company_profiles WHERE id = p_company_id;
  SELECT (SELECT count(*) FROM company_members WHERE company_id = p_company_id)
       + (SELECT count(*) FROM company_invites
           WHERE company_id = p_company_id AND status = 'pending')
    INTO v_used;
  IF v_used >= coalesce(v_cap, 10) THEN
    RAISE EXCEPTION 'seat_cap_reached';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash  := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO company_invites (company_id, email, role, token_hash, invited_by)
    VALUES (p_company_id, lower(btrim(p_email)), p_role, v_hash, (select auth.uid()))
    RETURNING id INTO v_id;

  invite_id := v_id;
  token := v_token;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.create_company_invite(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_company_invite(uuid, text, text) TO authenticated;

-- ── accept_company_invite ────────────────────────────────────
-- Turns a valid pending token into a membership for the calling user. Also
-- ensures the user has a company role so persona resolution routes them to the
-- company app. Idempotent: re-accepting a used token is a no-op error.
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
