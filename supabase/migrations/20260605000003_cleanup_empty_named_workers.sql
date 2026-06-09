-- One-off cleanup: remove seed/test worker_profiles rows with empty names.
-- Six rows were polluting the Discover directory because their first_name
-- and last_name are blank, causing the card to fall back to displaying the
-- primary_trade tagline ("CNA · Home Health & Urgent Care", etc.).
--
-- IDs are listed explicitly so this can't catch a future real signup that
-- hasn't filled in a name yet. All FKs to worker_profiles(id) are ON DELETE
-- CASCADE so the cleanup also drops attached worker_skills, applications,
-- krew_relationships, etc. for these accounts.

DELETE FROM public.worker_profiles
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  '470ca9eb-1209-4ba0-b8ed-19798b7d226f'
);
