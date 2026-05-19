# Krewtree — Pipeline Foundation
### Product Specification
**Scope:** Org-level pipeline model, stage definition, templates, worker-facing stage mapping
**Status:** Decisions locked
**Date:** May 19, 2026

---

## 1. Context & scope

The pipeline foundation is the underlying model for how Krewtree represents a company's hiring process. It defines what a stage is, how stages compose into a pipeline, how that pipeline relates to jobs and applications, how workers see their progress through it, and how new companies get a working pipeline at signup.

This spec replaces the embedded foundation sections that previously lived inside the kanban spec and the stage-tasks spec. Those sections were written when the foundation was a fixed four-stage model with semantic types. This spec defines the new foundation: org-level configurable pipelines, no semantic types, three-state worker-facing mapping.

**Out of scope for this spec:**
- The pipeline editor UI (deferred to its own spec)
- Actual template content — stages, tasks, triggers shipped in the Short and Long templates (deferred to a separate content task)
- Kanban view behavior (applicants widget spec)
- List view behavior (applicants widget spec)
- Drawer behavior (existing stage-tasks spec, with minor touch-up)
- Trigger system internals (existing trigger spec, unchanged in mechanism)
- Task system internals (existing task spec, unchanged in mechanism)

**Foundation dependencies:** Pipeline pivot (May 19, 2026) — defines what changed and why this spec exists.

---

## 2. Key decisions

| Topic | Decision |
|---|---|
| Pipeline scope | One pipeline per company. Defined at the organization level. All jobs at a company use the same pipeline. |
| Stage definition | Stages have a name and an order. No semantic type, no enable/disable flag. |
| Terminal stages | System-defined and outside the company-editable list. Set: hired, rejected, withdrawn, archived. |
| Pipeline snapshot | When a job is posted, the company's current pipeline is snapshotted onto the job. Existing jobs are unaffected by later pipeline edits. |
| Minimum pipeline | At least one active stage. The first active stage is implicitly Applied (where new applications land). |
| Pipeline edits | Allowed at any time. Changes apply to jobs posted after the edit. Existing jobs keep their snapshot. |
| Templates at signup | Three options: Short, Long, Build Your Own. Company picks one during account creation. By the time the dashboard renders, a working pipeline is in place. |
| Template content | Deferred. Architecture supports any content; seed data is a content task for when templates are filled in. |
| Worker-facing stages | Three states only: Applied, In Review, Closed. Derived from the application's position in the employer pipeline plus terminal state. |
| Offer to worker | Surfaced via message and notification, not as a stage badge. Workers see "In Review" until they receive an offer message. |
| Semantic types | Removed entirely from the data model. |
| Trigger configuration scope | Moves from per-stage-per-job to per-stage-per-org-pipeline. Snapshotted to the job at posting, same pattern as before. |
| Task template scope | Moves from per-stage-per-job to per-stage-per-org-pipeline. Snapshotted to the job at posting, same pattern as before. |

---

## 3. The org-level pipeline

### 3.1 Definition

Every company has exactly one pipeline. The pipeline is an ordered list of stages plus the four system-defined terminal states. The pipeline defines:

- The active stages an application moves through during hiring
- The order those stages appear in
- The triggers attached to each stage entry
- The task template attached to each stage

There is no concept of "this company doesn't have a pipeline." Every company has one from the moment they complete signup. New companies get the pipeline associated with whichever template they selected.

### 3.2 Pipeline shape

| Element | Notes |
|---|---|
| Active stages | Ordered list. Minimum one. No hard maximum, but a soft recommendation of 8 or fewer for usable kanban rendering. |
| Terminal stages | Four system-defined states: hired, rejected, withdrawn, archived. Not editable by companies, not part of the active stages list, not rendered as kanban columns. |
| First active stage | The stage where new applications land. Conventionally named "Applied," but the name is editable like any other stage. |
| Stage names | Free text, 1–40 characters. No uniqueness constraint within a pipeline (companies can name two stages the same if they want, though this is discouraged in the editor UX). |
| Stage order | Implicit from the order of the active stages list. No separate `order` integer required if the list itself is ordered in storage. |

### 3.3 Pipeline editing

Companies can edit their pipeline at any time. Allowed operations:

| Operation | Notes |
|---|---|
| Add stage | Append or insert at any position in the active stages list. |
| Rename stage | Edit the name freely. The display label updates everywhere the stage is referenced. |
| Reorder stages | Drag-to-reorder in the editor (UX deferred). |
| Remove stage | Allowed if no live applications are currently in the stage on any pre-snapshot job. Pre-snapshotted jobs retain the stage in their snapshot regardless. |
| Configure triggers | Per stage. Triggers fire when an application enters that stage. Unchanged in mechanism from the existing trigger spec. |
| Configure tasks | Per stage. Task template instantiates on each application that enters the stage. Unchanged in mechanism from the existing task spec. |
| Replace from template | Replace the current pipeline with one of the seeded templates. Destructive of the current configuration; pre-snapshotted jobs unaffected. |

Companies cannot edit the terminal stages. Their existence, names, and worker-facing notifications are platform-defined.

### 3.4 Pipeline snapshot at job creation

When a company posts a job, the company's current pipeline is snapshotted into the job record. The snapshot includes:

- The active stages and their order
- Each stage's name
- Each stage's triggers configuration
- Each stage's task template

Once a job is posted, its snapshotted pipeline is immutable for the life of the job. Subsequent edits to the company's pipeline do not propagate. This preserves the contract a worker applies under: the process they see on day one is the process they progress through.

The snapshot pattern is unchanged from prior locked decisions for triggers and tasks — it's now extended to cover stages themselves.

---

## 4. Stage data model

### 4.1 Active stage

```
pipeline_stage:
  id: UUID
  pipeline_id: UUID (FK to company_pipeline)
  name: string (1-40 chars)
  order: integer
  created_at: timestamp
  updated_at: timestamp
```

No `semantic_type` field. No `enabled` flag. No `purpose` field — that field from the prior task spec is dropped along with the rest of the four-stage scaffolding. Stage names carry their own meaning.

### 4.2 Job pipeline snapshot

When a job is created, the snapshot is stored on the job (or a related table, implementation choice). The snapshot is a structured copy of the company's pipeline at the moment of posting:

```
job.pipeline_snapshot:
  stages: array of {
    id: UUID (matches the original pipeline_stage.id at snapshot time)
    name: string
    order: integer
    triggers: array (per existing trigger spec)
    task_template: array (per existing task spec)
  }
```

Application records reference the snapshotted stage by ID, not the live `pipeline_stage` row. This is what allows pipeline edits to leave existing jobs untouched.

### 4.3 Terminal states

Terminal states live outside the pipeline_stage table. They are platform-defined enum values on the application record:

```
application.status: enum (
  'active',
  'terminal_hired',
  'terminal_rejected',
  'terminal_withdrawn',
  'terminal_archived'
)
```

When an application is `active`, it has a `current_stage_id` referencing a snapshotted stage on its job. When an application is in any terminal state, `current_stage_id` is the last stage it was in before entering the terminal state (for history and log purposes), but the application is no longer considered "in" that stage.

Terminal state transitions are triggered by:

| Terminal state | Trigger | Worker notification |
|---|---|---|
| terminal_hired | Employer affirmatively hires (Mark Hired action) | "You've been hired for [Job title] at [Company]." |
| terminal_rejected | Employer affirmatively rejects (Reject action) | "Your application for [Job title] at [Company] was not selected." |
| terminal_withdrawn | Worker withdraws their own application | None — internal-only. |
| terminal_archived | Job closed or deleted with active applicants on it | "[Company] has closed the position for [Job title]. Your application is no longer active." |

Terminal state behavior is unchanged from the locked May 15 foundation update. This spec inherits it as-is.

---

## 5. Templates

### 5.1 The three options

At signup, a company picks one of three options:

| Option | Outcome |
|---|---|
| Short | Pre-built short pipeline with stages, suggested triggers, and starter task templates. Suited for fast-turnaround hiring, contract or gig work, single-decision processes. |
| Long | Pre-built long pipeline with more stages, suggested triggers, and starter task templates. Suited for multi-step hiring with screening, interviews, and offers. |
| Build Your Own | Empty pipeline with just one stage (named "Applied" by default). No pre-built triggers or tasks. The company configures the rest in the pipeline editor. |

The signup flow asks the company which option fits their hiring best, with brief descriptions of each. The choice writes a pipeline to the new company record before the dashboard first loads.

### 5.2 Template architecture

Templates are seed data, not code. Each template is a JSON file in version control, structured to match the pipeline data model:

```
seeds/pipeline-templates/short.json
seeds/pipeline-templates/long.json
```

Build Your Own does not need a seed file — it's a hardcoded one-stage pipeline created on the fly during signup.

Each template file defines:
- Stages (name and order)
- Per-stage triggers (using the existing trigger configuration schema)
- Per-stage task template (using the existing task template schema)

The pipeline foundation does not constrain template content. Two stages or twelve stages, no triggers or many triggers, no tasks or many tasks — all valid. Content is a separate concern.

### 5.3 Template content is deferred

Actual template content (stage names, task lists, trigger configurations for Short and Long) is not part of this spec. Filling in the seed files is a separate content task to be done after the architecture is in place.

When the content task is undertaken, the templates should be working examples — pipelines that a real company could use without editing. Empty stages or skeleton task lists undermine the value proposition of "pick a template and go."

### 5.4 Template replacement after signup

A company can replace their current pipeline with one of the seeded templates at any time via the pipeline editor. This is a destructive operation against the current configuration: the existing stages, triggers, and tasks are replaced with the template's. Pre-snapshotted jobs are unaffected; only the live pipeline (for future job postings) is overwritten.

The editor surfaces this as "Replace pipeline with template" with a confirmation dialog. The confirmation lists what will be lost (current stage names, triggers, tasks).

---

## 6. Worker-facing stages

### 6.1 The three states

Workers see three states, derived from the application's status and stage position:

| Worker sees | Derivation |
|---|---|
| Applied | Application is in the first stage of the snapshotted pipeline and has not been moved. |
| In Review | Application has been moved past the first stage and is not in a terminal state. |
| Closed | Application is in any terminal state (`terminal_hired`, `terminal_rejected`, `terminal_withdrawn`, `terminal_archived`). |

These states do not map to specific employer stages. They describe the application's overall status from the worker's perspective. Two workers applied to two different companies might both be in "In Review" while sitting in completely different employer-defined stages.

### 6.2 The "moved past the first stage" rule

The transition from Applied to In Review happens when the application's `current_stage_id` changes from the first stage of the snapshotted pipeline to any other stage. This is a simple comparison: if the application has ever been moved out of the first stage, it is In Review.

If an employer moves an application back to the first stage (a backward move), the worker view stays In Review. The transition from Applied to In Review is one-way for worker-facing display purposes. The underlying log captures the actual movements regardless.

This is necessary because otherwise a worker could see their state flicker between Applied and In Review if an employer corrected a stage move. The worker view smooths this.

### 6.3 Offers are messages, not stages

When an employer extends an offer, the worker is notified via:

- An in-app notification ("You've received an offer for [Job title] at [Company]")
- A message in the messaging surface (deferred spec)
- Optional email notification depending on the worker's notification preferences

The worker's application stage badge remains "In Review" until the application transitions to a terminal state. There is no "Offer" stage badge on the worker side.

This decision rests on the principle that offers are too important to be communicated by a badge change. They warrant active notification.

### 6.4 What does NOT change worker stage

The following employer-side events have no effect on the worker's stage badge:

- Stage name changes by the employer (workers don't see employer stage names anyway)
- Triggers firing on stage entry
- Task completion or skip
- Stage notes being written
- Boost being applied to the application
- The employer adding or removing stages from their pipeline (workers see snapshotted state)

The worker-facing stage is intentionally decoupled from employer pipeline mechanics.

### 6.5 Boost and Withdraw availability

Both Boost and Withdraw are available at any application state except Closed:

| Worker stage | Boost available | Withdraw available |
|---|---|---|
| Applied | Yes | Yes |
| In Review | Yes | Yes |
| Closed | No | No |

This is a simplification from the prior locked rules, which hid Boost and Withdraw at the Offer stage. With offers no longer a stage, the rule collapses to "available until terminal."

If a worker boosts an application that has secretly received an offer (employer extended it but worker hasn't actioned the offer yet), the boost is wasted — the employer has already decided. This is an acceptable v1 edge case. The simpler rule is worth the rare wasted boost.

---

## 7. Triggers and tasks at the org level

### 7.1 Trigger configuration

Triggers were previously configured per-stage on each job's pipeline. With pipelines now at the company level, trigger configuration moves with them:

- Companies configure triggers per stage on their org-level pipeline.
- When a job is posted, the triggers configured at that moment are snapshotted onto the job along with the stage.
- The snapshot is immutable for the life of the job. Subsequent edits to the company pipeline's triggers do not propagate.

Mechanism is unchanged from the existing trigger spec. The v1 trigger set (five triggers) is unchanged.

### 7.2 Task templates

Task templates were previously configured per-stage on each job's pipeline. Same transition:

- Companies configure task templates per stage on their org-level pipeline.
- The task template at the time of job posting is snapshotted onto the job.
- When an application enters a stage, the snapshotted task template instantiates as task instances on that application.

Mechanism is unchanged from the existing task spec. Ad-hoc tasks, skip state, soft-block on advance, etc., all continue working as specified.

### 7.3 Editing triggers or tasks after the fact

The same "edits apply to future jobs only" rule applies:

- Editing a stage's trigger configuration at the org level affects future job postings only.
- Editing a stage's task template at the org level affects future job postings only.
- Existing jobs continue running against their snapshot.

This is the same pattern as stage edits — and it's the same pattern that already existed for triggers and tasks before this pivot. The only structural change is that the configuration source is now one record per company instead of one per job.

---

## 8. Data model summary

### 8.1 Updated tables

**`company_pipeline`** — one row per company.

```
company_pipeline:
  id: UUID
  company_id: UUID (FK, unique — one pipeline per company)
  created_at: timestamp
  updated_at: timestamp
```

The active stages are referenced via `pipeline_stage` (Section 4.1).

**`pipeline_stage`** — updated from the prior version.

```
pipeline_stage:
  id: UUID
  pipeline_id: UUID (FK to company_pipeline)
  name: string (1-40 chars)
  order: integer
  created_at: timestamp
  updated_at: timestamp
```

Removed fields: `semantic_type`, `enabled`, `purpose`. Removed constraint: `UNIQUE(pipeline_id, semantic_type)`.

**`job`** — gains a snapshot field.

```
job:
  ... existing fields ...
  pipeline_snapshot: JSONB (or related table — implementation choice)
```

The snapshot field stores the structured pipeline that was current at the moment of job posting.

**`application`** — references the snapshotted stage.

```
application:
  ... existing fields ...
  current_stage_id: UUID (references a stage within the job's pipeline snapshot)
  status: enum ('active', 'terminal_hired', 'terminal_rejected', 'terminal_withdrawn', 'terminal_archived')
```

### 8.2 Removed concepts

| Removed | Replaced by |
|---|---|
| `pipeline_stage.semantic_type` | Stage name only |
| `pipeline_stage.enabled` | If a stage isn't wanted, it's not in the pipeline |
| `pipeline_stage.purpose` | Stage names are descriptive enough; tasks carry process detail |
| `UNIQUE(pipeline_id, semantic_type)` constraint | No equivalent — companies can have any stages they want |
| "Next enabled stage" computation | Simply "next stage in order" |
| Ambiguity picker on drag-and-drop | Not needed — drops are unambiguous since columns are real stages |
| "Disabled stage" handling everywhere | Not needed — disabled stages don't exist |

---

## 9. Implementation notes

### 9.1 Migration of existing data

For any companies already in the system at migration time:

1. Create a `company_pipeline` row for each company.
2. For each `pipeline_stage` row that previously existed (under whatever the old model was), migrate to the new shape: keep `name`, drop `semantic_type` and `enabled`, retain `order`.
3. For companies that had stages disabled in the old model, drop those rows entirely.
4. For existing jobs, materialize a `pipeline_snapshot` from the current pipeline state. This is a best-effort migration; jobs posted under the old four-stage model get a snapshot that represents what their pipeline structure was.
5. For existing applications, update `current_stage_id` to reference the new snapshotted stage. Terminal applications can have their `current_stage_id` left null or pointed at the closest equivalent — they no longer need it for active stage display.

### 9.2 Worker-facing stage derivation

The derivation in Section 6 is best computed in the API response, not stored as a denormalized field. A simple function reads the application status and stage position and returns one of Applied / In Review / Closed. Avoid storing a `worker_stage` column — it would need to be kept in sync with every status change and stage move.

### 9.3 Order field

`pipeline_stage.order` is required for storage of an ordered list in a relational schema. If you're using a list-typed column (Postgres array, etc.) or a related ordered collection in your ORM, you can omit the field. Pick whichever pattern is consistent with the rest of the codebase.

### 9.4 First stage tracking

Worker stage derivation needs to know which stage is the "first" stage of a snapshot. This is the stage with the lowest `order` value in the snapshot. Compute on the fly; don't store a `is_first_stage` flag.

### 9.5 Snapshot storage

The `pipeline_snapshot` field on `job` can be a JSONB column or a separate related table. JSONB is simpler if the snapshot is never queried piecewise; a related table is better if queries like "show me all jobs that had a stage named X" become common. JSONB is the recommended starting point — queries against snapshotted historical data are rare in practice.

### 9.6 Terminal state notifications

Terminal state worker notifications are platform-defined. Companies don't configure them and can't override their copy. If a company wants to add a personal touch (e.g. a rejection note), that's a separate optional field on the rejection action, not a customization of the platform notification.

### 9.7 Stage removal constraints

A company can remove a stage from their pipeline if no live applications on any *current-snapshot* job are in that stage. Applications on previously-posted jobs (with older snapshots) don't block removal — their snapshot is immutable and continues to function. The editor should surface a count of "X applications in this stage on the current pipeline" before allowing removal.

If the company really wants to remove a stage with active applications, the suggested flow is: move those applications first, then remove the stage. The editor surfaces this requirement rather than auto-moving.

---

## 10. Routing

This spec doesn't introduce new routes. The pipeline editor (separate spec) will live under `/settings/pipeline` or similar. The data model defined here is consumed by every existing applicant-facing surface.

---

## 11. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | When a company replaces their pipeline from a template, do the snapshotted task templates and trigger configurations also get replaced, or just the stages? | Template semantics | Everything is replaced. Templates are working examples, including their tasks and triggers. Partial replacement (e.g. "just stages") would defeat the purpose. |
| 2 | What happens if a company tries to remove their last active stage? | Editor UX | Disallow. The pipeline must have at least one active stage. The editor surfaces this constraint rather than silently allowing then producing an unusable pipeline. |
| 3 | If the worker views their application history, do they see the employer-side stage names? | Worker information disclosure | No. Workers see only Applied / In Review / Closed in their own history, same as the live state. Internal employer stage names are not leaked. |
| 4 | When the first stage of a pipeline is renamed (e.g. from "Applied" to "New"), do worker-side new applications appear as "Applied" (worker terminology) or "New" (employer terminology)? | Worker-facing terminology | "Applied" — worker terminology is platform-defined and decoupled from employer stage names entirely. |
| 5 | Are templates versioned? If we update the Short template after launch, do companies that signed up under the old version notice? | Template lifecycle | No versioning in v1. Templates are seeded once per company at signup. Subsequent template updates only affect new signups. Companies who want the latest template can "Replace pipeline with template" manually. |

---

## 12. Future considerations

### 12.1 Multiple pipelines per company

V1 supports one pipeline per company. A multi-pipeline future could support per-role or per-department pipelines (e.g. one for hourly trades, one for salaried management). The data model supports this — `company_pipeline` could become a list — but no v1 surface exposes it.

### 12.2 Pipeline templates as a marketplace

A future enhancement could let companies share their pipelines as community templates. V1 ships only the platform-curated Short, Long, and Build Your Own options.

### 12.3 Per-stage analytics

The data model captures stage entry/exit times via the application log (existing). A future analytics layer could surface per-stage time-in-stage averages, conversion rates, and bottleneck detection. Out of scope for v1 but the data is being captured.

### 12.4 Versioned templates

If templates need to evolve while preserving historical reproducibility, a versioning layer can be added later. The seed JSON files would gain version numbers, and the company record would track which template version they were seeded from. Not a v1 concern.

### 12.5 Cross-company stage taxonomy for benchmarking

The decision to remove semantic types means cross-company stage comparison is impossible at the platform level — "average time in Interview" can't be computed across all companies because companies don't have a shared "Interview" concept. If platform-wide benchmarking becomes valuable, a lightweight tagging layer could be added back (employer optionally tags each stage as "screening-like," "interview-like," etc.) for analytics only. Not a v1 concern.
