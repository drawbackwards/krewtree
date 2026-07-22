-- ============================================================
-- KREWTREE — Multi-seat team accounts (schema layer)
--
-- Today a company account IS one auth user: company_profiles.id equals the
-- auth.users id, and every company-owned row is gated by company_id = auth.uid().
-- This migration introduces the MEMBERSHIP layer that lets many auth users act
-- as one company, WITHOUT introducing a new company entity — company_profiles.id
-- remains the organization id, so every existing company_id column keeps its
-- meaning. Only "who may act as this company" changes, and that rewrite lands in
-- the next migration (20260723000002) once the membership tables exist.
--
-- A login may belong to MANY companies (agencies/consultants), so membership is
-- a proper join table keyed on (company_id, user_id), not a column on the user.
--
-- This migration is behavior-neutral on its own: after backfill every existing
-- company is a one-owner team, and RLS still reads company_id = auth.uid() until
-- the companion rewrite migration runs.
-- ============================================================

-- ── 1. company_members — the seats of a company ──────────────
-- role: owner  → billing, delete company, transfer ownership, manage seats
--       admin  → manage seats (invite/remove/change role) + all product actions
--       member → all product actions, no seat/billing control
CREATE TABLE company_members (
  company_id  UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id)
);

-- Reverse lookup: "which companies does this user belong to?" (session load,
-- the multi-org switcher). The PK already indexes (company_id, ...).
CREATE INDEX idx_company_members_user ON company_members (user_id);

-- Exactly one owner per company. A partial unique index is the simplest way to
-- express it; ownership transfer is a demote-old + promote-new done atomically
-- in an RPC (added with the team flow).
CREATE UNIQUE INDEX one_owner_per_company
  ON company_members (company_id) WHERE role = 'owner';

-- ── 2. company_invites — pending email invitations ───────────
-- An invite exists before the invitee has an auth user. Only the SHA-256 hash of
-- the tokenized link is stored; the raw token is returned once, at creation, to
-- build the link (see createCompanyInvite / accept_company_invite in the team
-- flow migration). Unique (company_id, email) is enforced only while pending so
-- a revoked/accepted invite doesn't block re-inviting.
CREATE TABLE company_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  token_hash  TEXT NOT NULL UNIQUE,
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'revoked')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_invites_company ON company_invites (company_id);
CREATE UNIQUE INDEX one_pending_invite_per_email
  ON company_invites (company_id, lower(email)) WHERE status = 'pending';

-- ── 3. Soft seat cap (free tier) ─────────────────────────────
-- No billing yet; a configurable ceiling enforced in the accept RPC and surfaced
-- in Team settings. Existing companies inherit the default.
ALTER TABLE company_profiles
  ADD COLUMN seat_cap INTEGER NOT NULL DEFAULT 10;

-- ── 4. Membership helpers (the RLS primitives) ───────────────
-- SECURITY DEFINER so they bypass RLS on company_members — this both avoids
-- policy recursion (policies on company_members call these) and lets any policy
-- resolve the caller's relationship to a company in one indexed lookup.
CREATE OR REPLACE FUNCTION is_company_member(cid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = cid AND user_id = (select auth.uid())
  )
$$;

-- Returns the caller's role in the company, or NULL if not a member. Callers
-- gate owner/admin-only writes with company_role(cid) IN (...).
CREATE OR REPLACE FUNCTION company_role(cid UUID)
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM company_members
  WHERE company_id = cid AND user_id = (select auth.uid())
$$;

GRANT EXECUTE ON FUNCTION is_company_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION company_role(UUID) TO authenticated;

-- ── 5. RLS on the new tables ─────────────────────────────────
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;

-- Members can see their company's roster. Seat management (insert/update/delete)
-- is owner/admin only. Founding-owner rows and invite-accept rows are created by
-- SECURITY DEFINER paths (handle_new_user, accept_company_invite), which bypass
-- these policies, so client-side writes here are limited to admin role changes
-- and seat removal.
CREATE POLICY "member_read" ON company_members FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "admin_manage" ON company_members FOR ALL
  USING (company_role(company_id) IN ('owner', 'admin'))
  WITH CHECK (company_role(company_id) IN ('owner', 'admin'));

-- Invites are visible to and managed by owners/admins of the target company.
-- The invitee never reads this table directly — acceptance runs through a
-- SECURITY DEFINER RPC that looks up the row by token hash.
CREATE POLICY "admin_manage" ON company_invites FOR ALL
  USING (company_role(company_id) IN ('owner', 'admin'))
  WITH CHECK (company_role(company_id) IN ('owner', 'admin'));

-- ── 6. Backfill: every existing company becomes a one-owner team ─
-- company_profiles.id == the founding auth user, so that user is the owner.
INSERT INTO company_members (company_id, user_id, role)
  SELECT id, id, 'owner' FROM company_profiles
  ON CONFLICT (company_id, user_id) DO NOTHING;

-- ── 7. New company signups also get an owner seat ────────────
-- Extend handle_new_user (added in 20260609000001) so a fresh company signup is
-- a valid team from the first login. Idempotent via ON CONFLICT. The worker
-- branch is unchanged; only the company branch gains the membership insert.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_role         TEXT;
  v_first_name   TEXT;
  v_last_name    TEXT;
  v_company_name TEXT;
  v_industry     TEXT;
  v_phone        TEXT;
  v_hq_city      TEXT;
  v_hq_state     TEXT;
BEGIN
  v_role         := COALESCE(NEW.raw_user_meta_data->>'role', '');
  v_first_name   := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name    := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
  v_industry     := COALESCE(NEW.raw_user_meta_data->>'industry', '');
  v_phone        := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_hq_city      := COALESCE(NEW.raw_user_meta_data->>'hq_city', '');
  v_hq_state     := COALESCE(NEW.raw_user_meta_data->>'hq_state', '');

  IF v_role = 'company' THEN
    INSERT INTO user_roles (id, role)
      VALUES (NEW.id, 'company')
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO company_profiles (
      id, name, industry, phone, hq_city, hq_state
    )
      VALUES (
        NEW.id, v_company_name, v_industry, v_phone, v_hq_city, v_hq_state
      )
      ON CONFLICT (id) DO NOTHING;

    -- The founder is the company's first owner seat.
    INSERT INTO company_members (company_id, user_id, role)
      VALUES (NEW.id, NEW.id, 'owner')
      ON CONFLICT (company_id, user_id) DO NOTHING;
  ELSIF v_role = 'worker' THEN
    INSERT INTO user_roles (id, role)
      VALUES (NEW.id, 'worker')
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO worker_profiles (id, first_name, last_name)
      VALUES (NEW.id, v_first_name, v_last_name)
      ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
