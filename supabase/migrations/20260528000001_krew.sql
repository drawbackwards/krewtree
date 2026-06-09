-- ─── My Krew: relationships, lists, memberships ────────────────────────────
-- A company curates workers into "My Krew." Relationships persist (soft-delete
-- via the in_krew flag) so source + history survive a remove/re-add. Lists are
-- first-class objects (renamable, deletable) with many-to-many memberships.
-- ────────────────────────────────────────────────────────────────────────────

-- One row per (company, worker). in_krew flips on/off via add/remove; the row
-- itself sticks around so source + added_at + removed_at history are retained.
CREATE TABLE IF NOT EXISTS public.krew_relationships (
  company_id          UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  worker_id           UUID NOT NULL REFERENCES public.worker_profiles(id)  ON DELETE CASCADE,
  in_krew             BOOLEAN NOT NULL DEFAULT TRUE,
  source              TEXT NOT NULL DEFAULT 'manual_add'
    CHECK (source IN ('past_hire', 'inbound_application', 'referral', 'marketplace', 'manual_add')),
  last_interaction_at TIMESTAMPTZ,
  added_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at          TIMESTAMPTZ,
  PRIMARY KEY (company_id, worker_id)
);

-- Hot path: list a company's active krew. Partial index keeps it tight.
CREATE INDEX IF NOT EXISTS krew_relationships_company_in_krew_idx
  ON public.krew_relationships(company_id)
  WHERE in_krew = TRUE;

CREATE INDEX IF NOT EXISTS krew_relationships_worker_idx
  ON public.krew_relationships(worker_id);

-- Company-owned named lists ("Top Performers", "Electricians", etc.)
CREATE TABLE IF NOT EXISTS public.krew_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS krew_lists_company_idx ON public.krew_lists(company_id);

-- Reuse the shared trigger from 20260324000003_functions.sql
DROP TRIGGER IF EXISTS krew_lists_set_updated_at ON public.krew_lists;
CREATE TRIGGER krew_lists_set_updated_at
BEFORE UPDATE ON public.krew_lists
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Many-to-many: a worker can be in multiple lists.
CREATE TABLE IF NOT EXISTS public.krew_list_memberships (
  list_id   UUID NOT NULL REFERENCES public.krew_lists(id)         ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id)    ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, worker_id)
);

CREATE INDEX IF NOT EXISTS krew_list_memberships_worker_idx
  ON public.krew_list_memberships(worker_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- company_profiles.id = auth.users.id, so a company always identifies itself
-- as auth.uid(). Memberships are mediated through the parent list.

ALTER TABLE public.krew_relationships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.krew_lists            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.krew_list_memberships ENABLE ROW LEVEL SECURITY;

-- krew_relationships: a company can only see + manage its own
DROP POLICY IF EXISTS krew_rel_company_select ON public.krew_relationships;
CREATE POLICY krew_rel_company_select ON public.krew_relationships
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS krew_rel_company_insert ON public.krew_relationships;
CREATE POLICY krew_rel_company_insert ON public.krew_relationships
  FOR INSERT WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS krew_rel_company_update ON public.krew_relationships;
CREATE POLICY krew_rel_company_update ON public.krew_relationships
  FOR UPDATE USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS krew_rel_company_delete ON public.krew_relationships;
CREATE POLICY krew_rel_company_delete ON public.krew_relationships
  FOR DELETE USING (company_id = auth.uid());

-- krew_lists: same pattern
DROP POLICY IF EXISTS krew_lists_company_select ON public.krew_lists;
CREATE POLICY krew_lists_company_select ON public.krew_lists
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS krew_lists_company_insert ON public.krew_lists;
CREATE POLICY krew_lists_company_insert ON public.krew_lists
  FOR INSERT WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS krew_lists_company_update ON public.krew_lists;
CREATE POLICY krew_lists_company_update ON public.krew_lists
  FOR UPDATE USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS krew_lists_company_delete ON public.krew_lists;
CREATE POLICY krew_lists_company_delete ON public.krew_lists
  FOR DELETE USING (company_id = auth.uid());

-- krew_list_memberships: access mediated by the parent list's company
DROP POLICY IF EXISTS krew_mem_company_select ON public.krew_list_memberships;
CREATE POLICY krew_mem_company_select ON public.krew_list_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.krew_lists l
      WHERE l.id = list_id AND l.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS krew_mem_company_insert ON public.krew_list_memberships;
CREATE POLICY krew_mem_company_insert ON public.krew_list_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.krew_lists l
      WHERE l.id = list_id AND l.company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS krew_mem_company_delete ON public.krew_list_memberships;
CREATE POLICY krew_mem_company_delete ON public.krew_list_memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.krew_lists l
      WHERE l.id = list_id AND l.company_id = auth.uid()
    )
  );
