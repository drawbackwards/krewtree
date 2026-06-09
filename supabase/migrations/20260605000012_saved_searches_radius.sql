-- Extend Discover saved searches with the optional radius filter so a saved
-- search captures the full filter set, including "workers within 25 miles".
ALTER TABLE public.company_discover_saved_searches
  ADD COLUMN IF NOT EXISTS radius_mi INTEGER;
