# Company Dashboard — Feature Design

**Date:** 2026-04-20
**Status:** Design, pending plan
**Scope:** Comprehensive feature definition for the krewtree company dashboard. Maps every feature the dashboard will eventually have, grouped by launch phase, with enough detail to prioritize and later expand each into its own implementation plan. Applicant management gets deeper treatment because it requires a full redesign.

---

## 1. Framing

### 1.1 Goals

- Give companies a single, fast workflow to **find, evaluate, and hire workers** from krewtree's pool.
- Make **Regulix Ready** the visible, weighted signal that sorts applicants and builds recruiter trust.
- Keep the dashboard's scope **pre-hire only** — anything post-hire lives in Regulix.
- Ship a dashboard that holds up at **10–80 applicants per job** (the volume trade-hiring companies actually see) without redesign.

### 1.2 Non-goals

- **Post-hire operations.** No time tracking, timesheets, hours, payroll, or project management — these are Regulix.
- **Personal data (PII).** krewtree never reads, shows, or stores SSNs, bank accounts, I-9 documents, or W-4 data. Regulix keeps all PII contained.
- **Messaging.** Out of scope; will have its own spec.
- **Cross-product UX.** No "switch to Regulix" button, no deep-linking into Regulix internal views.

### 1.3 Primary user

SMB trades recruiter / hiring manager. Typically handles 1–5 active jobs at a time, 10–80 applicants each. Reviews on a phone or laptop between other work. Values speed over polish.

### 1.4 Ecosystem & data boundary

```
┌──────────────────────┐          ┌──────────────────────┐
│     krewtree         │          │      Regulix         │
│   (job board /       │ ──hire──▶│  (onboarding + work  │
│    acquisition)      │          │   management)        │
│                      │◀─status──│                      │
│  · Job posts         │   signals│  · W-4 / I-9 / DD    │
│  · Worker profiles   │          │  · Drug screening    │
│  · Applicants        │◀──endor- │  · Time tracking     │
│  · Hire decision     │  sements │  · Project mgmt      │
│                      │          │  · Payroll           │
└──────────────────────┘          └──────────────────────┘
```

**What krewtree reads from Regulix:** Regulix Ready status, onboarded status, immediate-hire status, verified work history, endorsements, past-hires list.

**What krewtree writes to Regulix:** hire handoff event, company account link, "invite worker to apply" notification.

**What krewtree never sees:** PII, timesheets, hours, payroll, active contracts, compliance documents.

---

## 2. Information architecture

### 2.1 Routes

| Route                                   | Page                              | Status   |
| --------------------------------------- | --------------------------------- | -------- |
| `/site/dashboard/company`               | Overview dashboard                | Built    |
| `/site/dashboard/jobs`                  | Job posts list                    | Built    |
| `/site/dashboard/applicants`            | Applicant management (redesigned) | Redesign |
| `/site/dashboard/applicants/:jobId`     | Applicants filtered to one job    | New      |
| `/site/dashboard/talent-pool`           | Cross-job talent pool             | New      |
| `/site/messages`                        | Messages (separate spec)          | Stub     |
| `/site/dashboard/company-profile/edit`  | Company profile editor            | New      |
| `/site/post-job` · `/site/post-job/:id` | Post / edit job                   | Built    |

### 2.2 Navigation

Top-level nav: **Overview · Jobs · Applicants · Talent Pool · Messages · Company Profile**. The sidebar's current Quick Actions + Regulix Ready callout remain.

**Messages** appears in the nav as a top-level destination even though the messaging feature lives in its own spec. The nav entry is added as part of this dashboard work; the page content is owned by the separate messaging spec.

---

## 3. Pre-launch features (detailed)

### 3.1 Overview dashboard (built — minor enhancements)

Four stat cards, active-jobs module, recent-applicants widget, company sidebar. No structural changes.

**Enhancements when Regulix API lands:**

- Replace "Pending Interviews" with "Completed Onboarding (this week)" once Regulix exposes onboarding status.
- Recent applicants widget surfaces the new rank score (§3.4).

### 3.2 Job management (built — minor enhancements)

List of company jobs with boost, pause, close, duplicate, edit. No structural changes.

**Enhancements:**

- Applicant count column splits into `total · top-ranked` using the rank score.
- Row action "View top applicants" jumps to `/dashboard/applicants/:jobId` with rank sort.

### 3.3 Applicant management — redesign (new)

**Problem today:** A filterable table with a profile slideover. It works for small volume but breaks the "80 applicants, no way to sort" workflow that recruiter research identified as the #1 pain point.

**Solution: split list-detail layout (Gmail / Linear / Superhuman).**

#### Layout

```
┌───────────────┬─────────────────────────────────────────────┐
│ Filters bar   │ Profile detail                              │
│ (job, stage,  │ ┌─────────────────────────────────────────┐ │
│  regulix-only,│ │ Maria Sanchez    [Shortlist][Advance]   │ │
│  search)      │ │ Applied to Carpenter II · 2d ago        │ │
├───────────────┤ │                                         │ │
│ Ranked list   │ │ Rank 98 (94% match · Regulix Ready ·    │ │
│               │ │   3 endorsements · applied 2d ago)      │ │
│ ▶ Maria · 98  │ │                                         │ │
│   James · 81  │ │ Skills · resume · endorsements · notes  │ │
│   Priya · 64  │ │                                         │ │
│   Alex  · 52  │ └─────────────────────────────────────────┘ │
└───────────────┴─────────────────────────────────────────────┘
```

#### Interactions

- **Keyboard navigation:** `j` / `k` to move through the list. `Enter` opens (auto-opens on selection anyway). `S` to shortlist, `R` to reject, `⌘↵` to advance stage.
- **Filters bar** (top): job selector, stage, Regulix-only toggle, search, date range. Persist in URL query params so views are shareable.
- **Bulk selection** still available via checkbox column in the list pane (for bulk advance / reject). Bulk actions appear in a floating action bar when any row is checked.
- **Empty state** (no applicants): message + link to post a job.

#### Per-job vs cross-job

- `/site/dashboard/applicants` — all applicants across all jobs.
- `/site/dashboard/applicants/:jobId` — same layout, pre-filtered to one job. Job selector in filter bar shows the current job.

#### Stages (keep existing model)

`new · reviewed · interview · offer · hired · rejected`. Marking an applicant hired changes only the pipeline stage — it is not tied to any HR software integration. The separate "Start Regulix onboarding" action (visible only when the company has linked Regulix) calls `submitHireHandoff` and is the actual handoff trigger. Future HR integrations (ADP, Gusto, BambooHR) can slot in as additional conditional actions. See [applicant management redesign spec](./2026-04-20-applicant-management-redesign-design.md) for full detail. `KanbanBoard` component is retained and becomes an optional **view toggle** in the list pane (for recruiters who prefer the visual pipeline for a small active set) but is **not** the primary view.

#### What the detail panel shows

- Header: name, job applied to, date, status badges (Regulix Ready / Onboarded / Immediate Hire).
- Action row: Shortlist · Advance · Reject · Hire · Save to talent pool · Start Regulix onboarding (conditional on company Regulix link).
- **Rank breakdown** — component scores with weights (40/30/20/10) so the recruiter knows why this rank.
- Skills, resume preview, endorsements from Regulix (stubbed until API exists), past work history summary (no PII).
- Notes (internal, company-scoped).
- Activity log (stage changes, notes, who did what).

### 3.4 Auto-ranking score (new)

**Formula.** Weighted blend of four signals; output is 0–100 integer.

| Signal                | Weight | Source                                                                    |
| --------------------- | ------ | ------------------------------------------------------------------------- |
| Skill / keyword match | 40%    | Job requirements × worker profile skills (computed in `applicantService`) |
| Regulix Ready status  | 30%    | Regulix API (0 or 100; binary)                                            |
| Endorsements          | 20%    | Regulix API (0-capped count, scaled)                                      |
| Recency               | 10%    | Application timestamp (decay over 14 days)                                |

#### V1 behavior

- Fixed weights; no per-company tuning.
- Recomputed on list fetch (cheap — no persistence yet). Consider caching to `applicant_rank_snapshot` only if the query becomes slow.
- Breakdown surfaced in the detail panel so recruiters can see the components and trust the score.

#### V2 roadmap

- Per-company weight tuning (e.g., construction company weights Regulix Ready 50%, software company weights match 60%).
- Explainability: "Why is this applicant ranked high?" with natural-language breakdown.

### 3.5 Talent pool (new)

**Route:** `/site/dashboard/talent-pool`.

**Purpose:** A single cross-job page for "workers I already know are good." Enables the highest-value competitive move in trade hiring — invite a past worker to apply to a new job post without waiting for them to discover it.

#### Layout

Top tabs (counts per tab):

- **All** — everything below, combined, sortable.
- **Saved** — manually bookmarked by the company during application review.
- **Past applicants** — applied to any of this company's jobs in the past, not hired.
- **Past hires** — hired via krewtree, sourced from Regulix API (stubbed in v1).

Below tabs: worker cards (grid) with name, role applied for, source tag, Regulix Ready badge, last interaction date. Actions per card: **View profile · Invite to apply**.

#### Invite to apply (dual channel)

Click → modal → choose which of this company's active jobs → send notification.

The service checks the worker's Regulix identity and routes the invite accordingly (resolved in §6.2):

- **Worker has Regulix account** → invite delivered through Regulix (`inviteWorker` in `regulixService`). Worker sees it in their Regulix dashboard.
- **Worker is krewtree-only** → invite delivered via krewtree: email + in-app notification when the worker next logs in.

Either path creates a row in `talent_pool_invitations` (shared table, with a `channel` column recording which path was used). The modal confirmation surfaces the channel so the recruiter knows how the worker will receive it.

#### Data model

New table `company_favorites`:

- `company_id`, `worker_id`, `saved_at`, `source` (enum: `manual` · `past_applicant` · `past_hire`), `notes`
- Unique on `(company_id, worker_id)`

Past hires tab queries the Regulix API; stub returns mock data for v1.

### 3.6 Company profile editor (new, MVP — fast-follow, not this sprint)

> **Sprint scope note:** This feature is defined here for completeness but is **not part of the current dashboard sprint**. It ships as a fast-follow immediately after the dashboard sprint. Sections 3.1–3.5 and 3.7 are the sprint scope.

**Route:** `/site/dashboard/company-profile/edit`.

**V1 fields** (match what `/site/company/:id` public view already renders):

- Logo upload
- Cover image upload
- Company name
- One-paragraph description (textarea, ~500 char)
- Industry (select)
- Size (select)
- Website URL
- Primary location (city, state)

Matches the polish of the worker profile editor (single-page form, save button, localStorage draft). No steps.

**Data model.** Promote company fields from `user_metadata` to a new dedicated `company_profiles` table (resolved in §6.2). Schema designed with nullable columns for v2 rich-editor fields (§4.4) so adding them later doesn't require a migration.

### 3.7 Regulix integration architecture (new)

All Regulix reads and writes go through a single service file: `src/site/services/regulixService.ts`. Each function returns `{ data, error }`. v1 returns mock data; v2 swaps in real API calls with no UI changes.

#### Interfaces to define in v1

```ts
// Status signals — read
getRegulixStatus(workerId: string): { data: RegulixStatus | null, error }
// RegulixStatus = { ready: boolean, onboarded: boolean, immediateHire: boolean }

getEndorsements(workerId: string): { data: Endorsement[], error }
// Endorsement = { id, fromCompany, role, rating, quote, date }

getVerifiedWorkHistory(workerId: string): { data: WorkHistoryEntry[], error }
// WorkHistoryEntry = { company (anonymized allowed), role, startDate, endDate, verified: true }

getPastHires(companyId: string): { data: PastHire[], error }
// PastHire = { workerId, lastHiredAt, jobTitle, rehireable: boolean }

hasRegulixAccount(workerId: string): { data: boolean, error }
// Used by the dual-channel "invite to apply" flow (§3.5) to decide
// whether to route via Regulix or fall back to krewtree email.

// Actions — write
submitHireHandoff(params: {
  companyId, workerId, jobId, hireDate, payRate
}): { data: { regulixHireId }, error }
// Invoked by the dedicated "Start Regulix onboarding" action in the
// applicant detail panel, NOT by the `hired` pipeline transition.
// Pipeline stages remain HR-integration-agnostic.

linkCompanyAccount(companyId: string, regulixCompanyId: string): { data, error }

inviteWorker(params: {
  companyId, workerId, jobId
}): { data, error }
```

#### What krewtree never calls

No timesheet endpoints, no hours endpoints, no payroll endpoints, no document retrieval, no PII endpoints. These don't belong in the service at all — enforcing the boundary at the code level.

#### V1 stub behavior

Mock data mirrors current fixtures in `src/site/data/mock.ts`. The three Regulix status flags all derive from the existing `isRegulixReady` flag plus mock variations.

---

## 4. Post-launch roadmap

Full features deferred until after initial launch. Each will get its own design doc when prioritized.

### 4.1 Analytics

Dedicated page `/site/dashboard/analytics`. Funnel visualization (views → applies → shortlisted → hired), time-to-hire by job, applicant source breakdown (organic vs. boosted vs. talent-pool invite), job performance comparison. Read-only in v1.

### 4.2 Worker reviews

Company can leave a review on a hired worker post-contract. Feeds into Regulix reputation system (writes to Regulix, not stored in krewtree). Prompts appear in the applicant detail view for `hired` applicants after a configurable delay.

### 4.3 Boost management dashboard

Dedicated view replacing the current modal-only UX. Active boosts, history, total spend, auto-renew toggle, performance of boosted jobs vs. non-boosted. Payment method management lives here too.

### 4.4 Company profile — rich editor

Extends §3.6 with:

- Benefits list (structured, with icons)
- Photo gallery (up to 10 photos)
- Team members section (photos, names, roles, bios)
- Testimonials from past hires — pulled from Regulix reviews when available
- Custom "What it's like to work here" section (markdown or rich text)

Schema designed in §3.6 to accommodate these as optional columns.

---

## 5. Deferred (enterprise)

### 5.1 Multi-seat team accounts

Invite teammates (hiring managers, admins), role-based permissions, activity log scoped to actor. Needs significant auth rework — deferred until enterprise demand signals the investment.

### 5.2 Calendar / interview scheduling

Google / Outlook calendar integration, booking links, availability windows. Tier 4 feature.

### 5.3 Messaging

Feature implementation is **out of scope** for this doc — will have its own spec. However, **the `/site/messages` nav entry is added as part of this dashboard work** (§2.2) so the nav structure is complete by the end of this sprint.

---

## 6. Appendices

### 6.1 Data model additions

| Table                                | Purpose                                       | Notes                                                                                                       |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `company_favorites`                  | Talent pool saves (manual + derived)          | `(company_id, worker_id, saved_at, source, notes)`                                                          |
| `talent_pool_invitations`            | Invite-to-apply tracking                      | `(id, company_id, worker_id, job_id, invited_at, status, channel)` where `channel` ∈ `regulix` · `krewtree` |
| `applicant_rank_snapshot` (optional) | Cached rank scores                            | Only if recompute-on-fetch becomes slow                                                                     |
| `company_profiles` (new)             | Editor fields (promoted from `user_metadata`) | Nullable columns for v2 rich editor; landed in fast-follow sprint                                           |

All tables get RLS policies consistent with existing patterns.

### 6.2 Resolved decisions

- **Account linking flow → explicit.** Companies complete a one-time linking flow to connect their krewtree account to their Regulix account. Not automatic, not inferred from email domain. UX for the linking flow itself is out of scope for this doc — lives in the Regulix integration sprint.
- **"Invite to apply" delivery → dual channel.** Not every applicant will have a Regulix identity. The invite flow checks the worker's Regulix status and routes accordingly:
  - Worker has Regulix account → notification delivered through Regulix (via `inviteWorker` in `regulixService`).
  - Worker does not have Regulix account → notification delivered via krewtree (email + in-app notification when the worker next logs in).
  - The UI shows the recruiter which channel the invite went through.
- **Company profile data location → dedicated `company_profiles` table.** Promote from `user_metadata` for extensibility. Schema designed with nullable columns to accommodate the v2 rich editor fields (§4.4) without future migrations. Migration handled as part of the fast-follow company profile sprint (§3.6).

### 6.3 Still-open questions

- **Regulix API shape.** This doc assumes the interface in §3.7. Must be validated against Regulix team's actual API design before swap-in.
- **Rank score tuning.** V1 uses fixed weights 40/30/20/10. Gather real-world feedback from first 10 customers before deciding whether per-company tuning is needed.

### 6.4 Implementation order (suggested)

**Dashboard sprint (this scope):**

1. Regulix service stubs (unblocks everything else).
2. Ranking score (small, self-contained).
3. Applicant management redesign (biggest pre-launch surface).
4. Talent pool.
5. Overview and job management enhancements.
6. Top-level `/site/messages` nav entry (page body owned by the messaging spec).

**Fast follow (immediately after the dashboard sprint):**

7. Company profile editor (§3.6) + `company_profiles` table migration.

Each step becomes its own plan via `writing-plans`.
