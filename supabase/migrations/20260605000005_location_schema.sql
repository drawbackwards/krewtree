-- ─── Location: schema + geocoding plumbing ─────────────────────────────────
-- Adds (latitude, longitude) to worker_profiles and company_profiles, a
-- us_cities lookup table populated from the US Census Gazetteer (seeded in
-- the next migration), and BEFORE INSERT/UPDATE triggers that resolve each
-- profile's saved city to a coordinate pair on every write.
--
-- Coords are stored as DOUBLE PRECISION — sufficient precision for the
-- 10/25/50/100-mile radius use case without pulling in PostGIS. Haversine in
-- application code does the distance math; if precision or query patterns
-- ever outgrow this, swap to a `geography(POINT)` column and PostGIS indexes.
-- ────────────────────────────────────────────────────────────────────────────

-- ── Coordinate columns ────────────────────────────────────────────────────
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ── us_cities lookup table ────────────────────────────────────────────────
-- (state, city) is the natural key. ~32k rows once seeded; city names are
-- stored case-preserved but compared case-insensitively in the lookup fn.
CREATE TABLE IF NOT EXISTS public.us_cities (
  state     TEXT NOT NULL,
  city      TEXT NOT NULL,
  latitude  DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (state, city)
);

-- Case-insensitive lookup index. The PK index already covers exact-case
-- matches, but real-world inputs ("phoenix", "PHOENIX") need this.
CREATE INDEX IF NOT EXISTS idx_us_cities_lower
  ON public.us_cities (lower(state), lower(city));

-- us_cities is reference data, world-readable. RLS off intentionally.
ALTER TABLE public.us_cities DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.us_cities TO authenticated, anon;

-- ── Lookup function ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lookup_city_coords(p_city TEXT, p_state TEXT)
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT latitude, longitude
  FROM public.us_cities
  WHERE lower(state) = lower(btrim(p_state))
    AND lower(city)  = lower(btrim(p_city))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_city_coords(TEXT, TEXT) TO authenticated;

-- ── Trigger: worker_profile geocoder ──────────────────────────────────────
-- Recomputes lat/lng whenever city OR region changes on a worker_profiles
-- row. Silent miss is intentional — an unmappable city leaves coords NULL
-- and downstream filters/sorts treat the worker as "unknown distance".
CREATE OR REPLACE FUNCTION public.worker_profile_geocode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_lat DOUBLE PRECISION;
  v_lng DOUBLE PRECISION;
BEGIN
  IF (TG_OP = 'INSERT')
     OR (NEW.city   IS DISTINCT FROM OLD.city)
     OR (NEW.region IS DISTINCT FROM OLD.region) THEN

    SELECT lat, lng INTO v_lat, v_lng
    FROM public.lookup_city_coords(NEW.city, NEW.region);

    NEW.latitude  := v_lat;
    NEW.longitude := v_lng;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS worker_profiles_geocode ON public.worker_profiles;
CREATE TRIGGER worker_profiles_geocode
BEFORE INSERT OR UPDATE OF city, region ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.worker_profile_geocode();

-- ── Trigger: company_profile geocoder ─────────────────────────────────────
-- company_profiles doesn't carry structured city/region columns yet — the
-- headquarters TEXT field holds them in "City, ST" form. Parse with a regex
-- so the trigger keeps working as long as that convention holds. If/when a
-- company-profile-edit page lands with proper fields, swap the regex for
-- direct NEW.city / NEW.region reads.
CREATE OR REPLACE FUNCTION public.company_profile_geocode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_match TEXT[];
  v_city  TEXT;
  v_state TEXT;
  v_lat   DOUBLE PRECISION;
  v_lng   DOUBLE PRECISION;
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.headquarters IS DISTINCT FROM OLD.headquarters) THEN

    v_match := regexp_match(NEW.headquarters, '^\s*([^,]+?)\s*,\s*([A-Za-z]{2})\b');
    IF v_match IS NOT NULL THEN
      v_city  := v_match[1];
      v_state := v_match[2];

      SELECT lat, lng INTO v_lat, v_lng
      FROM public.lookup_city_coords(v_city, v_state);

      NEW.latitude  := v_lat;
      NEW.longitude := v_lng;
    ELSE
      -- Unparseable headquarters string — clear stale coords so we don't
      -- carry a wrong location forward.
      NEW.latitude  := NULL;
      NEW.longitude := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_profiles_geocode ON public.company_profiles;
CREATE TRIGGER company_profiles_geocode
BEFORE INSERT OR UPDATE OF headquarters ON public.company_profiles
FOR EACH ROW EXECUTE FUNCTION public.company_profile_geocode();
