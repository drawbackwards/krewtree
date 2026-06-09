-- A saved search can now anchor its distance filter on a user-selected city
-- (defaults to the company office when unset). Two text columns are simpler
-- than a single "City, ST" string here — we already store the canonical pair
-- this way in us_cities and lookup_city_coords expects them separate.
ALTER TABLE public.company_discover_saved_searches
  ADD COLUMN IF NOT EXISTS near_city  TEXT,
  ADD COLUMN IF NOT EXISTS near_state TEXT;
