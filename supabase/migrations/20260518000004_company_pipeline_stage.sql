-- Company-level stage configuration: per-stage enable flag + purpose text.
-- One row per (company, stage_type) for each of the four active stages.
-- Rows are lazy-seeded on first read so existing companies don't need backfill.
--
-- Per the spec, "disabled" means the stage is skipped when auto-advancing the
-- applicant. Backward moves to a disabled stage are blocked (enforced in app
-- layer). Existing applicants in a now-disabled stage stay put.

CREATE TABLE IF NOT EXISTS company_pipeline_stage (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  stage_type  TEXT        NOT NULL
                          CHECK (stage_type IN ('screening', 'assessment', 'interview', 'offer')),
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  purpose     TEXT        CHECK (purpose IS NULL OR length(purpose) <= 280),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_company_stage UNIQUE (company_id, stage_type)
);

CREATE INDEX IF NOT EXISTS idx_company_pipeline_stage_company
  ON company_pipeline_stage (company_id);

ALTER TABLE company_pipeline_stage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_manage_stages" ON company_pipeline_stage;
CREATE POLICY "company_manage_stages"
  ON company_pipeline_stage FOR ALL
  USING  (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Auto-update updated_at on any write.
CREATE OR REPLACE FUNCTION touch_company_pipeline_stage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_pipeline_stage_updated_at ON company_pipeline_stage;
CREATE TRIGGER trg_company_pipeline_stage_updated_at
  BEFORE UPDATE ON company_pipeline_stage
  FOR EACH ROW EXECUTE FUNCTION touch_company_pipeline_stage_updated_at();
