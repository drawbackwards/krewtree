# Krewtree — Pipeline Pivot Migration Plan
### Session-by-session guide for working with Code
**Status:** Ready to execute
**Date:** May 19, 2026

---

## How to use this document

This is your migration runbook. It breaks the pipeline pivot into 11 focused Code sessions, in order. Each session has:

- A clear scope (definition of done)
- The specs Code needs to read
- A starter prompt you can copy-paste

You manage the order. You decide when to start the next session. Don't try to do more than one session in a single Code conversation — context will get muddled and quality drops.

**Before you start any session:** make sure the relevant specs are accessible to Code (in the project, attached, or pasted in). Make sure deprecated specs are NOT visible to Code — move them to `archive/` with a deprecation suffix before starting migration.

**Keeping track of progress:** I recommend a simple `migration-progress.md` file at the project root. After each session, add a one-liner: "Session 1 — done [date]. Notes: [anything surprising]." This is your at-a-glance status if you pause for a few days.

---

## Pre-migration checklist

Before starting Session 1, do these housekeeping steps:

| Step | Action |
|---|---|
| 1 | Move deprecated specs to `archive/` and rename with `-deprecated-may-2026` suffix. Files to archive: `krewtree-dashboard-kanban-spec.md`, `krewtree-worker-dashboard-spec.md` (original), `krewtree-stage-tasks-and-drawer-tabs-spec.md` (original), and the prior pivot/dashboard direction notes if any exist as files. |
| 2 | Confirm the new spec files are in the project root: `krewtree-pipeline-pivot-may-2026.md`, `krewtree-dashboard-structure-spec.md`, `krewtree-pipeline-foundation-spec.md`, `krewtree-applicants-widget-spec.md`, `krewtree-applicants-page-spec.md`, `krewtree-worker-dashboard-spec-revised.md`, `krewtree-stage-tasks-and-drawer-tabs-spec-revised.md`. |
| 3 | Create `migration-progress.md` at the project root. Use it to log session completion. |
| 4 | Backup the database before Session 1 (schema migration). |

---

## Session 1 — Schema migration

**Scope:** Data model changes. Drop `semantic_type`, restructure pipeline-stage relationship from per-job to per-org, add `company_pipeline` table, migrate existing data into a single default pipeline per company. Do not touch API responses or UI yet.

**Specs to read:**
- `krewtree-pipeline-pivot-may-2026.md` (context)
- `krewtree-pipeline-foundation-spec.md` (the spec to build against, sections 4, 8, 9)

**Definition of done:**
- New `company_pipeline` table exists with one row per existing company
- `pipeline_stage` table no longer has `semantic_type` or `enabled` columns
- `pipeline_stage.pipeline_id` references `company_pipeline.id`
- Existing jobs have a `pipeline_snapshot` JSONB column populated from their company's migrated pipeline
- Existing applications have valid `current_stage_id` references pointing into their job's snapshot
- All existing data preserved (no orphaned records)
- Schema migrations are runnable both forward and backward (rollback works)

**Prompt to copy-paste to Code:**

```
We're migrating Krewtree to a new pipeline model. Read `krewtree-pipeline-pivot-may-2026.md` for context on why things changed. Then read `krewtree-pipeline-foundation-spec.md`, especially sections 4 (Stage data model), 8 (Data model summary), and 9 (Implementation notes — migration of existing data).

This session focuses on the schema migration ONLY. Out of scope: API changes, UI changes, business logic that reads from these tables. Those have their own sessions.

The work:
1. Add a `company_pipeline` table (one row per company)
2. Restructure `pipeline_stage` to reference `company_pipeline` and drop the `semantic_type`, `enabled` columns
3. Add a `pipeline_snapshot` JSONB column to the jobs table
4. Migrate existing data:
   - One `company_pipeline` per company
   - Migrate `pipeline_stage` rows, dropping disabled stages
   - Materialize `pipeline_snapshot` for existing jobs from the current pipeline
   - Update `current_stage_id` on applications to reference snapshotted stage IDs
5. Make sure the migration is reversible (rollback works)

Show me your plan and the migration files before applying any changes. We'll review together.
```

---

## Session 2 — Pipeline snapshot at job creation

**Scope:** Update the job creation flow to snapshot the company's current pipeline onto the job at the moment of posting. The snapshot is immutable for the life of the job.

**Specs to read:**
- `krewtree-pipeline-foundation-spec.md` (sections 3.4, 4.2, 9.5)

**Definition of done:**
- When a company posts a new job, the current pipeline (including stage names, triggers, task templates) is snapshotted into the job's `pipeline_snapshot` field
- The snapshot is independent of the live pipeline — editing the live pipeline after the job is posted does NOT modify the snapshot
- New applications created against the job reference snapshotted stages by ID
- Existing test coverage for job creation still passes (with snapshot logic added)

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. The schema migration (Session 1) is complete. Read `krewtree-pipeline-foundation-spec.md`, especially sections 3.4 (Pipeline snapshot at job creation), 4.2 (Job pipeline snapshot), and 9.5 (Snapshot storage).

This session focuses on the job creation flow ONLY. Out of scope: pipeline editor (separate session), API stage derivation (separate session), UI changes (separate sessions).

The work:
1. When a job is created via the job creation flow, read the company's current `company_pipeline`
2. Materialize a snapshot including: stage list (name, order), triggers per stage, task template per stage
3. Store the snapshot on the job record in `pipeline_snapshot`
4. Confirm that subsequent edits to the company's live pipeline do NOT mutate this snapshot
5. Add tests covering: snapshot created on job creation, snapshot independent of live edits, new applications reference snapshot stage IDs

Show me your plan and the changes before applying them.
```

---

## Session 3 — Worker-facing stage derivation

**Scope:** Add the computed three-state worker mapping (Applied, In Review, Closed) to the API. Update worker-facing responses to use the derived stage instead of the raw employer stage name.

**Specs to read:**
- `krewtree-pipeline-foundation-spec.md` (section 6)
- `krewtree-worker-dashboard-spec-revised.md` (sections 4.3, 4.4, 11.1, 11.2)

**Definition of done:**
- API responses for worker-facing views compute `worker_stage` from `application.status` + `current_stage_id` + first-stage-in-snapshot
- The `has_been_advanced` flag (or equivalent log-based derivation) implements the one-way Applied → In Review transition
- Worker-facing endpoints (My Applications, application history, etc.) return `worker_stage`
- The old five-stage mapping is removed from worker-facing responses
- Existing tests for worker views are updated to expect the three-state model

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. The schema and snapshot logic are in place (Sessions 1 and 2). Read `krewtree-pipeline-foundation-spec.md` section 6 (Worker-facing stages), and `krewtree-worker-dashboard-spec-revised.md` sections 4.3, 4.4, and 11.

This session focuses on the worker-facing stage derivation in the API ONLY. Out of scope: any UI changes — the worker dashboard UI will be updated in a later session. The previous five-stage worker model is being collapsed to three states.

The work:
1. Add a computed `worker_stage` field to the application model (computed at API response time, not stored)
2. Implement the derivation: Closed if status != active; Applied if application has never been advanced past the first stage; In Review otherwise
3. Add a `has_been_advanced` boolean flag on applications, set to true on first stage advance, never reset (this implements the one-way Applied → In Review transition)
4. Update worker-facing API endpoints to return `worker_stage` instead of (or alongside) any older stage representation
5. Update tests to expect the three-state model

Show me your plan and the changes before applying them.
```

---

## Session 4 — Pipeline editor surface

**Scope:** Build the org-level pipeline editor UI. Lives at `/settings/pipeline` (or wherever fits your existing settings structure). Lets companies add, remove, rename, and reorder stages, configure triggers per stage, and configure task templates per stage.

**Specs to read:**
- `krewtree-pipeline-foundation-spec.md` (section 3 in full, especially 3.3)
- `krewtree-stage-tasks-and-drawer-tabs-spec-revised.md` (for stage purpose, tasks, triggers context)

**Definition of done:**
- Settings page at `/settings/pipeline` (or equivalent) renders the company's current pipeline
- Employer can add stages (with name, optional purpose, optional triggers, optional task template)
- Employer can rename, reorder, and remove stages
- Stage removal blocked if applications are currently in that stage on the live pipeline
- "Replace pipeline with template" affordance (functional even with empty template content — wires up the replacement flow)
- Changes to the live pipeline do not affect already-posted jobs
- Minimum one-stage constraint enforced

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. Schema, snapshot, and worker-stage derivation are done (Sessions 1–3). Read `krewtree-pipeline-foundation-spec.md` section 3 (The org-level pipeline) in full, and `krewtree-stage-tasks-and-drawer-tabs-spec-revised.md` for context on stage purpose, tasks, and triggers.

This session focuses on the pipeline editor UI ONLY. Out of scope: signup template selection (separate session), dashboard or applicants UI (separate sessions).

The work:
1. Build a settings page at `/settings/pipeline` that renders the company's current pipeline
2. Support add/remove/rename/reorder stages
3. Support per-stage triggers and task template configuration (use existing component patterns from prior sessions)
4. Enforce: minimum one active stage, stage names 1-40 chars, stage removal blocked if applications are currently in it on the live pipeline
5. Add "Replace pipeline with template" affordance (the template selection UX — even if templates are empty seed data for now)
6. Confirm that changes to the live pipeline don't mutate any existing job's snapshot

Show me your plan and a wireframe sketch before building. We can iterate on the editor's interaction model before code.
```

---

## Session 5 — Template selection at signup

**Scope:** Add the three-option template picker to the signup flow. Seed the new company's pipeline based on their choice. Build the JSON seed file structure for Short and Long templates (even if content is stubbed).

**Specs to read:**
- `krewtree-pipeline-foundation-spec.md` (section 5)
- `krewtree-dashboard-structure-spec.md` (section 10)

**Definition of done:**
- Signup flow includes a template-selection step
- Three options: Short, Long, Build Your Own
- On signup completion, a `company_pipeline` is seeded for the new company based on the choice
- Seed JSON files exist at `seeds/pipeline-templates/short.json` and `seeds/pipeline-templates/long.json` (structure complete, content can be minimal/stubbed)
- Build Your Own creates a one-stage pipeline ("Applied")
- By the time the new company hits the dashboard, their pipeline is in place

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. The editor is built (Session 4). Read `krewtree-pipeline-foundation-spec.md` section 5 (Templates), and `krewtree-dashboard-structure-spec.md` section 10 (Onboarding entry point).

This session focuses on signup template selection ONLY.

The work:
1. Add a template-selection step to the signup flow. Three options: Short, Long, Build Your Own
2. Create JSON seed file structure at `seeds/pipeline-templates/short.json` and `seeds/pipeline-templates/long.json`. Schema should match the pipeline data model (stages, triggers, task templates per stage). Content can be minimal stubs for now — actual template content is a separate work session.
3. Build Your Own creates a single "Applied" stage
4. On signup completion, seed the new company's `company_pipeline` based on the choice
5. Confirm the dashboard renders correctly for a freshly seeded company (using each template option)

Show me your plan before building. We can review the seed file schema together.
```

---

## Session 6 — Dashboard layout reorganization

**Scope:** Reorganize the dashboard around the four conceptual blocks defined in the dashboard structure spec. Replace the old kanban widget with an Applicants widget shell (views come in the next sessions). Wire up the view toggle (UI only, persistence to follow).

**Specs to read:**
- `krewtree-dashboard-structure-spec.md` (full spec)

**Definition of done:**
- Dashboard renders four conceptual blocks: stat cards, calendar+attention, applicants, jobs
- Regulix promo banner positioned between stat cards and calendar
- Applicants widget has a header with title, view toggle (List/Kanban), and "View all" link
- View toggle persists per user (DB column `applicants_view_preference` added)
- The applicants widget body shows a placeholder/loading state — the actual views ship in Sessions 7 and 8
- Old kanban widget code is removed/replaced
- Old "Recent Applicants" table is removed
- Module visibility configurability is wired but the settings surface is deferred

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. Schema, editor, and signup are done (Sessions 1–5). Read `krewtree-dashboard-structure-spec.md` in full.

This session focuses on the dashboard layout ONLY. Out of scope: the applicants widget views (list and kanban have their own sessions), the calendar internals, the stat card internals.

The work:
1. Reorganize the dashboard into the four conceptual blocks per Section 3 of the spec
2. Position the Regulix promo banner between stat cards and the calendar row (Section 5)
3. Build the Applicants widget SHELL: header with title, view toggle (List/Kanban segments), "View all" link to /dashboard/applicants
4. Add `applicants_view_preference` to the user model (enum: list, kanban; default list)
5. Wire toggle persistence: clicking toggles the DB field, optimistic UI update
6. Show a placeholder in the widget body for now (views come next)
7. Remove the old kanban widget code path and the old Recent Applicants table
8. Add the `dashboard_widget_config` shape (JSON on company record, all visible by default) — the configurability surface is deferred

Show me your plan before building.
```

---

## Session 7 — Applicants widget list view

**Scope:** Implement the list view inside the Applicants widget. This becomes the default view. 15 most recent applicants, dense table with primary "View" action and overflow menu.

**Specs to read:**
- `krewtree-applicants-widget-spec.md` (sections 3, 4, 6, 7)
- `krewtree-pipeline-foundation-spec.md` (for stage snapshot context)

**Definition of done:**
- List view renders inside the Applicants widget when toggle is set to List
- Shows up to 15 applicants, sorted by last activity descending
- Columns: applicant, job, stage, regulix ready, last activity, actions
- Primary action "View" opens the applicant drawer (Summary tab)
- Overflow menu: Advance, Reject, Mark Hired, Open Profile, Message
- Filters work: search, job, regulix ready, applied date range
- Filter chips display when filters are active
- Empty states implemented per Section 7

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. The dashboard shell is in place (Session 6). Read `krewtree-applicants-widget-spec.md` sections 3 (Widget structure), 4 (List view), 6 (Filters), and 7 (Empty states).

This session focuses on the LIST VIEW inside the Applicants widget. Out of scope: kanban view (next session), full /dashboard/applicants page (later session).

The work:
1. Build the list view content for the Applicants widget
2. 15 most recent applicants, sorted by last activity descending
3. Columns per Section 4.2
4. Primary "View" action opens the drawer (use existing drawer component)
5. Overflow menu actions per Section 4.4
6. Filter bar with search, job, regulix ready, applied date range
7. Filter chips per Section 6.2
8. Empty states per Section 7
9. Make sure shared components (rows, filter chips) are designed to be reusable for the full applicants page later

Show me your plan before building.
```

---

## Session 8 — Applicants widget kanban view

**Scope:** Rebuild the kanban view with dynamic columns based on the company's live pipeline. Drop the old four-fixed-column, disabled-stage, and ambiguity-picker code paths.

**Specs to read:**
- `krewtree-applicants-widget-spec.md` (sections 3, 5, 6, 7, 8, 11.1)

**Definition of done:**
- Kanban view renders inside the Applicants widget when toggle is set to Kanban
- Columns are dynamic: one per stage in the company's current live pipeline
- Each column shows top 15 cards plus "+N more" link
- Cards have the structure from Section 5.3
- Drag-and-drop works per Section 5.5
- Cross-job snapshot matching per Section 5.6
- Undo toast per Section 5.7
- Filters and filter chips work (shared with list view)
- Empty states implemented
- Old kanban code (semantic types, ambiguity picker, disabled-stage handling) is removed

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. The list view is done (Session 7). Read `krewtree-applicants-widget-spec.md` sections 3, 5 (Kanban view), 6, 7, 8, and 11.1.

This session focuses on the KANBAN VIEW inside the Applicants widget. Out of scope: full /dashboard/applicants page (later session).

The work:
1. Build the kanban view content for the Applicants widget
2. Dynamic columns based on the company's current live pipeline
3. Up to 15 cards per column, with "+N more" link to the full applicants page filtered to that stage
4. Cards per Section 5.3
5. Drag-and-drop with the cross-job snapshot matching logic per Section 5.6
6. Universal 5-second undo toast per Section 5.7
7. Filters shared with the list view
8. Remove the old kanban code: semantic types, ambiguity picker, "next enabled stage" computation, disabled-stage handling
9. Confirm cards and columns share components with the list-view rows where possible

Show me your plan before building.
```

---

## Session 9 — Full applicants page

**Scope:** Build (or update) the page at `/dashboard/applicants`. Same list/kanban patterns as the widget but scaled up: no row cap, pagination, sortable columns, bulk actions in list view, deep-linkable filters in URL.

**Specs to read:**
- `krewtree-applicants-page-spec.md` (full spec)
- `krewtree-applicants-widget-spec.md` (for shared component context)

**Definition of done:**
- Page at `/dashboard/applicants` renders list/kanban with the same toggle pattern
- List view supports sorting, pagination (25/50/100), bulk actions on current page
- Kanban view supports up to 50 cards per column with "+N more"
- Filters include all from the widget plus stage filter and "Show archived" toggle
- Filter state lives in URL query params
- "+N more" links from the widget kanban deep-link with stage filter pre-applied
- Bulk action bar appears on row selection
- Empty states implemented

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. Both views work in the widget (Sessions 7 and 8). Read `krewtree-applicants-page-spec.md` in full, and reference `krewtree-applicants-widget-spec.md` for shared components.

This session focuses on the FULL applicants page at /dashboard/applicants.

The work:
1. Build (or update) the page to match the spec
2. List view: sortable columns, pagination (25/50/100), bulk actions on current page
3. Kanban view: up to 50 cards per column
4. Full filter bar with stage filter and "Show archived" toggle
5. Filter state in URL query params (page is shareable and bookmarkable)
6. Bulk action bar (Advance, Reject, Mark Hired, Message, Deselect)
7. Empty states
8. Reuse the row, card, and column components from the widget (the page just uses the "full" variant)
9. Confirm deep-linking from widget "+N more" works

Show me your plan before building.
```

---

## Session 10 — Worker dashboard revision

**Scope:** Update the worker dashboard UI to the three-state stage badge model. Update Boost and Withdraw availability rules. Confirm the offer notification path works.

**Specs to read:**
- `krewtree-worker-dashboard-spec-revised.md` (full spec)

**Definition of done:**
- My Applications module shows three-state badges (Applied, In Review, Closed)
- Stage derivation uses the API's `worker_stage` field from Session 3
- Boost and Withdraw available at Applied and In Review; hidden at Closed
- Withdraw modal carries forward unchanged
- Saved jobs, profile completeness, new jobs for you, Regulix nudge modules unchanged
- Offer notifications route through the notification system (in-app + message)

**Prompt to copy-paste to Code:**

```
Continuing the pipeline migration. The employer-side UI is done through Session 9. Read `krewtree-worker-dashboard-spec-revised.md` in full.

This session focuses on the WORKER DASHBOARD UI updates. Out of scope: anything employer-facing.

The work:
1. Update the My Applications module to show three-state badges (Applied, In Review, Closed)
2. Use the `worker_stage` field from the API (built in Session 3) for badge display
3. Update Boost and Withdraw overflow menu visibility: shown at Applied and In Review, hidden at Closed
4. Confirm the Withdraw modal still works with reason dropdown
5. Confirm offer notifications route through the notification system — when an employer extends an offer, the worker receives an in-app notification and a message; their stage badge stays In Review until terminal
6. Leave saved jobs, profile completeness, new jobs for you, and Regulix nudge modules unchanged

Show me your plan before building.
```

---

## Session 11 — Stage tasks copy and code cleanup

**Scope:** Remove any residual references to semantic types in copy, code, and tests. Confirm the drawer's Pipeline tab uses dynamic stage names. Final sweep for "stage type" / "Screening/Assessment/Interview/Offer as labels" / "disabled stage" language.

**Specs to read:**
- `krewtree-stage-tasks-and-drawer-tabs-spec-revised.md` (full spec)

**Definition of done:**
- No "semantic_type" references anywhere in the codebase
- No "Screening" / "Assessment" / "Interview" / "Offer" used as fixed labels in code or copy
- No "next enabled stage" / "disabled stage" logic remaining
- Drawer's Pipeline tab uses snapshotted stage names
- Log entries render with snapshotted stage names
- All tests pass with the new model

**Prompt to copy-paste to Code:**

```
Final session of the pipeline migration. Read `krewtree-stage-tasks-and-drawer-tabs-spec-revised.md` in full.

This session is a CLEANUP sweep. The earlier sessions handled the major migrations; this session removes any residual references to the old model.

The work:
1. Grep for "semantic_type" / "semantic type" — should not appear anywhere
2. Grep for "Screening" / "Assessment" / "Interview" / "Offer" used as fixed stage labels — should be replaced with dynamic snapshotted stage name lookups
3. Grep for "next enabled stage" / "disabled stage" / "enabled" in pipeline context — code paths should be removed
4. Confirm the drawer's Pipeline tab reads stage name from the application's job snapshot, not from any hardcoded label
5. Confirm log entries render snapshotted stage names
6. Run the full test suite and confirm everything passes

Show me a list of every file you change and why.
```

---

## After migration

When all 11 sessions are complete:

1. **Final smoke test.** Manually walk through: create a new company, pick each template, post a job, apply as a worker, advance through stages, hire/reject. Confirm everything works end to end.
2. **Update `migration-progress.md`.** Note that the migration is complete.
3. **Template content session (deferred).** When ready, fill in the Short and Long template seed files with realistic stages, tasks, and trigger configurations. This is its own work session — content, not architecture.
4. **Archive this document.** Once the migration is fully done and stable, this plan becomes historical. Move it to `archive/` alongside the deprecated specs.

---

## Risks and tips

**The schema migration (Session 1) is the riskiest step.** Back up the database first. Make the migration reversible. Test the rollback path on a staging copy before running it in production.

**Don't merge sessions.** Even if a session feels small, do it as a focused session. Mixing scopes leads to confused Code conversations and worse output.

**If a session reveals an unanticipated blocker, stop and revise the spec.** Don't have Code paper over a spec gap with ad-hoc decisions. Update the spec, then continue. The spec is the source of truth.

**Some sessions will reveal that a downstream session needs reordering.** That's fine. Update this plan as you go. The order here is the recommended starting point, not a contract.

**If Code starts making changes outside the session scope, stop and refocus.** A session prompt with explicit out-of-scope items helps, but you may still need to remind Code mid-session.

**You don't have to start each session in a fresh Code conversation.** But you should at least start each with a clear "we're starting Session N" message that resets context. Long conversations spanning multiple sessions tend to drift.
