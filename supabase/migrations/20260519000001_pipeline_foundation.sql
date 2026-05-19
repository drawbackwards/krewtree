-- ============================================================
-- PIPELINE FOUNDATION — Up
-- May 2026 pivot: org-level pipelines, drop semantic types.
-- See: krewtree-pipeline-foundation-spec.md
--
-- What this migration does:
--   1. Creates company_pipeline (one row per company)
--   2. Creates pipeline_stage (name + order; no semantic_type, no enabled)
--   3. Seeds one pipeline + 4 default stages per existing company
--   4. Adds pipeline_snapshot JSONB to jobs; backfills from company pipeline
--   5. Adds current_stage_id to applications; backfills from kanban_stage
--
-- What is NOT changed here (deferred to API session):
--   - applications.status CHECK constraint (still 'Applied'/'Rejected'/etc.)
--   - kanban_stage column (still present; API session will reconcile)
-- ============================================================

-- ── 0. Drop superseded table ─────────────────────────────────
-- company_pipeline_stage (20260518000004) used semantic_type + enabled + purpose —
-- the exact model the May 2026 pivot removes. Replace with company_pipeline +
-- pipeline_stage below.

DROP TABLE IF EXISTS company_pipeline_stage;

-- ── 1. company_pipeline ───────────────────────────────────────

CREATE TABLE company_pipeline (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL UNIQUE REFERENCES company_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_company_pipeline_updated_at
  BEFORE UPDATE ON company_pipeline
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE company_pipeline ENABLE ROW LEVEL SECURITY;

-- Company reads/writes its own pipeline
CREATE POLICY "company_own"
  ON company_pipeline FOR ALL
  USING  (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- All authenticated users can read (needed to resolve stage names via
-- the pipeline editor and job detail surfaces)
CREATE POLICY "authenticated_read"
  ON company_pipeline FOR SELECT TO authenticated USING (TRUE);

-- ── 2. pipeline_stage ─────────────────────────────────────────

CREATE TABLE pipeline_stage (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id  UUID        NOT NULL REFERENCES company_pipeline(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  sort_order   INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_pipeline_stage_updated_at
  BEFORE UPDATE ON pipeline_stage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_pipeline_stage_pipeline ON pipeline_stage(pipeline_id, sort_order);

ALTER TABLE pipeline_stage ENABLE ROW LEVEL SECURITY;

-- Company reads/writes stages belonging to its own pipeline
CREATE POLICY "company_own"
  ON pipeline_stage FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM company_pipeline WHERE company_id = auth.uid()
    )
  )
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM company_pipeline WHERE company_id = auth.uid()
    )
  );

-- All authenticated users can read
CREATE POLICY "authenticated_read"
  ON pipeline_stage FOR SELECT TO authenticated USING (TRUE);

-- ── 3. Seed one pipeline per existing company ─────────────────

INSERT INTO company_pipeline (company_id)
SELECT id FROM company_profiles;

-- ── 4. Seed 4 default stages per pipeline ────────────────────
-- Names and order derived from the existing kanban_stage enum:
--   new → Applied (1), reviewed → Reviewed (2),
--   interview → Interview (3), offer → Offer (4)
-- Disabled stages don't exist in the prior model so nothing is dropped.

INSERT INTO pipeline_stage (pipeline_id, name, sort_order)
SELECT
  cp.id,
  stage.name,
  stage.ord
FROM company_pipeline cp
CROSS JOIN (VALUES
  (1, 'Applied'),
  (2, 'Reviewed'),
  (3, 'Interview'),
  (4, 'Offer')
) AS stage(ord, name);

-- ── 5. Add pipeline_snapshot column to jobs ───────────────────

ALTER TABLE jobs
  ADD COLUMN pipeline_snapshot JSONB;

-- ── 6. Materialize pipeline_snapshot for existing jobs ────────
-- Snapshot includes the company's current stages (just created above).
-- triggers and task_template are empty arrays for this seed — they will
-- be populated by the pipeline editor once that surface is built.

UPDATE jobs j
SET pipeline_snapshot = (
  SELECT jsonb_build_object(
    'stages',
    jsonb_agg(
      jsonb_build_object(
        'id',            ps.id,
        'name',          ps.name,
        'order',         ps.sort_order,
        'triggers',      '[]'::jsonb,
        'task_template', '[]'::jsonb
      ) ORDER BY ps.sort_order
    )
  )
  FROM company_pipeline cp
  JOIN pipeline_stage   ps ON ps.pipeline_id = cp.id
  WHERE cp.company_id = j.company_id
);

-- ── 7. Add current_stage_id to applications ───────────────────

ALTER TABLE applications
  ADD COLUMN current_stage_id UUID;

-- ── 8. Populate current_stage_id from kanban_stage ────────────
-- Active stages map directly. Terminal states (hired, rejected) are set
-- to the last snapshot stage (order 4) per spec §4.3 — "the last stage
-- the application was in before entering the terminal state."
-- A kanban_stage of NULL or any unexpected value falls back to order 1.

UPDATE applications a
SET current_stage_id = (
  SELECT (stage_el ->> 'id')::uuid
  FROM   jobs j,
         jsonb_array_elements(j.pipeline_snapshot -> 'stages') AS stage_el
  WHERE  j.id = a.job_id
    AND  (stage_el ->> 'order')::int = CASE a.kanban_stage
           WHEN 'screening'  THEN 1   -- renamed from 'new'  in 20260518000001
           WHEN 'assessment' THEN 2   -- renamed from 'reviewed' in 20260518000001
           WHEN 'interview'  THEN 3
           WHEN 'offer'      THEN 4
           WHEN 'hired'      THEN 4   -- terminal: last active stage
           WHEN 'rejected'   THEN 4   -- terminal: last active stage
           WHEN 'withdrawn'  THEN 4   -- terminal: last active stage
           WHEN 'archived'   THEN 4   -- terminal: last active stage
           ELSE 1
         END
  LIMIT 1
);
