-- ============================================================
-- KREWTREE — Schema
-- ============================================================

-- ── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- REFERENCE / LOOKUP TABLES
-- ============================================================

CREATE TABLE industries (
  id          TEXT PRIMARY KEY,                -- e.g. 'construction'
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  color       TEXT,
  job_count   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
  id           TEXT PRIMARY KEY,              -- e.g. 'framing'
  industry_id  TEXT NOT NULL REFERENCES industries(id),
  name         TEXT NOT NULL,
  aliases      TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE location_regions (
  id                   TEXT PRIMARY KEY,
  city                 TEXT NOT NULL,
  state                TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  job_count            INTEGER NOT NULL DEFAULT 0,
  featured_industries  TEXT[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER IDENTITY
-- ============================================================

-- Ties auth.users to a persona. Written once; role changes require admin.
CREATE TABLE user_roles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('worker', 'company')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKER PROFILE
-- ============================================================

CREATE TABLE worker_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name           TEXT NOT NULL DEFAULT '',
  last_name            TEXT NOT NULL DEFAULT '',
  city                 TEXT NOT NULL DEFAULT '',
  region               TEXT NOT NULL DEFAULT '',
  phone                TEXT NOT NULL DEFAULT '',
  primary_trade        TEXT NOT NULL DEFAULT '',
  bio                  TEXT NOT NULL DEFAULT '',
  avatar_url           TEXT,
  is_regulix_ready     BOOLEAN NOT NULL DEFAULT FALSE,
  performance_score    NUMERIC(3,1),
  profile_complete_pct INTEGER NOT NULL DEFAULT 0,
  total_hours_worked   INTEGER,
  is_premium           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_worker_profiles_updated_at
  BEFORE UPDATE ON worker_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Worker ↔ industries (many-to-many)
CREATE TABLE worker_industries (
  worker_id    UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  industry_id  TEXT NOT NULL REFERENCES industries(id),
  PRIMARY KEY (worker_id, industry_id)
);

-- Skills added to a worker profile
CREATE TABLE worker_skills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id    UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  industry_id  TEXT REFERENCES industries(id),
  skill_id     TEXT REFERENCES skills(id),         -- NULL if custom
  name         TEXT NOT NULL,
  years_exp    INTEGER,
  source       TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('suggested', 'custom')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_id);

-- Certifications
CREATE TABLE worker_certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  cert_name     TEXT NOT NULL DEFAULT '',
  issuing_body  TEXT NOT NULL DEFAULT '',
  expiry_date   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_certifications_worker ON worker_certifications(worker_id);

-- Social / web links
CREATE TABLE worker_social_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,                       -- 'linkedin', 'instagram', etc.
  url         TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, platform)
);

-- Work history
CREATE TABLE worker_work_history (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id            UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  employer_name        TEXT NOT NULL DEFAULT '',
  role_title           TEXT NOT NULL DEFAULT '',
  start_date           DATE,
  end_date             DATE,
  is_current           BOOLEAN NOT NULL DEFAULT FALSE,
  contract_type        TEXT NOT NULL DEFAULT '' CHECK (contract_type IN ('day_rate', 'project', 'long_term_temp', '')),
  industry_id          TEXT REFERENCES industries(id),
  description          TEXT NOT NULL DEFAULT '',
  is_regulix_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_work_history_worker ON worker_work_history(worker_id);

-- Resumes (metadata; file stored in Supabase Storage under resumes/{worker_id}/)
CREATE TABLE worker_resumes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  file_path   TEXT,                                -- storage path
  file_type   TEXT CHECK (file_type IN ('pdf', 'doc', 'docx')),
  size_kb     INTEGER,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portfolio items
CREATE TABLE worker_portfolio_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  project_date  DATE,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skill endorsements (peer validation)
CREATE TABLE skill_endorsements (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id          UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  skill_name         TEXT NOT NULL,
  endorser_id        UUID REFERENCES worker_profiles(id),
  endorser_name      TEXT NOT NULL DEFAULT '',
  endorser_initials  TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, skill_name, endorser_id)
);

-- ============================================================
-- COMPANY PROFILE
-- ============================================================

CREATE TABLE company_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  logo_url     TEXT,
  location     TEXT NOT NULL DEFAULT '',
  industry     TEXT NOT NULL DEFAULT '',
  is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  description  TEXT NOT NULL DEFAULT '',
  size         TEXT NOT NULL DEFAULT '',           -- '11–50', '51–200', '201–500', '500+'
  website      TEXT NOT NULL DEFAULT '',
  tagline      TEXT NOT NULL DEFAULT '',
  culture      TEXT NOT NULL DEFAULT '',
  mission      TEXT NOT NULL DEFAULT '',
  team_size    INTEGER,
  founded      INTEGER,
  headquarters TEXT NOT NULL DEFAULT '',
  avg_rating   NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE company_benefits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  icon          TEXT NOT NULL DEFAULT '',
  label         TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE company_perks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- JOBS
-- ============================================================

CREATE TABLE jobs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  industry                  TEXT NOT NULL DEFAULT '',
  industry_slug             TEXT NOT NULL DEFAULT '',
  type                      TEXT CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Temporary')),
  location                  TEXT NOT NULL DEFAULT '',
  pay_min                   NUMERIC(10,2),
  pay_max                   NUMERIC(10,2),
  pay_type                  TEXT CHECK (pay_type IN ('hour', 'salary')),
  description               TEXT NOT NULL DEFAULT '',
  requirements              TEXT[] NOT NULL DEFAULT '{}',
  skills                    TEXT[] NOT NULL DEFAULT '{}',
  is_sponsored              BOOLEAN NOT NULL DEFAULT FALSE,
  regulix_ready_applicants  INTEGER NOT NULL DEFAULT 0,
  total_applicants          INTEGER NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_industry_slug ON jobs(industry_slug);

CREATE TABLE job_analytics (
  job_id                   UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  views_total              INTEGER NOT NULL DEFAULT 0,
  applications_total       INTEGER NOT NULL DEFAULT 0,
  views_by_day             INTEGER[] NOT NULL DEFAULT '{}',
  applications_by_day      INTEGER[] NOT NULL DEFAULT '{}',
  conversion_rate          NUMERIC(5,4) NOT NULL DEFAULT 0,
  avg_time_to_apply_hours  NUMERIC(6,2) NOT NULL DEFAULT 0,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Viewed', 'Interviewing', 'Offer', 'Rejected')),
  is_boosted    BOOLEAN NOT NULL DEFAULT FALSE,
  kanban_stage  TEXT NOT NULL DEFAULT 'new' CHECK (kanban_stage IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, job_id)
);

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_applications_worker ON applications(worker_id);
CREATE INDEX idx_applications_job ON applications(job_id);

-- Timeline of status changes per application
CREATE TABLE application_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status          TEXT NOT NULL,
  note            TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_events_application ON application_events(application_id);

-- ============================================================
-- SAVED JOBS & SEARCHES
-- ============================================================

CREATE TABLE saved_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, job_id)
);

CREATE INDEX idx_saved_jobs_worker ON saved_jobs(worker_id);

CREATE TABLE saved_searches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id          UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  label              TEXT NOT NULL DEFAULT '',
  query              TEXT NOT NULL DEFAULT '',
  industry_slug      TEXT,
  types              TEXT[] NOT NULL DEFAULT '{}',
  pay_range_idx      INTEGER NOT NULL DEFAULT 0,
  regulix_only       BOOLEAN NOT NULL DEFAULT FALSE,
  alert_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  new_matches_count  INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVIEWS (two-way)
-- ============================================================

-- Workers reviewing companies
CREATE TABLE company_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id        UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  company_id       UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title            TEXT NOT NULL DEFAULT '',
  body             TEXT NOT NULL DEFAULT '',
  pros             TEXT NOT NULL DEFAULT '',
  cons             TEXT NOT NULL DEFAULT '',
  recommend        BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employers reviewing workers
CREATE TABLE worker_reviews (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id          UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  reviewer_id        UUID REFERENCES company_profiles(id),  -- NULL if imported
  employer_name      TEXT NOT NULL DEFAULT '',
  employer_initials  TEXT NOT NULL DEFAULT '',
  rating             INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  commentary         TEXT NOT NULL DEFAULT '',
  worker_reply       TEXT,
  source             TEXT NOT NULL DEFAULT 'krewtree',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_reviews_worker ON worker_reviews(worker_id);

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  company_id     UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  job_id         UUID REFERENCES jobs(id),
  unread_count   INTEGER NOT NULL DEFAULT 0,
  last_activity  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, company_id, job_id)
);

CREATE INDEX idx_conversations_worker ON conversations(worker_id);
CREATE INDEX idx_conversations_company ON conversations(company_id);

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES auth.users(id),
  is_company       BOOLEAN NOT NULL DEFAULT FALSE,
  content          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('application', 'message', 'status_change', 'job_alert', 'review')),
  title       TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  link        TEXT NOT NULL DEFAULT '',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- REFERRALS
-- ============================================================

CREATE TABLE referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  type         TEXT NOT NULL CHECK (type IN ('worker', 'company')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'hired')),
  reward       TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
