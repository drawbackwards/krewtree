-- ─── My Krew: auto-add on hire ─────────────────────────────────────────────
-- When an application flips to terminal_hired, the hired worker joins the
-- company's Krew. Upsert is idempotent: re-hires after a removal flip
-- in_krew back on and clear removed_at; original source is preserved so
-- referral/marketplace attribution survives a hire round-trip.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_add_to_krew_on_hire()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Only fire on transitions *into* terminal_hired. Repeated updates that
  -- leave the status at terminal_hired are no-ops at this layer, and the
  -- upsert below would be a no-op anyway.
  IF NEW.status = 'terminal_hired'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'terminal_hired') THEN
    SELECT company_id INTO v_company_id FROM public.jobs WHERE id = NEW.job_id;
    IF v_company_id IS NOT NULL THEN
      INSERT INTO public.krew_relationships
        (company_id, worker_id, in_krew, source, removed_at)
      VALUES
        (v_company_id, NEW.worker_id, TRUE, 'past_hire', NULL)
      ON CONFLICT (company_id, worker_id) DO UPDATE
        SET in_krew = TRUE,
            removed_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS applications_auto_add_to_krew_on_hire ON public.applications;
CREATE TRIGGER applications_auto_add_to_krew_on_hire
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_to_krew_on_hire();
