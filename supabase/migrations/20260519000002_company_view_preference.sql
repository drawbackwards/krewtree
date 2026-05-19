-- Per-user Applicants widget view preference.
-- 'list' is the default per the May 2026 dashboard spec (§7.2).
-- Stored on company_profiles (one row per company user) so it
-- survives logout and works across devices.

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS applicants_view TEXT NOT NULL DEFAULT 'list'
    CHECK (applicants_view IN ('list', 'kanban'));
