-- ============================================================
-- KREWTREE — Fix handle_new_user search_path
-- The trigger from 20260609000001 was SECURITY DEFINER but did
-- not pin search_path. When it fires on auth.users INSERT, the
-- session inherits the auth admin's search_path which does NOT
-- include public, so the unqualified user_roles / worker_profiles
-- / company_profiles references fail and Supabase returns
-- "Database error saving new user" (500) on every signup.
--
-- Fix: SET search_path = public and fully-qualify every table
-- reference so the trigger never depends on search_path again.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
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
    INSERT INTO public.user_roles (id, role)
      VALUES (NEW.id, 'company')
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.company_profiles (
      id, name, industry, phone, hq_city, hq_state
    )
      VALUES (
        NEW.id, v_company_name, v_industry, v_phone, v_hq_city, v_hq_state
      )
      ON CONFLICT (id) DO NOTHING;
  ELSIF v_role = 'worker' THEN
    INSERT INTO public.user_roles (id, role)
      VALUES (NEW.id, 'worker')
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.worker_profiles (id, first_name, last_name)
      VALUES (NEW.id, v_first_name, v_last_name)
      ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
