# Krewtree — Stage Tasks & Applicant Drawer Tabs
### Product Specification
**Scope:** Stage-level task system + applicant drawer tabbed structure (Pipeline tab detail)
**Status:** Decisions locked
**Date:** May 18, 2026 (revised)

---

## 1. Context & scope

The trigger system specced previously handles the automation layer of the hiring pipeline: messages send, SLA timers start, flags raise, applications archive. What it does not capture is the human workflow inside a stage. When an employer moves an applicant into Screening, the trigger system sends a screening message and starts an SLA timer. What it doesn't track is the actual work the employer is doing: the phone screen, the reference check, the availability confirmation.

This spec adds two coordinated pieces to address that gap:

1. A **stage task system** that lets companies define checklists of work per stage, instantiated on each application that enters the stage, with per-task completion state, notes, skip state, and ad-hoc additions.
2. A **tabbed structure for the applicant drawer** that gives the task system a home alongside the existing summary view and a new event log.

This revision (May 18) folds in the detailed Pipeline tab spec and three foundation-level updates that came out of that session. See Section 3 for the foundation updates.

**Out of scope for this spec:** Applicant profile page (the full-page view at `/dashboard/applicants/[id]`, which inherits the tab pattern in a future sprint), task analytics, task assignment across multiple users (deferred until multi-seat ships), tasks owned by triggers (future enhancement).

**Foundation dependencies:** Pipeline foundation (semantic types, two-level inheritance, per-job snapshots), trigger system (five v1 triggers, stage-entry firing, applicant log writes), applicant drawer (existing slide-over panel pattern).

---

## 2. Key decisions

| Topic | Decision |
|---|---|
| Stage purpose field | Optional one-sentence description per stage. Employer-facing only, no system behavior. Defined at company-default pipeline level, snapshotted at job creation. |
| Task templates | Optional checklist defined per stage at the company-default pipeline level. Snapshotted into the job's pipeline at job creation. Same inheritance pattern as triggers. |
| Task instantiation | When an application enters a stage, the stage's task template instantiates as a set of tasks on that application. |
| Ad-hoc tasks | Employers can add tasks to a specific application at runtime without modifying the template. Marked as `source: 'ad_hoc'`. |
| Task completion | Advisory by default. Tasks can be checked off but never block stage advancement. |
| Task skip | Tasks have a third state: skipped. Skip lives in the row overflow menu. Skipped tasks are excluded from completion analytics and do not trigger the soft-block modal. |
| Required tasks | Optional `is_required` flag per task. If any required task is incomplete AND not skipped on advance, a soft-block confirmation modal appears. Never a hard gate. |
| Incomplete tasks on advance | Carried forward in history. Visible on the application record. Not auto-completed. Not displayed on the new stage's task list. |
| Stage notes | Free-text field per application per stage, separate from per-task notes. Captures general observations that don't fit a specific task. |
| Tasks and triggers | Independent systems in v1. Tasks do not fire triggers. Triggers do not complete tasks. |
| Terminology | "Tasks" (not steps, actions, checklist items, or subtasks). |
| Drawer structure | Three tabs: Summary (default), Pipeline, Log. |
| Tab order | Summary → Pipeline → Log. |
| Default tab on open | Summary. |
| Overflow actions placement | Persistent action bar above the tab strip. Available from any tab. |
| Log tab scope | Reverse-chronological event list. Timestamp, actor, short description per row. No filters, no search, no expansion in v1. |
| Card-level task surfacing | Not in v1. Tasks live in the drawer only. Card visual remains unchanged. |
| Pipeline tab row interaction | Option 1: hover-revealed overflow menu plus inline expand for notes. Editing label/due/required happens via overflow → Edit. |
| Completed/skipped task order | Stay in place. Visually muted. Completed and skipped use distinct treatments. |
| Inline advance controls | Single "Advance to [next enabled stage]" button at bottom of Pipeline tab. No inline Reject (avoid destructive misclick after task review). Sticky to bottom of tab scroll. |
| Pipeline tab in terminal stages | Stage indicator shows terminal state name. Task list hidden. Stage notes editable. Inline advance replaced with muted "This application is closed." |

---

## 3. Foundation updates from this session

Three foundation-level decisions came out of this session's work. Each affects the locked pipeline foundation, the kanban spec, and downstream implementation. These supersede prior foundation decisions.

### 3.1 Custom stage names removed

Stage names are fixed to the semantic type display label. Companies cannot rename stages.

- Active stages always read: **Screening**, **Assessment**, **Interview**, **Offer**.
- Terminal states always read: **Hired**, **Rejected**, **Withdrawn**, **Archived**.
- The `stage.name` field is removed from the data model. `stage.semantic_type` is the canonical identifier and source of display label.
- Company-specific vocabulary for granular work (e.g. "Phone screen", "On-site panel") lives in the task system, not in stage naming. Tasks are the unit of company-specific process language.

**Why:** The stage purpose field and the task system already absorb the work custom naming was trying to do, without the structural cost (snapshot complexity, log readability, cross-job kanban consistency).

### 3.2 One stage per semantic type per pipeline

A pipeline has at most one stage of each active semantic type. Companies enable or disable each of the four active stages; they cannot duplicate them.

- Schema constraint: `UNIQUE(pipeline_id, semantic_type)` on the stage table for active types.
- Multiple rounds of the same kind of work (e.g. two interview rounds) are represented as multiple **tasks** within the Interview stage, not as multiple Interview stages.
- The `stage.order` field becomes redundant for active stages — order is implicit from semantic type: Screening → Assessment → Interview → Offer. Retain the field only if needed for terminal handling.

### 3.3 Drag-and-drop ambiguity picker removed

With one stage per semantic type, drops are never ambiguous. The picker is removed.

- The "ambiguous drops" section of the kanban spec (Section 6.2 of `krewtree-dashboard-kanban-spec.md`) is deleted.
- A card dropped on a column commits directly to that column's stage. No picker, no intermediate state.
- The undo toast still appears for every successful drag.

### 3.4 Disabled stages skipped on advance

The "Advance to next stage" affordance always targets the next **enabled** stage in the pipeline.

- If a job has Screening, Interview, Offer enabled (Assessment disabled), advancing from Screening goes directly to Interview.
- The Advance button label reflects the actual next enabled stage: "Advance to Interview."
- In the inline Pipeline tab Advance button and the persistent action bar Advance button: same behavior.
- Backward moves on the kanban can still target any enabled stage. Backward moves to a disabled stage are not possible.

### 3.5 Invalid drop case simplified

A drop is invalid only when the target semantic type is **disabled** in the job's pipeline.

- Hover state: red tint as before.
- Toast copy: "This job's pipeline doesn't include a [Stage type] stage."

---

## 4. Stage purpose

Each stage on a company's default pipeline gains an optional **purpose** field: a single sentence describing why this stage exists in the company's hiring process. This is employer-facing reference content only. It has no system behavior, does not affect triggers, and is not shown to workers.

| Field | Type | Notes |
|---|---|---|
| `purpose` | string \| null | Optional. Max length 280 characters. Displayed in the pipeline editor and surfaced in the drawer's Pipeline tab when an applicant is in this stage. |

The purpose field is snapshotted at job creation along with the rest of the pipeline definition. Companies who never set a purpose see the field absent in both the editor and the drawer; nothing breaks.

**Why this exists:** Six months after a pipeline is set up, an employer editing it should be able to remember what each stage is for without inferring it from the trigger configuration. The purpose field answers "what is this stage *for* in our process?" without forcing them to read the system behavior.

---

## 5. Task system

### 5.1 Task templates

Each stage on a company's default pipeline can have an associated **task template**: an ordered list of tasks that will instantiate on every application that enters the stage.

Task templates are defined at the company-default pipeline level. At job creation, the template is snapshotted into the job's pipeline along with the stage definition and triggers. Once the job is live, the template is locked for that job.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Identifier for the template task. |
| `stage_id` | UUID | Foreign key to the stage in the pipeline definition. |
| `label` | string | The task description shown to the employer. Free text. Max 200 characters. |
| `is_required` | boolean | Default false. If true, an incomplete-and-unskipped instance of this task triggers a soft-block confirmation modal on stage advance. |
| `order` | integer | Display order within the stage's task list. |

### 5.2 Task instantiation

When an application enters a stage (whether on application submission, drag-and-drop, or programmatic move), the stage's task template is instantiated as a set of **task instances** on that application.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Identifier for this task instance. |
| `application_id` | UUID | Foreign key to the application. |
| `stage_id` | UUID | Foreign key to the snapshotted stage on the job's pipeline. |
| `source` | enum | `template` or `ad_hoc`. Tracks origin for analytics and history. |
| `template_task_id` | UUID \| null | If `source = 'template'`, references the template task. Null for `ad_hoc`. |
| `label` | string | Copied from template at instantiation. Editable on ad-hoc tasks; not editable on template-sourced instances. |
| `is_required` | boolean | Copied from template. Editable on ad-hoc tasks only. |
| `completed_at` | timestamp \| null | Set when the task is marked complete. |
| `completed_by` | user_id \| null | Set when the task is marked complete. |
| `skipped_at` | timestamp \| null | Set when the task is marked skipped (not applicable). |
| `skipped_by` | user_id \| null | Set when the task is marked skipped. |
| `notes` | string \| null | Optional per-task notes. Free text. |
| `due_date` | date \| null | Optional due date. |
| `order` | integer | Display order. Inherited from template for template-sourced tasks; appended at end for ad-hoc tasks. |
| `created_at` | timestamp | When the task instance was created. |

A task instance is in exactly one of three states at any time:
- **Incomplete** — `completed_at IS NULL AND skipped_at IS NULL`
- **Completed** — `completed_at IS NOT NULL` (skipped_at must be null; mutually exclusive)
- **Skipped** — `skipped_at IS NOT NULL` (completed_at must be null; mutually exclusive)

Re-entering a stage (e.g. moving an applicant from Interview back to Screening) does **not** re-instantiate tasks. The original task instances are still attached to the application for that stage. This avoids losing completion or skip state from prior visits to the stage.

### 5.3 Ad-hoc tasks

Employers can add tasks to a specific application at runtime without modifying the template. Ad-hoc tasks:

- Are added from the Pipeline tab of the applicant drawer via an "Add task" affordance below the task list.
- Are associated with the application's current stage at the time of creation.
- Persist on the application record even after the application leaves the stage.
- Can be edited (label, due date, required flag) or deleted by the employer at any time.
- Are flagged with `source: 'ad_hoc'` for distinction in the data model. UI does not visually distinguish them from template tasks in v1.

### 5.4 Task completion

Tasks are advisory. They never block stage advancement directly. Behavior:

| Scenario | Behavior |
|---|---|
| Employer checks a task | `completed_at` and `completed_by` set. UI shows the task as complete with a strike-through and filled checkbox. |
| Employer unchecks a task | `completed_at` and `completed_by` cleared. Task returns to incomplete. |
| Employer skips a task | `skipped_at` and `skipped_by` set. UI shows muted state with a "Skipped" tag. |
| Employer unskips a task | `skipped_at` and `skipped_by` cleared. Task returns to incomplete. |
| Employer advances applicant with all required tasks resolved (completed or skipped) | Advance proceeds normally. Triggers fire. |
| Employer advances applicant with one or more required tasks incomplete-and-unskipped | Soft-block confirmation modal: "X required task(s) are incomplete. Advance anyway?" with Cancel and Advance buttons. On Advance, the move proceeds and triggers fire. |
| Employer advances applicant with non-required tasks incomplete | Advance proceeds normally. No modal. |

There is no hard-block on any task in v1. Companies who want stricter workflows can flag tasks as required and rely on the soft-block modal as friction.

### 5.5 Task skip

Skip is the affirmative way to say "this task doesn't apply to this applicant" without corrupting the completion record by checking off something that wasn't done.

- **Action location:** Row overflow menu (⋯ → Skip).
- **Visual treatment:** Muted text, no checkmark, small "Skipped" tag near the label. Visually distinct from completed (which uses strike-through and filled checkmark).
- **Reversible:** Unskip via the same overflow menu. Returns task to incomplete.
- **Soft-block interaction:** A skipped required task is considered resolved. It does not trigger the soft-block modal.
- **Analytics:** Skipped tasks are excluded from the denominator of completion rate calculations. They are tracked separately as a skip rate metric.
- **Logged:** `task_skipped` and `task_unskipped` events written to the applicant log.
- **Available on:** Both template and ad-hoc tasks.

### 5.6 Incomplete tasks on advance

When an applicant advances to a new stage, incomplete tasks from the previous stage remain attached to the application record. They:

- Do **not** appear on the new stage's task list in the Pipeline tab.
- **Do** appear in the application history and Log tab (carry-forward events are logged).
- Are visible on the application record if the applicant ever returns to the previous stage.

This preserves an honest record of what was done, what was skipped, and what was left incomplete.

### 5.7 Stage notes

Each application has a free-text **stage notes** field per stage it has entered. This is separate from per-task notes and captures general observations that don't fit a specific task ("Strong communicator, would be a good fit for client-facing work").

| Field | Type | Notes |
|---|---|---|
| `application_id` | UUID | Foreign key. |
| `stage_id` | UUID | Foreign key to the snapshotted stage. |
| `notes` | string \| null | Free text. No length cap in v1 (UI may impose a soft limit). |
| `updated_at` | timestamp | Set on every edit. |
| `updated_by` | user_id | Set on every edit. |

Stage notes are surfaced in the Pipeline tab of the drawer below the task list. When viewing the application history, stage notes are visible per stage.

---

## 6. Tasks and triggers

Tasks and triggers are **independent systems** in v1.

- Triggers fire on stage entry. They automate communication, timers, flags, and archiving.
- Tasks track human work within a stage. They are checked off (or skipped) manually.

The two systems do not interact in v1:

- A trigger sending a message does not auto-complete a "Send screening message" task.
- A task being completed does not fire a trigger.
- The trigger configuration and task template are edited in separate sections of the pipeline editor.

Companies who want to track what a trigger did can manually add a corresponding task to the template (e.g. a "Confirm screening message sent" task alongside the `send_message_to_worker` trigger). This is a small redundancy in exchange for keeping the systems decoupled.

A future enhancement could let a task declare itself "owned by" a trigger, with auto-completion on trigger fire. This is explicitly deferred.

---

## 7. Applicant drawer tabs

### 7.1 Structure

The applicant drawer (the slide-over panel that opens when an employer clicks an applicant card or row) gains a three-tab structure. The drawer's existing slide-over chrome, close affordance, and overflow action bar are preserved.

| Position | Tab | Purpose |
|---|---|---|
| 1 | Summary | "Who is this person?" Identity, skills, match info, Regulix status, availability, certifications, work history, ratings. |
| 2 | Pipeline | "Where are they in our process and what work is in flight?" Current stage, task list, stage notes, inline advance control. |
| 3 | Log | "What's happened so far?" Reverse-chronological event list. |

The default tab on drawer open is **Summary**.

### 7.2 Tab strip

| Property | Behavior |
|---|---|
| Position | Below the persistent action bar, above the tab content. |
| Style | Horizontal tabs. Active tab has an underline indicator in teal. Inactive tabs use secondary text color. |
| Default state | Summary tab active on drawer open. |
| State persistence | Not persisted across drawer closes. Each drawer open resets to Summary. |
| Mobile | Same horizontal tab strip. Tabs may abbreviate if width is constrained. |

### 7.3 Persistent action bar

The action bar sits above the tab strip and remains visible regardless of active tab.

| Action | Behavior |
|---|---|
| Advance stage | Moves the application to the next **enabled** stage in the job's pipeline. Fires that stage's triggers. Subject to soft-block on required-task resolution. |
| Reject | Opens confirmation modal. On confirm, moves application to `terminal_rejected`, fires triggers. |
| Message | Opens message thread with applicant (deferred to messaging spec). |
| Shortlist | Toggles shortlist state on the application (existing behavior, unchanged). |
| Overflow (⋯) | Contains less-frequent actions: Add note (legacy), Open profile (navigates to full applicant page, future), Mark hired, etc. |

The action bar's content does not change between tabs. The Pipeline tab also surfaces an inline Advance button next to the task list, but the persistent bar guarantees the user can always advance or reject from anywhere.

### 7.4 Summary tab

Contains the existing planned drawer content. No changes to scope from prior specs:

- Avatar, first name + last initial, Regulix Ready badge
- Primary trade / profession
- Skills (current job's industry first, secondary industries downplayed)
- Match score (if applicable to the job)
- Availability status and preferred work radius
- Certifications (self-reported)
- Work history summary (3 most recent entries)
- Krewtree ratings summary
- Regulix ratings block (if account linked)
- Contact affordances (Message, View full profile)

This tab is read-only in v1. Editing applicant info is not an employer action — workers manage their own profile.

### 7.5 Pipeline tab — detail

The Pipeline tab is the work surface for the current stage. It surfaces stage context, the task checklist, free-text notes, and an inline advance control. The detailed structure follows.

#### 7.5.1 Tab content order (top to bottom)

| Element | Description |
|---|---|
| Current stage indicator | Stage name (semantic type display label), time-in-stage. |
| SLA indicator | Inline with time-in-stage. Only visible when SLA is approaching (amber) or breached (red). |
| Stage purpose | Muted text below stage indicator. Hidden if no purpose set. |
| Task list | Vertical checklist of all template + ad-hoc tasks for the current stage. |
| Add task | Affordance below the task list. |
| Stage notes | Free-text editor below the task list. |
| Inline advance | Sticky button at the bottom of the tab scroll. |

#### 7.5.2 Current stage indicator

| Element | Behavior |
|---|---|
| Stage name | Semantic type display label (e.g. "Interview"). 15px, 600 weight, primary text color. |
| Time-in-stage | Prefixed with "In stage": e.g. "In stage 3d", "In stage 2w 1d". Resets on stage change. Located below the stage name. 12px, secondary text color. |
| SLA indicator | Inline with time-in-stage when SLA is approaching or breached. Amber pill for approaching, red pill for breached. Hidden otherwise. |

The semantic type is the stage name (per Section 3.1). No type pill is needed since the name IS the type.

#### 7.5.3 Stage purpose

If the stage's snapshotted pipeline definition includes a purpose, it renders directly below the stage indicator block.

| Property | Token / value |
|---|---|
| Container | No background, 12px top margin below stage indicator |
| Font | 12px, 400 weight, secondary text color |
| Max width | Drawer width minus 24px padding |

Hidden entirely if no purpose is set on the stage.

#### 7.5.4 Task list

A vertical list of task rows. Order: template-sourced tasks in template order, ad-hoc tasks appended in creation order. No drag-to-reorder in v1.

Completed and skipped tasks **stay in place** in the list — they do not drop to the bottom or hide. Visual treatment differentiates the three states (see 7.5.5).

**Empty state:** If the stage has no template tasks and no ad-hoc tasks have been added on this applicant, the list shows placeholder copy in muted text: "No tasks for this stage yet." Below it sits the standard "+ Add task" affordance.

#### 7.5.5 Task row

| Element | Position | Notes |
|---|---|---|
| Checkbox | Left | 16px square. Click toggles completed state. Disabled visually when row is skipped. |
| Label | Inline with checkbox | 13px, 400 weight. Strike-through when completed. Muted when skipped. |
| Required pill | After label | Small "Required" pill in amber tint, 11px font. Only visible when `is_required = true`. |
| Skipped tag | After label | Small "Skipped" tag in gray tint, 11px font. Only visible when row is in skipped state. |
| Due date | After tags | 11px, tertiary text color. Format: "Due Apr 22". Only visible when set. |
| Notes icon | Right side, before overflow | 14px icon. Outlined when no notes. Filled (and slightly darker) when notes exist. Click expands inline notes textarea below the row. |
| Overflow menu (⋯) | Right edge | Hover-visible on desktop, always-visible on mobile. |

**Row interaction model:**

| Interaction | Behavior |
|---|---|
| Click checkbox | Toggles completed state. Updates `completed_at` / `completed_by`. Logs `task_completed` or `task_uncompleted`. |
| Click notes icon | Expands inline notes textarea directly below the row. Auto-saves on blur. Icon fills in when notes are present. Click again or click outside to collapse. |
| Click overflow menu (⋯) | Opens dropdown with actions (see 7.5.6). |
| Click label or row body | No action by default. Editing happens via overflow → Edit. |

**Visual states for the three task states:**

| State | Checkbox | Label | Tags |
|---|---|---|---|
| Incomplete | Empty | Default text | Required pill if set |
| Completed | Filled teal with checkmark | Strike-through, secondary color | Required pill if set |
| Skipped | Empty, slightly muted | Muted text, no strike-through | Required pill if set + "Skipped" tag |

#### 7.5.6 Task row overflow menu

Available actions depend on task source (template vs. ad-hoc) and current state.

| Action | Available on | Behavior |
|---|---|---|
| Edit | Ad-hoc tasks (any state) | Opens inline edit form on the row: label input, due date control, required toggle. Save on Enter or button. Cancel on Esc or button. |
| Edit due date | Template tasks (any state) | Inline date picker. Save on selection. (Label and required flag are not editable on template tasks — they're snapshotted from the template.) |
| Skip | Incomplete or completed tasks | Sets `skipped_at` / `skipped_by`. Row transitions to skipped visual state. |
| Unskip | Skipped tasks | Clears `skipped_at` / `skipped_by`. Row returns to incomplete state. |
| Delete | Ad-hoc tasks only | Confirmation: "Delete this task?" On confirm, removes the task instance. Logged as `task_deleted`. Template-sourced tasks cannot be deleted (skip is the equivalent). |

#### 7.5.7 Add task affordance

Below the task list sits a "+ Add task" link/button. Clicking it replaces the affordance with an inline form sitting in the same position.

| Form element | Behavior |
|---|---|
| Label input | Autofocused. Required. Placeholder: "What needs to happen?" Max 200 chars. |
| Add due date link | Collapsed by default. Expands to inline date picker on click. |
| Required toggle | Small checkbox labeled "Required to advance". Default unchecked. |
| Save button | Submits the form. Also submits on Enter from the label field. |
| Cancel link | Dismisses the form. Also dismisses on Esc. |

On save: the new task appears at the bottom of the task list with `source: 'ad_hoc'`. The form collapses back to the "+ Add task" affordance. Logged as `task_created` with source flag.

#### 7.5.8 Stage notes

Below the task list and the Add task affordance.

| Element | Behavior |
|---|---|
| Section header | "Notes for this stage" — 12px, 500 weight, secondary text color. |
| Textarea | Min 3 rows. Grows with content up to a max height with internal scroll. |
| Placeholder | "Add observations, context, or anything that doesn't fit a specific task..." |
| Auto-save | On blur. Debounced log write — one `stage_notes_updated` event per save burst. |
| Save indicator | Subtle "Saved" indicator that fades after save. No persistent visible indicator otherwise. |

Stage notes belong to (application, stage) — moving to a new stage opens a fresh notes field for that stage. Previous stages' notes remain accessible via the Log (and a future history view).

#### 7.5.9 Inline advance control

Sticky at the bottom of the Pipeline tab content. Remains visible above the scroll fold as the user works through the task list.

| Element | Behavior |
|---|---|
| Advance button | Label: "Advance to [next enabled stage name]" — e.g. "Advance to Interview". The target is the next enabled stage in the pipeline, skipping any disabled stages (per Section 3.4). |
| Reject button | Not present inline. Only available from the persistent action bar to reduce destructive misclick risk after task review sessions. |
| Click behavior | Triggers the same advance flow as the persistent action bar's Advance. Subject to the same soft-block modal (Section 7.5.10). On success, fires the next stage's triggers, instantiates that stage's task template, and updates the drawer to show the new stage's Pipeline tab content. |

**Terminal stage display:** When the application is in `terminal_hired`, `terminal_rejected`, `terminal_withdrawn`, or `terminal_archived`:

- Current stage indicator shows the terminal state name (e.g. "Hired", "Rejected").
- Stage purpose: hidden.
- Task list: hidden entirely.
- Add task: hidden.
- Stage notes: still editable. An employer might want to log a final observation.
- Inline advance: replaced with a muted line "This application is closed." in tertiary text color.

#### 7.5.10 Soft-block modal on advance

When the employer clicks Advance (either the inline button in the Pipeline tab or the persistent action bar button) and one or more required tasks are incomplete and unskipped, a confirmation modal appears.

| Element | Content |
|---|---|
| Title | "Required tasks are incomplete" |
| Body | "X required task(s) are incomplete. Advance anyway?" |
| Task list | Up to 5 incomplete required task labels. "+N more" appended if more exist. |
| Cancel button | Dismisses the modal. No state change. |
| Advance button | Proceeds with the advance. Fires the next stage's triggers. |

Skipped required tasks do **not** count toward this modal's task list or trigger condition. The inline Advance and persistent Advance use identical modal behavior — no functional difference.

### 7.6 Log tab

A reverse-chronological list of events for this application. Single column, no filters, no search, no event-type grouping. v1 keeps this dumb on purpose.

| Field per row | Description |
|---|---|
| Timestamp | Short relative date ("2d ago") with full timestamp on hover/tap. |
| Actor | Either a user name (employer who took the action) or "System" (for trigger firings, SLA breaches, etc.). |
| Description | Short event description. Examples: "Advanced from Screening to Interview", "Sent screening message", "SLA timer started (72h)", "Flagged: SLA breached", "Task completed: Conduct phone screen", "Task skipped: Reference check", "Stage notes updated". |

Events surfaced in v1:

- Application created / submitted
- Stage entered / exited
- Trigger fired (one row per trigger)
- Task created (template instantiated or ad-hoc added)
- Task completed / uncompleted
- Task skipped / unskipped
- Task deleted (ad-hoc only)
- Stage notes updated
- Application withdrawn / rejected / hired / archived

Message contents are not rendered inline; events only state that a message was sent and reference the template name where applicable. Full message history lives in the messaging surface (deferred spec).

The log is read-only. Events cannot be edited or deleted from the log view.

---

## 8. Visual design tokens

Inherits the established Krewtree visual language. Tokens listed here are specific to the task system and drawer tabs.

### 8.1 Task row

| Property | Token / value |
|---|---|
| Checkbox size | 16px square |
| Checkbox unchecked | 0.5px tertiary border, white fill |
| Checkbox checked | Solid teal fill, white checkmark |
| Row padding | 8px vertical, 0 horizontal |
| Row gap | 4px between rows |
| Label font | 13px, 400 weight |
| Completed label | Strike-through, secondary text color |
| Skipped label | Muted (secondary text color), no strike-through |
| Required indicator | Small "Required" pill in amber tint, 11px font, after the label |
| Skipped indicator | Small "Skipped" tag in gray tint, 11px font, after the label |
| Due date | 11px, tertiary text color, after the tags |
| Notes icon (outlined) | 14px, secondary text color |
| Notes icon (filled) | 14px, primary text color |
| Overflow trigger | 14px, secondary text color, hover-visible on desktop |

### 8.2 Tab strip

| Property | Token / value |
|---|---|
| Tab height | 40px |
| Tab padding | 0 12px |
| Active tab indicator | 2px underline in teal (#1C3D4A) |
| Active tab text | 13px, 600 weight, primary text color |
| Inactive tab text | 13px, 500 weight, secondary text color |
| Tab strip border | 1px bottom border in tertiary border color |

### 8.3 Stage indicator

| Property | Token / value |
|---|---|
| Stage name | 15px, 600 weight, primary text color |
| Time-in-stage | 12px, 400 weight, secondary text color, "In stage Xd" format |
| SLA pill (approaching) | Amber tint background, 11px font, 500 weight |
| SLA pill (breached) | Red tint background, 11px font, 500 weight |
| Container padding | 16px horizontal, 12px vertical |

### 8.4 Stage purpose

| Property | Token / value |
|---|---|
| Container | No background, 12px top margin below stage indicator |
| Font | 12px, 400 weight, secondary text color |
| Max width | Drawer width minus 24px padding |

### 8.5 Add task affordance

| Property | Token / value |
|---|---|
| Affordance | "+ Add task" link, 12px, 500 weight, teal text |
| Inline form padding | 12px top margin |
| Label input | Full width, 13px, 0.5px tertiary border, border-radius-md, 8px padding |
| Save button | 26-28px height, teal fill, white text, 12px font, 500 weight |
| Cancel link | 12px, secondary text color |

### 8.6 Stage notes

| Property | Token / value |
|---|---|
| Section header | "Notes for this stage" — 12px, 500 weight, secondary text color, 16px top margin from task list |
| Textarea | Min 3 rows, full width, 0.5px tertiary border, border-radius-md, 8px padding, 13px font |
| Save indicator | 11px, tertiary text color, fades 2s after save |

### 8.7 Inline advance

| Property | Token / value |
|---|---|
| Container | Sticky bottom, 12px vertical padding, 1px top border in tertiary color, white background |
| Button | Full width or right-aligned per drawer width, 32px height, teal fill, white text, 13px, 500 weight |
| Terminal state line | 12px, 400 weight, tertiary text color, italic optional |

### 8.8 Log row

| Property | Token / value |
|---|---|
| Row padding | 10px vertical, 0 horizontal |
| Row gap | 0 (separator handled by 0.5px tertiary bottom border per row) |
| Timestamp font | 11px, 400 weight, tertiary text color |
| Actor font | 12px, 500 weight, secondary text color |
| Description font | 13px, 400 weight, primary text color |
| Layout | Timestamp + actor on first line, description on second line. Compact two-line block per event. |

---

## 9. Data model summary

### 9.1 Updated tables

**`pipeline_stage`** — updated to reflect foundation changes from Section 3.

```
pipeline_stage:
  id: UUID
  pipeline_id: UUID (FK)
  semantic_type: enum ('screening', 'assessment', 'interview', 'offer')
  enabled: boolean
  purpose: string | null
  created_at: timestamp
  updated_at: timestamp

  CONSTRAINT unique_semantic_type_per_pipeline UNIQUE (pipeline_id, semantic_type)
```

The `name` field is removed. Stage display name is derived from `semantic_type`.

### 9.2 New tables

**`pipeline_stage_task_template`** — defines tasks at the pipeline level.

```
pipeline_stage_task_template:
  id: UUID
  stage_id: UUID (FK)
  label: string
  is_required: boolean
  order: integer
  created_at: timestamp
  updated_at: timestamp
```

**`application_task`** — task instances on applications.

```
application_task:
  id: UUID
  application_id: UUID (FK)
  stage_id: UUID (FK to snapshotted stage on job)
  source: enum ('template', 'ad_hoc')
  template_task_id: UUID | null (FK)
  label: string
  is_required: boolean
  completed_at: timestamp | null
  completed_by: user_id | null
  skipped_at: timestamp | null
  skipped_by: user_id | null
  notes: string | null
  due_date: date | null
  order: integer
  created_at: timestamp
  updated_at: timestamp

  CONSTRAINT mutual_exclusion CHECK (completed_at IS NULL OR skipped_at IS NULL)
```

**`application_stage_notes`** — free-text notes per application per stage.

```
application_stage_notes:
  id: UUID
  application_id: UUID (FK)
  stage_id: UUID (FK)
  notes: string | null
  updated_at: timestamp
  updated_by: user_id
```

### 9.3 Log event sources

The Log tab reads from the existing applicant log table (already populated by the trigger system). New event types to add:

| Event type | Trigger source |
|---|---|
| `task_created` | When a task instance is created (template instantiation or ad-hoc) |
| `task_completed` | When a task is checked off |
| `task_uncompleted` | When a task is unchecked |
| `task_skipped` | When a task is marked skipped |
| `task_unskipped` | When a skipped task is restored to incomplete |
| `task_deleted` | When an ad-hoc task is deleted |
| `stage_notes_updated` | When stage notes are saved (debounced; one event per save burst) |

---

## 10. Routing

No new routes are introduced. The drawer renders on top of the current route.

| View | Route | Access |
|---|---|---|
| Applicant drawer (overlay) | Overlay on `/dashboard`, `/dashboard/applicants`, `/dashboard/jobs/[id]` | Authenticated company user |
| Full applicant page (future) | `/dashboard/applicants/[id]` | Authenticated company user |

The full applicant page inherits the same three-tab pattern in a future sprint. The drawer's tab content components should be built in a way that lifts cleanly into a full-page layout without rework.

---

## 11. Implementation notes

### 11.1 Snapshot behavior

The task template is snapshotted at job creation, same pattern as the trigger configuration and stage definitions. Changes to the company default after job creation do not propagate to live jobs. This preserves the contract a worker applies under.

### 11.2 Re-entry to a stage

If an application moves backward to a stage it has previously been in, the existing task instances are preserved. No re-instantiation. This avoids losing completion or skip history. If the employer wants a fresh checklist, they can manually uncheck items or delete and re-add (ad-hoc).

### 11.3 Soft-block modal

The soft-block modal on advance with incomplete required tasks should list the specific incomplete tasks by label (up to 5; truncate with "+N more" beyond that). Skipped required tasks are excluded from this list. The modal is a confirmation pattern, not a form. Two buttons: Cancel and Advance.

### 11.4 Inline advance vs. persistent advance

Both Advance affordances invoke the same advance flow. The inline button exists for ergonomic proximity to the task list (employer finishes working through tasks and advances without scrolling back up). The persistent action bar guarantees the action is always one click away regardless of scroll position or active tab.

### 11.5 Disabled-stage advance target

The Advance button label and target stage must be computed against the job's pipeline snapshot, skipping any stages where `enabled = false`. The next-stage lookup runs the ordered set [screening, assessment, interview, offer] and picks the first enabled stage after the current one. If no enabled stage follows (e.g. currently in Offer, or the remaining stages are all disabled), the button transitions to "Mark hired" or the persistent action bar's Mark Hired handles the final move.

### 11.6 Log performance

The Log tab queries the applicant log table filtered by application_id. For high-activity applications (50+ events), consider pagination or virtualization. v1 can render up to 100 events without pagination; beyond that, lazy-load on scroll.

### 11.7 Trigger reversal and the log

When a drag-and-drop is undone within the 5-second buffer, the corresponding trigger firings are discarded. Log events for those triggers should also be suppressed (never written). The undo behavior is upstream of the log write, so this should fall out naturally from the existing buffer implementation.

### 11.8 Card-level task surfacing

Not in v1. The kanban card and list row visuals remain unchanged. A future enhancement could surface task completion as a "2/4" indicator on the card status strip. Defer until usage data justifies the additional density.

### 11.9 Skip state UI consistency

The three task states (incomplete, completed, skipped) should be visually distinct at a glance. Implementations should not rely on the "Skipped" tag alone to differentiate skipped from completed — the checkbox state and label treatment must also differ. Reference 7.5.5 for the canonical visual mapping.

### 11.10 Notes icon state

The notes icon's filled-vs-outlined state is the only signal that notes exist for a task at-a-glance. Implementation should compute `hasNotes = notes IS NOT NULL AND length(notes) > 0` and switch the icon accordingly. Empty-string notes count as "no notes" — a user clearing the textarea should see the icon revert to outlined.

---

## 12. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | Can ad-hoc tasks be promoted to the company default template? | Workflow ergonomics | No in v1. Editing the template happens in the pipeline editor, not from the drawer. Revisit if users repeatedly add the same ad-hoc task. |
| 2 | Should the Log tab show a count of new events since last viewed? | Drawer UX | No in v1. Adds complexity without clear value. Revisit when activity volume warrants it. |
| 3 | Do stage notes from previous stages remain visible in the Pipeline tab, or only via the Log? | History surfacing | Pipeline tab shows current stage notes only. Previous stages' notes are accessible via the Log or future history view. |
| 4 | What happens to ad-hoc tasks when an application moves to a new stage? | Task lifecycle | Same as template tasks: remain on the application record, do not appear on the new stage's task list. |
| 5 | Should the Pipeline tab's inline Advance button differ from the persistent action bar's Advance? | UI redundancy | No functional difference. Inline button exists for ergonomic proximity to the task list. Both invoke the same action and soft-block logic. |
| 6 | When skipping a completed task, should the system require unchecking first, or allow direct transition? | Skip ergonomics | Allow direct transition. Skip clears `completed_at` and sets `skipped_at` in a single action. Reversing returns to incomplete (not completed). |
| 7 | Should the "+N more" link on the soft-block modal task list expand inline or navigate to the Pipeline tab? | Modal UX | Inline expansion. Modal is a confirmation, not a navigation surface. |

---

## 13. Future considerations

The following are explicitly deferred and not part of this spec.

### 13.1 Applicant profile full page

The standalone applicant page at `/dashboard/applicants/[id]` inherits the same three-tab structure (Summary, Pipeline, Log) in a future sprint. Design the drawer tab content as reusable components so the lift to full page is mechanical.

### 13.2 Tasks owned by triggers

A task could declare itself "owned by" a specific trigger and auto-complete when that trigger fires. Useful for reducing redundancy between trigger configuration and task templates. v1 keeps the systems independent.

### 13.3 Task assignment

When multi-seat companies ship, tasks may need an `assigned_to` field. Schema should accommodate this addition without migration of existing data.

### 13.4 Task analytics

Average time to task completion per stage, most-skipped tasks, completion vs. skip rates by stage. The data model captures completion and skip timestamps from day one, so this is a downstream reporting layer rather than a schema change. Skipped tasks must be excluded from completion-rate denominators per Section 5.5.

### 13.5 Log filtering and search

If usage shows employers struggle to find specific events in the log, add filters by event type and a search input. v1 keeps the log dumb.

### 13.6 Card-level task indicator

Surfacing task completion state on the kanban card or list row. Deferred pending usage signal.

### 13.7 Drag-to-reorder tasks

v1 has no drag-to-reorder. Template tasks keep template order; ad-hoc tasks append. If reordering becomes a request, it would apply per-instance (this applicant's task list only) and would not modify the template.

### 13.8 Stage-purpose-driven task suggestions

A future enhancement could use the stage purpose text to suggest template task labels (e.g. purpose "Verify availability and rate" suggests tasks like "Confirm availability for start date" and "Confirm rate expectations"). Defer until template-authoring UX is refined.
