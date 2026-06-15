-- ============================================================
-- us_cities trigram indexes for the city/state typeahead
--
-- searchCities() (src/site/services/locationService.ts) filters with
-- PostgREST `.ilike('city', 'term%')`, which generates `"city" ILIKE
-- 'term%'`. The only existing index, idx_us_cities_lower on
-- (lower(state), lower(city)), CANNOT serve an ILIKE predicate, so every
-- city-picker keystroke seq-scanned all ~32k rows and sorted the matches —
-- a temp-file spill candidate as the table and traffic grow.
--
-- pg_trgm GIN indexes make ILIKE (including the prefix form used here)
-- index-backed, eliminating the seq scan and the sort. No application
-- change is needed; the existing `.ilike()` calls use these automatically.
-- ============================================================

create extension if not exists pg_trgm;

create index if not exists idx_us_cities_city_trgm
  on public.us_cities using gin (city gin_trgm_ops);

create index if not exists idx_us_cities_state_trgm
  on public.us_cities using gin (state gin_trgm_ops);
