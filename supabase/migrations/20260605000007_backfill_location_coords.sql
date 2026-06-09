-- ─── Location: backfill existing rows ───────────────────────────────────────
-- Populates lat/lng on every worker_profiles and company_profiles row that
-- has a parseable city/state. Idempotent: re-running matches the same rows
-- against the same us_cities, so it can be safely re-applied. New rows after
-- this point are handled by the BEFORE INSERT/UPDATE triggers.
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.worker_profiles wp
SET latitude  = c.latitude,
    longitude = c.longitude
FROM public.us_cities c
WHERE lower(c.state) = lower(btrim(wp.region))
  AND lower(c.city)  = lower(btrim(wp.city));

-- company_profiles backfill: parse "City, ST" out of headquarters first, then
-- join. Rows whose headquarters doesn't match the pattern (or whose city
-- isn't in us_cities) keep NULL coords — same fail-soft behavior as the
-- trigger.
WITH parsed AS (
  SELECT
    cp.id,
    regexp_match(cp.headquarters, '^\s*([^,]+?)\s*,\s*([A-Za-z]{2})\b') AS parts
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
