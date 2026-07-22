-- ============================================================
-- KREWTREE — Capture who moved an applicant's stage
--
-- Stage moves happen from several call sites (kanban drag, slideover, bulk
-- actions), all plain UPDATEs of applications.current_stage_id. Rather than
-- thread the mover's name through every caller, a BEFORE UPDATE trigger stamps
-- stage_moved_by (a display-name snapshot of the acting user) and stage_moved_at
-- whenever current_stage_id changes. Powers the pipeline "Moved by X" line.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_stage_moved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.current_stage_id IS DISTINCT FROM OLD.current_stage_id THEN
    SELECT coalesce(
      nullif(btrim(
        coalesce(u.raw_user_meta_data->>'first_name', '') || ' ' ||
        coalesce(u.raw_user_meta_data->>'last_name', '')
      ), ''),
      nullif(u.raw_user_meta_data->>'company_name', ''),
      split_part(u.email::text, '@', 1)
    ) INTO v_name
    FROM auth.users u
    WHERE u.id = (select auth.uid());

    NEW.stage_moved_by := v_name;
    NEW.stage_moved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_stage_moved ON applications;
CREATE TRIGGER trg_set_stage_moved
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_stage_moved();
