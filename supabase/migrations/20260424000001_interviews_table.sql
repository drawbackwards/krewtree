create table if not exists interviews (
  interview_id    uuid        primary key default gen_random_uuid(),
  applicant_id    uuid        references applications(id) on delete cascade,
  job_id          uuid        references jobs(id) on delete cascade,
  scheduled_at    timestamptz not null,
  duration_minutes integer    not null default 30,
  status          text        not null default 'scheduled'
                              check (status in ('scheduled', 'completed', 'no_show', 'cancelled')),
  location_or_link text,
  created_at      timestamptz not null default now()
);

alter table interviews enable row level security;

create policy "Company can manage their own interviews"
  on interviews for all
  using (
    job_id in (
      select id from jobs where company_id = auth.uid()
    )
  );
