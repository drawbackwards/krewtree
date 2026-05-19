-- ============================================================
-- AUTO-SEED PIPELINE ON COMPANY SIGNUP
-- When a new company_profiles row is inserted, automatically
-- create a company_pipeline + single "Applied" stage.
-- Template selection in the signup UI can then replace this
-- default with Short, Long, or Build Your Own.
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_pipeline_id UUID;
BEGIN
  INSERT INTO company_pipeline (company_id)
    VALUES (NEW.id)
    ON CONFLICT (company_id) DO NOTHING
    RETURNING id INTO v_pipeline_id;

  IF v_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_stage (pipeline_id, name, sort_order)
      VALUES (v_pipeline_id, 'Applied', 1);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_seed_company_pipeline
  AFTER INSERT ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_pipeline();
