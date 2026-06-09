-- ─── Location: extend geocoding to jobs ────────────────────────────────────
-- The Find Jobs page needs to filter / sort by distance from a worker's
-- chosen anchor. Jobs already store their address in `location` text — same
-- "City, ST" convention as company_profiles. Add lat/lng + a trigger that
-- mirrors company_profile_geocode and backfill existing rows.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE OR REPLACE FUNCTION public.job_geocode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_match TEXT[];
  v_lat   DOUBLE PRECISION;
  v_lng   DOUBLE PRECISION;
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.location IS DISTINCT FROM OLD.location) THEN
    v_match := regexp_match(
      NEW.location,
      '^[[:space:]]*([^,]+?)[[:space:]]*,[[:space:]]*([A-Za-z]{2})[[:space:]]*$'
    );
    IF v_match IS NOT NULL THEN
      SELECT lat, lng INTO v_lat, v_lng
      FROM public.lookup_city_coords(v_match[1], v_match[2]);
      NEW.latitude  := v_lat;
      NEW.longitude := v_lng;
    ELSE
      NEW.latitude  := NULL;
      NEW.longitude := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_geocode ON public.jobs;
CREATE TRIGGER jobs_geocode
BEFORE INSERT OR UPDATE OF location ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.job_geocode();

-- Backfill existing jobs from their `location` text.
DO $$
DECLARE
  v_updated INT;
BEGIN
  WITH parsed AS (
    SELECT
      j.id,
      regexp_match(
        j.location,
        '^[[:space:]]*([^,]+?)[[:space:]]*,[[:space:]]*([A-Za-z]{2})[[:space:]]*$'
      ) AS parts
    FROM public.jobs j
  )
  UPDATE public.jobs j
  SET latitude  = c.latitude,
      longitude = c.longitude
  FROM parsed p
  JOIN public.us_cities c
    ON lower(c.state) = lower(p.parts[2])
   AND lower(c.city)  = lower(btrim(p.parts[1]))
  WHERE p.id = j.id
    AND p.parts IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'jobs backfilled: %', v_updated;
END $$;
