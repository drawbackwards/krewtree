# Applicant Management Redesign — Design

**Date:** 2026-04-20
**Status:** Design, pending plan
**Scope:** Implementation-ready design for the redesigned applicant management surface at `/site/dashboard/applicants` and `/site/dashboard/applicants/:jobId`. Replaces the current `AllApplicantsPage` table + `ApplicantSlideover` modal with a split list-detail layout, auto-ranked list, keyboard-first interactions, and responsive collapse on narrow screens.

**Parent spec:** [2026-04-20-company-dashboard-design.md](./2026-04-20-company-dashboard-design.md) §3.3 and §3.4. Decisions from that spec are inherited. This spec fills in details.

---

## 1. Framing

### 1.1 Goals

- Give a recruiter reviewing 10–80+ applicants a fast, keyboard-first path to triage, review, and decide.
- Surface the auto-ranking score (and its breakdown) transparently so recruiters trust why someone ranks high.
- Respect the Regulix boundary: consume Regulix status and endorsements via `regulixService`, but never tie the pipeline stages to Regulix — companies without Regulix must be first-class.
- Ship as a single cohesive redesign; the current table is replaced, not evolved.

### 1.2 Non-goals

- **Messaging** — separate spec. An action button opens the messages surface; no UI lives here.
- **Talent pool page** — separate spec (§3.5 of parent). A "Save to talent pool" action exists here; the pool page itself does not.
- **Kanban pipeline** — a view-toggle button is stubbed in the UI but the kanban implementation is deferred to a later plan. The existing `KanbanBoard` component is left untouched.
- **Activity log history** — no persistence of per-event history in v1. A compact status row shows current stage + last updated; full audit trail is deferred.
- **Company profile / multi-seat / calendar** — all out of scope.

### 1.3 Primary user

SMB trades recruiter reviewing applicants across 1–5 active jobs, typically 10–80 per job. Wants: ranked list, fast keyboard decisions, enough profile context to advance/reject without opening external tabs.

### 1.4 Relationship to Regulix

- **Status signals** (Regulix Ready / Onboarded / Immediate Hire) appear as badges on the applicant row and in the detail header.
- **Endorsements and verified work history** appear in the detail panel when the applicant has them; the sections degrade gracefully when they don't.
- **Onboarding handoff** is a dedicated button ("Start Regulix onboarding"), visible only when the viewing company has linked their Regulix account. **It is NOT coupled to the `hired` stage** — marking an applicant hired only changes the pipeline stage. This decoupling supports companies that don't use Regulix.

---

## 2. Layout & information architecture

### 2.1 Routes

| Route                               | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `/site/dashboard/applicants`        | Cross-job applicant view for the logged-in company |
| `/site/dashboard/applicants/:jobId` | Same UI, pre-filtered to one job                   |

Both routes render the same `ApplicantManagementPage` component; the param is read as an implicit `jobId` filter.

### 2.2 Desktop layout (≥ 1280px)

```
┌──────────────────────────────────────────────────────────────────┐
│  [breadcrumb · Back to dashboard]                                │
│  Applicants                      [Kanban toggle]  [? help]       │
│  ─────────────────────────────────────────────────────────────── │
│  [Search] [Job ▾] [Stage ▾] [☑ Regulix only] [from → to] [clear] │
│  ─────────────────────────────────────────────────────────────── │
│  ┌──────────────────────┬─────────────────────────────────────┐  │
│  │ 27 ranked applicants │ Maria Sanchez              [Close]  │  │
│  │                      │ Framing Carpenter · Applied 2d ago  │  │
│  │ ▸ Maria · 98         │                                     │  │
│  │   James · 81         │ [Shortlist] [Advance] [Reject]      │  │
│  │   Priya · 64         │ [Hire] [Save to talent pool]        │  │
│  │   Alex  · 52         │ [Start Regulix onboarding]          │  │
│  │   ...                │                                     │  │
│  │                      │ Rank 98 · breakdown                 │  │
│  │                      │ Regulix status · endorsements       │  │
│  │                      │ Work history · skills · resume      │  │
│  │                      │ Notes · status row                  │  │
│  └──────────────────────┴─────────────────────────────────────┘  │
│  [bulk action bar appears when any row is selected]              │
└──────────────────────────────────────────────────────────────────┘
```

Grid: list pane `400px` fixed, detail pane `1fr` with `min-width: 0`. List pane is sticky-scrollable; detail pane is scrollable within itself. Outer page never scrolls horizontally.

### 2.3 URL-param contract

Filters and selection persist in the URL so views are shareable and browser back works naturally.

| Param      | Meaning                                  | Values                                                        |
| ---------- | ---------------------------------------- | ------------------------------------------------------------- |
| `q`        | search text                              | string (URL-encoded)                                          |
| `stage`    | stage filter                             | `new · reviewed · interview · offer · hired · rejected · all` |
| `job`      | job filter (redundant on `:jobId` route) | job id or `all`                                               |
| `regulix`  | Regulix-ready filter                     | `1` or absent                                                 |
| `from`     | applied-date start                       | ISO date (YYYY-MM-DD)                                         |
| `to`       | applied-date end                         | ISO date                                                      |
| `sort`     | sort column + direction                  | `rank:desc · applied:desc · name:asc · ...`                   |
| `selected` | currently-open applicant id              | applicationId or absent                                       |
| `view`     | list or kanban                           | `list` (default) · `kanban` (stub)                            |

Pagination is _not_ URL-persisted in v1 (page always starts at 1 on filter change; see §10 for why).

### 2.4 Navigation

- Top-level nav already includes "Applicants" (per parent spec §2.2).
- Clicking "View applicants" on a job row in the Jobs page routes to `/dashboard/applicants/:jobId`.
- The filter bar's job dropdown respects the `:jobId` route — changing it navigates between per-job and cross-job views.

---

## 3. Component decomposition

Each component is a single file under `src/site/pages/ApplicantManagement/` (new directory) or `src/site/components/ApplicantManagement/`. Files are small (< 300 lines typically) and focused.

### 3.1 Top-level

**`pages/ApplicantManagement/ApplicantManagementPage.tsx`** — Container. Owns: filter state, selected applicant state, bulk selection state, pagination state, data fetching. Reads URL params into state (via `useSearchParams`), writes state back. Renders filter bar, list, detail panel, bulk action bar. Handles responsive collapse.

### 3.2 Filter and bulk bars

**`components/ApplicantManagement/ApplicantFilterBar.tsx`** — Pure controlled input. Props: current filters, `onChange(newFilters)`, job options. No internal state beyond the small UI bits (date picker open). Matches the existing filter bar visually.

**`components/ApplicantManagement/BulkActionBar.tsx`** — Floating bar shown when `selectedIds.size > 0`. Props: count, callbacks for each bulk action. Handles its own bulk-reject confirmation modal.

### 3.3 List pane

**`components/ApplicantManagement/ApplicantList.tsx`** — Renders the ranked list. Props: rows (`RankedApplicant[]`), selected id, hovered id, `onSelect(id)`, `onToggleCheckbox(id)`. Handles scroll-into-view for keyboard navigation. Renders list header (count + sort menu) + rows.

**`components/ApplicantManagement/ApplicantListRow.tsx`** — Single row. Compact density: avatar/initials, name, rank badge (number), Regulix mark if ready, stage pill, applied-date. Checkbox on hover/select for bulk action. ~60px tall. Selected row has `--kt-primary-subtle` background + left border accent.

### 3.4 Detail pane

**`components/ApplicantManagement/ApplicantDetail.tsx`** — The right pane. Props: applicant, callbacks for actions, `regulixLinked: boolean`. Renders sub-sections in order. Scrolls internally.

**`components/ApplicantManagement/ApplicantActionBar.tsx`** — The row of action buttons under the header. Props: applicant (for stage-aware button visibility), `regulixLinked`, callback per action. Consumed by `ApplicantDetail`.

**`components/ApplicantManagement/RankBreakdown.tsx`** — Rank score + component breakdown bars. Props: `{ rank: number, components: { match, regulixReady, endorsements, recency } }`. Renders a large number + 4 horizontal bars with labels and weights.

### 3.5 Action flow components

**`components/ApplicantManagement/HireConfirmModal.tsx`** — Opened by the Hire button. Content: applicant name (read-only), hire date (date input, defaults to today). Confirm button moves stage to `hired`. No Regulix coupling.

**`components/ApplicantManagement/RegulixOnboardingModal.tsx`** — Opened by the "Start Regulix onboarding" button. Content: hire date + pay rate (defaults to job's `payMax`). Confirm calls `regulixService.submitHireHandoff` and shows a toast.

### 3.6 Keyboard infrastructure

**`components/ApplicantManagement/useApplicantKeyboardNav.ts`** — Custom hook. Takes `{ ids, selectedId, onSelect, onShortlist, onReject, onAdvance, enabled }`. Attaches/detaches a `keydown` listener on `document`. Skips when `document.activeElement` is an input or textarea.

Binds: `j` / `k` / `↓` / `↑` (move), `Enter` (no-op since auto-open), `s` (shortlist toggle), `r` (reject), `⌘↵` / `Ctrl+↵` (advance), `?` (show help overlay), `Esc` (clear selection on desktop / close detail on mobile).

### 3.7 Help overlay

**`components/ApplicantManagement/KeyboardHelpOverlay.tsx`** — Shown when `?` is pressed or the `?` header button is clicked. Simple modal with a two-column table of key → action. Press `Esc` to dismiss.

---

## 4. Rank score composition

### 4.1 Formula

From parent §3.4, locked:

```
rank = 0.4 × skillMatch + 0.3 × regulixReady + 0.2 × endorsementsScore + 0.1 × recencyScore
```

All components are 0–100. Result is rounded to integer.

### 4.2 Components

| Component           | Formula                                                                              | Source                                                 |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `skillMatch`        | 0–100, count of required + nice-to-have skills present on the worker profile, scaled | Existing `matchBreakdown.skills` in `CompanyApplicant` |
| `regulixReady`      | `100` if `RegulixStatus.ready`, else `0`                                             | `regulixService.getRegulixStatus(workerId)`            |
| `endorsementsScore` | `min(count × 25, 100)` — 4+ endorsements caps at 100                                 | `regulixService.getEndorsements(workerId).length`      |
| `recencyScore`      | `max(0, 100 × (1 − daysSinceApplied / 14))`                                          | `applications.created_at`                              |

For workers not on Regulix, `regulixReady` and `endorsementsScore` resolve to 0 — their rank is determined by skill match and recency only. This is by design: Regulix signals are a boost, not a gate.

### 4.3 Where it runs

In `applicantService.getRankedApplicants()` (replaces `getAllApplicants`). For each applicant:

1. Fetch base applicant data (existing query).
2. Batch Regulix status for all worker IDs via `Promise.all(workerIds.map(getRegulixStatus))`.
3. Batch endorsement counts similarly.
4. Compose rank + component breakdown per applicant.
5. Return `RankedApplicant[]` (extends `CompanyApplicant` with `rank` + `rankBreakdown`).

No caching in v1. Recomputed on every fetch. If list rendering becomes slow with 500+ applicants, switch to per-applicant cached snapshots (see §11 Data model note).

### 4.4 Sorting

`sort=rank:desc` is the default on first load. The user can switch to `applied:desc`, `name:asc`, `job:asc` from the sort menu. `sort` persists in the URL.

---

## 5. Service layer changes

The existing `src/site/services/applicantService.ts` is backed by in-memory mocks. This redesign refactors it to:

1. Return ranked data (new shape).
2. Consume `regulixService` for Regulix signals.
3. Keep mutation functions as mock-in-memory until Supabase wiring happens (follow-up).

### 5.1 New function signatures

```ts
// Replaces getAllApplicants.
export async function getRankedApplicants(
  companyId: string,
  params: GetRankedParams
): Promise<{ data: RankedApplicant[]; total: number; error: string | null }>

// params: { filters, sort, page, pageSize }

// New: hire is just a stage move now.
export async function hireApplicant(
  applicationId: string,
  hireDate: string
): Promise<{ error: string | null }>

// New: the Regulix onboarding action. Wraps regulixService.submitHireHandoff.
export async function startRegulixOnboarding(
  applicationId: string,
  params: { hireDate: string; payRate: number }
): Promise<{ data: { regulixHireId: string } | null; error: string | null }>

// New: talent pool save. V1 stubs it (company_favorites table is in a different spec);
// returns success for the UI to show the "Saved" toast. Real persistence lands with
// the talent pool plan.
export async function saveApplicantToTalentPool(
  applicationId: string
): Promise<{ error: string | null }>
```

Existing functions retained with their current shapes: `advanceApplicantStage`, `rejectApplicant`, `shortlistApplicant`, bulk variants (`advanceApplicants`, `rejectApplicants`, `shortlistApplicants`), `addApplicantNote`, `getJobFilterOptions`, `DEFAULT_FILTERS`.

### 5.2 New type

```ts
export type RankedApplicant = CompanyApplicant & {
  rank: number // 0-100
  rankBreakdown: {
    skillMatch: number
    regulixReady: number // 0 or 100
    endorsementsScore: number
    recencyScore: number
  }
  regulixStatus: RegulixStatus | null
  endorsements: RegulixEndorsement[]
  verifiedWorkHistory: VerifiedWorkHistoryEntry[]
}
```

Lives in `src/site/types/index.ts`.

### 5.3 Supabase wiring note

Mutations (`advanceApplicantStage`, etc.) still mutate in-memory state in v1. The redesign does NOT block on Supabase wiring — that's a separate follow-up that swaps the implementation without changing call sites. Mutations return quickly; UI uses optimistic updates.

---

## 6. Keyboard navigation

### 6.1 Bindings

| Key             | Action                                               |
| --------------- | ---------------------------------------------------- |
| `j` / `↓`       | Select next row (scrolls into view)                  |
| `k` / `↑`       | Select previous row                                  |
| `s`             | Toggle shortlist on selected                         |
| `r`             | Reject selected (confirm via undo toast, not modal)  |
| `⌘↵` / `Ctrl+↵` | Advance selected to next stage                       |
| `Esc`           | Desktop: clear selection. Mobile: close detail view. |
| `?`             | Open keyboard help overlay                           |

### 6.2 Focus management

- Keydown listener on `document`, added/removed by `useApplicantKeyboardNav`.
- **Short-circuit when `document.activeElement` is an input, textarea, or contenteditable.** User typing in search box isn't navigating the list.
- Selected row gets `aria-selected="true"` and `scrollIntoView({ block: 'nearest' })` on change.
- Detail panel focuses the action bar on selection change (for screen reader context).

### 6.3 Help overlay

Triggered by `?` key or header icon. Modal lists the bindings above with visual kbd styling. Press `Esc` or click backdrop to dismiss.

---

## 7. Detail panel contents

In order, top to bottom:

### 7.1 Header

- Avatar (initials fallback) — 48×48
- Name (full name, `workerFullName`)
- Subtitle: `{primaryTrade} · Applied {relativeDate}`
- Right-side badges: Regulix Ready / Onboarded / Immediate Hire (as applicable)
- Close `X` button (visible on mobile; hidden on desktop since selection is persistent)

### 7.2 Action bar (see §3.4)

Buttons visible based on applicant state + company config:

- **Shortlist** — always visible. Toggles between "Shortlist" and "Shortlisted" (filled star).
- **Advance** — visible unless stage is `hired` or `rejected`. Label shows the next stage.
- **Reject** — visible unless stage is `rejected`. Danger styling.
- **Hire** — visible unless stage is `hired` or `rejected`. Opens `HireConfirmModal`.
- **Save to talent pool** — always visible. Toggles between "Save to talent pool" and "Saved to talent pool".
- **Start Regulix onboarding** — conditional: only if `company.regulixLinked === true`. Opens `RegulixOnboardingModal`. Visible even when not yet hired (but shows a warning when the applicant isn't in `hired` stage yet).

### 7.3 Rank breakdown

Large rank number (e.g., `98`) on the left, four mini bars on the right (one per component) with label + weight + value. See `RankBreakdown` component. Collapsed to a single line on narrow screens.

### 7.4 Status row (minimal activity log)

One line: `Applied {absoluteDate} · Currently {stage} · Last updated {relativeTime}`. No history, no event list.

### 7.5 Regulix section

- **Verified work history** (if any) — list of roles with company name, start/end, verified checkmark.
- **Endorsements** (if any) — each with from-company, role, rating stars, quote, date.
- **Collapsed gracefully** if the worker has no Regulix account. A small note ("Worker is not on Regulix") appears in place of the two sections.

### 7.6 Skills

Existing `workerTopSkills` tags. Max 10 shown inline.

### 7.7 Resume preview

If `resumeUrl` exists: a `View resume →` link that opens in a new tab. (Actual inline preview is deferred.)

### 7.8 Notes

Existing `notes: string[]`. Add-note action in the action row. Notes render as a simple list with timestamps where available.

### 7.9 Full profile link

Footer: `View full profile →` linking to `/site/profile/:workerId` in a new tab.

---

## 8. Actions & flows

### 8.1 Shortlist (inline, optimistic)

Click → `isShortlisted` flips optimistically → service call → revert + toast on error. No modal.

### 8.2 Advance (inline, undo toast)

Click → stage advances to next in sequence (see §2.1 of parent) → toast: `Advanced to Interview · Undo`. Undo reverses the stage for 5 seconds.

### 8.3 Reject (inline, undo toast — no modal for single)

Click the Reject button on a single applicant → immediate stage change → toast with undo. The existing bulk-reject modal is kept for bulk only (confirming 10+ rejections warrants a confirm step; a single reject does not).

### 8.4 Hire (confirm modal, no Regulix coupling)

Click Hire → `HireConfirmModal` opens. Content:

- Read-only: applicant name, job title.
- Editable: hire date (date input, defaults to today).
- Cancel / Confirm Hire buttons.

Confirm calls `hireApplicant(applicationId, hireDate)` → stage moves to `hired` → modal closes → toast: `Maria Sanchez marked as hired`. No Regulix call.

### 8.5 Start Regulix onboarding (conditional)

Only visible if `company.regulixLinked === true`. Click → `RegulixOnboardingModal`:

- Read-only: applicant name, job title.
- Editable: hire date (defaults to today), pay rate (defaults to job `payMax`, required).
- Warning banner if stage is not `hired`: "This applicant hasn't been marked hired yet. Mark them hired first, or proceed if onboarding happens first in your process."
- Confirm button text: `Start onboarding`.

Confirm calls `startRegulixOnboarding(applicationId, { hireDate, payRate })` which wraps `regulixService.submitHireHandoff`. On success: toast `Onboarding started in Regulix`. On error: toast with retry.

### 8.6 Save to talent pool (direct, toast)

Click → immediate success toast: `Saved to Maria's talent pool`. Button state becomes `Saved` with filled icon. Click again to remove. V1 is a stub (real persistence is the talent pool spec's job); the service function returns `{ error: null }` unconditionally so the UI story is complete.

### 8.7 Message (external)

Click → navigate to `/site/messages?applicant={workerId}&job={jobId}`. Messaging UI is owned by the messaging spec; this page just links.

### 8.8 Bulk actions

Floating `BulkActionBar` appears when `selectedIds.size > 0`. Actions: Advance, Shortlist, Message, Reject (with bulk-reject confirmation modal — keeping the existing pattern). Deselect all button returns to normal state.

---

## 9. Responsive strategy

Three breakpoints:

### 9.1 ≥ 1280px — split view

Both panes visible. List `400px`, detail flex. Detail auto-opens on list selection; no manual "open" needed.

### 9.2 768–1279px — list with push-in detail

List occupies full width by default. Selecting a row slides in an overlay detail panel from the right (about 70% width), with a semi-transparent scrim behind it. Close `X` button in the detail header. List stays in its scroll position when detail closes.

### 9.3 < 768px — list or detail, not both

Default: list view. Tapping a row navigates to a detail view that takes the full screen, with a back button that returns to the list. URL `selected` param drives which view is shown.

### 9.4 Implementation

CSS container queries or media queries on the page root. A single `layout` variable (`"split" | "push" | "stack"`) derived from `window.innerWidth` via a `useLayoutMode` hook controls conditional rendering. Resize listener debounced at 150ms.

### 9.5 Filter bar responsive

On ≥ 768px: horizontal bar as shown. On < 768px: a single `Filters` button opens a bottom sheet with all filter controls. The search input stays in the top bar always.

---

## 10. States

### 10.1 Loading

On initial load and on filter change: list pane shows 8 skeleton rows (animated shimmer). Detail pane shows a blank state: "Select an applicant to view details." No spinner on the whole page.

### 10.2 Empty

- **No applicants at all** (company has posted no jobs or received no applications): "No applicants yet" + CTA "Post a job".
- **No applicants match filters**: "No applicants match these filters" + link "Clear filters".

### 10.3 Error

On fetch failure: top-of-list error banner with "Couldn't load applicants" + Retry button. Rank score component errors (Regulix unreachable) degrade gracefully — those two rank components resolve to 0, and a small info banner in the detail panel notes "Regulix signals temporarily unavailable."

### 10.4 Bulk selection

Floating bar slides up from bottom when `selected.size > 0`. `z-index` above list, below modals.

### 10.5 Pagination

Pagination bar at the bottom of the list pane. Page resets to 1 on any filter/sort change. URL does **not** persist the page number in v1 — this keeps shareable URLs simple. If user feedback shows people need it, add it in v2.

---

## 11. Data model

### 11.1 No new tables for v1

The redesign uses existing data:

- `applications` (id, worker_id, job_id, status, status_updated_at, notes, created_at, is_boosted)
- `worker_profiles` (plus Regulix-linked data via `regulixService`)
- `jobs` (for filter + detail pay range)

### 11.2 Column additions

Verify during implementation that these columns exist on `applications`; add with migration if missing:

| Column              | Type                    | Notes                                            |
| ------------------- | ----------------------- | ------------------------------------------------ |
| `is_shortlisted`    | `boolean default false` | If missing. Drives the Shortlist action state.   |
| `status_updated_at` | `timestamptz`           | Already referenced by `companyDashboardService`. |

### 11.3 Talent pool is the other spec's problem

`saveApplicantToTalentPool` is stubbed here. Real persistence in the `company_favorites` table lands with the talent pool implementation plan.

### 11.4 Activity log deferred

No `applicant_activity_log` table. The minimal status row uses `status` + `status_updated_at` only. Full audit log is a post-launch v2 feature.

### 11.5 Company Regulix-linked flag

The "Start Regulix onboarding" button visibility requires knowing whether the company has linked Regulix. Source:

- v1 stub: a derived boolean in `AuthContext` that always returns `false` until the account-linking flow ships. UI hides the button.
- When linking flow ships: read from a `company_profiles.regulix_linked` column or equivalent.

---

## 12. Parent spec corrections

Update [2026-04-20-company-dashboard-design.md](./2026-04-20-company-dashboard-design.md):

### 12.1 §3.3 Stages section

**Before:**

> `new · reviewed · interview · offer · hired · rejected`. The `hired` action triggers the Regulix hire handoff (§3.7).

**After:**

> `new · reviewed · interview · offer · hired · rejected`. Marking an applicant hired changes only the pipeline stage — it is not tied to any HR software integration. The separate "Start Regulix onboarding" action (visible only when the company has linked Regulix) calls `submitHireHandoff` and is the actual handoff trigger. Future HR integrations (ADP, Gusto, BambooHR) can slot in as additional conditional actions.

### 12.2 §3.3 Action row

**Before:**

> Action row: Shortlist · Advance · Reject · Hire · Save to talent pool.

**After:**

> Action row: Shortlist · Advance · Reject · Hire · Save to talent pool · Start Regulix onboarding (conditional on company Regulix link).

### 12.3 §3.7 `submitHireHandoff` usage note

Add a sentence: _"This function is invoked by the dedicated 'Start Regulix onboarding' action in the applicant detail panel, not by the `hired` pipeline transition. Pipeline stages remain HR-integration-agnostic."_

These edits land in the same commit as this new spec, not a separate edit.

---

## 13. Out of scope

| Feature                         | Disposition                                          |
| ------------------------------- | ---------------------------------------------------- |
| Messaging page UI               | Separate spec — button here links to it              |
| Talent pool page                | Separate spec (§3.5) — Save action stubs persistence |
| Kanban view implementation      | Button stub only; toggle doesn't do anything yet     |
| Company profile editor          | Fast-follow (§3.6)                                   |
| Activity log history            | Deferred to v2                                       |
| Multi-seat accounts             | Deferred (§5.1 of parent)                            |
| Calendar / interview scheduling | Deferred (§5.2 of parent)                            |
| Inline resume preview           | Link out in v1; inline preview v2                    |
| Per-company rank weight tuning  | v2 (§3.4 of parent)                                  |

---

## 14. Appendices

### 14.1 Implementation order (suggested for plan phase)

1. Type additions (`RankedApplicant`, adjust filters/sort types).
2. `applicantService` refactor: `getRankedApplicants` + rank composition.
3. New `hireApplicant`, `startRegulixOnboarding`, `saveApplicantToTalentPool` service functions.
4. New component folder: `ApplicantManagement/` with `ApplicantManagementPage` + skeletons for sub-components.
5. `ApplicantFilterBar`, `BulkActionBar` (port from existing page).
6. `ApplicantList` + `ApplicantListRow` (new compact density).
7. `ApplicantDetail` + `ApplicantActionBar` + `RankBreakdown` + status row.
8. Keyboard nav hook + help overlay.
9. `HireConfirmModal` + `RegulixOnboardingModal`.
10. Responsive layout hook + mobile push-in detail.
11. Empty / loading / error states.
12. Router wiring: swap `AllApplicantsPage` for `ApplicantManagementPage`; per-job route.
13. Delete old `AllApplicantsPage.tsx` + `ApplicantSlideover.tsx` + their styles (final cleanup).
14. Parent spec edits (§12 corrections above).

Each step becomes one or more tasks in the implementation plan.

### 14.2 Open questions (not blocking)

- **Default sort.** V1 uses `rank:desc`. Validate with first users. Some may prefer `applied:desc` (newest first) as a familiar default.
- **Tab-switching undo.** Current undo toast assumes same-tab. Behavior when user switches tabs during the 5-second window is undefined — accept best effort in v1.
- **Mobile bulk actions.** The floating bar takes significant vertical space on a small screen. V1 ships as-is; consider a "select mode" entry on mobile if it proves cumbersome.
- **Rank score live refresh.** V1 recomputes on fetch only. If an endorsement arrives while the recruiter is viewing, the rank is stale until next fetch. Acceptable given Regulix endorsements are not real-time events today.

### 14.3 Accessibility checklist

- List is a `<ul role="listbox">` with `role="option"` children. Selected gets `aria-selected="true"`.
- Detail panel is `role="region" aria-label="Applicant details"`.
- Focus moves into the detail's action bar after selection change.
- All actions are real `<button>` elements with accessible text (no div-as-button).
- Modals trap focus and restore on close.
- Keyboard help overlay is the canonical discovery path for key bindings.
- Color contrast: rank breakdown bars and stage pills must hit AA. Existing `--kt-*` tokens already comply; re-verify only if new colors are introduced.

### 14.4 Testing strategy

- Unit tests for `applicantService.getRankedApplicants` — verify rank composition, edge cases (no Regulix worker, no endorsements, boundary dates).
- Unit tests for the keyboard nav hook — verify j/k behavior, input focus short-circuit, edge cases at list boundaries.
- Integration test (Playwright, optional) — filter-apply-persist-reload cycle, split→mobile responsive transition.
- Manual QA pass: keyboard-only session through the full workflow (triage, advance, hire, save, undo, bulk reject).

### 14.5 File inventory

**New files:**

- `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`
- `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`
- `src/site/components/ApplicantManagement/ApplicantFilterBar.tsx` + CSS
- `src/site/components/ApplicantManagement/ApplicantList.tsx` + CSS
- `src/site/components/ApplicantManagement/ApplicantListRow.tsx` + CSS
- `src/site/components/ApplicantManagement/ApplicantDetail.tsx` + CSS
- `src/site/components/ApplicantManagement/ApplicantActionBar.tsx` + CSS
- `src/site/components/ApplicantManagement/RankBreakdown.tsx` + CSS
- `src/site/components/ApplicantManagement/BulkActionBar.tsx` + CSS
- `src/site/components/ApplicantManagement/HireConfirmModal.tsx`
- `src/site/components/ApplicantManagement/RegulixOnboardingModal.tsx`
- `src/site/components/ApplicantManagement/KeyboardHelpOverlay.tsx`
- `src/site/components/ApplicantManagement/useApplicantKeyboardNav.ts`
- `src/site/components/ApplicantManagement/useLayoutMode.ts`
- Tests in `__tests__/` folders adjacent to each file.

**Modified files:**

- `src/site/services/applicantService.ts` — refactor to `getRankedApplicants`, add new mutation functions
- `src/site/types/index.ts` — add `RankedApplicant` and adjusted filter/sort types
- `src/site/Router.tsx` — swap page component; add `:jobId` route
- `src/site/context/AuthContext.tsx` — add `company.regulixLinked` derived value (v1 hard-coded `false`)
- `docs/superpowers/specs/2026-04-20-company-dashboard-design.md` — §12 corrections

**Deleted files (after new implementation lands):**

- `src/site/pages/AllApplicantsPage.tsx` + CSS
- `src/site/components/ApplicantSlideover/*`
