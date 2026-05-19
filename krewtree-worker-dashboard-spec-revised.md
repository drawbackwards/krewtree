# Krewtree — Worker Dashboard (Revised)
### Product Specification
**Scope:** Worker dashboard (authenticated worker view)
**Status:** Decisions locked
**Date:** May 19, 2026 (revision)

---

## 1. Context & scope

The worker dashboard is the authenticated landing page for workers after sign-in. It provides at-a-glance status on active applications, saved jobs, and profile health, and surfaces relevant new job opportunities without requiring navigation away.

This is a **revision** of the prior worker dashboard spec (April 28, 2026). The revision is targeted: the three-state worker-facing model from the pipeline pivot replaces the previous five-stage model. Boost and Withdraw availability rules update accordingly. Everything else is unchanged from the April 28 spec.

**What changed in this revision:**
- Application stages collapse from five (Applied, Reviewed, Interview, Offer, Closed) to three (Applied, In Review, Closed)
- Offers are surfaced via in-app notification and message, not as a stage badge
- Boost and Withdraw availability rules simplify to "available until Closed"
- Stage mapping table to employer pipeline is removed (worker stages are now derived, not mapped)

**What is unchanged:**
- All layout (two-column section, sidebar modules, below-fold modules)
- My Applications module structure (5 most recent, primary "View job" action)
- Saved jobs module (sort, staleness, removal)
- Profile completeness nudge (priority order, visibility rules)
- New jobs for you module (matching logic, fallback state)
- Regulix nudge block (sub-states, dismissal, recurrence)

**Foundation dependencies:** Pipeline foundation spec (three-state worker mapping), pipeline pivot (May 19, 2026).

---

## 2. Key decisions (changes only)

| Topic | Decision |
|---|---|
| Application stages | Three: Applied, In Review, Closed. No mapping to employer pipeline. |
| Stage derivation | Computed from application status and stage position. See Section 4.4. |
| Stage: Applied | Application is in the first stage of the employer's snapshotted pipeline, no movement yet. |
| Stage: In Review | Application has been moved past the first stage, not in terminal state. |
| Stage: Closed | Application is in any terminal state (hired, rejected, withdrawn, archived). |
| Offer notification | In-app notification + message in the messaging surface (deferred). Stage badge stays "In Review" until terminal. |
| Boost availability | Available at any worker stage except Closed. |
| Withdraw availability | Available at any worker stage except Closed. |
| Withdraw reasons | Unchanged: Accepted another offer · Applied by mistake · Position no longer a good fit · Not available for the dates/schedule · Other. |

All other decisions from the April 28 spec carry forward unchanged.

---

## 3. Layout

Unchanged from April 28 spec. See `archive/krewtree-worker-dashboard-spec-deprecated-may-2026.md` Section 3 for full details. Summary:

- Two-column section at top: My Applications (left, ~65%) + sidebar (right, ~35%, containing Profile Completeness Nudge above Regulix Nudge Block)
- Two full-width modules below: Saved Jobs, then New Jobs For You
- Mobile: stacks in order My Applications → Profile Completeness → Regulix Nudge → Saved Jobs → New Jobs For You

---

## 4. My applications (revised)

### 4.1 Module header

"My applications" left-aligned. "View all →" right-aligned, navigates to `/applications`.

### 4.2 Display rows

5 most recently active applications, sorted by last activity timestamp descending. If fewer than 5 applications exist, all are shown. No empty-state filler rows.

| Field | Description |
|---|---|
| Job title | Clickable. Navigates to job detail page. Teal text, 500 weight. |
| Company name | Plain text. Secondary text color. |
| Stage badge | Pill badge showing current worker-facing stage. Color-coded — see Section 4.3. |
| Applied date | Date application was submitted. Secondary text color. |
| Actions | Primary button + overflow menu (⋯). |

### 4.3 Stage badges (revised)

Three stages now. Color treatments differentiate at-a-glance.

| Stage | Background | Text | Notes |
|---|---|---|---|
| Applied | Gray tint | Gray | Application submitted, no employer movement yet. |
| In Review | Blue tint | Blue | Employer has moved the application past the first stage. |
| Closed | Gray tint (disabled) | Gray (muted) | Application in any terminal state — rejection, withdrawal, hiring, or job archived. |

### 4.4 Stage derivation

Worker stage is computed from the application's status and stage position. It is not stored.

```
function deriveWorkerStage(application):
  if application.status != 'active':
    return 'Closed'
  if application.current_stage_id == first_stage_id_in_snapshot(application.job):
    return 'Applied'
  return 'In Review'
```

If an employer moves an application backward to the first stage, the worker view stays In Review. The transition from Applied to In Review is one-way for worker display purposes (avoids visible flicker on employer corrections).

### 4.5 Offer notification

When an employer extends an offer, the worker is notified via:

- An in-app notification ("You've received an offer for [Job title] at [Company]")
- A message in the messaging surface (deferred to messaging spec)
- Optional email notification depending on the worker's notification preferences

The worker's stage badge for that application stays "In Review" until they accept, decline, or the employer formally hires them (transitioning to Closed with the hired terminal state). There is no "Offer" badge.

In My Applications, an offer-active application may surface a small indicator inline with the stage badge or job title — implementation choice. v1 acceptable behavior: the offer notification appears in the notification surface; My Applications shows "In Review" with no additional indicator. The notification + message do the work. If user testing reveals offers get missed, revisit with an inline indicator.

### 4.6 Row actions (revised)

**Primary:** View job — navigates to the job detail page. Unchanged.

**Overflow (⋯):**

| Action | Available stages | Behavior |
|---|---|---|
| Boost | Applied, In Review | Initiates $9.99 Stripe payment flow. Highlights application to employer. Small boost indicator appears on the row after purchase. Hidden when Closed. |
| Withdraw | Applied, In Review | Opens modal with reason dropdown and optional message field. On confirm, application marked withdrawn (`terminal_withdrawn`) and row removed from module. Hidden when Closed. |

The simplification: Boost and Withdraw are available throughout the active life of the application, all the way up to terminal. The previous "hidden at Offer" rule is gone because offers no longer have a stage representation.

If a worker boosts an application that has secretly received an offer (employer extended it but worker hasn't actioned the offer message yet), the boost is wasted — the employer has already decided. This is an acceptable v1 edge case.

### 4.7 Withdraw modal

Unchanged from April 28 spec:

| Element | Detail |
|---|---|
| Reason dropdown | Required. Options: Accepted another offer · Applied by mistake · Position no longer a good fit · Not available for the dates/schedule · Other. |
| Message to company | Optional free-text field. |
| Confirm | Marks application as withdrawn (`terminal_withdrawn`). Removes row from module. |
| Cancel | Dismisses modal, no change. |

---

## 5. Saved jobs

Unchanged from April 28 spec. See archived version Section 5 for full details.

Summary of staleness states:

| State | Trigger | Visual treatment |
|---|---|---|
| Open | Job is open, closing date not within 7 days or no closing date set. | No indicator. Default state. |
| Expiring Soon | `closing_at` is within 7 days. | Amber pill. Quick Apply given higher visual weight (solid fill vs. outline). |
| Closed | Job status is closed or paused. | Gray/disabled treatment. Job title struck through and non-clickable. Quick Apply hidden. |

---

## 6. Profile completeness nudge

Unchanged from April 28 spec. See archived version Section 6 for full details.

---

## 7. New jobs for you

Unchanged from April 28 spec. See archived version Section 7 for full details.

---

## 8. Regulix nudge block

Unchanged from April 28 spec. See archived version Section 8 for full details.

---

## 9. Data requirements (revised)

### 9.1 My applications

| Field | Type | Source |
|---|---|---|
| job_id | UUID | applications |
| job_title | string | jobs |
| company_name | string | companies |
| status | enum | applications — `active`, `terminal_hired`, `terminal_rejected`, `terminal_withdrawn`, `terminal_archived` |
| current_stage_id | UUID \| null | applications |
| first_stage_id_in_snapshot | UUID | computed from the application's job pipeline snapshot — the stage with the lowest order |
| applied_at | timestamp | applications |
| last_activity_at | timestamp | applications — updated on each stage change, used for sort |
| is_boosted | boolean | applications |
| worker_stage | computed | derived from status + current_stage_id + first_stage_id_in_snapshot — returns `Applied`, `In Review`, or `Closed` |

The `worker_stage` field is computed at API response time, not stored. See Section 4.4 for derivation logic.

### 9.2 Other modules

Saved jobs, profile completeness, new jobs for you, Regulix nudge — data requirements unchanged from April 28 spec.

---

## 10. Routing

Unchanged from April 28 spec.

| View | Route | Access |
|---|---|---|
| Worker dashboard | /dashboard | Authenticated worker |
| Full application history | /applications | Authenticated worker |
| Full saved jobs | /saved-jobs | Authenticated worker |
| Job browse | /jobs | Authenticated worker |
| Worker profile | /profile | Authenticated worker |
| Job detail | /jobs/[id] | Authenticated worker |

---

## 11. Implementation notes

### 11.1 Stage derivation in the API

The worker stage is computed in the API response, not stored on the application record. This avoids sync bugs when an employer moves an application — the stored stage_id changes, and the next API read computes the new worker stage from it.

### 11.2 One-way Applied → In Review

The derivation in Section 4.4 makes Applied a strictly-once state: as soon as `current_stage_id` is anything other than the first stage of the snapshot, worker stage is In Review. Moving backward (employer correction) does not flip back to Applied.

If the application's `current_stage_id` returns to the first stage value, the API still returns In Review based on history. This requires tracking a flag — either:
- A `has_been_advanced` boolean on the application, set to true on first advance and never reset, OR
- A check against the application log for any prior stage change events

The boolean flag is simpler. Set on first advance, never modified. Stage derivation reads the flag in addition to current stage.

```
function deriveWorkerStage(application):
  if application.status != 'active':
    return 'Closed'
  if application.has_been_advanced:
    return 'In Review'
  return 'Applied'
```

### 11.3 Offer indicators (deferred)

If user testing reveals that offer messages get missed because the stage badge stays at In Review, consider adding:
- A small "Offer pending" pill inline with the stage badge
- A dedicated "Offers" section above My Applications

Either is a future enhancement. v1 relies on the notification + message channel to communicate offers.

### 11.4 Boost-after-offer edge case

If a worker boosts an application that has an offer waiting (employer extended, worker hasn't seen it), the boost succeeds and the $9.99 is charged. This is technically a wasted boost since the employer has already decided. We accept this edge case for v1 in exchange for the simpler "available until Closed" rule.

Refund logic is out of scope. If this becomes a real complaint pattern, a future enhancement could detect offer-pending state and disable Boost.

---

## 12. Open questions

| # | Question | Impact | Recommended default |
|---|---|---|---|
| 1 | Should an offer-pending application get any visual indicator on the worker side beyond the notification? | Notification effectiveness | Not in v1. Rely on notification + message. Revisit if user testing shows offers getting missed. |
| 2 | When an employer moves an application back to the first stage (correction), should the worker see any indication of that? | Worker confusion potential | No. Worker view stays In Review. The employer-side log captures the correction; the worker doesn't need to see process churn. |
| 3 | Should the `has_been_advanced` flag be visible to workers? | API design | No. Internal-only. Workers see derived `worker_stage` only. |
| 4 | What about applications on jobs that get archived while in In Review — does the worker see "Closed" with any specific subtext? | Worker context on archived jobs | The terminal notification text covers this: "[Company] has closed the position for [Job title]. Your application is no longer active." Stage badge shows Closed with no additional subtext. |

---

## 13. Future considerations

### 13.1 Offer-active inline indicator

Add a small visual on My Applications rows when an offer is pending response. Defer until user testing justifies it.

### 13.2 Application detail page

A dedicated `/applications/[id]` page with full history, messages, and actions. v1 surfaces application info via the My Applications module and the job detail page. Dedicated page is a future enhancement.

### 13.3 Notification preferences

Workers may want to configure which events trigger email vs. in-app notifications (offers, rejections, status changes). v1 uses platform defaults. Notification preferences live in the worker profile settings (future).

### 13.4 Refund logic for wasted boosts

If boosting after an offer is extended becomes a complaint pattern, add detection logic to either block the boost or auto-refund. v1 accepts the wasted-boost edge case.
