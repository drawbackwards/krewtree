/* ============================================================
   KREWTREE — Reusable message templates
   A company saves named, reusable message bodies that can be inserted
   in the message composers and attached to pipeline task templates.
   Scoped to the company (company_profiles.id = auth.uid()), shared
   across the account and future-proof for multi-seat, mirroring
   job_templates. Any links (calendar, etc.) live inline in the body.
   ============================================================ */

create table if not exists message_templates (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references company_profiles(id) on delete cascade,
  name          text not null,
  body          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

/* company_id is the RLS filter column — index it (perf convention). */
create index if not exists message_templates_company_id_idx on message_templates (company_id);

alter table message_templates enable row level security;

/* Private to the owning company. auth.uid() wrapped as (select auth.uid()). */
create policy "company_read"   on message_templates for select to authenticated
  using (company_id = (select auth.uid()));
create policy "company_insert" on message_templates for insert to authenticated
  with check (company_id = (select auth.uid()));
create policy "company_update" on message_templates for update to authenticated
  using (company_id = (select auth.uid())) with check (company_id = (select auth.uid()));
create policy "company_delete" on message_templates for delete to authenticated
  using (company_id = (select auth.uid()));

/* ------------------------------------------------------------
   Pipeline task templates can reference a message template. At
   stage-instantiation time the referenced template's name/body/
   calendar_link are snapshotted into the application_task, feeding
   the existing send + auto-send machinery. ON DELETE SET NULL so
   deleting a message template just detaches it from the task.
   ------------------------------------------------------------ */
alter table pipeline_stage_task_template
  add column if not exists message_template_id uuid
    references message_templates(id) on delete set null;

create index if not exists pstt_message_template_id_idx
  on pipeline_stage_task_template (message_template_id);
