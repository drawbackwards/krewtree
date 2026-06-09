-- Fix: the previous geocode trigger + backfill used `\s` and `\b` in the
-- regex literal, which Postgres' string parser treats as literal characters
-- when standard_conforming_strings is on (the default). The regex never
-- matched and lat/lng stayed NULL. Switch to POSIX bracket classes which
-- have no backslash dependency in plain literals.

CREATE OR REPLACE FUNCTION public.company_profile_geocode()
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

-- Re-run the company backfill with the corrected regex.
DO $$
DECLARE
  v_updated INT;
BEGIN
  WITH parsed AS (
    SELECT
      cp.id,
      regexp_match(
        cp.location,
        '^[[:space:]]*([^,]+?)[[:space:]]*,[[:space:]]*([A-Za-z]{2})[[:space:]]*$'
      ) AS parts
    FROM public.company_profiles cp
  )
  UPDATE public.company_profiles cp
  SET latitude  = c.latitude,
      longitude = c.longitude
  FROM parsed p
  JOIN public.us_cities c
    ON lower(c.state) = lower(p.parts[2])
   AND lower(c.city)  = lower(btrim(p.parts[1]))
  WHERE p.id = cp.id
    AND p.parts IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'company_profiles backfilled: %', v_updated;
END $$;
