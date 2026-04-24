# Pipeline Kanban — Design Spec

**Date:** 2026-04-24
**Status:** Approved

---

## Overview

Add a drag-and-drop pipeline kanban board to the company dashboard, positioned below the existing stat cards. The board shows all active-stage applicants across all jobs in 4 columns: New, Reviewed, Interview, and Offer. Hired and Rejected applicants are excluded. Dragging a card between columns updates the applicant's `kanban_stage` in the database.

---

## Location

`CompanyDashboard.tsx` — rendered as a new section below the 4 stat cards, above the existing Recent Applicants and Active Jobs widgets.

---

## Components

All new files under `src/site/components/PipelineKanban/`:

### `PipelineKanban.tsx`

- Props: `{ companyId: string }`
- Owns local applicant state (flat array of `CompanyApplicant`)
- Calls `getKanbanApplicants(companyId)` on mount to load data
- Groups applicants into 4 columns by `stage` client-side
- Wraps columns in `DndContext` from `@dnd-kit/core`
- Handles `onDragEnd`: optimistic stage update in local state → `setApplicantStage(applicationId, newStage)` → revert on error
- Shows a loading skeleton and an empty state ("No applicants in pipeline yet")

### `KanbanColumn.tsx`

- Props: `{ stage: KanbanStage; applicants: CompanyApplicant[] }`
- Renders column header (stage label + count badge) and a list of `KanbanCard` components
- Uses `useDroppable({ id: stage })` from `@dnd-kit/core`
- Highlights drop zone when a card is dragged over it

### `KanbanCard.tsx`

- Props: `{ applicant: CompanyApplicant }`
- Displays: avatar (initials fallback using `workerInitials`), `workerFullName`, `jobTitle`
- Uses `useDraggable({ id: applicant.id })` from `@dnd-kit/core`
- Applies a drag-in-progress visual style (reduced opacity, slight scale) via `transform` from `useDraggable`

---

## Data

### New service function

`getKanbanApplicants(companyId: string)` in `src/site/services/applicantService.ts`

- Queries `applications` joined with `worker_profiles` and `jobs`
- Filters: `kanban_stage IN ('new', 'reviewed', 'interview', 'offer')` and job's `company_id = companyId`
- Returns `CompanyApplicant[]` (reuses existing type)
- Returns `{ data, error }` per service convention

### Stage update

Uses existing `setApplicantStage(applicationId, stage)` in `applicantService.ts` — no changes needed.

---

## Drag Interaction

1. User picks up a card — card renders with reduced opacity, column drop zones activate
2. User drops on a target column:
   - If same column: no-op
   - If different column: optimistically move card in local state, call `setApplicantStage`
   - On error: revert local state, no toast (out of scope)
3. Per-drag actions (e.g. confirmation modals, notifications) are **out of scope** for this build

---

## Packages

Install `@dnd-kit/core` only. No sortable package needed — cards move between columns, not within.

```
npm install @dnd-kit/core
```

---

## Styling

- CSS Module: `PipelineKanban.module.css`
- Board uses a 4-column CSS grid, full width
- Column background: `--kt-bg-secondary`
- Card background: `--kt-bg-primary`
- No hardcoded hex values — all tokens from `src/styles/tokens.css`
- Drop zone highlight uses a CSS class toggled by `isOver` from `useDroppable`

---

## Out of Scope

- Per-drag action modals or confirmation flows
- Reordering cards within a column
- Filtering the kanban by job
- Clicking a card to open detail pane (can be added later)
- Hired / Rejected columns
