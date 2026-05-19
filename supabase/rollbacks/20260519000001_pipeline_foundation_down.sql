-- ============================================================
-- PIPELINE FOUNDATION — Down (rollback)
--
-- This file is reference-only. Supabase does not apply it
-- automatically. To roll back, run it manually:
--
--   supabase db execute --file supabase/rollbacks/20260519000001_pipeline_foundation_down.sql
--   (or paste into the Supabase SQL editor)
--
-- Apply in a dev/staging environment before touching production.
-- ============================================================

-- ── 1. Drop current_stage_id from applications ───────────────

ALTER TABLE applications
  DROP COLUMN IF EXISTS current_stage_id;

-- ── 2. Drop pipeline_snapshot from jobs ──────────────────────

ALTER TABLE jobs
  DROP COLUMN IF EXISTS pipeline_snapshot;

-- ── 3. Drop pipeline_stage ───────────────────────────────────
-- CASCADE removes the index and trigger automatically.

DROP TABLE IF EXISTS pipeline_stage;

-- ── 4. Drop company_pipeline ─────────────────────────────────
-- CASCADE removes the trigger and RLS policies automatically.

DROP TABLE IF EXISTS company_pipeline;

-- ── 5. Restore company_pipeline_stage ────────────────────────
-- Recreates the table dropped in the up migration (20260518000004/000005).

CREATE TABLE IF NOT EXISTS company_pipeline_stage (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  stage_type  TEXT        NOT NULL
                          CHECK (stage_type IN ('screening', 'assessment', 'interview', 'offer')),
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  purpose     TEXT        CHECK (purpose IS NULL OR length(purpose) <= 280),
  sla_hours_approaching INTEGER,
  sla_hours_breached    INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_company_stage    UNIQUE (company_id, stage_type),
  CONSTRAINT sla_hours_positive      CHECK (
    (sla_hours_approaching IS NULL OR sla_hours_approaching > 0)
    AND (sla_hours_breached IS NULL OR sla_hours_breached > 0)
  ),
  CONSTRAINT sla_hours_ordered       CHECK (
    sla_hours_approaching IS NULL
    OR sla_hours_breached IS NULL
    OR sla_hours_approaching < sla_hours_breached
  )
);

CREATE INDEX IF NOT EXISTS idx_company_pipeline_stage_company
  ON company_pipeline_stage (company_id);

ALTER TABLE company_pipeline_stage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_manage_stages"
  ON company_pipeline_stage FOR ALL
  USING  (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

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
