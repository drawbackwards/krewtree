# Krewtree — Applicants Page
### Product Specification
**Scope:** Full applicants management page at `/dashboard/applicants`
**Status:** Decisions locked
**Date:** May 19, 2026

---

## 1. Context & scope

The full applicants page is the dedicated page for managing all applicants across all jobs. It uses the same list and kanban views as the dashboard widget, scaled up for high-volume management: no row cap, full filtering, bulk actions, sorting, and pagination.

This is where employers go when they have real work to do across many applicants — reviewing a batch, processing rejections, scanning the pipeline at full depth.

**Out of scope:** Dashboard widget (applicants widget spec), pipeline data model (foundation spec), drawer behavior (existing stage-tasks spec).

**Foundation dependencies:** Applicants widget spec (shared view patterns), pipeline foundation spec (org-level pipelines).

---

## 2. Key decisions

| Topic | Decision |
|---|---|
| Views | List and kanban. Same toggle pattern as the dashboard widget. |
| Default view | Same as dashboard widget — list by default. Toggle preference shared with the widget (last write wins per user). |
| Row cap (list view) | No cap. Configurable pagination at 25, 50, or 100 rows per page. Defaults to 25. |
| Card cap (kanban view) | Top 50 per column with "+N more" affordance for additional. (Higher than the widget's 15.) |
| Filters | Full filter bar: search, job, regulix ready, stage, date range, terminal status. |
| Sorting (list view) | Sortable columns: applicant name, job, stage, last activity, applied date. Click header to toggle asc/desc. |
| Bulk actions (list view) | Checkboxes with floating action bar. Current page selection only. |
| Bulk actions (kanban view) | Not supported. Use list view for bulk operations. |
| Terminal applicants | Hidden by default. "Show archived" toggle surfaces them. |
| Filter state | Persists in URL query parameters so the page is shareable and bookmarkable. |
| Pre-applied filters | Routes accept query params (e.g. `?stage=interview`) for deep-linking from widget "+N more" links. |

---

## 3. Page structure

### 3.1 Layout (top to bottom)

| Element | Description |
|---|---|
| Page header | Title "Applicants" on the left. View toggle (List / Kanban) on the right. |
| Filter bar | Single horizontal row: search input, job filter, regulix ready, stage filter, date range, "Show archived" toggle, "Clear filters" link. |
| Bulk action bar (list view only) | Appears when 1+ rows are selected. Shows selection count, action buttons, "Deselect all" link. |
| Body | List or kanban based on toggle. |
| Pagination footer (list view) | Row count summary, rows-per-page selector, page number buttons. |

### 3.2 Header

| Element | Notes |
|---|---|
| Title | "Applicants" — left-aligned. |
| Filter result count | Smaller text below title: "Showing 1–25 of 142 applicants" (list) or "142 applicants across 5 stages" (kanban). |
| View toggle | Two-segment toggle (List / Kanban) right-aligned. Same pattern as the widget. |

### 3.3 Mobile layout

The page stacks vertically. Filter bar collapses to a "Filters" button that opens a sheet/modal with all filter controls. Bulk actions are hidden on mobile in v1 (defer multi-row checkbox interactions on small screens).

---

## 4. List view

### 4.1 Columns

| Column | Width | Sortable | Description |
|---|---|---|---|
| Checkbox | ~32px | No | Row selection. Header checkbox selects/deselects current page. |
| Applicant | ~22% | Yes (by last name) | Avatar + first name + last initial. Clickable — opens drawer. |
| Job | ~20% | Yes (by job title) | Job title with "Paused" tag inline if applicable. Plain text. |
| Stage | ~12% | Yes (by stage order in current pipeline) | Current pipeline stage name. |
| Regulix Ready | ~9% | No | Olive gold "R" badge or blank. |
| Last activity | ~11% | Yes (by `last_activity_at`) | Short relative date. |
| Applied | ~11% | Yes (by `applied_at`) | Short relative date. |
| Actions | ~15% | No | Primary action (View) + overflow menu. |

### 4.2 Sorting

Default sort: `last_activity_at` descending. Click a sortable header to make it the active sort column; click again to toggle direction. Only one column sorted at a time. Active sort column displays an arrow indicator.

### 4.3 Bulk actions

When one or more rows are checked, a floating action bar appears above the table:

| Action | Behavior |
|---|---|
| Advance stage | Moves all selected applications to the next stage in their respective pipeline snapshots. Applications already at the last stage are skipped silently. Toast summary: "Advanced X applicants; Y skipped." |
| Reject | Confirmation modal listing how many will be rejected. On confirm, moves all to `terminal_rejected`, fires triggers, removes from view. |
| Mark hired | Confirmation modal. On confirm, moves all to `terminal_hired`, fires triggers, removes from view. (Bulk hiring is rare but supported for completeness.) |
| Message | Opens message composer with all selected applicants as recipients. Deferred to messaging spec. |
| Deselect all | Clears selection. |

Bulk operations are limited to the current page. Cross-page selection ("Select all 142 matching") is not supported in v1.

Changing pages, filters, or sort clears the selection.

### 4.4 Row interaction

Identical to the widget's list view (Section 4.6 of applicants widget spec). Click applicant cell or View to open drawer, overflow for other actions.

### 4.5 Pagination

| Element | Description |
|---|---|
| Row count | Format: "1–25 of 142 applicants". Updates dynamically based on filters and page. |
| Rows per page | Dropdown selector: 25, 50, 100. Defaults to 25. Changing resets to page 1. |
| Page buttons | Previous/next arrows plus numbered page buttons. Truncated to 7 visible buttons max. Active page highlighted with teal fill. |

---

## 5. Kanban view

### 5.1 Layout

Same structure as the widget's kanban view, scaled up:

| Property | Behavior |
|---|---|
| Columns | One per active stage in the company's current live pipeline. |
| Cards per column | Top 50 + "+N more" link (vs. 15 on the widget). |
| Column scroll | Independent vertical scroll within column. |
| Card content | Identical to widget cards. |
| Drag-and-drop | Same mechanics as widget. |
| Undo toast | Same 5-second window. |

### 5.2 Differences from widget

- Higher per-column cap (50 vs. 15)
- No "View all" link (this is the full page)
- Filter bar is more complete (stage filter, terminal toggle)

### 5.3 No bulk actions in kanban

Bulk operations are list-view only. The kanban is for visual flow management, not batch processing. If a user wants to bulk-reject applicants, they switch to list view. The toggle preference shift is fine here — the user is choosing the right tool.

---

## 6. Filters

### 6.1 Filter inventory

| Filter | Type | Behavior |
|---|---|---|
| Search | Text input | Filters by applicant name and job title. Case-insensitive. Debounced (300ms). |
| Job | Searchable multi-select | Filters by job. Includes all jobs (open, paused, closed). |
| Regulix Ready | Dropdown | All / Regulix Ready / Not Regulix Ready. |
| Stage | Multi-select | All stages in the company's current pipeline, plus terminal states if "Show archived" is on. |
| Applied date range | Date range | From/to date pickers. |
| Show archived | Toggle | When on, includes applications in terminal states (hired, rejected, withdrawn, archived). Off by default. |
| Clear filters | Link button | Resets all filters. |

### 6.2 Active filter chips

When any filter is active, a chip row appears below the filter bar:

| Element | Behavior |
|---|---|
| Filter chip | One per active filter. Format: "Stage: Interview ×" or "Regulix Ready ×". Click × to remove. |
| Clear all link | Right-aligned. Removes all active filters at once. |
| Visibility | Hidden when no filters are active. |

### 6.3 URL persistence

Filter state syncs to URL query parameters. The page is shareable and bookmarkable. Example: `/dashboard/applicants?stage=interview&job=hvac-tech&regulix_ready=true`.

The "+N more" link from the dashboard widget kanban column constructs a URL with the appropriate stage filter pre-applied (e.g. `/dashboard/applicants?stage=phone-screen`).

### 6.4 Filter state and view toggle

Filters persist across the list/kanban toggle within the page. Filters do **not** persist back to the dashboard widget — those are separate filter contexts (matching the widget spec's behavior).

---

## 7. Terminal applicants

Terminal applicants (hired, rejected, withdrawn, archived) are hidden by default. The "Show archived" toggle in the filter bar surfaces them.

| Toggle state | Behavior |
|---|---|
| Off (default) | Only active applications shown. Stage filter does not include terminal states as options. |
| On | All applications shown, including terminal. Stage filter includes terminal states as filterable options. Row visual treatment for terminal applicants: muted text, terminal state name in the stage column (e.g. "Rejected", "Hired"). |

In kanban view, terminal applicants don't appear as cards (terminal states aren't columns). The "Show archived" toggle has no effect on the kanban view — it's a list-view filter.

---

## 8. Empty states

### 8.1 No applicants on the platform (entire company has zero)

Same as the widget's "no applicants yet" state:

| Condition | Message | CTA |
|---|---|---|
| Company has no open jobs | "No applicants yet." | "Post your first job →" |
| Company has open jobs but no applicants | "No applicants yet." | "Share your job posts →" |

### 8.2 No applicants match filters

Centered message in the page body:

> "No applicants match your filters." **Clear filters**

Clear filters resets all active filters to defaults.

### 8.3 No terminal applicants when "Show archived" is on

If the toggle is on but no terminal applications exist:

> "No archived applications yet."

(Edge case but worth handling to avoid an empty list looking like a bug.)

---

## 9. Visual design tokens

Inherits the widget's tokens. Page-specific additions:

### 9.1 Page header

| Property | Token / value |
|---|---|
| Title font | 24px, 600 weight, primary text color |
| Subtitle font | 13px, 400 weight, secondary text color |
| Header padding | 24px top, 16px bottom |

### 9.2 List view (page)

| Property | Token / value |
|---|---|
| Row padding | 6px vertical, 12px horizontal (denser than widget's 8px) |
| Row font | 12px (widget uses 13px) |
| Header font | 11px, 600 weight, secondary text color, uppercase letter-spacing |

The page list view is denser than the widget to handle higher volume. The widget is for at-a-glance; the page is for working.

### 9.3 Bulk action bar

| Property | Token / value |
|---|---|
| Position | Sticky below the page header when active |
| Background | Teal tint (#1C3D4A at 8% opacity) |
| Border | 1px solid teal at 30% opacity |
| Padding | 12px horizontal, 8px vertical |
| Selection count font | 12px, 500 weight, teal primary |

### 9.4 Pagination footer

| Property | Token / value |
|---|---|
| Container | 16px vertical padding, 1px top border in tertiary color |
| Row count font | 12px, secondary text color |
| Page buttons | 28px square, 0.5px tertiary border, hover state secondary background |
| Active page | Teal fill, white text |

---

## 10. Data requirements

Same as the widget (Section 10 of applicants widget spec), with these additions:

| Field | Type | Notes |
|---|---|---|
| applied_at | timestamp | Application creation date. Surfaced as a sortable column. |
| status | enum | Includes terminal states. Filtered by "Show archived" toggle. |
| terminal_state_at | timestamp \| null | When the application entered its terminal state (if applicable). |

### 10.1 Query patterns

Server-side filtering and sorting. Don't send full applicant set to client and filter in browser — page should handle thousands of applicants without choking.

Filter and sort combine into a single query. Pagination is offset-based for v1; cursor-based pagination can be added later if performance demands.

---

## 11. Routing

| View | Route | Access |
|---|---|---|
| Full applicants page | `/dashboard/applicants` | Authenticated company user |
| Filtered view (deep link) | `/dashboard/applicants?stage=...&job=...` | Authenticated company user |

The page is reachable from:
- Dashboard widget header "View all →" link
- Dashboard widget kanban column "+N more" links (with stage filter pre-applied)
- Main navigation "Candidates" or "Applicants" entry

---

## 12. Implementation notes

### 12.1 Shared components with the widget

The list view rows, kanban cards, and kanban columns should be the same components used by the dashboard widget. The page just provides different containers (full pagination instead of capped, full filter bar instead of compact, sortable headers).

This is a strong code-reuse opportunity. The components take props for "capped" vs. "full" behavior; the page uses the full variants, the widget uses the capped variants.

### 12.2 URL parameter handling

Filter state lives in URL query params. The page reads them on mount, applies them, and updates them as the user changes filters. Back/forward browser navigation should respect filter state.

### 12.3 Show archived performance

Including terminal applicants can multiply the dataset size significantly for established companies. The "Show archived" query should be indexed appropriately. Consider a separate query path or a pre-filtered count for performance.

### 12.4 Bulk operations consistency

Bulk Advance, Reject, and Mark Hired must use the same underlying APIs as the single-applicant equivalents (drawer actions, list overflow, kanban overflow). Don't fork the logic. Otherwise triggers and snapshots will drift.

### 12.5 Sort stability

When sorting by `last_activity_at` or `applied_at`, secondary sort by `application_id` for stable ordering. Otherwise pagination can show duplicate rows when ties exist.

---

## 13. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | Should there be a "Select all matching" affordance for cross-page bulk operations? | Bulk action scope | Not v1. Adds complexity and creates risk of accidental mass changes. Revisit if employers request it. |
| 2 | Does the URL include the view toggle (list vs. kanban) as a query param? | Sharability of specific view | Yes. `?view=kanban` overrides the user's stored preference for that page load. Without the param, falls back to stored preference. |
| 3 | When a filter is changed in kanban view, does the kanban re-render or transition smoothly? | Visual polish | Re-render. Animated transitions are overkill for v1. |
| 4 | Should the page show a "last refreshed" timestamp? | Data freshness signal | Not v1. Add only if staleness becomes a perceived problem. |
| 5 | When a stage filter is applied in kanban view, do other columns hide or just show "(0)"? | Visual clarity vs. consistency | Other columns show "(0)". Hiding columns based on filter would make the kanban shape inconsistent. |

---

## 14. Future considerations

### 14.1 Saved views

Named filter combinations ("Regulix Ready interviews this week"). Defer to future phase.

### 14.2 Cross-page bulk selection

"Select all 142 matching" with a confirmation banner (Gmail pattern). Defer.

### 14.3 Cursor-based pagination

If offset pagination becomes slow at scale, migrate to cursor-based. Not a v1 concern.

### 14.4 Export

CSV export of filtered applicants. Useful for reporting; defer unless employers request it.

### 14.5 Inline applicant editing

Quick actions on rows beyond stage advancement (e.g. inline note add, inline flag toggle). Defer; the drawer handles this.
