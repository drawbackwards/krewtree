-- ============================================================
-- Let applied-to companies read an applicant's resume metadata.
--
-- worker_resumes had a single owner-only policy (own_all,
-- worker_id = auth.uid()), so a company could never read the file_path of an
-- applicant's resume. That made the storage-level resume_company_read policy
-- (added in 20260626000002) unreachable in practice: a company could be
-- allowed to fetch the file but had no way to discover its path.
--
-- This adds a read-only policy mirroring the same applied-to gate used for
-- worker_references and the resume storage object: a company may read a
-- worker_resumes row only when that worker has applied to it. The owner's
-- full access stays via own_all; policies are OR'd, so the owner is unaffected.
-- ============================================================

CREATE POLICY "company_applied_read" ON worker_resumes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.worker_id = worker_resumes.worker_id
        AND a.company_id = (SELECT auth.uid())
    )
  );
