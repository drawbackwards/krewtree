# RLS Audit — Findings (pre-beta)

Date: 2026-08-07
Method: **Static policy analysis** of all migration source (Phase 1 + 2 of the
audit plan). Reconstructed the current effective policy set from the 35
policy-touching migrations in `supabase/migrations/` plus the multiseat RPC
layer. `npm run lint:rls` passes (no bare `auth.uid()` in policies).

**Not yet done:** Phase 4 dynamic impersonation tests against seeded dev — this
run had only the anon key (no DB password / `psql`), so live `pg_policies` and
JWT-impersonation checks are still pending. Findings below are from source and
should be confirmed dynamically, especially #1.

**Update 2026-08-07:** Finding #1 confirmed dynamically on dev; fixes #1–#3
written as migrations `20260807000001..3` (not yet applied — see "Fixes" below).

---

## Headline

Good news first: **no user-data table has RLS off** (the one exception,
`public.us_cities`, is reference data, re-enabled with a read-only public policy
in `20260609000004`). The core cross-tenant paths — applications, pipeline,
tasks, notes, messages, krew, templates, analytics, interviews — were all
correctly rewritten to `is_company_member(company_id)` in the multiseat pass
(`20260723000002`), so **company B cannot read company A's applicants, pipeline,
or messages.** Invite RPCs are properly authorized (owner/admin gate, hashed
token, email-match on accept, seat cap). Contact-field privacy (worker phone,
company address) is enforced server-side via column grants + masked views.

One genuine cross-tenant confidentiality leak stands out (#1). The rest are
intra-tenant integrity/privilege issues and one multiseat coverage gap.

---

## Findings (ranked)

### 1. HIGH — `worker_feedback` private commentary is readable by any company

**File:** `20260707000001_worker_feedback.sql:322`, unchanged by
`20260723000002_multiseat_rls.sql:928`.

The base-table SELECT policy is:

```sql
CREATE POLICY "company_read" ON worker_feedback FOR SELECT
  USING (is_any_company_member());   -- true for ANY company user
```

There is **no column-level grant** on `worker_feedback`, so `authenticated`
holds Supabase's default full-table SELECT. RLS is row-level and cannot mask a
column. Any company user can therefore call PostgREST directly:

```
GET /rest/v1/worker_feedback?select=commentary,worker_id,reviewing_company_id
```

and read **every company's private commentary about every worker**. The
migration's own header says commentary "never leaves the author" and is "gated
per-row inside the history RPC" — but that masking only happens inside
`get_worker_feedback_history()`. The raw table is still exposed, so the RPC gate
is bypassable. This is a cross-tenant confidentiality leak of exactly the kind
this audit targets.

`worker_feedback_pill` has the same `is_any_company_member()` read policy;
pills are less sensitive but still leak which negative pills a rival company
selected.

**Failure scenario:** Company B (any signed-in company seat) queries
`worker_feedback` and reads Company A's written commentary and negative pills
about a shared worker.

**Dynamically confirmed (dev, 2026-08-07):** signed in as the company test
account (`corie+drywallcompany@…`, uid `0e06967f…`) and ran
`GET worker_feedback?select=commentary,reviewing_company_id,worker_id` — 5 rows
visible, 1 authored by a different company (`b0000000-…-0001`) with its private
commentary readable in full ("Strong framer with solid output. Scheduling was
tight…"). The `get_worker_feedback_history` RPC, by contrast, correctly nulled
that same commentary. Confirms the base table bypasses the masking RPC.

**Fixed by:** `20260807000001_fix_worker_feedback_commentary_leak.sql`.

**Fix direction:** restrict base-table SELECT to the author
(`is_company_member(reviewing_company_id)`) and serve the cross-company
aggregate + history exclusively through the existing SECURITY DEFINER RPCs
(`get_worker_feedback_aggregate`, `get_worker_feedback_top_pills`,
`get_worker_feedback_history`), which already mask commentary for non-authors.
Alternative/defense-in-depth: `REVOKE SELECT (commentary) ... ` via a
column-level grant. New migration; add no index changes.

---

### 2. MEDIUM — `company_members` seat management allows ownership takeover + invite/seat-cap bypass (intra-tenant)

**File:** `20260723000001_multiseat_schema.sql:602`.

```sql
CREATE POLICY "admin_manage" ON company_members FOR ALL
  USING (company_role(company_id) IN ('owner', 'admin'))
  WITH CHECK (company_role(company_id) IN ('owner', 'admin'));
```

The `WITH CHECK` validates only the **caller's** role, never the target row's
`role` or `user_id`. Consequences within a single company:

- An **admin can demote the owner** (`UPDATE` owner's row → `role='member'`),
  then promote themselves to `owner` (the `one_owner_per_company` unique index
  only blocks a _second_ concurrent owner). Full ownership takeover.
- An admin can **directly `INSERT` any `auth.users` id as a member/admin**,
  bypassing the invite flow, the email-match check, and the `seat_cap` ceiling
  that `create_company_invite` / `accept_company_invite` enforce.

Not cross-tenant (`company_role` is scoped), so severity is MEDIUM, but it
defeats the ownership and seat-cap model.

**Fix direction:** protect the owner row from non-owner writes, forbid direct
role escalation to `owner`, and constrain direct membership `INSERT` (force it
through the invite RPCs, or WITH CHECK the target role/seat count).

---

### 3. MEDIUM — UPDATE policies without `WITH CHECK` / column scope permit row tampering (intra-tenant)

RLS can't limit which columns an UPDATE touches; a policy meant to allow only a
narrow field (`read_at`, a withdraw) actually allows rewriting the whole row.

- **`message` — `party_mark_read`** (`20260723000002_multiseat_rls.sql:997`):
  `FOR UPDATE USING (is_company_member(company_id) OR auth.uid()=worker_id)` with
  no `WITH CHECK`. Either party can rewrite `body` / `subject` / `sent_by` of
  **any message in the thread, including the other party's messages.** The
  comment says "limited to read_at at the application layer" — i.e. not enforced
  in the DB.
- **`applications` — `worker_update`** (`20260324000002_rls.sql`, untouched
  since): `FOR UPDATE USING (worker_id = auth.uid())`, no `WITH CHECK`. A worker
  can set arbitrary `status` / `current_stage_id` on their own application —
  e.g. flip `status='terminal_hired'` (which fires the "You've been hired"
  notification via `notify_on_status_change`) or re-activate a rejected
  application.

**Fix direction:** move `read_at` and status/stage mutations behind SECURITY
DEFINER RPCs that write only the intended columns, or add `BEFORE UPDATE`
triggers that reject changes to protected columns; add matching `WITH CHECK`.

---

### 4. LOW–MEDIUM — multiseat coverage gap: `worker_profiles_secure` phone reveal not converted (functional, not a leak)

**File:** `20260626000002_worker_phone_and_resume_privacy.sql:136`.

The masked view still gates the applicant-phone reveal on
`a.company_id = (SELECT auth.uid())`:

```sql
CASE WHEN id = (SELECT auth.uid())
   OR EXISTS (SELECT 1 FROM applications a
              WHERE a.worker_id = worker_profiles.id
                AND a.company_id = (SELECT auth.uid()))   -- not is_company_member
   THEN phone ELSE '' END
```

`worker_resumes` and `worker_references` _were_ converted to
`is_company_member(...)` in the multiseat pass, but this view was missed. Effect
is **under-permissive** (a non-owner teammate of an applied-to company sees
`phone=''`), so it's a functional inconsistency, not a data leak.

**Fix direction:** change the view's `EXISTS` to `is_company_member(a.company_id)`
for parity with the resume/reference policies.

---

### 5. LOW — `interviews` has no worker-side read policy (functional gap)

**File:** `20260424000001_interviews_table.sql`; only a company `FOR ALL` policy
(later scoped to `is_company_member` via jobs). A worker cannot read their own
scheduled interviews through RLS. Not a leak (default-deny); flag only if the
worker UI is meant to surface interview times from this table.

---

### 6. INFO — a few company-scoped RPCs still use `company_id = auth.uid()` (multiseat gap, no leak, out of scope for this pass)

`20260707000003_feedback_matching_bonus.sql` (`j.company_id = auth.uid()`,
`kr.company_id = auth.uid()`), and the krew/discover match helpers
(`20260605000002`, `20260624000003`) predate multiseat and were not converted
to `is_company_member(...)`. Effect is **under-permissive** for non-owner
teammates (they get no match/ranking data), not a leak. Worth a follow-up sweep
for multiseat consistency; not fixed here.

---

## Verified-OK (spot-checked, no action)

- **Cross-tenant company isolation** — applications, application*events/\_log/
  \_notes/\_task/\_task_note/\_stage_notes, message, company_pipeline,
  pipeline_stage, pipeline_stage_task_template, job/message_templates,
  job_analytics, job_view_event, interviews, krew*\* — all gate through
  `is_company_member(company_id)`. No company-B-reads-company-A path found.
- **Invite flow** — `create_company_invite` (owner/admin gate + seat cap),
  `accept_company_invite` (hashed token, pending+unexpired, **email match**,
  seat cap), `get_invite_email` (anon, but the token IS the secret). Sound.
- **Worker self-scoping** — saved_jobs, saved_searches, notifications,
  referrals, worker_preferences, worker_integrations, notification_preference,
  worker sub-tables — all owner-scoped, correct.
- **Anon exposure** — limited to reference data (industries/skills/regions/
  us_cities), active jobs, and non-deleted company public columns (contact
  fields column-revoked; masked `company_public_profiles` view). Correct.
- **Contact privacy** — worker `phone` and company `phone`/`hq_street`/
  `hq_postal_code` removed from role grants and served via masked
  security-definer views honoring the `*_public` toggles. Correct.
- **SECURITY DEFINER RPCs** — set `search_path`, authorize internally, granted to
  the intended roles. Correct.

---

## Fixes (written 2026-08-07, pending apply)

Three forward migrations, none disable RLS; verified against `npm run lint:rls`.

| Migration                                                     | Fixes | What it does                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260807000001_fix_worker_feedback_commentary_leak.sql`      | #1    | Narrows `worker_feedback`/`_pill` base SELECT to the author (`is_company_member(reviewing_company_id)`); moves the aggregate/top-pills/history read RPCs to `SECURITY DEFINER` gated by `is_any_company_member()`, preserving the cross-company signal while masking commentary per row. Also closes a latent multi-seat gap (author checks were still `= auth.uid()`). |
| `20260807000002_fix_company_members_seat_management.sql`      | #2    | Replaces the `admin_manage` FOR ALL policy with command-scoped `admin_update`/`admin_delete` that protect the owner seat and forbid promotion to `owner`; removes direct client INSERT (membership only via the DEFINER invite/signup paths).                                                                                                                           |
| `20260807000003_fix_message_and_application_update_scope.sql` | #3    | BEFORE UPDATE triggers: `message` allows only `read_at` to change; `applications` restricts worker-actor updates to withdrawal (status→`terminal_withdrawn` + notes), leaving company-member and system writes untouched.                                                                                                                                               |

**To apply** (operator step — needs the DB password, which I don't hold):

```bash
supabase db push
```

Push to **dev** first (CLI is linked to dev `ryigaxihlfqdwgjbgmcg`), re-run the
dynamic check to confirm the leak is closed, then push to prod.

**Behaviour-neutral checks done before writing:** every client direct read of
`worker_feedback` is already scoped to the caller's own `reviewing_company_id`;
`message` client writes are `read_at`-only; the sole worker `applications`
write is `withdrawApplication`; `company_members` client writes are role-change

- seat-removal only (no direct INSERT). So the tightening should not break
  existing flows.

**Not yet dynamically verified:** #2 and #3 (would need a second seat / mutating
writes against seed) and the post-fix re-run of #1 (needs the migration applied
to dev). Happy to run all three once the migration is on dev.

## Recommended next step

Run the **Phase 4 dynamic impersonation pass** against seeded dev
(`ryigaxihlfqdwgjbgmcg`) to confirm #1 empirically (query `worker_feedback` as a
second company) and to smoke-test the fixes for #1–#3. Needs the dev DB password
or a service-role script.
