-- ============================================================
-- KREWTREE — Hard-delete expired companies (spec §6)
-- Soft-deleted companies (deleted_at IS NOT NULL) sit in a 30-day
-- grace window where support can restore them. After 30 days the
-- account is permanently removed.
--
-- This migration defines the cleanup function only. Scheduling is
-- handled either by:
--   - Supabase pg_cron extension (enable in dashboard → Database →
--     Extensions → pg_cron, then schedule: cron.schedule('krewtree-hard-delete-companies',
--     '0 4 * * *', 'SELECT hard_delete_expired_companies()'))
--   - or a Vercel Cron Job that calls a server route hitting this
--     RPC via the service_role key
-- ============================================================

CREATE OR REPLACE FUNCTION hard_delete_expired_companies()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_company_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Collect everyone past their 30-day grace period.
  SELECT array_agg(id) INTO v_company_ids
  FROM company_profiles
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  IF v_company_ids IS NULL OR array_length(v_company_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  v_count := array_length(v_company_ids, 1);

  -- Delete the auth.users rows; ON DELETE CASCADE on every
  -- company_profiles FK chain (user_roles, company_profiles,
  -- jobs, applications, etc.) removes the rest. Note that
  -- application records denormalize the company name at insert
  -- time, so worker history still surfaces the company name as
  -- a static string per spec §6.
  DELETE FROM auth.users WHERE id = ANY(v_company_ids);

  RETURN v_count;
END;
$$;

-- Restrict execution to the service_role so a cron / serverless function
-- can call it but ordinary clients cannot.
REVOKE EXECUTE ON FUNCTION hard_delete_expired_companies() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION hard_delete_expired_companies() FROM authenticated, anon;
GRANT  EXECUTE ON FUNCTION hard_delete_expired_companies() TO service_role;
