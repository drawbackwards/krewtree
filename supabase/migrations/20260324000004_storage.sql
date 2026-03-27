-- ── Storage buckets ───────────────────────────────────────────────────────────
-- Creates the resumes bucket (public so getPublicUrl works without signed URLs).
-- The avatars bucket is created separately / already exists.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  TRUE,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: workers can upload/replace their own resumes; anyone authenticated can read.
CREATE POLICY "resume_owner_write" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resume_public_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes');
