-- Fix: company_profiles stores its city/state in `location`, not `headquarters`.
-- The previous geocode trigger watched the wrong column, so all coords stayed
-- NULL even though the data was present. Switch the trigger + re-backfill.

DROP TRIGGER IF EXISTS company_profiles_geocode ON public.company_profiles;

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
    v_match := regexp_match(NEW.location, '^\s*([^,]+?)\s*,\s*([A-Za-z]{2})\b');
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

CREATE TRIGGER company_profiles_geocode
BEFORE INSERT OR UPDATE OF location ON public.company_profiles
FOR EACH ROW EXECUTE FUNCTION public.company_profile_geocode();

-- Re-backfill against `location`.
WITH parsed AS (
  SELECT
    cp.id,
    regexp_match(cp.location, '^\s*([^,]+?)\s*,\s*([A-Za-z]{2})\b') AS parts
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
