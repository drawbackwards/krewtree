-- ============================================================
-- DEFAULT PIPELINE STAGES ON COMPANY SIGNUP
-- New companies start with a three-stage pipeline: Applied,
-- Review, Offer (no task templates). Previously only a single
-- "Applied" stage was seeded. The company can still edit these
-- stages, or replace them via a template in Org Settings.
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
      VALUES
        (v_pipeline_id, 'Applied', 1),
        (v_pipeline_id, 'Review', 2),
        (v_pipeline_id, 'Offer', 3);
  END IF;

  RETURN NEW;
END;
$$;
