# Krewtree — Pipeline Pivot
### Summary & Migration Plan
**Scope:** Foundation-level changes to pipeline model, worker-facing stages, and dashboard structure
**Status:** Decisions locked
**Date:** May 19, 2026

---

## 1. Purpose of this document

This document captures a foundation-level pivot in how Krewtree models the company hiring pipeline. The pivot affects already-shipped code built against the previous spec set and is significant enough to warrant a coordinated migration rather than incremental revisions.

This is not a spec. It is a bridge between the previous spec set and the revised one. It exists to orient the developer (and future-Corie) at the start of migration work sessions. Once the migration is complete and the revised specs are authoritative, this document becomes historical reference.

**Read this first when starting a migration session.** Then read the relevant revised spec for the scope being worked on. The revised specs are the source of truth for implementation. This document is the source of truth for context.

---

## 2. What changed and why

Five foundation-level decisions were taken on May 19, 2026. Each is summarized below with its rationale. The revised specs implement these decisions; this section explains why they exist.

### 2.1 Pipelines are now org-level configurable

**Previously:** Four fixed semantic-type stages (Screening, Assessment, Interview, Offer) with per-pipeline enable/disable toggles.

**Now:** Each company defines its own pipeline at the organization level. Companies pick from two templates (Short, Long) or choose Build Your Own at onboarding. They can add, remove, rename, and reorder stages as needed.

**Why:** Industries and companies within them organize hiring differently. The four-stage taxonomy was forcing companies to compress their actual process to fit Krewtree's model. The platform should adapt to the company, not the other way around. The task system, soft-block modal, disabled-stage logic, and other accumulated complexity around the four-stage model were symptoms of this misfit.

### 2.2 Semantic types removed

**Previously:** Every stage had a `semantic_type` enum (screening, assessment, interview, offer) which drove the cross-job kanban rollup, worker-facing display mapping, and analytics.

**Now:** Semantic types are removed entirely from the data model. Stages are identified by name only. The cross-job kanban renders the company's actual stages because every job at a company uses the same pipeline.

**Why:** Once pipelines are org-level and consistent across a company's jobs, the kanban rollup no longer needs a shared taxonomy. Semantic types were doing structural work that the org-level pipeline now does directly.

### 2.3 Worker-facing stages collapse to three

**Previously:** Workers saw five stages (Applied, Reviewed, Interview, Offer, Closed) mapped from the employer's five pipeline stages.

**Now:** Workers see three states only — **Applied, In Review, Closed**. Offers are communicated as messages and notifications, not as a stage badge.

**Why:** With custom employer pipelines, mapping each employer stage to a worker-facing stage requires either preserving semantic types or accepting coarser worker states. Coarser is better: workers do not need to track which of the employer's six internal stages they are in. "They are looking at it" is the information workers actually need. Offers are too important to be a badge change anyway — they deserve a message and a notification.

### 2.4 List view is default; kanban is opt-in

**Previously:** The dashboard applicant pipeline widget centered on the kanban view, with a list view available via toggle.

**Now:** List view is the default. Kanban is available via the same toggle but is opt-in. The toggle state persists per user.

**Why:** A meaningful slice of Krewtree's expected user base — small contractors, low-volume hirers, simple processes — does not benefit from a visual board. Forcing kanban as the marquee surface adds noise for these companies. Kanban remains a real feature for companies that want it, but it is no longer presumed to be the right default.

### 2.5 Dashboard widget consolidation

**Previously:** The dashboard had a separate Applicant Pipeline (kanban) widget and a Recent Applicants table row.

**Now:** These consolidate into a single Applicants widget with list/kanban toggle. The dashboard structure simplifies from five conceptual blocks to four (stat cards, calendar + attention, applicants, jobs).

**Why:** Two widgets showing the same underlying data in different shapes is redundant. The consolidation is enabled by the list-default + kanban-opt-in framing — once the applicant view can be either shape, having two separate widgets is just clutter.

---

## 3. Supporting decisions

Two additional decisions follow from the changes above. They are smaller in scope but worth recording.

### 3.1 Templates at onboarding

Companies pick one of three options when they post their first job (or at signup, TBD in spec): Short template, Long template, or Build Your Own. Short and Long ship with pre-built stages, suggested triggers, and starter task templates. Build Your Own opens an empty pipeline editor with just Applied as a starting stage.

Exact template content (stage names, task lists, trigger configurations) is deferred. The architecture supports any template content; the seed data is a content task for when templates are filled in. Templates live as JSON files in version control, same pattern as the skill taxonomy seed files.

### 3.2 The applicant drawer is the primary work surface

With list view as default and kanban as opt-in, the drawer becomes the workhorse for both view modes. List-view companies open the drawer to look at applicants and act on them. Kanban-view companies open the drawer when they need to work on a specific person. Either way, the drawer's Summary tab and Pipeline tab carry most of the actual work.

This framing is unchanged from prior specs in mechanism but elevated in importance. The drawer's tabbed structure (Summary, Pipeline, Log) remains as specced in the May 18 stage-tasks spec.

---

## 4. What this means for existing code

The following table characterizes the migration cost per area, based on what was built to the prior spec set.

| Area | Cost | Notes |
|---|---|---|
| Pipeline data model | Hard | Drops `semantic_type` field, restructures pipeline-stage relationship from per-job to per-org. Existing data needs migration to a single default pipeline per company. |
| Pipeline editor surface | New build | Did not previously exist as a real product surface. Org-level editor for add/remove/rename/reorder stages, configure triggers and tasks per stage. |
| Kanban view | Medium | Columns become dynamic. Drops ambiguity picker (gone in May 18 already), disabled-stage logic, and "next enabled stage" computation. Drop-zone validity becomes trivially "all defined stages are valid." |
| List view of applicants | Medium | Gets promoted to default view of the dashboard widget. May need richer content than the current spec assumed (it was the secondary view). Capped row count for the dashboard context, full count on the dedicated page. |
| Dashboard layout | Medium | Consolidates the kanban widget and the recent applicants table into a single Applicants widget. Layout structure of the dashboard updates accordingly. |
| Worker dashboard stage badges | Easy | Collapses from five badges to three. Badge state derivation simplifies. Boost and Withdraw availability rules update. |
| Applicant drawer | Easy | Largely unchanged. Pipeline tab no longer references semantic types; stage display reads from the org pipeline directly. Tabs structure intact. |
| Task system | Easy | Unchanged in mechanism. References to the four semantic types removed from copy. Tasks are still per-stage, per-application. |
| Trigger system | Easy | Unchanged in mechanism. Trigger configuration moves from per-stage-per-job to per-stage-per-org (with snapshot at job creation, same as before). |
| Job posts spec | Easy | Mostly unchanged. The applicant count and Regulix Ready count fields are unaffected. |

---

## 5. Which specs are now authoritative

The following revised specs supersede prior versions. Any spec not on this list is either unchanged or has been deprecated.

| Revised spec | Status | Replaces |
|---|---|---|
| `krewtree-dashboard-structure-spec` | To be written | Implicit dashboard structure from prior session notes (Option C "morning briefing" direction) |
| `krewtree-pipeline-foundation-spec` | To be written | Embedded foundation sections inside the kanban and task specs |
| `krewtree-applicants-widget-spec` | To be written | `krewtree-dashboard-kanban-spec.md` (the dashboard widget portion) |
| `krewtree-applicants-page-spec` | To be written | `krewtree-dashboard-kanban-spec.md` (the full-page portion) |
| `krewtree-worker-dashboard-spec` (revised) | Revision | `krewtree-worker-dashboard-spec.md` |
| `krewtree-stage-tasks-and-drawer-tabs-spec` (revised) | Touch-up | `krewtree-stage-tasks-and-drawer-tabs-spec.md` |
| `krewtree-job-posts-spec` | Unchanged | Stays as-is — applicant count, Regulix Ready count, and lifecycle are unaffected |
| `krewtree-worker-profile-spec` | Unchanged | Stays as-is — worker profile model is unaffected |

When a revised spec is published, the previous version should be moved to an `archive/` subfolder and renamed with a `-deprecated-may-2026` suffix. This preserves history without confusing Code about which file is current.

---

## 6. Migration order

The migration is too large to do in one Code session. Break it into focused scopes, each with a clear definition of done.

### Step 1 — Spec revisions

The revised specs are written first, before any code migration begins. They are the source of truth Code works against; rushing into migration without complete specs will surface decision points that should have been resolved in the spec.

1. **Dashboard structure spec** — defines the four-block layout and the consolidated Applicants widget framing
2. **Pipeline foundation spec** — defines the org-level pipeline model, kills semantic types, locks the worker-facing three-state mapping, defines templates as a concept
3. **Applicants widget spec** — the dashboard widget, list-default with kanban toggle
4. **Applicants page spec** — the full `/dashboard/applicants` page, same patterns at full scale
5. **Worker dashboard spec revision** — three-state badge model, updated boost and withdraw rules
6. **Stage tasks spec touch-up** — minor: remove references to semantic types in copy

### Step 2 — Code migration

Migration sessions, one per focused scope. Each session works against the relevant revised spec, not against this pivot document.

1. **Schema migration.** Drop `semantic_type`, restructure pipeline-stage relationship, migrate existing data into a single default pipeline per company. Build the templates JSON structure even if content is stubbed.
2. **Pipeline editor.** Build the org-level configurable pipeline surface. Includes the template-selection UX at first job post (or signup).
3. **Dashboard layout.** Reorganize the dashboard around the four conceptual blocks. Replace the existing kanban widget with the new Applicants widget shell (the views themselves come next).
4. **Applicants widget — list view.** Promote the list view to the dashboard widget default. Add the capped row count and any content additions the new framing requires.
5. **Applicants widget — kanban view.** Rebuild the kanban with dynamic columns. Drop the disabled-stage and ambiguity-picker code paths.
6. **Worker dashboard.** Update stage badges to the three-state model. Update boost and withdraw availability rules.
7. **Task system touch-up.** Remove semantic-type references from copy and any leftover code paths.

### Step 3 — Template content

Once the architecture is in place, fill in the Short and Long template content with realistic stages, tasks, and trigger configurations. This is content work, not architecture work, and can be done after migration is complete. Treat as a separate work session.

---

## 7. How to use this document with Code

**At the start of each migration session,** paste a reference to this document and the relevant revised spec. Example: *"We are migrating Krewtree to the new pipeline model. Read `krewtree-pipeline-pivot-may-2026` for context, then read `krewtree-pipeline-foundation-spec` for the spec we are building against. This session focuses on the schema migration only."*

**Do not paste prior specs alongside the revised ones.** Code should work against the current source of truth, not a diff. The pivot document exists so that Code understands why the world looks different from any earlier specs it may have seen in prior sessions, but the actual implementation work runs against the revised spec only.

**Use Linear to track each scope as a ticket.** Each ticket references its revised spec and (where helpful) this pivot document. The ticket is the unit of work for a Code session.

---

## 8. Open questions

These were raised during the pivot discussion and remain unresolved. They affect spec content but not migration order.

| # | Question | Recommended default |
|---|---|---|
| 1 | At what moment does template selection happen — at signup, before first job post, or both? | Before first job post. Signup is for account creation; the pipeline decision is hiring-context. |
| 2 | Can a company change its pipeline after jobs are posted? Does the change apply retroactively, only to new jobs, or both? | Only to new jobs. Existing jobs keep their snapshotted pipeline. Mirrors the locked snapshot pattern for triggers and tasks. |
| 3 | What is the minimum pipeline shape allowed in Build Your Own? Just Applied? Applied + one custom stage? | Just Applied. Companies can hire directly from Applied via the Mark Hired action; no stages between are required. |
| 4 | Should the dashboard Applicants widget remember the user's view toggle preference (list vs. kanban) per session, per user-and-device, or across all devices? | Per user, persisted in the database. Survives logout and works across devices. |
| 5 | Do templates ship with triggers pre-configured, or just stages and tasks? | Pre-configured triggers where they make sense (e.g. Long template's Interview stage has a scheduling email trigger). Templates need to be working examples, not skeletons. |
