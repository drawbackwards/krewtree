-- ============================================================
-- KREWTREE — Multi-seat follow-ups: new-company creation + stage-move actor
--
-- 1. create_company(): a logged-in user spins up a brand-new company and becomes
--    its owner (multi-org). SECURITY DEFINER so it can mint a company_profiles
--    row with a fresh id (not auth.uid()) and seat the caller as owner.
-- 2. applications.stage_moved_by / stage_moved_at: capture WHO moved an applicant
--    to their current stage and WHEN, so the pipeline can show "Moved by X".
--    Name is a snapshot at write time (same pattern as application_notes.author_name).
-- ============================================================

-- company_profiles.id was FK'd to auth.users(id) from the old "company == one
-- user" model. Under multi-seat the org id is standalone (membership is the
-- link), and a company must be able to exist with an id that is not any auth
-- user (created via create_company below). Drop the FK; existing rows whose id
-- happens to equal the founder's auth id are unaffected. Side effect (desired):
-- deleting a founder's auth user no longer cascade-deletes the whole company.
ALTER TABLE company_profiles DROP CONSTRAINT IF EXISTS company_profiles_id_fkey;

CREATE OR REPLACE FUNCTION public.create_company(
  p_name text,
  p_industry text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (select auth.uid());
  v_id  uuid := gen_random_uuid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF btrim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  INSERT INTO company_profiles (id, name, industry)
    VALUES (v_id, btrim(p_name), coalesce(p_industry, ''));
  INSERT INTO company_members (company_id, user_id, role)
    VALUES (v_id, v_uid, 'owner');
  INSERT INTO user_roles (id, role)
    VALUES (v_uid, 'company')
    ON CONFLICT (id) DO NOTHING;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_company(text, text) TO authenticated;

-- Stage-move attribution. Nullable — historical rows and pure status changes
-- (hire/reject) leave them null; set only when current_stage_id changes.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage_moved_by TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage_moved_at TIMESTAMPTZ;
