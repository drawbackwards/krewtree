-- ============================================================
-- KREWTREE — Normalize legacy company_profiles.size values
-- The old company signup wrote '1-9' / '10-50' / '51-200' / '201+'.
-- The new About-section dropdown uses '1-10' / '11-50' / '51-200' /
-- '201-500' / '500+'. Remap so existing rows match the new options.
-- ============================================================

UPDATE company_profiles SET size = '1-10'    WHERE size = '1-9';
UPDATE company_profiles SET size = '11-50'   WHERE size = '10-50';
UPDATE company_profiles SET size = '201-500' WHERE size = '201+';
