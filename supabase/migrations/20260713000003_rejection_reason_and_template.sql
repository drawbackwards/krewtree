/* ============================================================
   KREWTREE — Rejection reason + default rejection template

   Two related additions to the reject flow:

   1. Rejection reason — an INTERNAL, company-only note captured when
      rejecting an applicant. It is written to `application_log` at reject
      time (see applicantService.rejectApplicant), which is already RLS-scoped
      to the owning company, so the worker never sees it. No schema change is
      needed here — this migration only handles the template below.

   2. A default "Rejection notification" message template. It is an ordinary
      message template (behaves like any other): editable in Org Settings,
      insertable in the composer. This migration seeds one for every existing
      company and installs a trigger so new companies get one on signup.

   NOTE: an earlier iteration of this migration (applied only to the shared
   dev database) added an `applications.rejection_reason` column and a
   `message_templates.kind` column. Those were dropped in favor of the
   application_log approach above; the guarded statements below clean them up
   on any environment that ran that iteration. They are no-ops on a fresh DB.
   ============================================================ */

-- ── Cleanup of the earlier dev-only iteration ───────────────────────────
alter table applications        drop column if exists rejection_reason;
drop index if exists message_templates_one_rejection_per_company;
alter table message_templates   drop constraint if exists message_templates_kind_check;
alter table message_templates   drop column if exists kind;

-- ── Default rejection template body (shared by backfill + trigger) ───────
create or replace function default_rejection_template_body()
returns text
language sql immutable
as $$
  select $body$Thank you for taking the time to apply and for your interest in this role.

After careful consideration, we have decided to move forward with other candidates at this time. This was a difficult decision and is not a reflection of your experience or effort.

We would genuinely welcome a future application from you and wish you the very best in your search.$body$;
$$;

-- ── Backfill: one per existing company that doesn't already have one ─────
insert into message_templates (company_id, name, body)
select cp.id, 'Rejection notification', default_rejection_template_body()
from company_profiles cp
where not exists (
  select 1 from message_templates mt
  where mt.company_id = cp.id
    and mt.name = 'Rejection notification'
);

-- ── Trigger: seed the default template for every new company ────────────
create or replace function seed_default_message_templates()
returns trigger
language plpgsql security definer
as $$
begin
  insert into message_templates (company_id, name, body)
  select NEW.id, 'Rejection notification', default_rejection_template_body()
  where not exists (
    select 1 from message_templates mt
    where mt.company_id = NEW.id
      and mt.name = 'Rejection notification'
  );
  return NEW;
end;
$$;

drop trigger if exists auto_seed_message_templates on company_profiles;
create trigger auto_seed_message_templates
  after insert on company_profiles
  for each row execute function seed_default_message_templates();
