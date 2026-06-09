-- ============================================================
-- KREWTREE — Enable RLS on public.us_cities (security fix)
-- The original location_schema migration left RLS OFF on this
-- table because it's reference data ("world-readable"), but
-- Supabase's advisor flags any public table without RLS as a
-- critical security issue.
--
-- This migration enables RLS and adds a permissive SELECT policy
-- that matches the prior behavior (anyone can read) — no write
-- policies, so anon/authenticated still can't INSERT/UPDATE/DELETE.
-- The existing GRANT SELECT TO authenticated, anon stays as-is.
-- ============================================================

ALTER TABLE public.us_cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "us_cities_public_read" ON public.us_cities;
CREATE POLICY "us_cities_public_read"
  ON public.us_cities
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);
