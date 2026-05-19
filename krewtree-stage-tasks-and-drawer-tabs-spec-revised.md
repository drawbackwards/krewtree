# Krewtree — Stage Tasks & Drawer Tabs (Revised)
### Product Specification
**Scope:** Touch-up to the May 18, 2026 stage tasks and drawer tabs spec
**Status:** Decisions locked
**Date:** May 19, 2026 (revision)

---

## 1. Purpose of this revision

The May 18, 2026 stage tasks spec was written when stages were anchored to four fixed semantic types (Screening, Assessment, Interview, Offer). The May 19, 2026 pipeline pivot removed semantic types entirely in favor of org-level configurable pipelines.

The task system, drawer tabs, and stage purpose decisions from the May 18 spec are all unchanged in mechanism. The only changes are removing semantic type references and updating language to match the new pipeline foundation.

**Read this revision alongside the May 18 spec.** This revision is a delta, not a full replacement. Sections not addressed here carry forward unchanged. Once code migration is complete, this revision and the May 18 spec should be merged into a single canonical document.

**Foundation dependencies:** Pipeline foundation spec (May 19, 2026), pipeline pivot (May 19, 2026).

---

## 2. Changes to the locked decisions

### 2.1 Stage purpose field

**May 18 decision:** Optional one-sentence description per stage, employer-facing only, no system behavior. Defined at company-default pipeline level.

**Revision:** Unchanged. The purpose field survives the pivot. It's still an optional field on each stage, surfaced in the pipeline editor and in the drawer's Pipeline tab. The earlier pipeline foundation spec draft mentioned dropping purpose; that was an over-correction. Purpose stays.

The data model addition:

```
pipeline_stage:
  ... existing fields ...
  purpose: string | null  (optional, max 280 chars)
```

### 2.2 Custom stage names

**May 18 decision:** Stage names fixed to semantic type display label. Companies cannot rename.

**Revision:** Reversed. Stage names are now fully editable (1–40 chars, free text). The constraint disappears along with semantic types. Companies own their stage vocabulary.

The reasoning that drove the May 18 decision (snapshot complexity, log readability, kanban consistency) is now resolved by the org-level pipeline pattern: every job at a company uses the same pipeline, so cross-job consistency is automatic, and snapshots preserve historical pipelines without ambiguity.

### 2.3 One stage per semantic type

**May 18 decision:** A pipeline has at most one stage of each active semantic type.

**Revision:** Constraint removed along with semantic types. Companies can have any number of stages, named whatever they want. The unique constraint on the stage table is dropped.

### 2.4 Drag-and-drop ambiguity picker

**May 18 decision:** Removed (drops are unambiguous when there's one stage per type).

**Revision:** Stays removed. Now the reason is different: drops are unambiguous because every column is a real stage in the pipeline, not because of a one-per-type constraint. Implementation is the same; the rationale is what changed.

### 2.5 Disabled stages skipped on advance

**May 18 decision:** Advance affordance targets the next enabled stage, skipping disabled ones.

**Revision:** Constraint removed along with the enable/disable concept. There are no disabled stages anymore — if a stage isn't wanted, it's not in the pipeline. Advance simply targets the next stage in order.

This simplifies the Advance button label and behavior. The button reads "Advance to [next stage name]" where next stage is just the next-in-order. No more "next enabled stage" computation.

### 2.6 Invalid drop case

**May 18 decision:** A drop is invalid only when the target semantic type is disabled in the job's pipeline.

**Revision:** Updated. A drop is invalid only when the target column's stage name doesn't exist in the application's job snapshot (see applicants widget spec Section 5.6 for cross-job snapshot handling).

Toast copy update: "This job's pipeline doesn't include a '[Stage name]' stage." (Was: "This job's pipeline doesn't have a [Stage type] stage.")

---

## 3. Language updates

References to semantic types throughout the May 18 spec are updated. Examples:

| Old language | New language |
|---|---|
| "Stage type" / "semantic type" | "Stage" |
| "Stage of semantic type 'screening'" | "Stage named [whatever the employer named it]" |
| "Next enabled stage" | "Next stage" |
| "First active stage" (semantic-type-aware) | "First stage" (positional, lowest order in pipeline) |

The "active" qualifier is retained where it distinguishes pipeline stages from terminal states (e.g. "active stages vs. terminal stages"), but no longer carries the semantic-type meaning.

---

## 4. Pipeline tab in drawer (revised)

The Pipeline tab structure from the May 18 spec is unchanged. The content within it now reflects custom stage names instead of semantic-type labels.

### 4.1 Current stage indicator

**Before:** Stage name = semantic type display label (e.g. "Interview", "Screening").

**After:** Stage name = the employer's actual stage name (e.g. "Phone screen", "On-site interview", "Reference check").

### 4.2 Inline advance button

**Before:** Label "Advance to [next enabled stage name]" with disabled-stage skip logic.

**After:** Label "Advance to [next stage name]" — simply the next stage in order. No skip logic.

### 4.3 Terminal stage display

**Before:** Shows terminal state name (Hired, Rejected, etc.) with task list hidden, advance replaced with "This application is closed."

**After:** Unchanged. Terminal states are still system-defined and outside the editable pipeline.

---

## 5. Task system

The task system is unchanged in mechanism. Tasks are still:

- Per-stage on the company pipeline (snapshotted at job creation)
- Instantiated on each application when it enters a stage
- Editable (ad-hoc) or template-sourced (immutable)
- Three states: incomplete, completed, skipped
- Soft-block on advance for incomplete required tasks

Language updates apply: "stage" replaces any "semantic type" references in task-related copy.

---

## 6. Log tab

Unchanged in structure. Log entries that mentioned semantic types in event descriptions now use the stage name directly.

| Before | After |
|---|---|
| "Advanced from Screening to Interview" | "Advanced from Phone Screen to On-Site Interview" |
| "Entered stage of type Assessment" | "Entered Phone Screen" |

The log is a read-only event stream; this is purely a copy adjustment in how events are rendered.

---

## 7. Data model changes summary

| Change | Description |
|---|---|
| Drop `pipeline_stage.semantic_type` | Removed entirely. |
| Drop `pipeline_stage.enabled` | Removed. If a stage isn't wanted, it's not in the pipeline. |
| Keep `pipeline_stage.purpose` | Optional. Carries forward. |
| Add `pipeline_stage.name` constraint | Free text, 1–40 chars. No uniqueness constraint within pipeline. |
| Drop `UNIQUE(pipeline_id, semantic_type)` | Removed. |
| Restructure `pipeline_stage.pipeline_id` | Now references `company_pipeline` (one per company), not per-job pipeline. |
| `application_task` references unchanged | Tasks still reference the snapshotted stage on the job. |
| `application_stage_notes` references unchanged | Stage notes still reference the snapshotted stage. |

---

## 8. Implementation notes

### 8.1 Migration of existing tasks and stage notes

For applications already in flight when the migration runs:

- Existing `application_task` rows: keep their `stage_id` references. Stage IDs in the migrated pipeline snapshots should preserve the same UUIDs where possible. Task instances continue to work against their snapshot.
- Existing `application_stage_notes` rows: same — stage references preserved through snapshot migration.

The task system shouldn't notice the pipeline change. Triggers and tasks fire against snapshotted stages on jobs, which are immutable.

### 8.2 Trigger configuration

Triggers attached to stages now live on the org-level pipeline. When a job is posted, the triggers are snapshotted onto the job along with the stage. Same snapshot pattern as before, just one record per company instead of one per job.

### 8.3 Copy review

Code should grep the codebase for:

- "semantic_type" / "semantic type" — should not appear after migration
- "Screening" / "Assessment" / "Interview" / "Offer" used as stage type labels — should be replaced with dynamic stage name lookups
- "next enabled stage" / "disabled stage" — references can be removed
- "stage type" used in UI copy — replace with "stage"

---

## 9. Open questions

| # | Question | Recommended default |
|---|---|---|
| 1 | Does the drawer surface the stage purpose anywhere besides the Pipeline tab? | No. Purpose is reference content for the employer; not relevant elsewhere. |
| 2 | If a stage is renamed while applications are in it, do the drawer's Pipeline tab and log entries reflect the new name retroactively? | No — they reflect the snapshotted name. The live pipeline rename only affects future job postings. Existing applications keep their snapshot's names everywhere they're surfaced. |
| 3 | If a stage is removed from the live pipeline, but applications still exist in it on pre-snapshot jobs, does the drawer's Pipeline tab still work? | Yes. Snapshotted stages persist for the life of the job. The drawer reads from the snapshot, not the live pipeline. |
| 4 | Are task templates still defined per-stage on the org-level pipeline? | Yes. Same pattern as triggers — defined per stage at the org level, snapshotted onto jobs at posting. |

---

## 10. What carries forward unchanged

Most of the May 18 spec stands as written. The following sections do not need revision:

- Section 5 (Task system mechanics): all of it
- Section 7 (Applicant drawer tabs structure): all of it
- Section 9 (Data model summary): apart from the changes in Section 7 of this revision
- Section 10 (Routing): all of it
- Section 11 (Implementation notes): most of it; subsections referencing disabled-stage logic are obsolete
- Section 12 (Open questions): most of it
- Section 13 (Future considerations): all of it

When time permits, the May 18 spec and this revision should be merged into a single document — the May 18 spec rewritten in place with these changes applied — to avoid the cognitive load of cross-referencing two documents. For now, this revision can be appended or cross-referenced.
