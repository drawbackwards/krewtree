# Krewtree — Applicants Widget
### Product Specification
**Scope:** Dashboard applicants widget — list view, kanban view, shared toggle
**Status:** Decisions locked
**Date:** May 19, 2026

---

## 1. Context & scope

The applicants widget is the consolidated dashboard surface for active applicants. It replaces two previous structures: the Applicant Pipeline (kanban) widget and the Recent Applicants table. Both are now collapsed into a single widget with a view toggle.

This spec covers the widget's behavior in both views — what it shows, how it behaves, and how the toggle works. It does not cover the full applicants page at `/dashboard/applicants` (separate spec, but it inherits the same patterns).

**Out of scope:** Full applicants page (applicants page spec), dashboard top-level structure (dashboard structure spec), pipeline data model (foundation spec), applicant drawer behavior (existing stage-tasks spec).

**Foundation dependencies:** Dashboard structure spec (block position, toggle persistence at the dashboard level), pipeline foundation spec (org-level pipelines, no semantic types, three-state worker mapping).

---

## 2. Key decisions

| Topic | Decision |
|---|---|
| Default view | List. New companies and users with no stored preference see list view. |
| View toggle | Two-segment toggle (List / Kanban) in widget header. Active segment highlighted. |
| Toggle persistence | Per user, stored in database. Survives logout, works across devices. |
| Row cap (list view) | 15 most recent active applicants across all jobs, sorted by last activity descending. |
| Card cap (kanban view) | Top 15 cards per column, with "+N more" link to the full page filtered to that stage. |
| Cross-job rollup | Both views show applicants across all of the company's active jobs. |
| Kanban columns | One column per stage in the company's pipeline. Dynamic count based on company's actual pipeline. |
| Card body click | Opens the applicant drawer (Summary tab default). |
| Card overflow menu | Reject, Mark hired, Open profile, Message. |
| Drag-and-drop (kanban) | Mouse and touch in v1. Keyboard deferred. All drops are valid (no ambiguity picker, no invalid drops). |
| Undo toast | 5-second window on every successful stage change. |
| Filter persistence | Filters persist across list/kanban toggle. Filter chips display above the widget when active. |
| Filter scope | Widget-level filters apply only within the widget; do not persist to the full applicants page. |
| Filter set | Search, Job, Regulix Ready, Applied date range. |
| Paused jobs | Cards/rows remain visible with a "Paused" tag inline with the job title. |
| Closed/deleted jobs | Active applicants auto-move to `terminal_archived` and disappear from the widget. |
| Empty states | Distinct copy and CTAs for "no applicants yet," "no applicants match filters," and individual empty kanban columns. |

---

## 3. Widget structure

### 3.1 Header

| Element | Behavior |
|---|---|
| Title | "Applicants" — left-aligned. |
| View toggle | Two-segment toggle (List / Kanban) right of title. Active segment highlighted in teal. |
| Filter chip row | Below the header, visible only when filters are active. Each filter shown as a dismissible chip with × icon. "Clear all" link on the right. |
| "View all →" link | Right-aligned, far right of header. Navigates to `/dashboard/applicants`. |

### 3.2 Body

| View | Body contents |
|---|---|
| List | Dense table with applicant rows. Up to 15 most recent. |
| Kanban | Horizontal column layout. One column per active pipeline stage. Up to 15 cards per column. |

The body switches based on the toggle. Filter chip row and "View all" link persist across the toggle.

---

## 4. List view

### 4.1 Layout

A dense table showing the 15 most recently active applicants across all active jobs at the company. Sorted by `last_activity_at` descending.

### 4.2 Columns

| Column | Width | Alignment | Description |
|---|---|---|---|
| Applicant | ~24% | Left | Avatar (24px circular) + first name + last initial. Clickable — opens drawer. |
| Job | ~22% | Left | Job title. Plain text. Truncated with ellipsis. "Paused" tag inline if applicable. |
| Stage | ~14% | Left | Current pipeline stage name (from the snapshotted pipeline on the application's job). |
| Regulix Ready | ~10% | Center | Olive gold "R" badge if Regulix Ready, blank otherwise. |
| Last activity | ~12% | Left | Short relative date (e.g. "2d ago", "1h ago"). Secondary text color. |
| Actions | ~18% | Right | Primary action button ("View") + overflow menu (⋯). |

### 4.3 Primary action

The primary action button on each row is **View** — opens the applicant drawer (Summary tab default). This is the most frequent action and gets the explicit button. Stage changes and other actions live in the overflow menu.

### 4.4 Overflow menu

| Action | Behavior |
|---|---|
| Advance stage | Moves application to the next stage in the pipeline. Same logic as the drawer's Advance button. |
| Reject | Confirmation modal. On confirm, moves to `terminal_rejected`, fires triggers. Card disappears from widget. |
| Mark hired | Confirmation modal. On confirm, moves to `terminal_hired`, fires triggers. Card disappears from widget. |
| Open profile | Opens the applicant drawer (same as clicking applicant cell). |
| Message | Opens message thread with applicant (deferred to messaging spec). |

### 4.5 Sorting

The list is sorted by `last_activity_at` descending by default. No column header sort interactions in the widget (the full page handles richer sorting). Keep the widget simple — it's a snapshot, not a working surface.

### 4.6 Row interaction

| Interaction | Behavior |
|---|---|
| Click applicant cell (avatar/name) | Opens drawer. |
| Click View button | Opens drawer. |
| Click overflow (⋯) | Opens dropdown. |
| Click anywhere else on row | No-op. (Avoid accidental drawer opens from misclicks.) |

---

## 5. Kanban view

### 5.1 Layout

A horizontal arrangement of columns, one per active stage in the company's pipeline. The number of columns is dynamic — whatever the company's pipeline currently has.

| Property | Desktop | Mobile |
|---|---|---|
| Column arrangement | Side-by-side, equal widths | Stacked vertically |
| Column collapse | Always expanded | Collapsible per user, state persists |
| Column scroll | Independent vertical scroll within column | Single page scroll |
| Cards per column | Top 15 + "+N more" link | Top 15 + "+N more" link |

### 5.2 Column header

Each column displays the stage name + applicant count in parentheses. Example: "Phone Screen (8)". Empty columns display "(0)" with empty space below — no placeholder card or instructional text.

The stage name comes from the snapshotted pipeline. Since the widget shows applicants across multiple jobs, and each job has its own snapshot, the column header reflects the company's **current live pipeline** — not any particular job's snapshot. This is fine because the company's pipeline is consistent across jobs (the snapshot pattern preserves historical jobs but new jobs use the current pipeline).

### 5.3 Card content

Cards are uniform across all columns.

| Element | Position | Notes |
|---|---|---|
| Avatar | Top-left | 32px circular. Worker profile photo or initial fallback. |
| Name | Top, next to avatar | First name + last initial. |
| Regulix Ready badge | Top row, after name | Olive gold "R" circle. Shown only if applicant is Regulix Ready. |
| Overflow menu (⋯) | Top-right corner | Hover-visible on desktop, always-visible on mobile. |
| Job title | Second row | Truncated with ellipsis. Secondary text color. Plain text. |
| "Paused" tag | Inline with job title | Small amber pill. Shown only if the job is currently paused. |
| Time in stage | Status strip, left | Short format: "3d", "2w", "1h". Resets when stage changes. |
| SLA indicator | Status strip, middle | Visible only when SLA is approaching (amber) or breached (red). Hidden otherwise. |
| Flag indicator | Status strip, right | Visible only when `flag_for_attention` trigger has fired. Hidden otherwise. |

### 5.4 Card interaction

| Action | Behavior |
|---|---|
| Click card body | Opens drawer (Summary tab default). |
| Click overflow menu (⋯) | Opens dropdown menu (same options as list view overflow, minus Advance — drag handles that). |
| Drag card | Initiates stage change. See Section 5.5. |

### 5.5 Drag-and-drop

| Property | Behavior |
|---|---|
| Initiation | Mouse: click-hold and move. Touch: long-press and move. |
| Card preview | Semi-transparent copy of the card follows the cursor/finger. |
| Drop zones | All columns. The column under the cursor shows a hover state. |
| Hover state | Subtle teal background tint on the column. |
| Validity | All drops are valid. Every column is a real stage in the company's pipeline. |
| Drop release outside column | Cancels the drag with no change. |
| Backward moves | Allowed. No special friction — the company defined the pipeline; backward moves are their call. |

### 5.6 Cross-job moves and snapshot mismatch

A subtle edge case: a card on the kanban represents an application on a specific job. That job has a snapshotted pipeline, which may differ from the company's current live pipeline. If the company has edited their pipeline since the job was posted, the snapshot may have stages the current pipeline doesn't, or vice versa.

The widget renders columns based on the **company's current live pipeline**, not any one job's snapshot. When dropping a card, the system resolves the target column to the matching stage on the **application's job snapshot** by stage name. Resolution rules:

| Scenario | Behavior |
|---|---|
| Target column name matches a stage in the application's job snapshot | Drop succeeds. Application advances to that stage on its job. |
| Target column name does not match any stage in the application's job snapshot | Drop is rejected. Toast: "This job's pipeline doesn't include a '[Stage name]' stage." |
| Multiple matches (duplicate stage names in the snapshot) | Drop succeeds against the first matching stage in snapshot order. Edge case — duplicate names are discouraged in the editor. |

This keeps the cross-job rollup working without forcing every card on the board to share the same pipeline. The trade-off is that some moves on edited-pipeline jobs may fail; the toast explains why.

### 5.7 Undo toast

Every successful drag completion shows an undo toast for 5 seconds:

> "Moved [name] to [Stage]. **Undo**"

Undo reverts the stage change *and* reverses any triggers that fired. Trigger reversal uses the 5-second buffer pattern from the existing trigger spec.

### 5.8 Filter-out-of-view drops

If a card is dragged to a stage that is outside the currently applied filter set, the move is allowed and the card disappears from the visible widget. Toast appears:

> "Moved [name] to [Stage]. **Undo** · **Clear filter**"

5-second auto-dismiss. **Undo** reverts the move. **Clear filter** keeps the move but clears all active filters so the card reappears in its new column.

### 5.9 Keyboard accessibility

Keyboard drag-and-drop is not supported in v1. Keyboard users can perform the same operations via the card overflow menu (Tab to focus card, Enter to open menu, arrow keys to navigate). This is an acknowledged WCAG gap to be addressed in a follow-up.

---

## 6. Filters

### 6.1 Filter inventory

Filters apply to both views. The filter bar lives at the top of the widget (above the content, below the header).

| Filter | Type | Behavior |
|---|---|---|
| Search | Text input | Filters by applicant name and job title. Case-insensitive substring match. |
| Job | Searchable multi-select | Filters by job. Defaults to all active jobs. |
| Regulix Ready | Dropdown | All / Regulix Ready / Not Regulix Ready. |
| Applied date range | Date range | Filters by application date. |

### 6.2 Active filter chips

When any filter is active, a chip row appears between the widget header and the content:

| Element | Behavior |
|---|---|
| Filter chip | One per active filter. Format: "Job: HVAC Tech ×" or "Regulix Ready ×". Click × to remove that filter. |
| Clear all link | Right-aligned. Removes all active filters at once. |
| Visibility | Hidden when no filters are active. |

### 6.3 Filter persistence

Filters persist when the user toggles between list view and kanban view *within the widget*. They do **not** persist between the dashboard widget and the full applicants page at `/dashboard/applicants` — those are separate filter contexts.

Filter state is per-session, not stored in the database. Refreshing the page clears the filters.

---

## 7. Empty states

### 7.1 No applicants yet

When the company has zero active applications across all jobs:

| Condition | Message | CTA |
|---|---|---|
| Company has no open jobs | "No applicants yet." | "Post your first job →" (links to job creation) |
| Company has open jobs but no applicants | "No applicants yet." | "Share your job posts →" (links to job posts page) |

Display: centered message replacing the widget body. No illustration. No filler rows or empty columns.

### 7.2 No applicants match filters

When filters are active and no applicants match:

> "No applicants match your filters." **Clear filters**

Display: centered message. In kanban view, the columns remain rendered (with "(0)" counts) above the message; in list view, the table area shows the message only.

### 7.3 Single empty column (kanban only)

When some columns have cards but one or more don't, the empty column shows its header with "(0)" and empty space below. No placeholder card, no instructional text. The presence of cards in adjacent columns is sufficient context.

---

## 8. Job lifecycle effects

### 8.1 Paused jobs

| Property | Behavior |
|---|---|
| Active applicants on widget | Remain visible in both views. |
| Visual indicator | Small amber "Paused" pill displayed inline with the job title. |
| Stage transitions | Continue normally. Employer can process applicants through all stages including hire. |

### 8.2 Closed jobs

| Property | Behavior |
|---|---|
| Active applicants on widget | Auto-move to `terminal_archived` and disappear from the widget. |
| Worker notification | "[Company] has closed the position for [Job title]. Your application is no longer active." |
| Reversibility | Not reversible from the widget. Closing a job requires reposting to recover. |

### 8.3 Deleted jobs

Same as closed: applicants auto-move to `terminal_archived`, disappear from the widget, worker notified.

---

## 9. Visual design tokens

Inherits the established Krewtree visual language. Tokens listed here are widget-specific.

### 9.1 View toggle

| Property | Token / value |
|---|---|
| Toggle container | Inline-flex, 0.5px tertiary border, border-radius-md |
| Segment height | 28px |
| Segment padding | 0 12px |
| Active segment | Teal background fill, white text, 500 weight |
| Inactive segment | Transparent background, secondary text, 500 weight |
| Segment font | 12px |

### 9.2 List row

| Property | Token / value |
|---|---|
| Row padding | 8px vertical, 12px horizontal |
| Row hover | Subtle gray tint background |
| Avatar size | 24px circular |
| Name font | 13px, 500 weight, primary text color |
| Secondary text | 12px, 400 weight, secondary text color |
| Stage label | 12px, 400 weight, primary text color |
| Action button | 26-28px height, 0.5px tertiary border, 12px font, 500 weight |

### 9.3 Kanban column

| Property | Token / value |
|---|---|
| Column background | Subtle gray tint |
| Column header padding | 12px vertical, 16px horizontal |
| Column header font | 13px, 600 weight, primary text color |
| Column count font | 13px, 400 weight, secondary text color |
| Column gap | 16px between columns |

### 9.4 Kanban card

| Property | Token / value |
|---|---|
| Card background | White |
| Card border | 0.5px tertiary border color |
| Card border radius | border-radius-md |
| Card padding | 12px |
| Card gap (within column) | 8px between cards |
| Card hover | Subtle shadow lift |
| Card drag (in-progress) | 50% opacity in original position, full opacity on cursor preview |

### 9.5 Filter chips

| Property | Token / value |
|---|---|
| Chip background | Light gray tint |
| Chip border radius | Full pill |
| Chip padding | 4px vertical, 10px horizontal |
| Chip font | 12px, 500 weight |
| × icon | 12px, secondary text color, hover state darkens |

---

## 10. Data requirements

### 10.1 Row/card-level data

| Field | Type | Source |
|---|---|---|
| application_id | UUID | applications |
| worker_id | UUID | applications → workers |
| worker_first_name | string | workers |
| worker_last_initial | string | derived from workers.last_name |
| worker_avatar_url | string \| null | workers |
| regulix_ready | boolean | workers (via Regulix linked status) |
| job_id | UUID | applications |
| job_title | string | jobs |
| job_status | enum | jobs — `open` / `paused` / `closed` |
| current_stage_id | UUID | applications |
| current_stage_name | string | pipeline snapshot on job |
| stage_entered_at | timestamp | applications |
| last_activity_at | timestamp | applications |
| sla_state | enum | computed — `none`, `approaching`, `breached` |
| flagged | boolean | applications |

### 10.2 Column-level data (kanban)

| Field | Type | Source |
|---|---|---|
| stage_id | UUID | company's current live pipeline |
| stage_name | string | company's current live pipeline |
| stage_order | integer | company's current live pipeline |
| applicant_count | integer | count of active applications whose current stage name matches this column |

### 10.3 View preference

| Field | Type | Source |
|---|---|---|
| applicants_view_preference | enum (`list`, `kanban`) | user record |

---

## 11. Implementation notes

### 11.1 Stage matching across snapshots

The widget renders columns from the company's current live pipeline but rolls up applicants from jobs that may have older pipeline snapshots. Stage matching is by **name**, not by stage ID, because IDs are snapshot-specific.

This is mostly invisible to the user but has edge cases:
- A stage renamed in the live pipeline (e.g. "Phone Screen" → "Initial Screen") would cause applicants on pre-rename jobs to fall off the column rollup until they're moved.
- A stage removed from the live pipeline would cause applicants still in that stage on pre-snapshot jobs to be invisible in the widget.

The widget should surface these orphaned applicants somewhere — likely in a footer count or via the full applicants page (which has its own filtering). For v1, accept the edge case and surface it through the "View all" link, which goes to the full page where the user can see everything.

### 11.2 Column count adaptation

Companies with many pipeline stages (8+) will have a busier kanban. The widget should handle horizontal overflow gracefully — likely with horizontal scroll. Don't truncate column count.

### 11.3 Performance

- Fetch only the top 15 per column (kanban) or top 15 rows (list), plus a total count for "+N more" affordances.
- Filter changes trigger a re-query, not a client-side filter.
- The widget polls on dashboard load. No real-time updates in v1.

### 11.4 Trigger reversal window

The 5-second undo toast requires the trigger queue to buffer outbound effects (messages, notifications, SLA timers) for 5 seconds before committing. This is the same pattern as the prior kanban spec; the requirement carries over unchanged.

---

## 12. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | How should the widget handle a company with 10+ pipeline stages? | Visual layout, horizontal scroll | Horizontal scroll. Acknowledge the soft recommendation of 8 stages but don't enforce. |
| 2 | When a card is dragged to a column whose stage name doesn't exist on the application's job snapshot, do we just toast-and-reject, or offer a way to advance the application to the closest matching stage? | Drag UX | Toast-and-reject. Suggesting a fuzzy match would be confusing and error-prone. The employer should resolve via the drawer if needed. |
| 3 | If a user has the kanban open and another user (when multi-seat ships) drags a card, does the first user's view update? | Real-time sync | Not in v1. Poll on page load only. Accept staleness. |
| 4 | Should the widget show a count of orphaned applicants (those in stages no longer in the live pipeline)? | Visibility of edge case | Defer to the full applicants page. Don't clutter the dashboard widget. |
| 5 | Does Mark Hired in the row/card overflow require confirmation, or proceed silently? | Destructive action safety | Confirmation modal, matching the drawer's Mark Hired behavior. Consistency across surfaces. |

---

## 13. Future considerations

### 13.1 Saved kanban views

Companies that use the kanban heavily may want to save filter combinations as named views. Not v1.

### 13.2 Real-time updates

Multi-user environments need live updates when cards move. Not v1.

### 13.3 Card customization

The current card content is fixed. Future enhancement could let companies configure which fields appear on cards. Not v1.

### 13.4 Bulk operations from the widget

The widget supports single-card operations only. Bulk operations live on the full applicants page. Not v1 for the widget.
