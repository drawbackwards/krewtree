-- ============================================================
-- RLS audit fix #2 (MEDIUM) — company_members seat-management hardening
--
-- Problem: the `admin_manage` FOR ALL policy validated only the CALLER's role,
-- never the target row. So an owner/admin could:
--   • demote the owner then promote self to owner (ownership takeover),
--   • directly INSERT any auth user as a member/admin — bypassing the invite
--     flow, its email-match check, and the seat_cap ceiling.
--
-- Fix: replace the blanket FOR ALL with command-scoped policies that
--   • never let a client INSERT rows directly (all legitimate inserts run
--     through SECURITY DEFINER paths — handle_new_user, accept_company_invite —
--     which bypass RLS; the client only changes roles and removes seats),
--   • protect the owner seat from UPDATE/DELETE by non-owner logic, and
--   • forbid promoting anyone to 'owner' via the policy (ownership transfer is
--     the dedicated SECURITY DEFINER transfer_company_ownership RPC).
--
-- Client surfaces preserved: teamService.changeMemberRole (UPDATE role ∈
-- admin|member) and teamService.removeMember (DELETE a non-owner seat).
-- ============================================================

DROP POLICY IF EXISTS "admin_manage" ON company_members;

-- SELECT stays as member_read (any member sees the roster) — unchanged.

-- UPDATE: owner/admin may change a NON-owner seat, and may only set it to a
-- non-owner role. Prevents demoting the owner and prevents self-promotion to
-- owner (the one_owner_per_company index alone did not stop the demote-then-
-- promote sequence).
CREATE POLICY "admin_update" ON company_members FOR UPDATE
  USING (company_role(company_id) IN ('owner', 'admin') AND role <> 'owner')
  WITH CHECK (company_role(company_id) IN ('owner', 'admin') AND role <> 'owner');

-- DELETE: owner/admin may remove a NON-owner seat. The owner seat can't be
-- deleted (transfer ownership first, or delete the whole company — an
-- owner-only action on company_profiles).
CREATE POLICY "admin_delete" ON company_members FOR DELETE
  USING (company_role(company_id) IN ('owner', 'admin') AND role <> 'owner');

-- No INSERT policy: direct client inserts are denied. Membership is created
-- only by the DEFINER invite/signup paths, which enforce email match + seat cap.
