/* ============================================================
   KREWTREE — Reserved "rejection" kind on message templates

   The "Rejection notification" template is now a RESERVED template linked to
   the applicant reject modal: the reject flow sends its body (opt-in, via a
   checkbox), its title is not editable, and it can't be deleted. To identify
   it reliably (independent of its display name), tag it with kind = 'rejection'.
   It still behaves like a normal template otherwise (listed under Message
   templates, body editable, insertable in composers).
   ============================================================ */

alter table message_templates
  add column if not exists kind text not null default 'custom';

alter table message_templates
  drop constraint if exists message_templates_kind_check;
alter table message_templates
  add constraint message_templates_kind_check check (kind in ('custom', 'rejection'));

-- Tag the templates seeded by 20260713000003 (one per company, by name).
update message_templates
  set kind = 'rejection'
  where name = 'Rejection notification' and kind <> 'rejection';

-- At most one rejection template per company.
create unique index if not exists message_templates_one_rejection_per_company
  on message_templates (company_id)
  where kind = 'rejection';

-- Seed trigger tags the reserved template so new companies get it too.
create or replace function seed_default_message_templates()
returns trigger
language plpgsql security definer
as $$
begin
  insert into message_templates (company_id, name, body, kind)
  select NEW.id, 'Rejection notification', default_rejection_template_body(), 'rejection'
  where not exists (
    select 1 from message_templates mt
    where mt.company_id = NEW.id
      and mt.kind = 'rejection'
  );
  return NEW;
end;
$$;
