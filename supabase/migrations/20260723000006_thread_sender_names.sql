-- ============================================================
-- KREWTREE — Multi-seat team accounts (message attribution)
--
-- With multiple seats, a company-side message is sent by an individual teammate,
-- not "the company." Workers can't read auth.users, so this SECURITY DEFINER RPC
-- resolves the display name of each company-side sender in a pair thread for
-- both parties (any company member, or the worker on the thread). The client
-- maps sender id -> name and labels company bubbles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_thread_senders(
  p_company_id uuid,
  p_worker_id uuid
)
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    m.sent_by,
    coalesce(
      nullif(btrim(
        coalesce(u.raw_user_meta_data->>'first_name', '') || ' ' ||
        coalesce(u.raw_user_meta_data->>'last_name', '')
      ), ''),
      nullif(u.raw_user_meta_data->>'company_name', ''),
      split_part(u.email::text, '@', 1)
    ) AS display_name
  FROM message m
  JOIN auth.users u ON u.id = m.sent_by
  WHERE m.company_id = p_company_id
    AND m.worker_id = p_worker_id
    AND m.sent_by <> p_worker_id  -- company-side senders only
    AND (is_company_member(p_company_id) OR (select auth.uid()) = p_worker_id)
$$;
GRANT EXECUTE ON FUNCTION public.get_thread_senders(uuid, uuid) TO authenticated;
