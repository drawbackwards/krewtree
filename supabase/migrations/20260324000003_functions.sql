-- ============================================================
-- KREWTREE — Database Functions
-- ============================================================

-- ── setup_worker_profile ──────────────────────────────────
-- Called immediately after a worker signs up.
-- Creates the user_roles row and an empty worker_profiles row.
-- SECURITY DEFINER: runs as the owning role (postgres), not the caller,
-- so it can write to user_roles even before the RLS insert policy would
-- normally allow it.
CREATE OR REPLACE FUNCTION setup_worker_profile(
  p_user_id    UUID,
  p_first_name TEXT DEFAULT '',
  p_last_name  TEXT DEFAULT '',
  p_city       TEXT DEFAULT '',
  p_region     TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (id, role)
    VALUES (p_user_id, 'worker')
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO worker_profiles (id, first_name, last_name, city, region)
    VALUES (p_user_id, p_first_name, p_last_name, p_city, p_region)
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ── setup_company_profile ─────────────────────────────────
CREATE OR REPLACE FUNCTION setup_company_profile(
  p_user_id UUID,
  p_name    TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (id, role)
    VALUES (p_user_id, 'company')
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO company_profiles (id, name)
    VALUES (p_user_id, p_name)
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ── upsert_worker_profile ─────────────────────────────────
-- Saves the worker profile edit page data in one call.
-- Replaces all skills, certifications, social links, and work history
-- belonging to the worker, then updates the core profile row.
CREATE OR REPLACE FUNCTION upsert_worker_profile(
  p_first_name   TEXT,
  p_last_name    TEXT,
  p_city         TEXT,
  p_region       TEXT,
  p_phone        TEXT,
  p_primary_trade TEXT,
  p_bio          TEXT,
  p_industries   TEXT[],
  p_skills       JSONB,   -- [{industry_id, skill_id, name, years_exp, source}]
  p_certs        JSONB,   -- [{cert_name, issuing_body, expiry_date}]
  p_social_links JSONB,   -- [{platform, url}]
  p_work_history JSONB    -- [{employer_name, role_title, start_date, end_date, is_current, contract_type, industry_id, description}]
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_worker_id UUID := auth.uid();
BEGIN
  -- Core profile (also recomputes completion %)
  -- 4 sections × 25 each: basic info, about, skills, work history
  UPDATE worker_profiles SET
    first_name    = p_first_name,
    last_name     = p_last_name,
    city          = p_city,
    region        = p_region,
    phone         = p_phone,
    primary_trade = p_primary_trade,
    bio           = p_bio,
    profile_complete_pct = (
      CASE WHEN p_first_name <> '' AND p_last_name <> '' AND p_city <> '' AND p_phone <> '' THEN 25 ELSE 0 END +
      CASE WHEN p_primary_trade <> '' AND p_bio <> '' THEN 25 ELSE 0 END +
      CASE WHEN jsonb_array_length(p_skills) > 0 THEN 25 ELSE 0 END +
      CASE WHEN jsonb_array_length(p_work_history) > 0 THEN 25 ELSE 0 END
    )
  WHERE id = v_worker_id;

  -- Industries (full replace)
  DELETE FROM worker_industries WHERE worker_id = v_worker_id;
  INSERT INTO worker_industries (worker_id, industry_id)
    SELECT v_worker_id, unnest(p_industries);

  -- Skills (full replace)
  DELETE FROM worker_skills WHERE worker_id = v_worker_id;
  INSERT INTO worker_skills (worker_id, industry_id, skill_id, name, years_exp, source)
    SELECT
      v_worker_id,
      (s->>'industry_id')::TEXT,
      NULLIF(s->>'skill_id', ''),
      s->>'name',
      NULLIF(s->>'years_exp', '')::INTEGER,
      CASE WHEN s->>'source' = 'suggested' THEN 'suggested' ELSE 'custom' END
    FROM jsonb_array_elements(p_skills) s;

  -- Certifications (full replace)
  DELETE FROM worker_certifications WHERE worker_id = v_worker_id;
  INSERT INTO worker_certifications (worker_id, cert_name, issuing_body, expiry_date)
    SELECT
      v_worker_id,
      c->>'cert_name',
      COALESCE(c->>'issuing_body', ''),
      NULLIF(c->>'expiry_date', '')::DATE
    FROM jsonb_array_elements(p_certs) c;

  -- Social links (full replace)
  DELETE FROM worker_social_links WHERE worker_id = v_worker_id;
  INSERT INTO worker_social_links (worker_id, platform, url)
    SELECT v_worker_id, l->>'platform', COALESCE(l->>'url', '')
    FROM jsonb_array_elements(p_social_links) l;

  -- Work history (full replace)
  DELETE FROM worker_work_history WHERE worker_id = v_worker_id;
  INSERT INTO worker_work_history (
    worker_id, employer_name, role_title, start_date, end_date,
    is_current, contract_type, industry_id, description
  )
    SELECT
      v_worker_id,
      w->>'employer_name',
      COALESCE(w->>'role_title', ''),
      NULLIF(w->>'start_date', '')::DATE,
      NULLIF(w->>'end_date', '')::DATE,
      COALESCE((w->>'is_current')::BOOLEAN, FALSE),
      COALESCE(w->>'contract_type', ''),
      NULLIF(w->>'industry_id', ''),
      COALESCE(w->>'description', '')
    FROM jsonb_array_elements(p_work_history) w;
END;
$$;

-- ── increment_job_view ────────────────────────────────────
-- Safe, non-blocking view count increment.
CREATE OR REPLACE FUNCTION increment_job_view(p_job_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO job_analytics (job_id, views_total)
    VALUES (p_job_id, 1)
    ON CONFLICT (job_id) DO UPDATE
      SET views_total = job_analytics.views_total + 1,
          updated_at  = NOW();
$$;
