-- Compute a 0-100 match score for one (worker, job) pair.
-- For MVP we treat jobs.title x worker_profiles.primary_trade as the skill signal
-- (there's no job_skills table yet) and jobs.location x worker_profiles.city for location.
-- Keep this simple; revisit when a real job_skills table lands.
--
-- NOTE: worker_profiles and jobs store '' (not NULL) for missing text fields,
-- so guards treat blank strings as missing. `position()` is used instead of LIKE
-- so that special characters ('%', '_') in user-entered text can't forge matches.

CREATE OR REPLACE FUNCTION compute_match_score(p_worker_id UUID, p_job_id UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_worker_city  TEXT;
  v_worker_trade TEXT;
  v_job_location TEXT;
  v_job_title    TEXT;
  v_location_score INT;
  v_trade_score    INT;
BEGIN
  -- Assumption: worker_profiles.id == auth.users.id (signup trigger enforces this).
  SELECT city, primary_trade INTO v_worker_city, v_worker_trade
    FROM worker_profiles WHERE id = p_worker_id;
  SELECT location, title INTO v_job_location, v_job_title
    FROM jobs WHERE id = p_job_id;

  IF v_worker_city IS NULL OR btrim(v_worker_city) = ''
     OR v_job_location IS NULL OR btrim(v_job_location) = '' THEN
    v_location_score := 0;
  ELSIF position(lower(btrim(v_worker_city)) IN lower(v_job_location)) > 0 THEN
    v_location_score := 100;
  ELSE
    v_location_score := 0;
  END IF;

  IF v_worker_trade IS NULL OR btrim(v_worker_trade) = ''
     OR v_job_title IS NULL OR btrim(v_job_title) = '' THEN
    v_trade_score := 0;
  ELSIF position(lower(btrim(v_worker_trade)) IN lower(v_job_title)) > 0 THEN
    v_trade_score := 100;
  ELSE
    v_trade_score := 50;  -- partial credit when we have both but no overlap
  END IF;

  RETURN (v_location_score + v_trade_score) / 2;
END $$;

-- Populate match_score on insert
CREATE OR REPLACE FUNCTION populate_application_match()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.match_score := compute_match_score(NEW.worker_id, NEW.job_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS populate_applications_match_score ON applications;
CREATE TRIGGER populate_applications_match_score
  BEFORE INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION populate_application_match();
