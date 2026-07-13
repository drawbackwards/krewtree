-- ============================================================
-- Worker Feedback — post-hire, company-to-company quality signal
--
-- Replaces the legacy worker_reviews model (public per-entry reviews with
-- worker replies) with a tightly-scoped feedback system per the Worker
-- Feedback spec (2026-07-07):
--   • Private to the reviewing company; commentary never leaves the author.
--   • Feeds an aggregate rating + top-pill signal any company can see.
--   • Workers see ONLY their own aggregate rating + review count — no
--     individual entries, no pills, no commentary, no reply mechanism.
--
-- worker_reviews was seeded schema in the initial migration but was never
-- wired to any service or component (only referenced in generated types),
-- so it is dropped outright rather than migrated. Spec §8.
--
-- Visibility is enforced at the query layer, not the UI (spec §12.4):
--   • Base rows are readable only by companies (RLS). Workers cannot read
--     worker_feedback at all — their aggregate comes from a SECURITY DEFINER
--     function that returns only avg + count.
--   • Author-only columns (commentary, full job detail) are gated per-row
--     inside the history RPC via reviewing_company_id = auth.uid().
-- The 24-hour edit window is a server-side boundary (spec §12.3): the UPDATE
-- policy rejects any write once now() >= locked_at. No DELETE policy exists.
-- ============================================================

-- ── 0. Drop the legacy, unwired review model ─────────────────
-- CASCADE removes its RLS policies and the reviewer/worker indexes with it.
DROP TABLE IF EXISTS worker_reviews CASCADE;

-- ── 1. Canonical attribute pills (universal for MVP) ─────────
-- `display_order` (not `order`, a reserved word) is the tie-break rank within
-- a sentiment list. `active` allows deprecation without breaking historical
-- references (pills are referenced by id on feedback, never by label). §4.3
CREATE TABLE feedback_pill (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,
  label          TEXT NOT NULL,
  sentiment      TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative')),
  display_order  INTEGER NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the 9 positive + 5 negative pills inline (matches the skills/licenses
-- taxonomy convention — SQL INSERT, no JSON loader).
INSERT INTO feedback_pill (slug, label, sentiment, display_order) VALUES
  ('reliable',              'Reliable',                        'positive', 1),
  ('on_time',               'On time',                         'positive', 2),
  ('quality_work',          'Quality work',                    'positive', 3),
  ('fast_learner',          'Fast learner',                    'positive', 4),
  ('great_communicator',    'Great communicator',              'positive', 5),
  ('professional',          'Professional',                    'positive', 6),
  ('team_player',           'Team player',                     'positive', 7),
  ('problem_solver',        'Problem solver',                  'positive', 8),
  ('safety_conscious',      'Safety-conscious',                'positive', 9),
  ('poor_communication',    'Poor communication',              'negative', 1),
  ('attendance_issues',     'Attendance issues',               'negative', 2),
  ('work_quality_below',    'Work quality below expectations', 'negative', 3),
  ('unprofessional_conduct','Unprofessional conduct',          'negative', 4),
  ('safety_concerns',       'Safety concerns',                 'negative', 5);

ALTER TABLE feedback_pill ENABLE ROW LEVEL SECURITY;
-- Reference data: readable by any authenticated user (companies render the
-- form; harmless to workers, who never see pills in the UI).
CREATE POLICY "authenticated_read" ON feedback_pill FOR SELECT TO authenticated USING (TRUE);

-- ── 2. worker_feedback — one row per (company, hired application) ─
-- worker_id CASCADE: feedback is removed with the worker (matches today's
--   hard-delete-via-auth.users reality; a retain-aggregate pattern waits for a
--   real worker soft-delete flow). §10.3
-- reviewing_company_id SET NULL: feedback persists if the company is deleted —
--   the company name was already hidden from non-authoring viewers. §10.3
-- job_id is denormalized from the application (set by trigger) for query
--   efficiency. locked_at is stored (created_at + 24h) for query simplicity.
CREATE TABLE worker_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id             UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  reviewing_company_id  UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  application_id        UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id                UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  star_rating           INTEGER NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  would_hire_again      TEXT NOT NULL CHECK (would_hire_again IN ('yes', 'no', 'unsure')),
  commentary            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at             TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_feedback_per_company_per_application
    UNIQUE (reviewing_company_id, application_id)
);

-- Denormalize job_id from the application and stamp the 24-hour lock on insert.
-- The window is fixed from creation and never reset by edits (spec §3.3).
CREATE OR REPLACE FUNCTION worker_feedback_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.job_id IS NULL THEN
    SELECT job_id INTO NEW.job_id FROM applications WHERE id = NEW.application_id;
  END IF;
  NEW.locked_at := NEW.created_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_worker_feedback_before_insert
  BEFORE INSERT ON worker_feedback
  FOR EACH ROW EXECUTE FUNCTION worker_feedback_before_insert();

CREATE TRIGGER set_worker_feedback_updated_at
  BEFORE UPDATE ON worker_feedback
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_worker_feedback_worker ON worker_feedback (worker_id);
CREATE INDEX idx_worker_feedback_company ON worker_feedback (reviewing_company_id);
CREATE INDEX idx_worker_feedback_application ON worker_feedback (application_id);

ALTER TABLE worker_feedback ENABLE ROW LEVEL SECURITY;

-- Any company may read feedback rows (aggregate + history are company-visible).
-- Workers get NO direct read; their aggregate comes from the SECURITY DEFINER
-- function below. Author-only columns are gated inside the history RPC.
CREATE POLICY "company_read" ON worker_feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_profiles c WHERE c.id = (select auth.uid())));

-- Only the hiring company can create feedback, only for its own terminal_hired
-- application, and worker_id must match that application (eligibility, §5.3).
-- Outer columns are qualified (worker_feedback.*) to avoid resolving against
-- the correlated subquery's columns.
CREATE POLICY "company_insert" ON worker_feedback FOR INSERT
  WITH CHECK (
    reviewing_company_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = worker_feedback.application_id
        AND a.company_id = (select auth.uid())
        AND a.worker_id = worker_feedback.worker_id
        AND a.status = 'terminal_hired'
    )
  );

-- Editable only by the author, only within the 24-hour window (spec §12.3).
CREATE POLICY "author_update" ON worker_feedback FOR UPDATE
  USING (reviewing_company_id = (select auth.uid()) AND now() < locked_at)
  WITH CHECK (reviewing_company_id = (select auth.uid()) AND now() < locked_at);
-- No DELETE policy: feedback can never be deleted by the company (spec §3.3).

-- ── 3. worker_feedback_pill — pills selected on a feedback row ─
CREATE TABLE worker_feedback_pill (
  feedback_id  UUID NOT NULL REFERENCES worker_feedback(id) ON DELETE CASCADE,
  pill_id      UUID NOT NULL REFERENCES feedback_pill(id),
  PRIMARY KEY (feedback_id, pill_id)
);

-- Aggregation groups by pill_id; the PK only indexes (feedback_id, ...).
CREATE INDEX idx_worker_feedback_pill_pill ON worker_feedback_pill (pill_id);

ALTER TABLE worker_feedback_pill ENABLE ROW LEVEL SECURITY;

-- Same read gate as worker_feedback: any company, never a worker.
CREATE POLICY "company_read" ON worker_feedback_pill FOR SELECT
  USING (EXISTS (SELECT 1 FROM company_profiles c WHERE c.id = (select auth.uid())));

-- Pill selections can only be added/removed by the author while the parent
-- feedback is still inside its 24-hour edit window.
CREATE POLICY "author_insert" ON worker_feedback_pill FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_feedback f
      WHERE f.id = worker_feedback_pill.feedback_id
        AND f.reviewing_company_id = (select auth.uid())
        AND now() < f.locked_at
    )
  );

CREATE POLICY "author_delete" ON worker_feedback_pill FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM worker_feedback f
      WHERE f.id = worker_feedback_pill.feedback_id
        AND f.reviewing_company_id = (select auth.uid())
        AND now() < f.locked_at
    )
  );

-- ── 4. Viewer-scoped read RPCs ───────────────────────────────

-- Aggregate rating + review count. SECURITY DEFINER so a worker (who cannot
-- read worker_feedback rows) can still see their own aggregate. The guard
-- limits arbitrary lookups: a worker may query only their own worker_id; a
-- company may query any (they can already read the underlying rows). §6.1, §7.1
CREATE OR REPLACE FUNCTION public.get_worker_feedback_aggregate(p_worker_id uuid)
RETURNS TABLE (average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    round(avg(star_rating)::numeric, 1) AS average_rating,
    count(*) AS review_count
  FROM worker_feedback
  WHERE worker_id = p_worker_id
    AND (
      p_worker_id = (select auth.uid())
      OR EXISTS (SELECT 1 FROM company_profiles c WHERE c.id = (select auth.uid()))
    )
$$;

GRANT EXECUTE ON FUNCTION public.get_worker_feedback_aggregate(uuid) TO authenticated;

-- Top pills by frequency across all of a worker's feedback. SECURITY INVOKER:
-- RLS on the base tables naturally returns nothing to a worker caller, so this
-- is company-facing by construction. Ties broken by canonical display_order.
-- Returns every pill with a count > 0; the caller slices top 3-5 per sentiment. §7.2
CREATE OR REPLACE FUNCTION public.get_worker_feedback_top_pills(p_worker_id uuid)
RETURNS TABLE (
  pill_id uuid,
  slug text,
  label text,
  sentiment text,
  cnt bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    fp.id,
    fp.slug,
    fp.label,
    fp.sentiment,
    count(*) AS cnt
  FROM worker_feedback f
  JOIN worker_feedback_pill wfp ON wfp.feedback_id = f.id
  JOIN feedback_pill fp ON fp.id = wfp.pill_id
  WHERE f.worker_id = p_worker_id
  GROUP BY fp.id, fp.slug, fp.label, fp.sentiment, fp.display_order
  ORDER BY fp.sentiment, count(*) DESC, fp.display_order ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_worker_feedback_top_pills(uuid) TO authenticated;

-- Per-entry history for the profile history view. SECURITY INVOKER: RLS blocks
-- workers entirely. Author-only fields are gated per-row — commentary is NULL
-- for non-authors, and is_own/is_editable let the client show the right action.
-- Full job detail beyond the title is fetched separately by the author (they
-- own the job); only the title is exposed to other companies. §6.2, §6.3, §12.5
CREATE OR REPLACE FUNCTION public.get_worker_feedback_history(p_worker_id uuid)
RETURNS TABLE (
  id uuid,
  job_id uuid,
  job_title text,
  star_rating integer,
  would_hire_again text,
  created_at timestamptz,
  is_own boolean,
  is_editable boolean,
  commentary text,
  positive_pills text[],
  negative_pills text[]
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    f.id,
    f.job_id,
    j.title AS job_title,
    f.star_rating,
    f.would_hire_again,
    f.created_at,
    (f.reviewing_company_id = (select auth.uid())) AS is_own,
    (f.reviewing_company_id = (select auth.uid()) AND now() < f.locked_at) AS is_editable,
    CASE
      WHEN f.reviewing_company_id = (select auth.uid()) THEN f.commentary
      ELSE NULL
    END AS commentary,
    coalesce(
      array_agg(fp.label ORDER BY fp.display_order) FILTER (WHERE fp.sentiment = 'positive'),
      ARRAY[]::text[]
    ) AS positive_pills,
    coalesce(
      array_agg(fp.label ORDER BY fp.display_order) FILTER (WHERE fp.sentiment = 'negative'),
      ARRAY[]::text[]
    ) AS negative_pills
  FROM worker_feedback f
  LEFT JOIN jobs j ON j.id = f.job_id
  LEFT JOIN worker_feedback_pill wfp ON wfp.feedback_id = f.id
  LEFT JOIN feedback_pill fp ON fp.id = wfp.pill_id
  WHERE f.worker_id = p_worker_id
  GROUP BY f.id, j.title
  ORDER BY f.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_worker_feedback_history(uuid) TO authenticated;
