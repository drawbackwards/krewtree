-- ============================================================
-- KREWTREE — align the needs-attention digest copy with its generator
-- The daily needs-attention digest now counts flagged applicants only (the
-- separate "stalled" event was removed in 20260722000004), so drop "stalled"
-- from the catalog description.
-- ============================================================
UPDATE public.notification_type
   SET description = 'A daily digest of flagged applicants that need attention.'
 WHERE key = 'company.pipeline.needs_attention_digest';
