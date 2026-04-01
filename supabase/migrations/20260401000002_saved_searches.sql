-- Saved job searches with optional alert flag

CREATE TABLE saved_searches (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label          TEXT        NOT NULL,
  query          TEXT        NOT NULL DEFAULT '',
  industry_slug  TEXT,
  types          TEXT[]      NOT NULL DEFAULT '{}',
  pay_range_idx  INTEGER     NOT NULL DEFAULT 0,
  regulix_only   BOOLEAN     NOT NULL DEFAULT FALSE,
  alert_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_worker ON saved_searches(worker_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "worker_own_saved_searches" ON saved_searches
  FOR ALL
  USING  (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());
