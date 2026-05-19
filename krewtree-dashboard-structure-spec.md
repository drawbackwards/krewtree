# Krewtree — Dashboard Structure
### Product Specification
**Scope:** Company dashboard top-level structure and layout
**Status:** Decisions locked
**Date:** May 19, 2026

---

## 1. Context & scope

The company dashboard is the authenticated landing page for employer users. It is the daily check-in surface: a morning briefing of what's happened, what's coming up, and what needs attention.

This spec defines the **top-level structure** of that page — what conceptual blocks exist, what order they appear in, and how they relate. It does not spec the internal behavior of any individual widget. Each widget has (or will have) its own spec.

This spec supersedes the implicit dashboard direction captured in prior session notes (the "Option C morning briefing" direction). It also formalizes the May 19, 2026 pivot decisions: list view as the default, kanban as opt-in, and the consolidation of the previous Applicant Pipeline widget and Recent Applicants table into a single Applicants widget.

**Out of scope for this spec:** Internal behavior of any widget (stat cards behavior, applicants widget list/kanban views, jobs widget rows, calendar mechanics). Empty states for individual widgets. Pipeline editor surface. Settings page.

**Foundation dependencies:** Pipeline pivot (May 19, 2026) — org-level configurable pipelines, three-state worker mapping, list-default + kanban-opt-in framing.

---

## 2. Key decisions

| Topic | Decision |
|---|---|
| Conceptual blocks | Four: stat cards, calendar + attention row, applicants, jobs. Reduced from five by consolidating the previous kanban widget and Recent Applicants table. |
| Block order (top to bottom) | Stat cards → Regulix promo banner (dismissible) → Calendar + Needs Attention → Applicants → Jobs. |
| Applicants widget | Single widget with a list/kanban view toggle. List is the default. Toggle preference persists per user. |
| New company default | List view. New companies see the list view on first dashboard load. |
| Toggle persistence scope | Per user, stored in the database. Survives logout and works across devices. |
| Jobs widget | The existing "Active jobs" module (5 most recent open/paused posts). Unchanged in scope by this spec. |
| Calendar | 2:1 ratio with Needs Attention row to the right. Unchanged in scope by this spec. |
| Stat cards | Four cards: Active Posts, New Applicants Today, Regulix Ready Applicants, Pending Interviews. Unchanged in scope by this spec. |
| Regulix promo | Dismissible banner below stat cards, above the calendar row. Surfaces only when company has not connected Regulix or has not enabled key Regulix features. |
| Onboarding entry point | Template selection happens at signup. New companies arrive at the dashboard with a default pipeline already in place. |
| Module configurability | Show/hide toggles per widget. No reorder in v1. Per-company (not per-user). |

---

## 3. Layout

### 3.1 Conceptual blocks

The dashboard is organized into four conceptual blocks, in fixed vertical order. Each block contains one or more widgets.

| Order | Block | Contents |
|---|---|---|
| 1 | Stat cards | Four KPI cards in a single horizontal row. |
| 2 | Calendar + Needs Attention | Week calendar (left, 2/3 width) + Needs Attention list (right, 1/3 width). |
| 3 | Applicants | Single full-width widget with list/kanban view toggle. |
| 4 | Jobs | "Active jobs" module — 5 most recent open/paused posts in a compact table. |

The Regulix promo banner sits between block 1 and block 2 when present (dismissible, conditional).

### 3.2 Page structure (top to bottom)

| Position | Element | Notes |
|---|---|---|
| 1 | Page header | Title "Dashboard" left-aligned. No CTA on the right at this level — actions live within widgets. |
| 2 | Stat cards row | Four cards, equal width, horizontal flex layout. |
| 3 | Regulix promo banner | Conditional. Dismissible. Hidden if company has fully connected Regulix or has previously dismissed the current variant. |
| 4 | Calendar + Needs Attention row | 2:1 horizontal split at desktop, stacks vertically at mobile. |
| 5 | Applicants widget | Full-width. Contains the view toggle (list/kanban) in its header. |
| 6 | Jobs widget | Full-width. "Active jobs" header with "View all posts →" link. |

### 3.3 Mobile layout

All blocks stack vertically. Order top to bottom matches desktop: stat cards (may wrap to 2x2 grid) → Regulix promo → Calendar → Needs Attention → Applicants → Jobs.

Stat cards on narrow screens collapse to a 2x2 grid to maintain readability. Widgets that have internal columns (calendar + needs attention, applicants kanban) stack their internal columns vertically on mobile.

---

## 4. Block 1 — Stat cards

Defined in the previously locked dashboard direction. Four KPI cards in a single row. Each card displays a current count, a week-over-week delta, and a label.

| Card | Metric | Notes |
|---|---|---|
| Active Posts | Count of jobs with status Open or Paused | Excludes Closed. |
| New Applicants Today | Count of applications created in the last 24 hours | Across all of the company's jobs. |
| Regulix Ready Applicants | Count of active applicants who are Regulix Ready | Across all active applicants in non-terminal stages. |
| Pending Interviews | Count of interviews scheduled within the next 7 days | Sourced from the Interviews stub data model. |

The internal mechanics of each card (loading, click-through, delta calculation) are out of scope for this spec.

---

## 5. Regulix promo banner

A dismissible banner that promotes Regulix features. Surfaces between the stat cards and the calendar row. Hidden when not applicable.

| Property | Behavior |
|---|---|
| Visibility | Shown when the company has not connected Regulix or has not enabled a featured Regulix capability. |
| Dismissibility | Yes. Close (×) icon on the right. Dismissal stored per company in the database. |
| Recurrence | Variants may resurface periodically (e.g. after 30 days or when a new Regulix feature ships). Recurrence rules are not specced here. |
| Position | Between stat cards and calendar row. |

The banner copy, CTA, and variant logic are out of scope for this spec.

---

## 6. Block 2 — Calendar + Needs Attention

A 2:1 split row containing two widgets side-by-side at desktop.

| Side | Width | Contents |
|---|---|---|
| Left | ~66% | Week calendar — 7-day view of upcoming interviews and scheduled events. |
| Right | ~33% | Needs Attention — list of applications with SLA breaches, flagged items, or pending actions. |

On mobile, these stack vertically with the calendar above Needs Attention.

The internal behavior of each widget is out of scope for this spec.

---

## 7. Block 3 — Applicants widget

A single full-width widget that consolidates the previous Applicant Pipeline (kanban) widget and the Recent Applicants table. Its full behavior is defined in the Applicants widget spec — this section establishes only the structural framing within the dashboard.

### 7.1 View toggle

The widget has two views: list and kanban. A toggle control in the widget header switches between them.

| View | When it's shown |
|---|---|
| List | Default for all new companies. Default for any user who has not made an explicit choice. |
| Kanban | Shown when the user has previously toggled to it. Preference persists per user. |

### 7.2 Toggle persistence

| Property | Behavior |
|---|---|
| Scope | Per user (not per company, not per device). |
| Storage | Persisted in the database on the user record (not local storage). |
| Lifetime | Survives logout. Works across devices. |
| Default | List view. A user with no stored preference sees list view on every device until they toggle to kanban. |

### 7.3 Widget header

| Element | Notes |
|---|---|
| Title | "Applicants" left-aligned. |
| View toggle | Two-segment toggle (List / Kanban) right-aligned. Active segment highlighted. |
| "View all →" link | Right of the toggle. Navigates to `/dashboard/applicants` (full applicants page). |

Internal content of the widget — capped row count, columns, drag-and-drop behavior, filtering, etc. — is specced separately in the Applicants widget spec.

---

## 8. Block 4 — Jobs widget

The "Active jobs" module from the existing Job Posts spec. Compact table showing the 5 most recent open or paused job posts. Closed posts excluded.

This spec does not modify the Jobs widget. Its behavior is defined in `krewtree-job-posts-spec` (Section 3, "Dashboard module — Active jobs").

---

## 9. Module configurability

Each widget on the dashboard can be shown or hidden. Configuration is per-company, not per-user.

| Property | Behavior |
|---|---|
| Configurable widgets | Stat cards (as a group), Regulix promo, Calendar, Needs Attention, Applicants, Jobs. |
| Default state | All widgets visible. New companies see the full dashboard on first load. |
| Configuration surface | Settings → Dashboard. Out of scope for this spec. |
| Reorder | Not supported in v1. Widgets render in the fixed order defined in Section 3.2. |

Module configurability is per-company because the dashboard is shared by all users at a company. A widget hidden by one user should not be hidden for their colleagues. (If multi-seat surfaces a real need for per-user dashboard config later, that's a future enhancement.)

---

## 10. Onboarding entry point

Template selection happens at signup. A new company picks one of three options during account creation:

| Option | Outcome |
|---|---|
| Short template | Pre-built short pipeline with stages, suggested triggers, and starter task templates. |
| Long template | Pre-built long pipeline with more stages, suggested triggers, and starter task templates. |
| Build Your Own | Empty pipeline with just an Applied stage. Company configures the rest in the pipeline editor. |

By the time a new company first reaches the dashboard, their pipeline is already defined. The dashboard is functional from minute one. No dashboard state depends on the template choice except via the underlying pipeline.

The signup template-selection UX is out of scope for this spec — it's a signup-flow concern, not a dashboard concern. The pipeline foundation spec defines the data model behind templates.

---

## 11. New company state

A brand-new company arrives at the dashboard with:

- A default pipeline (whichever template they chose at signup)
- Zero jobs posted
- Zero applicants

The dashboard renders all widgets, but most are in their empty state:

| Widget | Empty state behavior |
|---|---|
| Stat cards | All counts show 0. No deltas. |
| Regulix promo | Shown (assuming Regulix not yet connected). |
| Calendar | Empty week view with no events. |
| Needs Attention | Empty state copy: "Nothing needs your attention right now." |
| Applicants | Empty state copy with CTA: "No applicants yet." + "Post your first job →" link. |
| Jobs | Empty state copy with CTA: "No active job posts." + "Post your first job →" button. |

The specific empty-state copy and visual treatment of each widget is defined in that widget's own spec.

---

## 12. Visual design tokens

Inherits the established Krewtree visual language. Tokens listed here govern the dashboard layout only — individual widgets define their own internal tokens.

### 12.1 Block spacing

| Property | Token / value |
|---|---|
| Page padding | 24px horizontal, 24px top, 32px bottom |
| Vertical gap between blocks | 24px |
| Vertical gap between stat cards row and Regulix banner (when present) | 16px |
| Horizontal gap between widgets within a block | 16px |

### 12.2 Block headers

| Property | Token / value |
|---|---|
| Widget title font | 15px, 600 weight, primary text color |
| Widget header padding | 16px horizontal, 12px vertical |
| Widget header bottom border | 1px tertiary border color (only when widget has internal content rows; calendar and kanban omit this) |

### 12.3 Widget container

| Property | Token / value |
|---|---|
| Background | White |
| Border | 0.5px tertiary border color |
| Border radius | border-radius-md |
| Internal padding | 16px (widgets with their own dense content may override) |

---

## 13. Routing

| View | Route | Access |
|---|---|---|
| Company dashboard | `/dashboard` | Authenticated company user |
| Full applicants page | `/dashboard/applicants` | Authenticated company user |
| Full job posts page | `/dashboard/jobs` | Authenticated company user |
| Job detail | `/dashboard/jobs/[id]` | Authenticated company user, owner of the post |

The dashboard route is unchanged by this spec. Links from dashboard widgets navigate to the existing dedicated pages.

---

## 14. Data requirements

This spec is structural and does not introduce new data requirements at the dashboard level. Each widget defines its own data needs in its own spec. The only dashboard-level addition is:

| Field | Model | Type | Notes |
|---|---|---|---|
| `applicants_view_preference` | user | enum (`list`, `kanban`) | Default `list`. Per-user preference for the Applicants widget view toggle. |

---

## 15. Implementation notes

### 15.1 Block rendering independence

Each block (and each widget within a block) should render independently. A failure in one widget should not block the rest of the dashboard. Suggested pattern: each widget is a separate data-fetching boundary with its own loading and error states.

### 15.2 First-paint priority

The stat cards are the highest-priority paint target — they're at the top of the page and visible above the fold. Prioritize their data fetch over other widgets. The Applicants widget is the highest-content widget and likely the slowest; render its skeleton early so the layout doesn't jump.

### 15.3 Toggle persistence

When the user toggles the Applicants widget between list and kanban:

1. Update the UI immediately (optimistic)
2. Write the preference to the user record asynchronously
3. On next dashboard load (any device), the stored preference is the source of truth

If the write fails, the UI stays on the toggled view for the current session but reverts to the stored preference on next load. No error message; the failure is silent.

### 15.4 Widget visibility config

The configurability surface is deferred (out of scope here), but the data model should accommodate it now. Suggested shape: a `dashboard_widget_config` table or JSON column on the company record, keyed by widget identifier, with a boolean `visible` flag per widget. Default all to `true`.

---

## 16. Future considerations

The following are explicitly deferred and not part of this spec.

### 16.1 Widget reorder

V1 has a fixed widget order. A future enhancement could let companies reorder widgets. The data model from Section 15.4 should accommodate an `order` field per widget to support this later.

### 16.2 Per-user dashboard configuration

V1 has per-company widget visibility. If multi-seat surfaces a need for per-user overrides (e.g. an admin who wants to hide widgets only relevant to recruiters), revisit. Not a v1 concern.

### 16.3 Dashboard variants by company size

A high-volume company has very different needs from a small contractor hiring quarterly. A future enhancement could surface different default widget visibility based on company activity level. Not a v1 concern — v1 ships one dashboard.

### 16.4 Saved kanban views (if kanban is in use)

If a company adopts the kanban view, they may eventually want to save filter combinations as named views. Not a v1 concern, and not a dashboard-level concern — would live in the Applicants widget spec.

### 16.5 Calendar expansion

The current calendar is a week view. A month view, day view, or full calendar page could come later. Not a v1 concern.

---

## 17. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | Should the Regulix promo banner appear above or below the stat cards? | First-paint priority, attention hierarchy | Below stat cards. Stat cards are higher-priority information; promo is conditional and dismissible. |
| 2 | When a user has hidden a widget via company config, do they still see its data summarized elsewhere (e.g. a count in stat cards)? | Widget independence vs. dashboard coherence | Yes. Hiding the Jobs widget doesn't hide the "Active Posts" stat card. Widgets are independent display surfaces; stat cards summarize the underlying data regardless. |
| 3 | Does the view toggle preference apply to the full applicants page at `/dashboard/applicants` as well? | Cross-surface consistency | Yes. The same user preference drives the default view on both the dashboard widget and the full page. Both surfaces respect any override the user makes on the other (last write wins). |
| 4 | What happens to widgets in their loading state — skeleton placeholders or just blank space? | Page jump and perceived performance | Skeleton placeholders matching the widget's expected dimensions. Prevents layout shift. |
