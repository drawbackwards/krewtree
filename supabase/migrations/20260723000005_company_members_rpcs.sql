-- ============================================================
-- KREWTREE — Multi-seat team accounts (roster + ownership transfer)
--
-- The Team settings roster needs each seat's email + name, which live in
-- auth.users (not client-readable). get_company_members() resolves them for any
-- member of the company. transfer_company_ownership() hands the single owner
-- seat to another member atomically (the one-owner index forbids two owners, so
-- the swap must happen in one statement).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_company_members(p_company_id uuid)
RETURNS TABLE(
  user_id uuid,
  role text,
  created_at timestamptz,
  email text,
  first_name text,
  last_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.user_id,
    cm.role,
    cm.created_at,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'first_name', '') AS first_name,
    coalesce(u.raw_user_meta_data->>'last_name', '')  AS last_name
  FROM company_members cm
  JOIN auth.users u ON u.id = cm.user_id
  WHERE cm.company_id = p_company_id
    AND is_company_member(p_company_id)   -- caller must belong to this company
  ORDER BY
    CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    cm.created_at
$$;
GRANT EXECUTE ON FUNCTION public.get_company_members(uuid) TO authenticated;

-- Single-statement CASE swap: the unique "one owner per company" index is
-- validated at statement end, so momentarily touching two owner rows mid-update
-- is fine — the final state has exactly one owner.
CREATE OR REPLACE FUNCTION public.transfer_company_ownership(
  p_company_id uuid,
  p_new_owner uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF company_role(p_company_id) <> 'owner' THEN
    RAISE EXCEPTION 'not_authorized' USING errcode = 'insufficient_privilege';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id AND user_id = p_new_owner
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  UPDATE company_members
  SET role = CASE
    WHEN user_id = p_new_owner THEN 'owner'
    WHEN role = 'owner' THEN 'admin'
    ELSE role
  END
  WHERE company_id = p_company_id AND (user_id = p_new_owner OR role = 'owner');
END;
$$;
GRANT EXECUTE ON FUNCTION public.transfer_company_ownership(uuid, uuid) TO authenticated;
