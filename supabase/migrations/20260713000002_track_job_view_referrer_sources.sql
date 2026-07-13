-- ============================================================
-- Widen track_job_view source normalization for external traffic.
--
-- The initial version (20260713000001) only knew internal sources (search,
-- browse, company_profile, landing, similar) and folded everything else into
-- 'direct'. Views arriving from OUTSIDE krewtree — an external search engine
-- result or another site's link — were therefore invisible in the traffic
-- breakdown. JobDetailPage now inspects document.referrer and passes
-- 'search_engine' (Google/Bing/etc.) or 'referral' (any other external host);
-- accept those buckets here. External search keywords are NOT recoverable
-- (search engines strip the query from the referrer), so keyword stays null for
-- these — only the internal 'search' source carries a keyword.
-- ============================================================

CREATE OR REPLACE FUNCTION track_job_view(
  p_job_id         UUID,
  p_source         TEXT DEFAULT 'direct',
  p_search_keyword TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source  TEXT;
  v_keyword TEXT;
BEGIN
  v_source := CASE lower(coalesce(p_source, 'direct'))
    WHEN 'search'          THEN 'search'
    WHEN 'browse'          THEN 'browse'
    WHEN 'company_profile' THEN 'company_profile'
    WHEN 'landing'         THEN 'landing'
    WHEN 'similar'         THEN 'similar'
    WHEN 'search_engine'   THEN 'search_engine'
    WHEN 'referral'        THEN 'referral'
    ELSE 'direct'
  END;

  -- Keep keywords only for the internal job search; trim + cap length.
  v_keyword := NULL;
  IF v_source = 'search' AND btrim(coalesce(p_search_keyword, '')) <> '' THEN
    v_keyword := left(btrim(p_search_keyword), 120);
  END IF;

  INSERT INTO public.job_analytics (job_id, views_total)
    VALUES (p_job_id, 1)
    ON CONFLICT (job_id) DO UPDATE
      SET views_total = public.job_analytics.views_total + 1,
          updated_at  = NOW();

  INSERT INTO public.job_view_event (job_id, source, search_keyword, viewer_id)
    VALUES (p_job_id, v_source, v_keyword, (select auth.uid()));
END;
$$;

GRANT EXECUTE ON FUNCTION track_job_view(UUID, TEXT, TEXT) TO anon, authenticated;
