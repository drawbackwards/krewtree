-- ============================================================
-- KREWTREE — Saved job templates
-- A company can save a job posting's field values as a reusable
-- template and start a new post from one. Templates are scoped to
-- the company (company_profiles.id = auth.uid()), so they are shared
-- across the company account and future-proof if multi-seat is added.
-- The full posting form is stored as jsonb so the template survives
-- as the form grows.
-- ============================================================

create table if not exists job_templates (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references company_profiles(id) on delete cascade,
  name        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- company_id is the RLS filter column — index it (perf convention).
create index if not exists job_templates_company_id_idx on job_templates (company_id);

alter table job_templates enable row level security;

-- Templates are private to the owning company: read is scoped (not USING(true)).
-- auth.uid() wrapped as (select auth.uid()) per the RLS perf convention.
create policy "company_read"   on job_templates for select to authenticated
  using (company_id = (select auth.uid()));
create policy "company_insert" on job_templates for insert to authenticated
  with check (company_id = (select auth.uid()));
create policy "company_update" on job_templates for update to authenticated
  using (company_id = (select auth.uid())) with check (company_id = (select auth.uid()));
create policy "company_delete" on job_templates for delete to authenticated
  using (company_id = (select auth.uid()));
