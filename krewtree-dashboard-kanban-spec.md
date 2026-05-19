# Krewtree — Dashboard Applicant Kanban
### Product Specification
**Scope:** Company dashboard kanban view (cross-job, semantic-type columns)
**Status:** Decisions locked
**Date:** May 15, 2026

---

## 1. Context & scope

The dashboard applicant kanban is the visual, cross-job view of the company's active applicants. It rolls up applicants from every active job into four semantic-type columns and supports drag-and-drop stage management directly from the dashboard.

This is one of two views available on the dashboard applicant pipeline widget. The list view (specced separately) presents the same underlying data as a dense table with filters, sorting, and bulk actions. Both views share filter state and toggle from the same control.

**Out of scope for this spec:** Per-job kanban on the job detail page (separate spec, deferred), list view of the applicant pipeline widget (separate spec), interview scheduling (future sprint), message templates subsystem (separate spec).

**Foundation dependencies:** This spec assumes the locked pipeline foundation: per-job configurable pipelines, system-defined semantic types, two-level inheritance (company default snapshotted at job creation), all-moves-allowed with logging, five v1 triggers, no platform-managed legal readiness concept.

---

## 2. Key decisions

| Topic | Decision |
|---|---|
| Columns | Four columns matching the active semantic types: Screening, Assessment, Interview, Offer. No terminal columns. |
| Unit on card | Application (not worker). Same worker applying to two jobs = two cards. |
| Card content | Avatar, first name + last initial, Regulix Ready badge, job title, time in stage, SLA indicator, flag indicator. Overflow menu (⋯) top-right. |
| Card body interaction | Clicking the card body opens the applicant side panel. No separate primary action button. |
| Card overflow menu | Reject, Mark hired, Open profile, Message. Withdrawn is worker-initiated only. |
| Column header | Column name + applicant count, e.g. "Interview (8)". |
| Column sort | Flagged / SLA-breached first, then time in stage descending. |
| Column overflow | Show top 15 cards per column with "+N more" link to the full applicants page filtered to that semantic type. |
| Column collapse | Desktop: always expanded. Mobile: collapsible, state persists per user. |
| Drag-and-drop | Mouse and touch only in v1. Keyboard support deferred. |
| Ambiguous drops | Inline dropdown picker inserted at the drop position when target semantic type maps to multiple stages in the job's pipeline. |
| Picker options | Stage name + the trigger that will fire (e.g. "Document check — sends document request email"). |
| Drop zone feedback | Valid: subtle background tint. Invalid (no matching stage in job's pipeline): red tint, drop rejected. |
| Backward moves | Allowed. Use the same picker logic. Backward-move toast suppressed (the picker is enough friction). |
| Undo | Every drag completion shows an undo toast for 5 seconds. Undo reverts the stage change and any triggers fired. |
| Filter persistence | Filters persist across list/kanban toggle. Kanban shows active filters as chips above the columns. |
| Filter-out-of-view drags | Allowed. Card disappears with a toast: "Moved [name] to [Stage] — out of current filter." Undo + Clear filter options in the toast. |
| Paused jobs | Cards remain on the kanban with a "Paused" tag near the job title. |
| Closed jobs | Active applicants auto-move to a new terminal state `terminal_archived` and disappear from the kanban. |
| Deleted jobs | Same as closed: applicants auto-move to `terminal_archived` and are notified the position is no longer available. |

---

## 3. Foundation updates from this session

Two foundation-level decisions came out of this spec work and update the locked foundation:

**1. Legal readiness is not a platform concept.** Krewtree does not track readiness state. The Regulix Ready badge is the only readiness signal in the product. Employers handle paperwork off-platform if a worker does not have the badge. Implications:

- `request_legal_readiness` trigger removed. v1 trigger library drops to five: `send_message_to_worker`, `notify_employer`, `start_sla_timer`, `flag_for_attention`, `archive_from_active_board`.
- Hire confirmation modal text simplified. No readiness clause. New text: "This will notify [worker name] they've been hired and archive this applicant from the active board. Proceed?"
- No "Resolved via Regulix / Confirmed manually / Not yet resolved" states exist anywhere in the data model.
- Regulix Ready badge becomes the single readiness signal, which sharpens its strategic value as a conversion driver.

**2. Terminal stage set updated to four states:**

| Stage | Trigger | Notification |
|---|---|---|
| `terminal_hired` | Employer affirmatively hires | "You've been hired for [Job title] at [Company]." |
| `terminal_rejected` | Employer affirmatively rejects | "Your application for [Job title] at [Company] was not selected." |
| `terminal_withdrawn` | Worker pulls their own application | Internal-only; no worker notification. |
| `terminal_archived` | Job closed or deleted with active applicants | "[Company] has closed the position for [Job title]. Your application is no longer active. We'll let you know if anything similar becomes available." |

`terminal_archived` is a new state. It catches applications that ended without an affirmative employer decision because the job ended. It must not count as a rejection in worker quality metrics or as a hire/rejection in employer pipeline analytics.

---

## 4. Layout

### 4.1 Widget structure

The applicant pipeline widget sits in its established location on the company dashboard (below the Active Jobs widget). It includes:

| Element | Description |
|---|---|
| Widget header | Title "Applicant pipeline" left-aligned. View toggle (List / Kanban) right-aligned. "View all →" link to the full applicants page. |
| Filter chip row | Visible when filters are active. Each filter shown as a dismissible chip with × icon. "Clear all" link on the right. Hidden when no filters are active. |
| Kanban columns | Four columns rendered side-by-side at desktop, stacked vertically on mobile. |

### 4.2 Column layout

| Property | Desktop | Mobile |
|---|---|---|
| Column arrangement | Side-by-side, equal widths | Stacked vertically |
| Column collapse | Disabled (always expanded) | Enabled, state persists per user |
| Column scroll | Independent vertical scroll within column | Single page scroll |
| Cards per column | Top 15 + "+N more" link | Top 15 + "+N more" link |

### 4.3 Column structure

| Column | Semantic type | Notes |
|---|---|---|
| Screening | `screening` | First active column. New applicants land here unless the job's pipeline starts at a different semantic type. |
| Assessment | `assessment` | Optional skill/document checks. |
| Interview | `interview` | Live interaction stages. |
| Offer | `offer` | Offer extended, awaiting worker acceptance. |

Each column header displays: column name + applicant count in parentheses. Example: "Interview (8)". Empty columns display "(0)" with empty space below — no placeholder card or instructional text.

---

## 5. Card

### 5.1 Card content

Cards are uniform across all four columns. No special offer-stage treatment.

| Element | Position | Notes |
|---|---|---|
| Avatar | Top-left | 32px circular. Worker profile photo or initial fallback. |
| Name | Top, next to avatar | First name + last initial. Example: "Jane S." |
| Regulix Ready badge | Top row, after name | Olive gold "R" circle. Shown only if applicant is Regulix Ready. |
| Overflow menu (⋯) | Top-right corner | Hover-visible on desktop, always-visible on mobile. |
| Job title | Second row | Truncated with ellipsis. Secondary text color. Plain text — not a link (use side panel to navigate). |
| "Paused" tag | Inline with job title | Small amber pill. Shown only if the job is currently paused. |
| Time in stage | Status strip, left | Short format: "3d", "2w", "1h". Resets when stage changes. |
| SLA indicator | Status strip, middle | Visible only when SLA is approaching (amber) or breached (red). Hidden otherwise. |
| Flag indicator | Status strip, right | Visible only when `flag_for_attention` trigger has fired. Hidden otherwise. |

### 5.2 Card interaction

| Action | Behavior |
|---|---|
| Click card body | Opens applicant side panel (same as list view). |
| Click overflow menu (⋯) | Opens dropdown menu with four options: Reject, Mark hired, Open profile, Message. |
| Drag card | Initiates stage change. See Section 6. |

### 5.3 Card overflow menu

| Action | Behavior |
|---|---|
| Reject | Confirmation modal: "This will send [worker name] a rejection notification. This can't be undone. Proceed?" On confirm, fires `send_message_to_worker` and `archive_from_active_board` triggers. Card disappears from kanban. |
| Mark hired | Confirmation modal: "This will notify [worker name] they've been hired and archive this applicant from the active board. Proceed?" On confirm, fires `send_message_to_worker` and `archive_from_active_board` triggers. Card disappears from kanban. |
| Open profile | Opens the applicant side panel (same as clicking card body). |
| Message | Opens message thread with applicant (deferred to messaging spec). |

---

## 6. Drag-and-drop

### 6.1 Drag mechanics

| Property | Behavior |
|---|---|
| Initiation | Mouse: click-hold and move. Touch: long-press and move. |
| Card preview | Semi-transparent copy of the card follows the cursor/finger. |
| Drop zones | All four columns. The column under the cursor shows a hover state. |
| Hover state — valid | Subtle teal background tint on the column. Drop will succeed. |
| Hover state — invalid | Red background tint on the column. Drop will be rejected with a toast. |
| Invalid condition | The job's pipeline has no stage of the target semantic type. |
| Drop release outside column | Cancels the drag with no change. |

Validity is evaluated per-card: a column may be a valid target for some cards (jobs whose pipelines have that semantic type) and invalid for others. When a card is being dragged, only that card's validity is reflected in hover state.

### 6.2 Ambiguous drops

When a card is dropped on a column whose semantic type maps to multiple stages in the job's pipeline, an inline dropdown picker appears at the drop position. The card itself lands in the column visually but is not committed to a stage until the picker resolves.

| Element | Description |
|---|---|
| Position | Inserted into the target column at the drop location, replacing the card slot visually. |
| Options | Each stage in the job's pipeline with the matching semantic type, listed in pipeline order. |
| Option format | Stage name + the trigger summary. Example: "Document check — sends document request email". If no triggers configured: just stage name. |
| Cancel | Click outside the picker or press Esc. Card returns to its original column and stage. |
| Confirm | Click a stage option. Stage is committed, triggers fire, undo toast appears. |

### 6.3 Unambiguous drops

When the target semantic type maps to exactly one stage in the job's pipeline, the drop completes silently with no picker. The undo toast still appears.

### 6.4 Invalid drops

When the target semantic type does not exist in the job's pipeline, the drop is rejected. Card returns to its original column. Toast appears: "This job's pipeline doesn't have a [Stage type] stage."

### 6.5 Backward moves

Moving a card to a column representing an earlier semantic type (e.g. Interview → Assessment) is allowed and uses the same picker logic if ambiguous. The general backward-move warning toast from the foundation alerts log is suppressed for kanban drags — the picker is sufficient friction. The backward move is still logged.

### 6.6 Filter-out-of-view drops

If a card is dragged to a stage that is outside the currently applied filter set, the move is allowed and the card disappears from the visible kanban. Toast appears:

> "Moved [name] to [Stage]. **Undo** · **Clear filter**"

5-second auto-dismiss. **Undo** reverts the stage change and triggers. **Clear filter** keeps the move but clears all active filters so the card reappears in its new column.

### 6.7 Undo toast (universal)

Every successful drag completion shows an undo toast for 5 seconds:

> "Moved [name] to [Stage]. **Undo**"

Undo reverts the stage change *and* reverses any triggers that fired (message recall, SLA timer cancellation, notification deletion). This requires the trigger system to support a reversal window — flagged as an implementation note in Section 11.

### 6.8 Keyboard accessibility

Keyboard drag-and-drop is not supported in v1. Keyboard users can perform the same operations via the card overflow menu (Tab to focus card, Enter to open menu, arrow keys to navigate menu items). This is an acknowledged WCAG gap to be addressed in a follow-up.

---

## 7. Filters

### 7.1 Filter inventory

The same filter set as the list view applies on kanban. Filters live in the filter bar at the top of the applicant pipeline widget (not specced in this document — see list view spec).

| Filter | Type | Effect on kanban |
|---|---|---|
| Search | Text | Filters cards by applicant name and job title. |
| Job | Searchable multi-select | Filters cards by job. |
| Regulix Ready | Dropdown | All / Regulix Ready / Not Regulix Ready. |
| Applied date range | Date range | Filters by application date. |

### 7.2 Active filter chips

When any filter is active, a chip row appears above the kanban columns:

| Element | Behavior |
|---|---|
| Filter chip | One per active filter. Format: "Job: HVAC Tech ×" or "Regulix Ready ×". Click × to remove that filter. |
| Clear all link | Right-aligned. Removes all active filters at once. |
| Visibility | Hidden when no filters are active. |

### 7.3 Filter persistence

Filters persist when the user toggles between list view and kanban view on the dashboard. They do not persist between the dashboard widget and the full applicants page at `/dashboard/applicants` — those are separate filter contexts.

---

## 8. Empty states

### 8.1 Brand new company (zero applications across all jobs)

The kanban columns are replaced with a centered message and contextual CTA:

| Condition | Message | CTA |
|---|---|---|
| Company has no open jobs | "No applicants yet." | "Post your first job →" (links to job creation) |
| Company has open jobs but no applicants | "No applicants yet." | "Share your job posts →" (links to job posts page) |

No illustration. No filler cards.

### 8.2 Filtered to zero (has applications but current filter shows nothing)

The four columns remain rendered (with "(0)" counts). Above the columns, a centered message:

> "No applicants match your filters." **Clear filters**

Clear filters is a text link that resets all active filters.

### 8.3 Single empty column (other columns have applicants)

The empty column shows its header with "(0)" and empty space below. No placeholder card, no instructional text. The presence of cards in adjacent columns is sufficient context.

---

## 9. Job lifecycle effects on the kanban

### 9.1 Paused jobs

| Property | Behavior |
|---|---|
| Active applicants on kanban | Remain visible with no change in position. |
| Visual indicator | Small amber "Paused" pill displayed inline with the job title on each affected card. |
| New applications | Not received (job is not visible in worker feed). |
| Stage transitions | Continue normally. Employer can process applicants through all stages including hire. |

### 9.2 Closed jobs

| Property | Behavior |
|---|---|
| Active applicants on kanban | All active applicants auto-move to `terminal_archived` and disappear from the kanban. |
| Worker notification | "[Company] has closed the position for [Job title]. Your application is no longer active. We'll let you know if anything similar becomes available." |
| Triggers fired on archive | `send_message_to_worker` (archived template), `archive_from_active_board`. |
| Reversibility | Closing a job cannot be undone from the alert toast (too many side effects). To reverse, the employer must repost the job (separate flow). |
| Confirmation modal | "Closing this job will archive [N] active applicants and notify them the position has closed. This can't be undone. Proceed?" |

### 9.3 Deleted jobs

| Property | Behavior |
|---|---|
| Active applicants on kanban | Same as closed: auto-move to `terminal_archived` and disappear from the kanban. |
| Job record | Permanently removed. Applicant records retained but no longer linked to a visible job post. |
| Worker notification | Same template as closed. |
| Confirmation modal | "Deleting this job will archive [N] active applicants and notify them the position is no longer available. This permanently removes the job post. Proceed?" |

---

## 10. Visual design tokens

Inherits the established Krewtree visual language. Tokens listed here are kanban-specific.

### 10.1 Column

| Property | Token / value |
|---|---|
| Column background | Subtle gray tint, slightly darker than page background |
| Column header padding | 12px vertical, 16px horizontal |
| Column header font | 13px, 600 weight |
| Column count font | 13px, 400 weight, secondary text color |
| Column gap | 16px between columns |

### 10.2 Card

| Property | Token / value |
|---|---|
| Card background | White |
| Card border | 0.5px tertiary border color |
| Card border radius | border-radius-md |
| Card padding | 12px |
| Card gap (within column) | 8px between cards |
| Card hover | Subtle shadow lift |
| Card drag (in-progress) | 50% opacity in original position, full opacity on cursor preview |

### 10.3 Drop zone states

| State | Background |
|---|---|
| Default (no drag) | Column background |
| Valid drop hover | Teal tint at ~8% opacity |
| Invalid drop hover | Red tint at ~8% opacity |

### 10.4 Filter chips

| Property | Token / value |
|---|---|
| Chip background | Light gray tint |
| Chip border radius | Full pill |
| Chip padding | 4px vertical, 10px horizontal |
| Chip font | 12px, 500 weight |
| × icon | 12px, secondary text color, hover state darkens |

---

## 11. Data requirements

### 11.1 Card-level data

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
| current_stage_name | string | job_pipeline_stages (snapshotted on job) |
| current_stage_semantic_type | enum | job_pipeline_stages — one of `screening`, `assessment`, `interview`, `offer` |
| stage_entered_at | timestamp | applications — updated on every stage change |
| sla_state | enum | computed — `none`, `approaching`, `breached` |
| flagged | boolean | applications — set by `flag_for_attention` trigger |

### 11.2 Column-level data

| Field | Type | Source |
|---|---|---|
| column_semantic_type | enum | Hard-coded for the four columns |
| column_count | integer | Count of applications across all of the company's active jobs with current stage of this semantic type |

### 11.3 Pipeline lookup for ambiguity resolution

When a drag drops a card on a column, the system needs to know the target job's pipeline stages of that semantic type. This requires:

| Field | Type | Source |
|---|---|---|
| job_pipeline_stages | array | jobs.pipeline_snapshot (locked at job creation) |
| stage.id | UUID | within snapshot |
| stage.name | string | within snapshot |
| stage.semantic_type | enum | within snapshot |
| stage.order | integer | within snapshot |
| stage.trigger_summary | string | computed — short description of triggers configured for stage entry |

---

## 12. Implementation notes

### 12.1 Required new fields

| Field | Model | Type | Notes |
|---|---|---|---|
| `terminal_archived` enum value | applications.stage / pipeline_stages.semantic_type | enum | New terminal state added to the locked set. |
| `paused_at` | jobs | timestamp \| null | Already in the dashboard cards spec but worth confirming. |
| `closed_at` | jobs | timestamp \| null | Already in the dashboard cards spec. |

### 12.2 Trigger reversal window

The universal undo toast requires triggers to support reversal within a 5-second window:

| Trigger | Reversal mechanism |
|---|---|
| `send_message_to_worker` | Buffer outbound message for 5 seconds before actually sending. If undo fires, discard the buffered message. |
| `notify_employer` | Same buffer pattern. |
| `start_sla_timer` | Cancel the timer record. |
| `flag_for_attention` | Remove the flag. |
| `archive_from_active_board` | Restore the application to active state and previous stage. |

This is a meaningful implementation requirement. The 5-second buffer must be applied at the trigger queue layer, not the UI layer, so that triggers fired by drag are deferred until the undo window passes.

### 12.3 Real-time updates

Out of scope for v1. The kanban does not refresh when other users move cards. Stale data is acceptable for the v1 single-user workflow. Real-time sync via websocket is a future phase enhancement.

### 12.4 Performance considerations

- The "+N more" cutoff at 15 cards per column caps the data shipped to the client. Implementations should fetch only 15 per column with a count for the "+N more" affordance, not all applications.
- Filter changes trigger a re-query, not a client-side filter, to avoid sending all applications to the browser for every filter combination.

---

## 13. Routing

| View | Route | Access |
|---|---|---|
| Company dashboard (with kanban widget) | /dashboard | Authenticated company user |
| Full applicants page | /dashboard/applicants | Authenticated company user |
| Applicant side panel | Overlay on current route | Authenticated company user |
| Job creation (sets pipeline snapshot) | /dashboard/jobs/new | Authenticated company user |
| Job detail (per-job kanban — separate spec) | /dashboard/jobs/[id] | Authenticated company user, owner of the post |

The "+N more" link in a column navigates to `/dashboard/applicants` with the semantic-type filter pre-applied. The "View all →" link in the widget header navigates to `/dashboard/applicants` with no pre-applied filters.

---

## 14. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | Keyboard drag-and-drop accessibility | WCAG compliance, deferred from v1 | Address in a follow-up sprint. Document the gap in release notes. |
| 2 | Trigger reversal: what if a worker has already opened the in-app notification during the 5s buffer? | Edge case in undo behavior | Notifications dispatched but card-level message stays buffered. Acceptable v1 compromise. |
| 3 | Mobile kanban gestures: long-press to drag is the default; do we need a confirmation gesture? | Mobile UX | Long-press + drag is enough. Standard pattern. Revisit if user testing surfaces accidental drags. |
| 4 | When a paused job is resumed, do its applicants get any notification? | Worker experience | No notification on resume. Workers were never told the job was paused. |
| 5 | Should `terminal_archived` applicants show in the full applicants page by default, or be hidden behind a "show archived" toggle? | Full applicants page UX | Hidden by default, toggle to surface. Specced in the list view spec. |

---

## 15. Future considerations

The following are explicitly deferred and not part of this spec, but the implementation should not preclude them.

### 15.1 Real-time multi-user sync

If multiple employer users move cards simultaneously, the kanban should eventually update in real time. v1 polls on page load. Phase 2 adds websocket sync.

### 15.2 Per-job kanban view

The job detail page at `/dashboard/jobs/[id]` will have its own kanban view rendering the job's actual stage names (not generic semantic-type labels). Drag behavior, picker logic, and undo toast patterns should be reusable across both kanbans.

### 15.3 Saved kanban views

Employers may eventually want to save filter combinations as named views (e.g. "Regulix Ready interviews this week"). v1 has no saved views.

### 15.4 Card customization

The current card content is fixed. A future enhancement could let companies configure which fields appear on cards.

### 15.5 Bulk drag operations

Currently a drag moves one card. A future enhancement could support multi-select then drag for bulk stage changes. v1 supports bulk operations only via the list view's bulk action bar.
