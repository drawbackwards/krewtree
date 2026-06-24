-- ============================================================
-- KREWTREE — Draft job posts
-- A company can save an in-progress posting as a draft before
-- publishing. Drafts use status = 'draft'; the public board
-- (search_jobs) pins status = 'active', so drafts never surface to
-- workers, and the jobs RLS already lets a company read its own
-- non-active rows (company_id = auth.uid()).
-- ============================================================

alter table jobs drop constraint if exists jobs_status_check;
alter table jobs add constraint jobs_status_check
  check (status in ('active', 'paused', 'closed', 'scheduled', 'draft'));
