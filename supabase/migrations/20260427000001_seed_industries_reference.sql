-- Industries are reference data the app depends on (skills FK to them, jobs and
-- workers categorize by them). They previously existed ONLY in seed.sql, which
-- does not run on prod — so a clean database failed at 20260428000001_sync_skills
-- (FK: skills.industry_id -> industries.id) with an empty industries table.
--
-- This migration plants the canonical industry rows in EVERY environment, before
-- sync_skills runs. job_count starts at 0 (real); seed.sql overrides with demo
-- counts on local only. Idempotent so it is safe alongside seed.sql and reruns.
--
-- NOTE: this list matches the seeded/tested taxonomy in seed.sql. It differs from
-- src/site/data/industries.ts (which lists warehousing/cleaning/food_service/
-- freelance instead of retail/transportation/security) — a pre-existing
-- discrepancy to reconcile separately.

INSERT INTO industries (id, name, slug, color) VALUES
  ('construction',   'Construction',    'construction',   '#8B6914'),
  ('healthcare',     'Healthcare',      'healthcare',     '#1d5669'),
  ('hospitality',    'Hospitality',     'hospitality',    '#7a3e6d'),
  ('retail',         'Retail',          'retail',         '#6D7531'),
  ('transportation', 'Transportation',  'transportation', '#0A232D'),
  ('manufacturing',  'Manufacturing',   'manufacturing',  '#454545'),
  ('landscaping',    'Landscaping',     'landscaping',    '#4d5a16'),
  ('security',       'Security',        'security',       '#164355')
ON CONFLICT (id) DO NOTHING;
