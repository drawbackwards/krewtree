-- Extend upsert_worker_profile with references + section-level consent.
-- Mirrors the existing full-replace pattern (delete + reinsert) used for skills,
-- certifications, social links, and work history. Also maintains the
-- references_count denorm on worker_profiles so the public profile can render
-- the "X references available on application" indicator without reading the
-- locked-down worker_references rows.

CREATE OR REPLACE FUNCTION upsert_worker_profile(
  p_first_name         TEXT,
  p_last_name          TEXT,
  p_city               TEXT,
  p_region             TEXT,
  p_phone              TEXT,
  p_primary_trade      TEXT,
  p_bio                TEXT,
  p_industries         TEXT[],
  p_skills             JSONB,
  p_certs              JSONB,
  p_social_links       JSONB,
  p_work_history       JSONB,
  p_references         JSONB   DEFAULT '[]'::JSONB,
  p_references_consent BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_worker_id UUID := auth.uid();
  v_ref_count INTEGER := jsonb_array_length(p_references);
BEGIN
  IF v_ref_count > 5 THEN
    RAISE EXCEPTION 'A worker can have at most 5 references';
  END IF;

  -- Core profile (also recomputes completion %).
  -- Consent timestamp: preserved when already set; cleared when consent flips off.
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
    ),
    references_count = v_ref_count,
    references_consent_confirmed_at = CASE
      WHEN p_references_consent THEN COALESCE(references_consent_confirmed_at, NOW())
      ELSE NULL
    END
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

  -- References (full replace). Empty phone/email strings normalize to NULL so
  -- the at-least-one-contact CHECK rejects entries with neither.
  DELETE FROM worker_references WHERE worker_id = v_worker_id;
  INSERT INTO worker_references (worker_id, name, company, phone, email)
    SELECT
      v_worker_id,
      r->>'name',
      r->>'company',
      NULLIF(r->>'phone', ''),
      NULLIF(r->>'email', '')
    FROM jsonb_array_elements(p_references) r;
END;
$$;
