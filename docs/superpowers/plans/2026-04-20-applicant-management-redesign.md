# Applicant Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current table-based `AllApplicantsPage` with the split list-detail applicant management surface specified in `docs/superpowers/specs/2026-04-20-applicant-management-redesign-design.md` — ranked list on the left, profile detail on the right, keyboard-first, responsive down to mobile, consuming the already-merged `regulixService`.

**Architecture:** Foundations first (types + rank composition + service refactor + hooks), then components built outside-in (page shell → filter/bulk bars → list → detail → modals → help overlay → states), then integration (router, AuthContext) and cleanup (delete old page + slideover). Service logic is TDD-tested; visual components are shipped with full code and verified by typecheck + visual smoke test.

**Tech Stack:** React 18 + TypeScript 5 strict, React Router 7, CSS Modules + `--kt-*` tokens, Vitest for unit tests, existing `regulixService` / `applicantService` pattern.

**Spec:** [docs/superpowers/specs/2026-04-20-applicant-management-redesign-design.md](../specs/2026-04-20-applicant-management-redesign-design.md)

---

## File Structure

Create all new files under two folders:

**`src/site/pages/ApplicantManagement/`**

| File                                 | Responsibility                                                        |
| ------------------------------------ | --------------------------------------------------------------------- |
| `ApplicantManagementPage.tsx`        | Container: state, URL-param sync, data fetching, layout orchestration |
| `ApplicantManagementPage.module.css` | Page-level layout grid, responsive breakpoints                        |

**`src/site/components/ApplicantManagement/`**

| File                                     | Responsibility                                        |
| ---------------------------------------- | ----------------------------------------------------- |
| `ApplicantFilterBar.tsx` + `.module.css` | Top-of-page filter controls                           |
| `BulkActionBar.tsx` + `.module.css`      | Floating bar when rows are checked                    |
| `ApplicantList.tsx` + `.module.css`      | Left pane — ranked list + keyboard nav                |
| `ApplicantListRow.tsx` + `.module.css`   | Compact row: avatar, name, rank, stage, Regulix badge |
| `ApplicantDetail.tsx` + `.module.css`    | Right pane — profile contents                         |
| `ApplicantActionBar.tsx` + `.module.css` | Action buttons inside detail panel                    |
| `RankBreakdown.tsx` + `.module.css`      | Large rank number + 4 component bars                  |
| `HireConfirmModal.tsx`                   | Simple hire confirmation (date only)                  |
| `RegulixOnboardingModal.tsx`             | Regulix handoff modal (date + pay rate)               |
| `KeyboardHelpOverlay.tsx`                | Modal listing key bindings                            |
| `useApplicantKeyboardNav.ts`             | Keyboard nav hook                                     |
| `useLayoutMode.ts`                       | Responsive layout mode hook                           |

**Modified:**

- `src/site/services/applicantService.ts` — refactor `getAllApplicants` → `getRankedApplicants`, add 3 new write functions
- `src/site/types/index.ts` — add `RankedApplicant`, `RankComponents`, update `ApplicantSort`
- `src/site/Router.tsx` — swap page; add `:jobId` route
- `src/site/pages/index.ts` — export new page; remove old
- `src/site/context/AuthContext.tsx` — add `company.regulixLinked` derived value (v1 always false)

**Deleted (after wiring lands):**

- `src/site/pages/AllApplicantsPage.tsx` + `.module.css`
- `src/site/components/ApplicantSlideover/` directory (2 files)

**Boundaries:**

- New UI never imports from the old page/slideover.
- All service layer reads of Regulix go through `regulixService` — the page never imports from `mock.ts` directly.
- CSS Modules only for component-scoped styles; page-level layout uses the page's own `.module.css`.

---

## Task 1: Types + rank composition helper (TDD)

**Files:**

- Modify: `src/site/types/index.ts`
- Create: `src/site/services/rankComposition.ts`
- Create: `src/site/services/__tests__/rankComposition.test.ts`

- [ ] **Step 1: Add types**

Append to `src/site/types/index.ts` (after the REGULIX INTEGRATION TYPES block):

```ts
// ============================================================
// APPLICANT RANKING TYPES
// See: docs/superpowers/specs/2026-04-20-applicant-management-redesign-design.md §4
// ============================================================

export type RankComponents = {
  skillMatch: number // 0-100
  regulixReady: number // 0 or 100
  endorsementsScore: number // 0-100, scaled count
  recencyScore: number // 0-100, 14-day decay
}

export type RankedApplicant = CompanyApplicant & {
  rank: number // 0-100 integer
  rankBreakdown: RankComponents
  regulixStatus: RegulixStatus | null
  endorsements: RegulixEndorsement[]
  verifiedWorkHistory: VerifiedWorkHistoryEntry[]
}
```

- [ ] **Step 2: Write failing tests**

Create `src/site/services/__tests__/rankComposition.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeRank, computeRecencyScore, computeEndorsementsScore } from '../rankComposition'

describe('computeRecencyScore', () => {
  it('returns 100 for applied-today (0 days)', () => {
    expect(computeRecencyScore(0)).toBe(100)
  })

  it('returns ~50 for 7 days old', () => {
    expect(computeRecencyScore(7)).toBeCloseTo(50, 0)
  })

  it('returns 0 for 14+ days old', () => {
    expect(computeRecencyScore(14)).toBe(0)
    expect(computeRecencyScore(30)).toBe(0)
  })
})

describe('computeEndorsementsScore', () => {
  it('returns 0 for no endorsements', () => {
    expect(computeEndorsementsScore(0)).toBe(0)
  })

  it('scales linearly: 1 endorsement = 25, 2 = 50, 3 = 75', () => {
    expect(computeEndorsementsScore(1)).toBe(25)
    expect(computeEndorsementsScore(2)).toBe(50)
    expect(computeEndorsementsScore(3)).toBe(75)
  })

  it('caps at 100 for 4+ endorsements', () => {
    expect(computeEndorsementsScore(4)).toBe(100)
    expect(computeEndorsementsScore(10)).toBe(100)
  })
})

describe('computeRank', () => {
  it('returns 100 for a perfect applicant', () => {
    const { rank, breakdown } = computeRank({
      skillMatch: 100,
      regulixReady: true,
      endorsementCount: 4,
      daysSinceApplied: 0,
    })
    expect(rank).toBe(100)
    expect(breakdown).toEqual({
      skillMatch: 100,
      regulixReady: 100,
      endorsementsScore: 100,
      recencyScore: 100,
    })
  })

  it('returns 0 for a total mismatch', () => {
    const { rank, breakdown } = computeRank({
      skillMatch: 0,
      regulixReady: false,
      endorsementCount: 0,
      daysSinceApplied: 14,
    })
    expect(rank).toBe(0)
    expect(breakdown).toEqual({
      skillMatch: 0,
      regulixReady: 0,
      endorsementsScore: 0,
      recencyScore: 0,
    })
  })

  it('applies the 40/30/20/10 weighting', () => {
    // skillMatch only: 100 * 0.4 = 40
    expect(
      computeRank({
        skillMatch: 100,
        regulixReady: false,
        endorsementCount: 0,
        daysSinceApplied: 14,
      }).rank
    ).toBe(40)

    // regulixReady only: 100 * 0.3 = 30
    expect(
      computeRank({ skillMatch: 0, regulixReady: true, endorsementCount: 0, daysSinceApplied: 14 })
        .rank
    ).toBe(30)

    // endorsementsScore only (4+): 100 * 0.2 = 20
    expect(
      computeRank({ skillMatch: 0, regulixReady: false, endorsementCount: 4, daysSinceApplied: 14 })
        .rank
    ).toBe(20)

    // recencyScore only (today): 100 * 0.1 = 10
    expect(
      computeRank({ skillMatch: 0, regulixReady: false, endorsementCount: 0, daysSinceApplied: 0 })
        .rank
    ).toBe(10)
  })

  it('rounds to integer', () => {
    // skillMatch=33 * 0.4 = 13.2 → 13
    const { rank } = computeRank({
      skillMatch: 33,
      regulixReady: false,
      endorsementCount: 0,
      daysSinceApplied: 14,
    })
    expect(Number.isInteger(rank)).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- --run src/site/services/__tests__/rankComposition.test.ts`
Expected: FAIL with "Cannot find module '../rankComposition'"

- [ ] **Step 4: Implement `rankComposition.ts`**

Create `src/site/services/rankComposition.ts`:

```ts
// ============================================================
// KREWTREE — Rank Composition
// Pure functions that compute the applicant rank score and its component
// breakdown. See spec §4 for the formula:
//   rank = 0.4 × skillMatch + 0.3 × regulixReady + 0.2 × endorsementsScore + 0.1 × recencyScore
// ============================================================

import type { RankComponents } from '@site/types'

const RECENCY_WINDOW_DAYS = 14
const ENDORSEMENT_CAP = 4
const ENDORSEMENT_UNIT = 25 // 1 endorsement = 25 points, capped at 4

export function computeRecencyScore(daysSinceApplied: number): number {
  if (daysSinceApplied >= RECENCY_WINDOW_DAYS) return 0
  if (daysSinceApplied <= 0) return 100
  const score = 100 * (1 - daysSinceApplied / RECENCY_WINDOW_DAYS)
  return Math.round(score)
}

export function computeEndorsementsScore(count: number): number {
  const clamped = Math.min(count, ENDORSEMENT_CAP)
  return clamped * ENDORSEMENT_UNIT
}

export type RankInputs = {
  skillMatch: number // 0-100
  regulixReady: boolean
  endorsementCount: number
  daysSinceApplied: number
}

export function computeRank(inputs: RankInputs): { rank: number; breakdown: RankComponents } {
  const breakdown: RankComponents = {
    skillMatch: Math.max(0, Math.min(100, inputs.skillMatch)),
    regulixReady: inputs.regulixReady ? 100 : 0,
    endorsementsScore: computeEndorsementsScore(inputs.endorsementCount),
    recencyScore: computeRecencyScore(inputs.daysSinceApplied),
  }

  const weighted =
    breakdown.skillMatch * 0.4 +
    breakdown.regulixReady * 0.3 +
    breakdown.endorsementsScore * 0.2 +
    breakdown.recencyScore * 0.1

  return { rank: Math.round(weighted), breakdown }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- --run src/site/services/__tests__/rankComposition.test.ts`
Expected: all tests PASS (11 tests).

- [ ] **Step 6: Commit**

```bash
git add src/site/types/index.ts src/site/services/rankComposition.ts src/site/services/__tests__/rankComposition.test.ts
git commit -m "feat(applicants): add rank composition types + pure helper"
```

---

## Task 2: applicantService — `getRankedApplicants` (TDD)

**Files:**

- Modify: `src/site/services/applicantService.ts`
- Create: `src/site/services/__tests__/applicantService.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/site/services/__tests__/applicantService.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getRankedApplicants, DEFAULT_FILTERS } from '../applicantService'

describe('getRankedApplicants', () => {
  it('returns ranked applicants with breakdown + Regulix data', async () => {
    const res = await getRankedApplicants('c1', {
      filters: DEFAULT_FILTERS,
      sort: { column: 'rank', direction: 'desc' },
      page: 1,
      pageSize: 25,
    })

    expect(res.error).toBeNull()
    expect(res.data.length).toBeGreaterThan(0)
    expect(res.total).toBeGreaterThan(0)

    const first = res.data[0]
    expect(typeof first.rank).toBe('number')
    expect(first.rank).toBeGreaterThanOrEqual(0)
    expect(first.rank).toBeLessThanOrEqual(100)
    expect(first.rankBreakdown).toHaveProperty('skillMatch')
    expect(first.rankBreakdown).toHaveProperty('regulixReady')
    expect(first.rankBreakdown).toHaveProperty('endorsementsScore')
    expect(first.rankBreakdown).toHaveProperty('recencyScore')
    // regulixStatus is null or a RegulixStatus
    expect(first.regulixStatus === null || typeof first.regulixStatus === 'object').toBe(true)
    expect(Array.isArray(first.endorsements)).toBe(true)
    expect(Array.isArray(first.verifiedWorkHistory)).toBe(true)
  })

  it('sorts by rank descending by default', async () => {
    const res = await getRankedApplicants('c1', {
      filters: DEFAULT_FILTERS,
      sort: { column: 'rank', direction: 'desc' },
      page: 1,
      pageSize: 50,
    })

    expect(res.error).toBeNull()
    for (let i = 1; i < res.data.length; i++) {
      expect(res.data[i - 1].rank).toBeGreaterThanOrEqual(res.data[i].rank)
    }
  })

  it('applies filters', async () => {
    const res = await getRankedApplicants('c1', {
      filters: { ...DEFAULT_FILTERS, stage: 'interview' },
      sort: { column: 'rank', direction: 'desc' },
      page: 1,
      pageSize: 25,
    })
    expect(res.data.every((a) => a.stage === 'interview')).toBe(true)
  })

  it('paginates', async () => {
    const pageSize = 2
    const page1 = await getRankedApplicants('c1', {
      filters: DEFAULT_FILTERS,
      sort: { column: 'rank', direction: 'desc' },
      page: 1,
      pageSize,
    })
    expect(page1.data.length).toBeLessThanOrEqual(pageSize)
    if (page1.total > pageSize) {
      const page2 = await getRankedApplicants('c1', {
        filters: DEFAULT_FILTERS,
        sort: { column: 'rank', direction: 'desc' },
        page: 2,
        pageSize,
      })
      expect(page2.data[0].id).not.toBe(page1.data[0].id)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/applicantService.test.ts`
Expected: FAIL with "getRankedApplicants is not exported" or similar.

- [ ] **Step 3: Refactor `applicantService.ts`**

Replace the entire contents of `src/site/services/applicantService.ts` with:

```ts
// ============================================================
// KREWTREE — Applicant Service
// Company-side read/write API for the applicant pipeline.
//
// Currently backed by mock data for v1. Service functions return
// `{ data, error }` so the call sites don't change when we swap
// to Supabase later.
//
// Rank composition pulls Regulix signals via `regulixService` and
// combines them with local skill-match + recency via
// `rankComposition`. See spec §4 for the formula.
// ============================================================

import type {
  CompanyApplicant,
  KanbanStage,
  RankedApplicant,
  RegulixStatus,
  RegulixEndorsement,
  VerifiedWorkHistoryEntry,
} from '@site/types'
import { companyApplicants as initialApplicants } from '@site/data/mock'
import { computeRank } from './rankComposition'
import {
  getRegulixStatus,
  getEndorsements,
  getVerifiedWorkHistory,
  submitHireHandoff,
} from './regulixService'

// Active pipeline stages (exclude resolved/terminal).
const ACTIVE_STAGES: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer']

const STAGE_ORDER: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer', 'hired', 'rejected']

// In-memory mutable store.
let applicants: CompanyApplicant[] = initialApplicants.map((a) => ({ ...a }))

// ── Types ─────────────────────────────────────────────────────────────────

export type ApplicantSort = 'rank' | 'applicant' | 'job' | 'match' | 'applied'

export type ApplicantFilters = {
  search: string
  stage: KanbanStage | 'all'
  jobId: string | 'all'
  regulixOnly: boolean
  appliedFrom: string | null
  appliedTo: string | null
}

export const DEFAULT_FILTERS: ApplicantFilters = {
  search: '',
  stage: 'all',
  jobId: 'all',
  regulixOnly: false,
  appliedFrom: null,
  appliedTo: null,
}

export type GetRankedParams = {
  filters?: ApplicantFilters
  sort?: { column: ApplicantSort; direction: 'asc' | 'desc' }
  page?: number
  pageSize?: number
}

// ── Internal helpers ──────────────────────────────────────────────────────

function matchesFilters(a: CompanyApplicant, f: ApplicantFilters): boolean {
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase()
    const hay =
      `${a.workerFirstName} ${a.workerLastInitial} ${a.workerFullName} ${a.jobTitle}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (f.stage !== 'all' && a.stage !== f.stage) return false
  if (f.jobId !== 'all' && a.jobId !== f.jobId) return false
  if (f.regulixOnly && !a.isRegulixReady) return false
  if (f.appliedFrom && new Date(a.appliedAt) < new Date(f.appliedFrom)) return false
  if (f.appliedTo) {
    const end = new Date(f.appliedTo)
    end.setHours(23, 59, 59, 999)
    if (new Date(a.appliedAt) > end) return false
  }
  return true
}

function daysSinceApplied(appliedAt: string): number {
  const ms = Date.now() - new Date(appliedAt).getTime()
  return Math.max(0, ms / (1000 * 60 * 60 * 24))
}

function sortRanked(
  list: RankedApplicant[],
  sort: { column: ApplicantSort; direction: 'asc' | 'desc' }
): RankedApplicant[] {
  const dir = sort.direction === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    switch (sort.column) {
      case 'rank':
        return (a.rank - b.rank) * dir
      case 'applicant':
        return (
          (a.workerLastInitial.localeCompare(b.workerLastInitial, undefined, {
            sensitivity: 'base',
          }) ||
            a.workerFirstName.localeCompare(b.workerFirstName, undefined, {
              sensitivity: 'base',
            })) * dir
        )
      case 'job':
        return a.jobTitle.localeCompare(b.jobTitle, undefined, { sensitivity: 'base' }) * dir
      case 'match':
        return (a.matchScore - b.matchScore) * dir
      case 'applied':
        return (new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()) * dir
    }
  })
}

// ── Queries ───────────────────────────────────────────────────────────────

export async function getRecentApplicants(
  _companyId: string,
  limit = 5
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const active = applicants.filter((a) => ACTIVE_STAGES.includes(a.stage))
  const sorted = [...active].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  )
  return { data: sorted.slice(0, limit), error: null }
}

export async function countNewApplicantsSince(
  _companyId: string,
  sinceIso: string | null
): Promise<{ count: number; error: string | null }> {
  if (!sinceIso) return { count: applicants.length, error: null }
  const since = new Date(sinceIso).getTime()
  const count = applicants.filter((a) => new Date(a.appliedAt).getTime() > since).length
  return { count, error: null }
}

export async function getRankedApplicants(
  _companyId: string,
  params: GetRankedParams = {}
): Promise<{ data: RankedApplicant[]; total: number; error: string | null }> {
  const filters = params.filters ?? DEFAULT_FILTERS
  const sort = params.sort ?? { column: 'rank' as const, direction: 'desc' as const }
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 25

  const filtered = applicants.filter((a) => matchesFilters(a, filters))

  // Batch Regulix lookups per applicant's workerId.
  const uniqueWorkerIds = Array.from(new Set(filtered.map((a) => a.workerId)))
  const [statuses, endorsementLists, workHistoryLists] = await Promise.all([
    Promise.all(uniqueWorkerIds.map((id) => getRegulixStatus(id))),
    Promise.all(uniqueWorkerIds.map((id) => getEndorsements(id))),
    Promise.all(uniqueWorkerIds.map((id) => getVerifiedWorkHistory(id))),
  ])

  const statusByWorker = new Map<string, RegulixStatus | null>()
  const endorsementsByWorker = new Map<string, RegulixEndorsement[]>()
  const workHistoryByWorker = new Map<string, VerifiedWorkHistoryEntry[]>()

  uniqueWorkerIds.forEach((id, i) => {
    statusByWorker.set(id, statuses[i].data)
    endorsementsByWorker.set(id, endorsementLists[i].data)
    workHistoryByWorker.set(id, workHistoryLists[i].data)
  })

  const ranked: RankedApplicant[] = filtered.map((a) => {
    const status = statusByWorker.get(a.workerId) ?? null
    const endorsements = endorsementsByWorker.get(a.workerId) ?? []
    const workHistory = workHistoryByWorker.get(a.workerId) ?? []

    const { rank, breakdown } = computeRank({
      skillMatch: a.matchScore,
      regulixReady: status?.ready ?? false,
      endorsementCount: endorsements.length,
      daysSinceApplied: daysSinceApplied(a.appliedAt),
    })

    return {
      ...a,
      rank,
      rankBreakdown: breakdown,
      regulixStatus: status,
      endorsements,
      verifiedWorkHistory: workHistory,
    }
  })

  const sorted = sortRanked(ranked, sort)
  const start = (page - 1) * pageSize
  const slice = sorted.slice(start, start + pageSize)

  return { data: slice, total: ranked.length, error: null }
}

export async function getJobFilterOptions(
  _companyId: string
): Promise<{ data: Array<{ id: string; title: string }>; error: string | null }> {
  const seen = new Map<string, string>()
  applicants.forEach((a) => {
    if (!seen.has(a.jobId)) seen.set(a.jobId, a.jobTitle)
  })
  const data = Array.from(seen, ([id, title]) => ({ id, title })).sort((a, b) =>
    a.title.localeCompare(b.title)
  )
  return { data, error: null }
}

// ── Mutations ─────────────────────────────────────────────────────────────

export async function advanceApplicantStage(
  applicationId: string
): Promise<{ error: string | null }> {
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  const current = applicants[idx].stage
  const activeIdx = STAGE_ORDER.indexOf(current)
  if (activeIdx < 0 || current === 'hired' || current === 'rejected') {
    return { error: 'cannot_advance' }
  }
  const next = STAGE_ORDER[activeIdx + 1]
  if (!next) return { error: 'no_next_stage' }
  applicants[idx] = { ...applicants[idx], stage: next }
  return { error: null }
}

export async function rejectApplicant(applicationId: string): Promise<{ error: string | null }> {
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  applicants[idx] = { ...applicants[idx], stage: 'rejected' }
  return { error: null }
}

export async function rejectApplicants(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  let affected = 0
  applicants = applicants.map((a) => {
    if (!applicationIds.includes(a.id)) return a
    if (a.stage === 'rejected') return a
    affected += 1
    return { ...a, stage: 'rejected' }
  })
  return { affected, error: null }
}

export async function advanceApplicants(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  let affected = 0
  applicants = applicants.map((a) => {
    if (!applicationIds.includes(a.id)) return a
    const activeIdx = STAGE_ORDER.indexOf(a.stage)
    if (a.stage === 'hired' || a.stage === 'rejected' || activeIdx < 0) return a
    const next = STAGE_ORDER[activeIdx + 1]
    if (!next) return a
    affected += 1
    return { ...a, stage: next }
  })
  return { affected, error: null }
}

export async function shortlistApplicant(
  applicationId: string
): Promise<{ isShortlisted: boolean; error: string | null }> {
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { isShortlisted: false, error: 'not_found' }
  const next = !applicants[idx].isShortlisted
  applicants[idx] = { ...applicants[idx], isShortlisted: next }
  return { isShortlisted: next, error: null }
}

export async function shortlistApplicants(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  let affected = 0
  applicants = applicants.map((a) => {
    if (!applicationIds.includes(a.id)) return a
    if (a.isShortlisted) return a
    affected += 1
    return { ...a, isShortlisted: true }
  })
  return { affected, error: null }
}

export async function addApplicantNote(
  applicationId: string,
  note: string
): Promise<{ error: string | null }> {
  const trimmed = note.trim()
  if (!trimmed) return { error: 'empty_note' }
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  applicants[idx] = { ...applicants[idx], notes: [...applicants[idx].notes, trimmed] }
  return { error: null }
}

// ── New actions (spec §5.1) ───────────────────────────────────────────────

export async function hireApplicant(
  applicationId: string,
  hireDate: string
): Promise<{ data: { hireDate: string } | null; error: string | null }> {
  if (!hireDate) return { data: null, error: 'hireDate is required' }
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { data: null, error: 'not_found' }
  applicants[idx] = { ...applicants[idx], stage: 'hired' }
  // Note: hireDate is not persisted in v1 mocks (no column for it); recorded
  // here for the real Supabase impl to consume.
  return { data: { hireDate }, error: null }
}

export async function startRegulixOnboarding(
  applicationId: string,
  params: { hireDate: string; payRate: number }
): Promise<{ data: { regulixHireId: string } | null; error: string | null }> {
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { data: null, error: 'not_found' }
  const a = applicants[idx]
  const res = await submitHireHandoff({
    companyId: 'c1', // v1: derive from auth once wiring is done
    workerId: a.workerId,
    jobId: a.jobId,
    hireDate: params.hireDate,
    payRate: params.payRate,
  })
  if (res.error || !res.data) return { data: null, error: res.error ?? 'handoff_failed' }
  return { data: res.data, error: null }
}

export async function saveApplicantToTalentPool(
  applicationId: string
): Promise<{ error: string | null }> {
  // V1 stub: real persistence lands with the talent pool plan. Callers show
  // a success toast regardless; this always returns OK.
  const exists = applicants.some((a) => a.id === applicationId)
  if (!exists) return { error: 'not_found' }
  return { error: null }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --run src/site/services/__tests__/applicantService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Delete the `getAllApplicants` callers temporarily — skip, the old page still imports it**

The old `AllApplicantsPage.tsx` still imports `getAllApplicants` from this file. We removed it. If typecheck fails, the old page will be deleted in Task 19 — for now, add a temporary re-export to keep typecheck green:

Add this at the bottom of `src/site/services/applicantService.ts`:

```ts
// TEMPORARY COMPAT: the old AllApplicantsPage still imports getAllApplicants.
// This alias will be removed in Task 19 when that page is deleted.
export const getAllApplicants = getRankedApplicants
```

Run: `npm run typecheck`
Expected: exits 0. If there are type errors on the old page, they're because `getRankedApplicants` returns `RankedApplicant[]` which is a superset of `CompanyApplicant` — the old call sites still type-check.

- [ ] **Step 6: Commit**

```bash
git add src/site/services/applicantService.ts src/site/services/__tests__/applicantService.test.ts
git commit -m "feat(applicants): refactor applicantService to getRankedApplicants

Composes rank from local match + Regulix signals via regulixService.
Adds hireApplicant (pipeline-only, no Regulix), startRegulixOnboarding
(wraps regulixService.submitHireHandoff), and saveApplicantToTalentPool
(v1 stub). Keeps existing mutation functions unchanged. Temporary
getAllApplicants compat export for the old page until Task 19 deletes it."
```

---

## Task 3: New service write functions — tests (TDD)

The functions themselves landed in Task 2; this task adds tests for them to close out service-layer coverage.

**Files:**

- Modify: `src/site/services/__tests__/applicantService.test.ts`

- [ ] **Step 1: Append tests**

Add these `describe` blocks to `src/site/services/__tests__/applicantService.test.ts`. First update the top import to include the new functions:

```ts
import {
  getRankedApplicants,
  DEFAULT_FILTERS,
  hireApplicant,
  startRegulixOnboarding,
  saveApplicantToTalentPool,
} from '../applicantService'
```

Then append:

```ts
describe('hireApplicant', () => {
  it('rejects empty hireDate', async () => {
    const res = await hireApplicant('ap1', '')
    expect(res.error).toBe('hireDate is required')
    expect(res.data).toBeNull()
  })

  it('returns not_found for unknown id', async () => {
    const res = await hireApplicant('does-not-exist', '2026-05-01')
    expect(res.error).toBe('not_found')
  })

  it('changes the applicant stage to hired on success', async () => {
    const first = await getRankedApplicants('c1', {
      filters: { ...DEFAULT_FILTERS, stage: 'interview' },
      sort: { column: 'applied', direction: 'desc' },
      page: 1,
      pageSize: 1,
    })
    const id = first.data[0]?.id
    if (!id) return
    const res = await hireApplicant(id, '2026-05-01')
    expect(res.error).toBeNull()
    expect(res.data).toEqual({ hireDate: '2026-05-01' })
  })
})

describe('startRegulixOnboarding', () => {
  it('returns not_found for unknown id', async () => {
    const res = await startRegulixOnboarding('does-not-exist', {
      hireDate: '2026-05-01',
      payRate: 32,
    })
    expect(res.error).toBe('not_found')
  })

  it('returns a regulixHireId on success', async () => {
    const first = await getRankedApplicants('c1', {
      filters: DEFAULT_FILTERS,
      sort: { column: 'rank', direction: 'desc' },
      page: 1,
      pageSize: 1,
    })
    const id = first.data[0]?.id
    if (!id) return
    const res = await startRegulixOnboarding(id, { hireDate: '2026-05-01', payRate: 32 })
    expect(res.error).toBeNull()
    expect(res.data?.regulixHireId).toMatch(/^mock-hire-/)
  })
})

describe('saveApplicantToTalentPool', () => {
  it('returns not_found for unknown id', async () => {
    const res = await saveApplicantToTalentPool('does-not-exist')
    expect(res.error).toBe('not_found')
  })

  it('returns success for a valid id (v1 stub)', async () => {
    const first = await getRankedApplicants('c1', {
      filters: DEFAULT_FILTERS,
      sort: { column: 'rank', direction: 'desc' },
      page: 1,
      pageSize: 1,
    })
    const id = first.data[0]?.id
    if (!id) return
    const res = await saveApplicantToTalentPool(id)
    expect(res.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --run src/site/services/__tests__/applicantService.test.ts`
Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/site/services/__tests__/applicantService.test.ts
git commit -m "test(applicants): cover hireApplicant, startRegulixOnboarding, saveApplicantToTalentPool"
```

---

## Task 4: `useApplicantKeyboardNav` hook

**Files:**

- Create: `src/site/components/ApplicantManagement/useApplicantKeyboardNav.ts`

- [ ] **Step 1: Create the hook**

Create `src/site/components/ApplicantManagement/useApplicantKeyboardNav.ts`:

```ts
import { useEffect, useRef } from 'react'

export type KeyboardNavHandlers = {
  /** Advance selection down (j / ArrowDown). */
  onNext: () => void
  /** Move selection up (k / ArrowUp). */
  onPrev: () => void
  /** Toggle shortlist on selected (s). */
  onShortlist: () => void
  /** Reject selected (r). */
  onReject: () => void
  /** Advance stage of selected (Cmd+Enter / Ctrl+Enter). */
  onAdvance: () => void
  /** Show keyboard help overlay (?). */
  onHelp: () => void
  /** Escape — clears selection on desktop, closes detail on mobile. */
  onEscape: () => void
}

export type UseApplicantKeyboardNavOptions = {
  enabled: boolean
  handlers: KeyboardNavHandlers
}

/**
 * Keyboard navigation for the applicant list.
 * Listens on `document.keydown` while `enabled` is true. Short-circuits
 * when focus is inside a form input / textarea / contenteditable so typing
 * in the search box doesn't hijack j/k.
 */
export function useApplicantKeyboardNav({
  enabled,
  handlers,
}: UseApplicantKeyboardNavOptions): void {
  // Keep a ref to the handlers so the listener doesn't re-attach every render.
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    const isTypingTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (el.isContentEditable) return true
      return false
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const meta = e.metaKey || e.ctrlKey
      const h = handlersRef.current

      if ((e.key === 'j' || e.key === 'ArrowDown') && !meta) {
        e.preventDefault()
        h.onNext()
        return
      }
      if ((e.key === 'k' || e.key === 'ArrowUp') && !meta) {
        e.preventDefault()
        h.onPrev()
        return
      }
      if ((e.key === 's' || e.key === 'S') && !meta) {
        e.preventDefault()
        h.onShortlist()
        return
      }
      if ((e.key === 'r' || e.key === 'R') && !meta) {
        e.preventDefault()
        h.onReject()
        return
      }
      if (e.key === 'Enter' && meta) {
        e.preventDefault()
        h.onAdvance()
        return
      }
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        h.onHelp()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        h.onEscape()
        return
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/site/components/ApplicantManagement/useApplicantKeyboardNav.ts
git commit -m "feat(applicants): add useApplicantKeyboardNav hook"
```

---

## Task 5: `useLayoutMode` hook

**Files:**

- Create: `src/site/components/ApplicantManagement/useLayoutMode.ts`

- [ ] **Step 1: Create the hook**

Create `src/site/components/ApplicantManagement/useLayoutMode.ts`:

```ts
import { useEffect, useState } from 'react'

export type LayoutMode = 'split' | 'push' | 'stacked'

const SPLIT_MIN = 1280
const PUSH_MIN = 768

function modeFor(width: number): LayoutMode {
  if (width >= SPLIT_MIN) return 'split'
  if (width >= PUSH_MIN) return 'push'
  return 'stacked'
}

/**
 * Responsive layout mode for the applicant management surface.
 *
 * - `split` (>= 1280px): list + detail visible side-by-side
 * - `push` (768-1279px): list full width; detail is an overlay pushed in from the right
 * - `stacked` (< 768px): list OR detail, not both — navigated via URL `selected` param
 *
 * Debounced to avoid excessive re-renders on drag-resize.
 */
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(() =>
    typeof window === 'undefined' ? 'split' : modeFor(window.innerWidth)
  )

  useEffect(() => {
    let timer: number | undefined

    const onResize = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        setMode(modeFor(window.innerWidth))
      }, 150)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  return mode
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/site/components/ApplicantManagement/useLayoutMode.ts
git commit -m "feat(applicants): add useLayoutMode hook"
```

---

## Task 6: Page shell — `ApplicantManagementPage`

Creates the page container with state, data fetching, URL-param sync, and responsive layout orchestration. Sub-components are stubbed with placeholder divs; Tasks 7-15 fill them in one by one.

**Files:**

- Create: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`
- Create: `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`
- Modify: `src/site/pages/index.ts`

- [ ] **Step 1: Create the page component**

Create `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { KanbanStage, RankedApplicant } from '../../types'
import {
  getRankedApplicants,
  getJobFilterOptions,
  DEFAULT_FILTERS,
  type ApplicantFilters,
  type ApplicantSort,
} from '../../services/applicantService'
import { useLayoutMode } from '../../components/ApplicantManagement/useLayoutMode'
import styles from './ApplicantManagementPage.module.css'

// Sort column:direction value <-> object.
function parseSort(value: string | null): { column: ApplicantSort; direction: 'asc' | 'desc' } {
  if (!value) return { column: 'rank', direction: 'desc' }
  const [col, dir] = value.split(':') as [ApplicantSort, 'asc' | 'desc']
  return { column: col || 'rank', direction: dir === 'asc' ? 'asc' : 'desc' }
}

function serializeSort(s: { column: ApplicantSort; direction: 'asc' | 'desc' }): string {
  return `${s.column}:${s.direction}`
}

// ── URL ↔ state ────────────────────────────────────────────────────────────

function filtersFromParams(
  params: URLSearchParams,
  routeJobId: string | undefined
): ApplicantFilters {
  return {
    search: params.get('q') ?? '',
    stage: (params.get('stage') as KanbanStage | 'all' | null) ?? 'all',
    jobId: routeJobId ?? params.get('job') ?? 'all',
    regulixOnly: params.get('regulix') === '1',
    appliedFrom: params.get('from'),
    appliedTo: params.get('to'),
  }
}

function paramsFromFilters(
  filters: ApplicantFilters,
  sort: { column: ApplicantSort; direction: 'asc' | 'desc' },
  selectedId: string | null
): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.search) p.set('q', filters.search)
  if (filters.stage !== 'all') p.set('stage', filters.stage)
  if (filters.jobId !== 'all') p.set('job', filters.jobId)
  if (filters.regulixOnly) p.set('regulix', '1')
  if (filters.appliedFrom) p.set('from', filters.appliedFrom)
  if (filters.appliedTo) p.set('to', filters.appliedTo)
  const sortStr = serializeSort(sort)
  if (sortStr !== 'rank:desc') p.set('sort', sortStr)
  if (selectedId) p.set('selected', selectedId)
  return p
}

export const ApplicantManagementPage: React.FC = () => {
  const { user } = useAuth()
  const { jobId: routeJobId } = useParams<{ jobId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const layoutMode = useLayoutMode()

  // State derived from URL on mount; written back on change.
  const [filters, setFilters] = useState<ApplicantFilters>(() =>
    filtersFromParams(searchParams, routeJobId)
  )
  const [sort, setSort] = useState(() => parseSort(searchParams.get('sort')))
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('selected'))
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)

  const [rows, setRows] = useState<RankedApplicant[]>([])
  const [total, setTotal] = useState(0)
  const [jobOptions, setJobOptions] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sync URL when state changes.
  useEffect(() => {
    const next = paramsFromFilters(filters, sort, selectedId)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, selectedId])

  // Load job options once.
  useEffect(() => {
    if (!user?.id) return
    getJobFilterOptions(user.id).then(({ data }) => setJobOptions(data))
  }, [user?.id])

  // Reload data when filters/sort/page change.
  const load = useCallback(() => {
    if (!user?.id) return
    setLoading(true)
    setErrorMessage(null)
    getRankedApplicants(user.id, { filters, sort, page, pageSize })
      .then((res) => {
        if (res.error) {
          setErrorMessage(res.error)
          setRows([])
          setTotal(0)
        } else {
          setRows(res.data)
          setTotal(res.total)
        }
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => setLoading(false))
  }, [user?.id, filters, sort, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  // Auto-select first row when nothing selected and data loads.
  useEffect(() => {
    if (!selectedId && rows.length > 0 && layoutMode === 'split') {
      setSelectedId(rows[0].id)
    }
  }, [rows, selectedId, layoutMode])

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/site/dashboard/company" className={styles.breadcrumb}>
          ← Back to dashboard
        </Link>

        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Applicants</h1>
            <p className={styles.subtitle}>
              {routeJobId
                ? 'Ranked applicants for this job'
                : 'Cross-job pipeline across every posting on your company'}
            </p>
          </div>
        </header>

        {/* Filter bar — Task 7 wires the real component */}
        <div className={styles.filterBarStub}>Filter bar (coming in Task 7)</div>

        {/* Bulk action bar — Task 8 */}
        {selectedIds.size > 0 && (
          <div className={styles.bulkBarStub}>
            {selectedIds.size} selected (bulk bar coming in Task 8)
          </div>
        )}

        {/* Main split/stacked layout */}
        <div className={[styles.mainLayout, styles[`layout_${layoutMode}`]].join(' ')}>
          <div className={styles.listPane}>
            {loading ? (
              <div className={styles.loadingStub}>Loading…</div>
            ) : errorMessage ? (
              <div className={styles.errorStub}>Error: {errorMessage}</div>
            ) : rows.length === 0 ? (
              <div className={styles.emptyStub}>No applicants match these filters.</div>
            ) : (
              <ul className={styles.listStub}>
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className={[
                      styles.rowStub,
                      r.id === selectedId ? styles.rowStubSelected : '',
                    ].join(' ')}
                    onClick={() => setSelectedId(r.id)}
                  >
                    {r.workerFullName} · rank {r.rank}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(layoutMode !== 'stacked' || selected) && (
            <div className={styles.detailPane}>
              {selected ? (
                <div className={styles.detailStub}>
                  <h2>{selected.workerFullName}</h2>
                  <p>
                    Rank {selected.rank} · {selected.jobTitle}
                  </p>
                  <p>Detail panel coming in Tasks 10-13.</p>
                </div>
              ) : (
                <div className={styles.detailPlaceholder}>Select an applicant to view details.</div>
              )}
            </div>
          )}
        </div>

        {/* Silence unused-var warning while sub-components are stubbed */}
        <span hidden>{jobOptions.length}</span>
        <span hidden>{total}</span>
        <span hidden>{page}</span>
        <span hidden>{setFilters.length}</span>
        <span hidden>{setSort.length}</span>
        <span hidden>{setSelectedIds.size}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS module**

Create `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`:

```css
.page {
  min-height: 100vh;
  background: var(--kt-bg);
}

.container {
  max-width: var(--kt-layout-max-width);
  margin: 0 auto;
  padding: 28px var(--kt-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--kt-space-5);
}

.breadcrumb {
  align-self: flex-start;
  font-size: 12px;
  color: var(--kt-text-muted);
  text-decoration: none;
  font-family: var(--kt-font-sans);
  padding: 4px 0;
}

.breadcrumb:hover {
  color: var(--kt-text);
  text-decoration: underline;
}

.pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--kt-space-4);
}

.title {
  font-size: var(--kt-text-2xl);
  font-weight: var(--kt-weight-semibold);
  color: var(--kt-text);
  margin: 0 0 4px;
}

.subtitle {
  font-size: var(--kt-text-sm);
  color: var(--kt-text-muted);
  margin: 0;
}

/* Stubs — replaced by real components in later tasks */
.filterBarStub,
.bulkBarStub,
.loadingStub,
.errorStub,
.emptyStub,
.detailStub,
.detailPlaceholder {
  padding: var(--kt-space-4);
  border: 1px dashed var(--kt-border);
  border-radius: var(--kt-radius-md);
  background: var(--kt-surface-raised);
  color: var(--kt-text-muted);
  font-size: 13px;
}

.mainLayout {
  display: grid;
  gap: var(--kt-space-4);
  min-height: 600px;
}

.layout_split {
  grid-template-columns: 400px minmax(0, 1fr);
}

.layout_push {
  grid-template-columns: minmax(0, 1fr);
  /* detail pane becomes an overlay in Task 16 */
}

.layout_stacked {
  grid-template-columns: minmax(0, 1fr);
}

.listPane {
  background: var(--kt-surface);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-lg);
  overflow: hidden;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.detailPane {
  background: var(--kt-surface);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-lg);
  overflow: auto;
  padding: var(--kt-space-4);
}

.listStub {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rowStub {
  padding: 10px var(--kt-space-4);
  font-size: 13px;
  color: var(--kt-text);
  cursor: pointer;
  border-bottom: 1px solid var(--kt-border);
}

.rowStub:hover {
  background: var(--kt-secondary);
}

.rowStubSelected {
  background: var(--kt-primary-subtle);
  border-left: 3px solid var(--kt-primary);
}
```

- [ ] **Step 3: Export from pages/index.ts**

In `src/site/pages/index.ts`, add alongside the existing exports (keep `AllApplicantsPage` export for now — Task 19 removes it):

```ts
export { ApplicantManagementPage } from './ApplicantManagement/ApplicantManagementPage'
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/site/pages/ApplicantManagement src/site/pages/index.ts
git commit -m "feat(applicants): add ApplicantManagementPage shell with URL sync"
```

---

## Task 7: `ApplicantFilterBar` component

**Files:**

- Create: `src/site/components/ApplicantManagement/ApplicantFilterBar.tsx`
- Create: `src/site/components/ApplicantManagement/ApplicantFilterBar.module.css`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Create the component**

Create `src/site/components/ApplicantManagement/ApplicantFilterBar.tsx`:

```tsx
import React from 'react'
import type { KanbanStage } from '../../types'
import type { ApplicantFilters } from '../../services/applicantService'
import { SearchIcon } from '../../icons'
import styles from './ApplicantFilterBar.module.css'

const STAGE_OPTIONS: Array<{ value: KanbanStage | 'all'; label: string }> = [
  { value: 'all', label: 'All stages' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

export interface ApplicantFilterBarProps {
  filters: ApplicantFilters
  onChange: (next: ApplicantFilters) => void
  jobOptions: Array<{ id: string; title: string }>
  /** When locked, the job selector is disabled and shows the one job's title. */
  jobLocked?: boolean
}

export const ApplicantFilterBar: React.FC<ApplicantFilterBarProps> = ({
  filters,
  onChange,
  jobOptions,
  jobLocked = false,
}) => {
  const update = <K extends keyof ApplicantFilters>(key: K, value: ApplicantFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const clear = () => {
    onChange({
      search: '',
      stage: 'all',
      jobId: jobLocked ? filters.jobId : 'all',
      regulixOnly: false,
      appliedFrom: null,
      appliedTo: null,
    })
  }

  const hasFilters =
    filters.search ||
    filters.stage !== 'all' ||
    (!jobLocked && filters.jobId !== 'all') ||
    filters.regulixOnly ||
    filters.appliedFrom ||
    filters.appliedTo

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <SearchIcon size={14} />
        </span>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search applicants or jobs"
          className={styles.searchInput}
        />
      </div>
      <select
        value={filters.stage}
        onChange={(e) => update('stage', e.target.value as KanbanStage | 'all')}
        className={styles.select}
      >
        {STAGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={filters.jobId}
        onChange={(e) => update('jobId', e.target.value)}
        className={styles.select}
        disabled={jobLocked}
      >
        <option value="all">All jobs</option>
        {jobOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={filters.regulixOnly}
          onChange={(e) => update('regulixOnly', e.target.checked)}
        />
        Regulix only
      </label>
      <div className={styles.dateGroup}>
        <input
          type="date"
          value={filters.appliedFrom ?? ''}
          onChange={(e) => update('appliedFrom', e.target.value || null)}
          className={styles.dateInput}
          aria-label="Applied from"
        />
        <span className={styles.dateSep}>to</span>
        <input
          type="date"
          value={filters.appliedTo ?? ''}
          onChange={(e) => update('appliedTo', e.target.value || null)}
          className={styles.dateInput}
          aria-label="Applied to"
        />
      </div>
      {hasFilters && (
        <button type="button" className={styles.clearLink} onClick={clear}>
          Clear filters
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS**

Create `src/site/components/ApplicantManagement/ApplicantFilterBar.module.css`. Port these styles from `src/site/pages/AllApplicantsPage.module.css` (the filter-bar section is already a solid reference). Content:

```css
.filterBar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--kt-space-3);
  align-items: center;
  background: var(--kt-surface);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-lg);
  padding: var(--kt-space-3) var(--kt-space-4);
}

.searchWrap {
  position: relative;
  flex: 1 1 240px;
  max-width: 320px;
}

.searchIcon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--kt-text-muted);
  display: inline-flex;
}

.searchInput {
  width: 100%;
  height: 32px;
  padding: 0 10px 0 30px;
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  background: var(--kt-bg);
  color: var(--kt-text);
  font-family: var(--kt-font-sans);
  font-size: 12px;
  outline: none;
}

.searchInput:focus {
  border-color: var(--kt-primary);
}

.select {
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  background: var(--kt-bg);
  color: var(--kt-text);
  font-family: var(--kt-font-sans);
  font-size: 12px;
  cursor: pointer;
}

.select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkboxLabel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--kt-text);
  cursor: pointer;
}

.dateGroup {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dateInput {
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  background: var(--kt-bg);
  color: var(--kt-text);
  font-family: var(--kt-font-sans);
  font-size: 12px;
  outline: none;
}

.dateSep {
  font-size: 11px;
  color: var(--kt-text-muted);
}

.clearLink {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--kt-font-sans);
  font-size: 12px;
  color: var(--kt-primary);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
```

- [ ] **Step 3: Wire into `ApplicantManagementPage`**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

(a) Add this import near the top with the other component imports:

```tsx
import { ApplicantFilterBar } from '../../components/ApplicantManagement/ApplicantFilterBar'
```

(b) Replace the `<div className={styles.filterBarStub}>…</div>` line with:

```tsx
<ApplicantFilterBar
  filters={filters}
  onChange={(next) => {
    setFilters(next)
    setPage(1)
  }}
  jobOptions={jobOptions}
  jobLocked={Boolean(routeJobId)}
/>
```

(c) Remove the now-unused `<span hidden>{setFilters.length}</span>` etc. where they're no longer needed.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/site/components/ApplicantManagement/ApplicantFilterBar.tsx src/site/components/ApplicantManagement/ApplicantFilterBar.module.css src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(applicants): ApplicantFilterBar component wired into page"
```

---

## Task 8: `BulkActionBar` component

**Files:**

- Create: `src/site/components/ApplicantManagement/BulkActionBar.tsx`
- Create: `src/site/components/ApplicantManagement/BulkActionBar.module.css`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Create the component**

Create `src/site/components/ApplicantManagement/BulkActionBar.tsx`:

```tsx
import React, { useState } from 'react'
import { Modal } from '../../../components'
import type { RankedApplicant } from '../../types'
import { CheckSmallIcon, CloseIcon } from '../../icons'
import styles from './BulkActionBar.module.css'

export interface BulkActionBarProps {
  applicants: RankedApplicant[]
  onAdvance: () => void
  onShortlist: () => void
  onMessage: () => void
  onReject: () => void
  onDeselectAll: () => void
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  applicants,
  onAdvance,
  onShortlist,
  onMessage,
  onReject,
  onDeselectAll,
}) => {
  const [confirmReject, setConfirmReject] = useState(false)

  const handleConfirmReject = () => {
    setConfirmReject(false)
    onReject()
  }

  return (
    <>
      <div className={styles.bulkBar}>
        <span className={styles.bulkCount}>{applicants.length} selected</span>
        <div className={styles.bulkActions}>
          <button type="button" className={styles.bulkBtn} onClick={onAdvance}>
            Advance stage
          </button>
          <button type="button" className={styles.bulkBtn} onClick={onShortlist}>
            Shortlist
          </button>
          <button type="button" className={styles.bulkBtn} onClick={onMessage}>
            Message
          </button>
          <button
            type="button"
            className={[styles.bulkBtn, styles.bulkBtnDanger].join(' ')}
            onClick={() => setConfirmReject(true)}
          >
            Reject
          </button>
          <button type="button" className={styles.bulkDeselect} onClick={onDeselectAll}>
            Deselect all
          </button>
        </div>
      </div>

      <Modal
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        size="sm"
        title={
          <>
            <CloseIcon size={16} color="var(--kt-danger)" /> Reject {applicants.length} applicant
            {applicants.length === 1 ? '' : 's'}?
          </>
        }
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              onClick={() => setConfirmReject(false)}
              className={styles.modalSecondary}
            >
              Cancel
            </button>
            <button type="button" onClick={handleConfirmReject} className={styles.modalDanger}>
              Reject {applicants.length}
            </button>
          </div>
        }
      >
        <p className={styles.confirmBody}>
          This will move the following applicants to the Rejected stage. Already-rejected applicants
          are skipped.
        </p>
        <ul className={styles.confirmList}>
          {applicants.slice(0, 6).map((a) => (
            <li key={a.id}>
              <CheckSmallIcon size={10} /> {a.workerFirstName} {a.workerLastInitial}. — {a.jobTitle}
            </li>
          ))}
          {applicants.length > 6 && (
            <li className={styles.confirmMore}>+{applicants.length - 6} more</li>
          )}
        </ul>
      </Modal>
    </>
  )
}
```

- [ ] **Step 2: Create the CSS**

Create `src/site/components/ApplicantManagement/BulkActionBar.module.css`:

```css
.bulkBar {
  position: sticky;
  bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--kt-space-4);
  padding: var(--kt-space-3) var(--kt-space-4);
  background: var(--kt-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--kt-primary) 20%, var(--kt-border));
  border-radius: var(--kt-radius-lg);
  box-shadow: var(--kt-shadow-md);
  z-index: 10;
}

.bulkCount {
  font-size: 13px;
  font-weight: var(--kt-weight-semibold);
  color: var(--kt-text);
}

.bulkActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bulkBtn {
  height: 28px;
  padding: 0 12px;
  border: 0.5px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  background: var(--kt-surface);
  color: var(--kt-text);
  font-family: var(--kt-font-sans);
  font-size: 11px;
  font-weight: var(--kt-weight-medium);
  cursor: pointer;
}

.bulkBtn:hover {
  background: var(--kt-secondary);
}

.bulkBtnDanger {
  color: var(--kt-danger);
  border-color: color-mix(in srgb, var(--kt-danger) 30%, var(--kt-border));
}

.bulkBtnDanger:hover {
  background: var(--kt-danger-subtle);
}

.bulkDeselect {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--kt-font-sans);
  font-size: 12px;
  color: var(--kt-text-muted);
  cursor: pointer;
  text-decoration: underline;
}

.confirmBody {
  font-size: 13px;
  color: var(--kt-text);
  margin: 0 0 var(--kt-space-3);
  line-height: 1.5;
}

.confirmList {
  list-style: none;
  margin: 0;
  padding: var(--kt-space-3);
  background: var(--kt-bg-subtle);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.confirmList li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--kt-text);
}

.confirmMore {
  color: var(--kt-text-muted);
  font-style: italic;
}

.modalSecondary {
  flex: 1;
  padding: var(--kt-space-3);
  background: transparent;
  color: var(--kt-text);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  font-family: var(--kt-font-sans);
  font-size: var(--kt-text-sm);
  font-weight: var(--kt-weight-medium);
  cursor: pointer;
}

.modalDanger {
  flex: 1;
  padding: var(--kt-space-3);
  background: var(--kt-danger);
  color: var(--kt-danger-fg);
  border: none;
  border-radius: var(--kt-radius-md);
  font-family: var(--kt-font-sans);
  font-size: var(--kt-text-sm);
  font-weight: var(--kt-weight-semibold);
  cursor: pointer;
}
```

- [ ] **Step 3: Wire into page**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

(a) Add imports:

```tsx
import { BulkActionBar } from '../../components/ApplicantManagement/BulkActionBar'
import {
  advanceApplicants,
  rejectApplicants,
  shortlistApplicants,
} from '../../services/applicantService'
```

(b) Add bulk action handlers inside the component, after `load`:

```tsx
const bulkApplicants = useMemo(() => rows.filter((r) => selectedIds.has(r.id)), [rows, selectedIds])

const doBulkAdvance = async () => {
  await advanceApplicants(Array.from(selectedIds))
  setSelectedIds(new Set())
  load()
}
const doBulkShortlist = async () => {
  await shortlistApplicants(Array.from(selectedIds))
  setSelectedIds(new Set())
  load()
}
const doBulkReject = async () => {
  await rejectApplicants(Array.from(selectedIds))
  setSelectedIds(new Set())
  load()
}
const doBulkMessage = () => {
  window.alert('Messaging not built yet.')
}
```

(c) Replace the stubbed bulk bar with:

```tsx
{
  selectedIds.size > 0 && (
    <BulkActionBar
      applicants={bulkApplicants}
      onAdvance={doBulkAdvance}
      onShortlist={doBulkShortlist}
      onMessage={doBulkMessage}
      onReject={doBulkReject}
      onDeselectAll={() => setSelectedIds(new Set())}
    />
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/BulkActionBar.tsx src/site/components/ApplicantManagement/BulkActionBar.module.css src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(applicants): BulkActionBar component with reject confirmation"
```

---

## Task 9: `ApplicantList` + `ApplicantListRow` components

**Files:**

- Create: `src/site/components/ApplicantManagement/ApplicantList.tsx`
- Create: `src/site/components/ApplicantManagement/ApplicantList.module.css`
- Create: `src/site/components/ApplicantManagement/ApplicantListRow.tsx`
- Create: `src/site/components/ApplicantManagement/ApplicantListRow.module.css`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Create `ApplicantListRow`**

Create `src/site/components/ApplicantManagement/ApplicantListRow.tsx`:

```tsx
import React from 'react'
import type { RankedApplicant } from '../../types'
import { RegulixMarkIcon, StarIcon } from '../../icons'
import { StagePill } from '../StagePill/StagePill'
import styles from './ApplicantListRow.module.css'

export interface ApplicantListRowProps {
  applicant: RankedApplicant
  selected: boolean
  checked: boolean
  onSelect: () => void
  onToggleCheck: () => void
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const ApplicantListRow = React.forwardRef<HTMLLIElement, ApplicantListRowProps>(
  ({ applicant, selected, checked, onSelect, onToggleCheck }, ref) => {
    return (
      <li
        ref={ref}
        className={[styles.row, selected ? styles.selected : ''].filter(Boolean).join(' ')}
        role="option"
        aria-selected={selected}
        onClick={onSelect}
      >
        <div className={styles.checkCell} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggleCheck}
            aria-label={`Select ${applicant.workerFirstName} ${applicant.workerLastInitial}.`}
          />
        </div>
        <div className={styles.avatar}>{applicant.workerInitials}</div>
        <div className={styles.main}>
          <div className={styles.nameRow}>
            <span className={styles.name}>
              {applicant.workerFirstName} {applicant.workerLastInitial}.
            </span>
            {applicant.isShortlisted && <StarIcon size={11} color="var(--kt-olive-600)" />}
            {applicant.isRegulixReady && <RegulixMarkIcon size={12} />}
          </div>
          <div className={styles.metaRow}>
            <span className={styles.jobTitle}>{applicant.jobTitle}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.date}>{formatShortDate(applicant.appliedAt)}</span>
          </div>
        </div>
        <div className={styles.rankCell}>
          <span className={styles.rankNumber}>{applicant.rank}</span>
          <StagePill stage={applicant.stage} size="sm" />
        </div>
      </li>
    )
  }
)
ApplicantListRow.displayName = 'ApplicantListRow'
```

- [ ] **Step 2: Create `ApplicantListRow.module.css`**

```css
.row {
  display: grid;
  grid-template-columns: 28px 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px var(--kt-space-4);
  border-bottom: 1px solid var(--kt-border);
  cursor: pointer;
  min-height: 60px;
}

.row:hover {
  background: var(--kt-secondary);
}

.selected {
  background: var(--kt-primary-subtle);
  border-left: 3px solid var(--kt-primary);
  padding-left: calc(var(--kt-space-4) - 3px);
}

.checkCell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkCell input[type='checkbox'] {
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--kt-navy-800);
  color: var(--kt-sand-300);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: var(--kt-weight-bold);
  flex-shrink: 0;
}

.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nameRow {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.name {
  font-size: 13px;
  font-weight: var(--kt-weight-semibold);
  color: var(--kt-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metaRow {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--kt-text-muted);
  min-width: 0;
}

.jobTitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dot {
  opacity: 0.5;
}

.rankCell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.rankNumber {
  font-size: 16px;
  font-weight: var(--kt-weight-bold);
  color: var(--kt-text);
  line-height: 1;
}
```

- [ ] **Step 3: Create `ApplicantList`**

Create `src/site/components/ApplicantManagement/ApplicantList.tsx`:

```tsx
import React, { useEffect, useRef } from 'react'
import type { RankedApplicant } from '../../types'
import { ApplicantListRow } from './ApplicantListRow'
import styles from './ApplicantList.module.css'

export interface ApplicantListProps {
  applicants: RankedApplicant[]
  selectedId: string | null
  onSelect: (id: string) => void
  checkedIds: Set<string>
  onToggleCheck: (id: string) => void
  totalCount: number
}

export const ApplicantList: React.FC<ApplicantListProps> = ({
  applicants,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  totalCount,
}) => {
  const rowRefs = useRef<Map<string, HTMLLIElement | null>>(new Map())

  // Scroll the selected row into view.
  useEffect(() => {
    if (!selectedId) return
    const el = rowRefs.current.get(selectedId)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {totalCount} {totalCount === 1 ? 'applicant' : 'applicants'}
      </div>
      <ul className={styles.list} role="listbox" aria-label="Ranked applicants">
        {applicants.map((a) => (
          <ApplicantListRow
            key={a.id}
            ref={(el) => {
              if (el) rowRefs.current.set(a.id, el)
              else rowRefs.current.delete(a.id)
            }}
            applicant={a}
            selected={a.id === selectedId}
            checked={checkedIds.has(a.id)}
            onSelect={() => onSelect(a.id)}
            onToggleCheck={() => onToggleCheck(a.id)}
          />
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Create `ApplicantList.module.css`**

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 10px var(--kt-space-4);
  font-size: 11px;
  font-weight: var(--kt-weight-semibold);
  color: var(--kt-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--kt-bg);
  border-bottom: 1px solid var(--kt-border);
  flex-shrink: 0;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
}
```

- [ ] **Step 5: Wire into page + keyboard nav**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

(a) Add imports:

```tsx
import { ApplicantList } from '../../components/ApplicantManagement/ApplicantList'
import { useApplicantKeyboardNav } from '../../components/ApplicantManagement/useApplicantKeyboardNav'
import {
  advanceApplicantStage,
  rejectApplicant,
  shortlistApplicant,
} from '../../services/applicantService'
```

(b) Add per-row callbacks inside the component:

```tsx
const toggleCheck = useCallback((id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}, [])

const handleShortlist = useCallback(async () => {
  if (!selectedId) return
  await shortlistApplicant(selectedId)
  load()
}, [selectedId, load])

const handleReject = useCallback(async () => {
  if (!selectedId) return
  await rejectApplicant(selectedId)
  load()
}, [selectedId, load])

const handleAdvance = useCallback(async () => {
  if (!selectedId) return
  await advanceApplicantStage(selectedId)
  load()
}, [selectedId, load])

const handleNextOrPrev = useCallback(
  (dir: 1 | -1) => {
    if (rows.length === 0) return
    const idx = selectedId ? rows.findIndex((r) => r.id === selectedId) : -1
    const nextIdx =
      idx < 0
        ? dir === 1
          ? 0
          : rows.length - 1
        : Math.max(0, Math.min(rows.length - 1, idx + dir))
    setSelectedId(rows[nextIdx].id)
  },
  [rows, selectedId]
)
```

(c) Add keyboard hook usage:

```tsx
const [helpOpen, setHelpOpen] = useState(false)

useApplicantKeyboardNav({
  enabled: !loading && rows.length > 0,
  handlers: {
    onNext: () => handleNextOrPrev(1),
    onPrev: () => handleNextOrPrev(-1),
    onShortlist: handleShortlist,
    onReject: handleReject,
    onAdvance: handleAdvance,
    onHelp: () => setHelpOpen(true),
    onEscape: () => {
      if (layoutMode === 'stacked') setSelectedId(null)
      else setSelectedIds(new Set())
    },
  },
})
```

(d) Replace the stubbed list (`<ul className={styles.listStub}>…</ul>`) inside the `listPane` with:

```tsx
<ApplicantList
  applicants={rows}
  selectedId={selectedId}
  onSelect={(id) => setSelectedId(id)}
  checkedIds={selectedIds}
  onToggleCheck={toggleCheck}
  totalCount={total}
/>
```

(e) Remove the now-unused `helpOpen` silencer line if present. Leave `helpOpen` — it's wired in Task 14.

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/ApplicantList.tsx src/site/components/ApplicantManagement/ApplicantList.module.css src/site/components/ApplicantManagement/ApplicantListRow.tsx src/site/components/ApplicantManagement/ApplicantListRow.module.css src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(applicants): ApplicantList + ApplicantListRow with keyboard nav"
```

---

## Task 10: `RankBreakdown` component

**Files:**

- Create: `src/site/components/ApplicantManagement/RankBreakdown.tsx`
- Create: `src/site/components/ApplicantManagement/RankBreakdown.module.css`

- [ ] **Step 1: Create the component**

Create `src/site/components/ApplicantManagement/RankBreakdown.tsx`:

```tsx
import React from 'react'
import type { RankComponents } from '../../types'
import styles from './RankBreakdown.module.css'

export interface RankBreakdownProps {
  rank: number
  components: RankComponents
}

type Row = { label: string; weight: number; value: number }

export const RankBreakdown: React.FC<RankBreakdownProps> = ({ rank, components }) => {
  const rows: Row[] = [
    { label: 'Skill match', weight: 40, value: components.skillMatch },
    { label: 'Regulix Ready', weight: 30, value: components.regulixReady },
    { label: 'Endorsements', weight: 20, value: components.endorsementsScore },
    { label: 'Recency', weight: 10, value: components.recencyScore },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.rankNumberBlock}>
        <span className={styles.rankLabel}>Rank</span>
        <span className={styles.rankNumber}>{rank}</span>
      </div>
      <ul className={styles.bars}>
        {rows.map((r) => (
          <li key={r.label} className={styles.barRow}>
            <span className={styles.barLabel}>{r.label}</span>
            <span className={styles.barWeight}>{r.weight}%</span>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${r.value}%` }} />
            </div>
            <span className={styles.barValue}>{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Create `RankBreakdown.module.css`**

```css
.container {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: var(--kt-space-4);
  padding: var(--kt-space-4);
  background: var(--kt-surface-raised);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-lg);
  align-items: center;
}

.rankNumberBlock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.rankLabel {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--kt-text-muted);
}

.rankNumber {
  font-size: 36px;
  font-weight: var(--kt-weight-bold);
  color: var(--kt-text);
  line-height: 1;
}

.bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.barRow {
  display: grid;
  grid-template-columns: 100px 36px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.barLabel {
  color: var(--kt-text);
  font-weight: var(--kt-weight-medium);
}

.barWeight {
  color: var(--kt-text-muted);
  font-size: 10px;
}

.track {
  height: 6px;
  background: var(--kt-grey-200);
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--kt-olive-600);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.barValue {
  text-align: right;
  color: var(--kt-text);
  font-weight: var(--kt-weight-semibold);
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/RankBreakdown.tsx src/site/components/ApplicantManagement/RankBreakdown.module.css
git commit -m "feat(applicants): RankBreakdown component with 4 component bars"
```

---

## Task 11: `ApplicantActionBar` component

**Files:**

- Create: `src/site/components/ApplicantManagement/ApplicantActionBar.tsx`
- Create: `src/site/components/ApplicantManagement/ApplicantActionBar.module.css`

- [ ] **Step 1: Create the component**

Create `src/site/components/ApplicantManagement/ApplicantActionBar.tsx`:

```tsx
import React from 'react'
import type { RankedApplicant } from '../../types'
import {
  CheckCircleIcon,
  CloseIcon,
  MessageIcon,
  RegulixMarkIcon,
  RocketIcon,
  StarIcon,
  StarOutlineIcon,
} from '../../icons'
import styles from './ApplicantActionBar.module.css'

export interface ApplicantActionBarProps {
  applicant: RankedApplicant
  savedToTalentPool: boolean
  regulixLinked: boolean
  onShortlist: () => void
  onAdvance: () => void
  onReject: () => void
  onHire: () => void
  onMessage: () => void
  onSaveToTalentPool: () => void
  onStartRegulixOnboarding: () => void
}

export const ApplicantActionBar: React.FC<ApplicantActionBarProps> = ({
  applicant,
  savedToTalentPool,
  regulixLinked,
  onShortlist,
  onAdvance,
  onReject,
  onHire,
  onMessage,
  onSaveToTalentPool,
  onStartRegulixOnboarding,
}) => {
  const canAdvance = applicant.stage !== 'hired' && applicant.stage !== 'rejected'
  const canReject = applicant.stage !== 'rejected'
  const canHire = applicant.stage !== 'hired' && applicant.stage !== 'rejected'

  return (
    <div className={styles.actionBar}>
      <button
        type="button"
        className={[styles.btn, applicant.isShortlisted ? styles.btnActive : ''].join(' ')}
        onClick={onShortlist}
      >
        {applicant.isShortlisted ? <StarIcon size={13} /> : <StarOutlineIcon size={13} />}
        {applicant.isShortlisted ? 'Shortlisted' : 'Shortlist'}
      </button>

      {canAdvance && (
        <button
          type="button"
          className={[styles.btn, styles.btnPrimary].join(' ')}
          onClick={onAdvance}
        >
          <CheckCircleIcon size={13} /> Advance
        </button>
      )}

      {canReject && (
        <button
          type="button"
          className={[styles.btn, styles.btnDanger].join(' ')}
          onClick={onReject}
        >
          <CloseIcon size={13} /> Reject
        </button>
      )}

      {canHire && (
        <button type="button" className={styles.btn} onClick={onHire}>
          Hire
        </button>
      )}

      <button type="button" className={styles.btn} onClick={onMessage}>
        <MessageIcon size={13} /> Message
      </button>

      <button
        type="button"
        className={[styles.btn, savedToTalentPool ? styles.btnActive : ''].join(' ')}
        onClick={onSaveToTalentPool}
      >
        {savedToTalentPool ? 'Saved to talent pool' : 'Save to talent pool'}
      </button>

      {regulixLinked && (
        <button
          type="button"
          className={[styles.btn, styles.btnRegulix].join(' ')}
          onClick={onStartRegulixOnboarding}
        >
          <RocketIcon size={13} /> Start Regulix onboarding <RegulixMarkIcon size={12} />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `ApplicantActionBar.module.css`**

```css
.actionBar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: var(--kt-space-3) 0;
  border-top: 1px solid var(--kt-border);
  border-bottom: 1px solid var(--kt-border);
}

.btn {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  background: var(--kt-surface);
  color: var(--kt-text);
  font-family: var(--kt-font-sans);
  font-size: 12px;
  font-weight: var(--kt-weight-medium);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:hover {
  background: var(--kt-secondary);
}

.btnActive {
  background: var(--kt-olive-100);
  border-color: var(--kt-olive-600);
  color: var(--kt-olive-900);
}

.btnPrimary {
  background: var(--kt-primary);
  color: var(--kt-primary-fg);
  border-color: var(--kt-primary);
}

.btnPrimary:hover {
  background: var(--kt-primary-hover);
}

.btnDanger {
  color: var(--kt-danger);
  border-color: color-mix(in srgb, var(--kt-danger) 30%, var(--kt-border));
}

.btnDanger:hover {
  background: var(--kt-danger-subtle);
}

.btnRegulix {
  border-color: color-mix(in srgb, var(--kt-olive-600) 40%, var(--kt-border));
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/ApplicantActionBar.tsx src/site/components/ApplicantManagement/ApplicantActionBar.module.css
git commit -m "feat(applicants): ApplicantActionBar with conditional Regulix onboarding"
```

---

## Task 12: `ApplicantDetail` component

Orchestrates the right pane: header, action bar, rank breakdown, status row, Regulix section, skills, notes, full-profile link.

**Files:**

- Create: `src/site/components/ApplicantManagement/ApplicantDetail.tsx`
- Create: `src/site/components/ApplicantManagement/ApplicantDetail.module.css`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Create the component**

Create `src/site/components/ApplicantManagement/ApplicantDetail.tsx`:

```tsx
import React from 'react'
import { Link } from 'react-router-dom'
import type { RankedApplicant } from '../../types'
import { CloseIcon, RegulixMarkIcon, StarIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { StagePill } from '../StagePill/StagePill'
import { ApplicantActionBar } from './ApplicantActionBar'
import { RankBreakdown } from './RankBreakdown'
import styles from './ApplicantDetail.module.css'

function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeDays(iso: string | undefined): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export interface ApplicantDetailProps {
  applicant: RankedApplicant
  savedToTalentPool: boolean
  regulixLinked: boolean
  onClose?: () => void
  onShortlist: () => void
  onAdvance: () => void
  onReject: () => void
  onHire: () => void
  onMessage: () => void
  onSaveToTalentPool: () => void
  onStartRegulixOnboarding: () => void
}

export const ApplicantDetail: React.FC<ApplicantDetailProps> = ({
  applicant,
  savedToTalentPool,
  regulixLinked,
  onClose,
  onShortlist,
  onAdvance,
  onReject,
  onHire,
  onMessage,
  onSaveToTalentPool,
  onStartRegulixOnboarding,
}) => {
  const status = applicant.regulixStatus
  const hasRegulixAccount = status !== null

  return (
    <div className={styles.panel}>
      <div className={styles.topBar}>
        <StagePill stage={applicant.stage} />
        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close details"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      <div className={styles.identity}>
        <div className={styles.avatar}>{applicant.workerInitials}</div>
        <div className={styles.identityText}>
          <div className={styles.nameRow}>
            <h2 className={styles.fullName}>{applicant.workerFullName}</h2>
            {applicant.isRegulixReady && <RegulixBadge size="sm" />}
          </div>
          <p className={styles.trade}>{applicant.workerPrimaryTrade}</p>
          <p className={styles.jobRef}>
            Applied for <strong>{applicant.jobTitle}</strong> ·{' '}
            {formatAbsoluteDate(applicant.appliedAt)}
          </p>
          {hasRegulixAccount && (
            <div className={styles.statusBadges}>
              {status?.ready && <span className={styles.statusBadge}>Regulix Ready</span>}
              {status?.onboarded && <span className={styles.statusBadge}>Onboarded</span>}
              {status?.immediateHire && <span className={styles.statusBadge}>Immediate hire</span>}
            </div>
          )}
        </div>
      </div>

      <ApplicantActionBar
        applicant={applicant}
        savedToTalentPool={savedToTalentPool}
        regulixLinked={regulixLinked}
        onShortlist={onShortlist}
        onAdvance={onAdvance}
        onReject={onReject}
        onHire={onHire}
        onMessage={onMessage}
        onSaveToTalentPool={onSaveToTalentPool}
        onStartRegulixOnboarding={onStartRegulixOnboarding}
      />

      <div className={styles.body}>
        <RankBreakdown rank={applicant.rank} components={applicant.rankBreakdown} />

        {/* Status row — minimal activity log per spec §7.4 */}
        <section className={styles.statusRow}>
          <span className={styles.statusLine}>
            Applied <strong>{formatAbsoluteDate(applicant.appliedAt)}</strong>
            {' · '}
            Stage <strong>{applicant.stage}</strong>
            {' · '}
            Updated {formatRelativeDays(applicant.appliedAt)}
          </span>
        </section>

        {/* Regulix section */}
        {hasRegulixAccount ? (
          <>
            {applicant.verifiedWorkHistory.length > 0 && (
              <section className={styles.section}>
                <span className={styles.sectionLabel}>
                  <RegulixMarkIcon size={12} /> Verified work history
                </span>
                <ul className={styles.list}>
                  {applicant.verifiedWorkHistory.map((e) => (
                    <li key={e.id} className={styles.listItem}>
                      <strong>{e.role}</strong>
                      <span className={styles.listMeta}>
                        {e.companyName} · {formatAbsoluteDate(e.startDate)}
                        {e.endDate ? ` – ${formatAbsoluteDate(e.endDate)}` : ' – present'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {applicant.endorsements.length > 0 && (
              <section className={styles.section}>
                <span className={styles.sectionLabel}>
                  <RegulixMarkIcon size={12} /> Endorsements
                </span>
                <ul className={styles.list}>
                  {applicant.endorsements.map((e) => (
                    <li key={e.id} className={styles.endorsement}>
                      <div className={styles.endorsementHeader}>
                        <strong>{e.fromCompanyName}</strong>
                        <span className={styles.endorsementRating}>
                          {Array.from({ length: e.rating }).map((_, i) => (
                            <StarIcon key={i} size={11} color="var(--kt-olive-600)" />
                          ))}
                        </span>
                      </div>
                      <p className={styles.endorsementQuote}>"{e.quote}"</p>
                      <span className={styles.endorsementMeta}>
                        {e.role} · {formatAbsoluteDate(e.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <section className={styles.section}>
            <p className={styles.mutedNote}>Worker is not on Regulix.</p>
          </section>
        )}

        {/* Skills */}
        {applicant.workerTopSkills.length > 0 && (
          <section className={styles.section}>
            <span className={styles.sectionLabel}>Top skills</span>
            <div className={styles.skillTags}>
              {applicant.workerTopSkills.map((s) => (
                <span key={s} className={styles.skillTag}>
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {applicant.notes.length > 0 && (
          <section className={styles.section}>
            <span className={styles.sectionLabel}>Notes</span>
            <ul className={styles.list}>
              {applicant.notes.map((n, i) => (
                <li key={i} className={styles.noteItem}>
                  {n}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className={styles.footer}>
        <Link
          to={`/site/profile/${applicant.workerId}`}
          target="_blank"
          rel="noreferrer"
          className={styles.viewFullLink}
        >
          View full profile →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `ApplicantDetail.module.css`**

```css
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.topBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--kt-space-3) var(--kt-space-4);
  border-bottom: 1px solid var(--kt-border);
}

.closeBtn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--kt-radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--kt-text-muted);
}

.closeBtn:hover {
  background: var(--kt-secondary);
  color: var(--kt-text);
}

.identity {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: var(--kt-space-3);
  padding: var(--kt-space-4);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--kt-navy-800);
  color: var(--kt-sand-300);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: var(--kt-weight-bold);
}

.identityText {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.nameRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fullName {
  font-size: 18px;
  font-weight: var(--kt-weight-semibold);
  color: var(--kt-text);
  margin: 0;
}

.trade {
  font-size: 13px;
  color: var(--kt-text-muted);
  margin: 0;
}

.jobRef {
  font-size: 12px;
  color: var(--kt-text-muted);
  margin: 2px 0 0;
}

.statusBadges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.statusBadge {
  font-size: 10px;
  font-weight: var(--kt-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--kt-olive-800);
  background: var(--kt-olive-100);
  padding: 2px 8px;
  border-radius: var(--kt-radius-md);
}

.body {
  padding: var(--kt-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--kt-space-4);
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.statusRow {
  padding: 10px var(--kt-space-3);
  background: var(--kt-bg-subtle);
  border-radius: var(--kt-radius-md);
  font-size: 12px;
  color: var(--kt-text-muted);
}

.statusLine strong {
  color: var(--kt-text);
  font-weight: var(--kt-weight-semibold);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sectionLabel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--kt-weight-semibold);
  color: var(--kt-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.listItem {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  padding: 8px 10px;
  background: var(--kt-surface-raised);
  border-radius: var(--kt-radius-md);
}

.listItem strong {
  color: var(--kt-text);
}

.listMeta {
  font-size: 11px;
  color: var(--kt-text-muted);
}

.endorsement {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--kt-surface-raised);
  border-radius: var(--kt-radius-md);
  border-left: 2px solid var(--kt-olive-600);
}

.endorsementHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--kt-text);
}

.endorsementRating {
  display: inline-flex;
  gap: 1px;
}

.endorsementQuote {
  margin: 0;
  font-size: 12px;
  color: var(--kt-text);
  font-style: italic;
  line-height: 1.5;
}

.endorsementMeta {
  font-size: 10px;
  color: var(--kt-text-muted);
}

.mutedNote {
  font-size: 12px;
  color: var(--kt-text-muted);
  font-style: italic;
  margin: 0;
}

.skillTags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skillTag {
  font-size: 11px;
  padding: 3px 10px;
  background: var(--kt-secondary);
  border-radius: var(--kt-radius-md);
  color: var(--kt-text);
}

.noteItem {
  font-size: 12px;
  padding: 8px 10px;
  background: var(--kt-sand-50);
  border-radius: var(--kt-radius-md);
  border-left: 2px solid var(--kt-sand-600);
  color: var(--kt-text);
  line-height: 1.5;
}

.footer {
  padding: var(--kt-space-3) var(--kt-space-4);
  border-top: 1px solid var(--kt-border);
}

.viewFullLink {
  font-size: 12px;
  color: var(--kt-primary);
  font-weight: var(--kt-weight-medium);
  text-decoration: none;
}

.viewFullLink:hover {
  text-decoration: underline;
}
```

- [ ] **Step 3: Wire into page**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

(a) Add import:

```tsx
import { ApplicantDetail } from '../../components/ApplicantManagement/ApplicantDetail'
import { saveApplicantToTalentPool } from '../../services/applicantService'
```

(b) Add state for saved-to-pool and modal opens (modals come in Task 13):

```tsx
const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
const [hireModalFor, setHireModalFor] = useState<RankedApplicant | null>(null)
const [regulixModalFor, setRegulixModalFor] = useState<RankedApplicant | null>(null)
```

(c) Add handlers for save + messaging + hire/regulix openers:

```tsx
const handleSaveToPool = useCallback(async () => {
  if (!selected) return
  const already = savedIds.has(selected.id)
  if (already) {
    setSavedIds((prev) => {
      const next = new Set(prev)
      next.delete(selected.id)
      return next
    })
    return
  }
  const res = await saveApplicantToTalentPool(selected.id)
  if (!res.error) {
    setSavedIds((prev) => new Set([...prev, selected.id]))
  }
}, [selected, savedIds])

const handleMessage = useCallback(() => {
  if (!selected) return
  window.location.href = `/site/messages?applicant=${selected.workerId}&job=${selected.jobId}`
}, [selected])
```

(d) Replace the stubbed detail pane content with:

```tsx
{
  selected ? (
    <ApplicantDetail
      applicant={selected}
      savedToTalentPool={savedIds.has(selected.id)}
      regulixLinked={false /* Task 17 wires the real value */}
      onClose={layoutMode === 'split' ? undefined : () => setSelectedId(null)}
      onShortlist={handleShortlist}
      onAdvance={handleAdvance}
      onReject={handleReject}
      onHire={() => setHireModalFor(selected)}
      onMessage={handleMessage}
      onSaveToTalentPool={handleSaveToPool}
      onStartRegulixOnboarding={() => setRegulixModalFor(selected)}
    />
  ) : (
    <div className={styles.detailPlaceholder}>Select an applicant to view details.</div>
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/ApplicantDetail.tsx src/site/components/ApplicantManagement/ApplicantDetail.module.css src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(applicants): ApplicantDetail panel orchestrates detail sections"
```

---

## Task 13: Hire + Regulix onboarding modals

**Files:**

- Create: `src/site/components/ApplicantManagement/HireConfirmModal.tsx`
- Create: `src/site/components/ApplicantManagement/RegulixOnboardingModal.tsx`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Create `HireConfirmModal`**

Create `src/site/components/ApplicantManagement/HireConfirmModal.tsx`:

```tsx
import React, { useState } from 'react'
import { Modal } from '../../../components'
import type { RankedApplicant } from '../../types'

export interface HireConfirmModalProps {
  applicant: RankedApplicant | null
  onClose: () => void
  onConfirm: (hireDate: string) => Promise<void> | void
}

function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const HireConfirmModal: React.FC<HireConfirmModalProps> = ({
  applicant,
  onClose,
  onConfirm,
}) => {
  const [hireDate, setHireDate] = useState(todayIso())
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!applicant) return
    setSubmitting(true)
    try {
      await onConfirm(hireDate)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={applicant !== null}
      onClose={onClose}
      size="sm"
      title="Confirm hire"
      footer={
        <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1,
              padding: 'var(--kt-space-3)',
              background: 'transparent',
              color: 'var(--kt-text)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !hireDate}
            style={{
              flex: 1,
              padding: 'var(--kt-space-3)',
              background: 'var(--kt-olive-700)',
              color: 'var(--kt-white)',
              border: 'none',
              borderRadius: 'var(--kt-radius-md)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              cursor: submitting || !hireDate ? 'default' : 'pointer',
              opacity: submitting || !hireDate ? 0.6 : 1,
            }}
          >
            {submitting ? 'Confirming…' : 'Confirm hire'}
          </button>
        </div>
      }
    >
      {applicant && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--kt-space-3)' }}>
          <div style={{ fontSize: 13 }}>
            Marking <strong>{applicant.workerFullName}</strong> as hired for{' '}
            <strong>{applicant.jobTitle}</strong>.
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            Hire date
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
              style={{
                padding: '8px 10px',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                fontFamily: 'var(--kt-font-sans)',
                fontSize: 13,
              }}
            />
          </label>
          <p style={{ fontSize: 12, color: 'var(--kt-text-muted)', margin: 0, lineHeight: 1.5 }}>
            This only changes the pipeline stage. It does not start onboarding in any HR system. Use
            "Start Regulix onboarding" separately if your company uses Regulix.
          </p>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 2: Create `RegulixOnboardingModal`**

Create `src/site/components/ApplicantManagement/RegulixOnboardingModal.tsx`:

```tsx
import React, { useState } from 'react'
import { Modal } from '../../../components'
import type { RankedApplicant } from '../../types'
import { RocketIcon, RegulixMarkIcon, WarningTriangleIcon } from '../../icons'

export interface RegulixOnboardingModalProps {
  applicant: RankedApplicant | null
  /** Default pay rate — typically the job's payMax. */
  defaultPayRate: number
  onClose: () => void
  onConfirm: (params: { hireDate: string; payRate: number }) => Promise<void> | void
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const RegulixOnboardingModal: React.FC<RegulixOnboardingModalProps> = ({
  applicant,
  defaultPayRate,
  onClose,
  onConfirm,
}) => {
  const [hireDate, setHireDate] = useState(todayIso())
  const [payRate, setPayRate] = useState(defaultPayRate)
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!applicant || payRate <= 0) return
    setSubmitting(true)
    try {
      await onConfirm({ hireDate, payRate })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const notYetHired = applicant && applicant.stage !== 'hired'

  return (
    <Modal
      open={applicant !== null}
      onClose={onClose}
      size="sm"
      title={
        <>
          <RocketIcon size={16} /> Start Regulix onboarding <RegulixMarkIcon size={14} />
        </>
      }
      footer={
        <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1,
              padding: 'var(--kt-space-3)',
              background: 'transparent',
              color: 'var(--kt-text)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !hireDate || payRate <= 0}
            style={{
              flex: 1.5,
              padding: 'var(--kt-space-3)',
              background: 'var(--kt-olive-700)',
              color: 'var(--kt-white)',
              border: 'none',
              borderRadius: 'var(--kt-radius-md)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              cursor: submitting || !hireDate || payRate <= 0 ? 'default' : 'pointer',
              opacity: submitting || !hireDate || payRate <= 0 ? 0.6 : 1,
            }}
          >
            {submitting ? 'Starting…' : 'Start onboarding'}
          </button>
        </div>
      }
    >
      {applicant && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--kt-space-3)' }}>
          <div style={{ fontSize: 13 }}>
            Hand off <strong>{applicant.workerFullName}</strong> to Regulix onboarding for{' '}
            <strong>{applicant.jobTitle}</strong>.
          </div>

          {notYetHired && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: 10,
                background: 'var(--kt-warning-subtle)',
                borderRadius: 'var(--kt-radius-md)',
                border: '1px solid color-mix(in srgb, var(--kt-warning) 30%, var(--kt-border))',
                fontSize: 12,
                color: 'var(--kt-text)',
                lineHeight: 1.5,
              }}
            >
              <WarningTriangleIcon size={14} color="var(--kt-warning)" />
              <span>
                This applicant is in stage <strong>{applicant.stage}</strong> — not yet marked
                hired. Continue if onboarding happens first in your process.
              </span>
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            Hire date
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
              style={{
                padding: '8px 10px',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                fontFamily: 'var(--kt-font-sans)',
                fontSize: 13,
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            Pay rate ($/hour)
            <input
              type="number"
              value={payRate}
              onChange={(e) => setPayRate(Number(e.target.value))}
              min={1}
              step="0.01"
              required
              style={{
                padding: '8px 10px',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                fontFamily: 'var(--kt-font-sans)',
                fontSize: 13,
              }}
            />
          </label>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 3: Wire modals into page**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

(a) Add imports:

```tsx
import { HireConfirmModal } from '../../components/ApplicantManagement/HireConfirmModal'
import { RegulixOnboardingModal } from '../../components/ApplicantManagement/RegulixOnboardingModal'
import { hireApplicant, startRegulixOnboarding } from '../../services/applicantService'
```

(b) Add handlers:

```tsx
const handleConfirmHire = async (hireDate: string) => {
  if (!hireModalFor) return
  const res = await hireApplicant(hireModalFor.id, hireDate)
  if (!res.error) {
    load()
  } else {
    window.alert(`Could not hire: ${res.error}`)
  }
}

const handleConfirmRegulixOnboarding = async (params: { hireDate: string; payRate: number }) => {
  if (!regulixModalFor) return
  const res = await startRegulixOnboarding(regulixModalFor.id, params)
  if (res.error) {
    window.alert(`Could not start onboarding: ${res.error}`)
  } else {
    window.alert(`Onboarding started (${res.data?.regulixHireId})`)
  }
}
```

(c) Render both modals at the bottom of the returned JSX (just before the closing `</div>` of `.container`):

```tsx
<HireConfirmModal
  applicant={hireModalFor}
  onClose={() => setHireModalFor(null)}
  onConfirm={handleConfirmHire}
/>
<RegulixOnboardingModal
  applicant={regulixModalFor}
  // v1: mock CompanyApplicant doesn't carry the job's pay range.
  // Recruiter edits the value; a later spec that enriches applicant rows with
  // job pay details will replace this with regulixModalFor?.job.payMax.
  defaultPayRate={32}
  onClose={() => setRegulixModalFor(null)}
  onConfirm={handleConfirmRegulixOnboarding}
/>
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/HireConfirmModal.tsx src/site/components/ApplicantManagement/RegulixOnboardingModal.tsx src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(applicants): HireConfirmModal + RegulixOnboardingModal"
```

---

## Task 14: `KeyboardHelpOverlay`

**Files:**

- Create: `src/site/components/ApplicantManagement/KeyboardHelpOverlay.tsx`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Create the component**

Create `src/site/components/ApplicantManagement/KeyboardHelpOverlay.tsx`:

```tsx
import React from 'react'
import { Modal } from '../../../components'

export interface KeyboardHelpOverlayProps {
  open: boolean
  onClose: () => void
}

const BINDINGS: Array<{ keys: string[]; action: string }> = [
  { keys: ['j', '↓'], action: 'Next applicant' },
  { keys: ['k', '↑'], action: 'Previous applicant' },
  { keys: ['s'], action: 'Toggle shortlist' },
  { keys: ['r'], action: 'Reject applicant' },
  { keys: ['⌘', '↵'], action: 'Advance stage' },
  { keys: ['?'], action: 'Show this help' },
  { keys: ['Esc'], action: 'Close or clear selection' },
]

export const KeyboardHelpOverlay: React.FC<KeyboardHelpOverlayProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Keyboard shortcuts">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {BINDINGS.map((b) => (
            <tr key={b.action}>
              <td style={{ padding: '6px 0', width: 140 }}>
                {b.keys.map((k, i) => (
                  <React.Fragment key={i}>
                    <kbd
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: 'var(--kt-surface-raised)',
                        border: '1px solid var(--kt-border)',
                        borderRadius: 4,
                        fontFamily: 'var(--kt-font-mono, ui-monospace)',
                        fontSize: 11,
                        color: 'var(--kt-text)',
                        marginRight: 4,
                      }}
                    >
                      {k}
                    </kbd>
                    {i < b.keys.length - 1 && (
                      <span style={{ color: 'var(--kt-text-muted)', marginRight: 4 }}>or</span>
                    )}
                  </React.Fragment>
                ))}
              </td>
              <td style={{ padding: '6px 0', color: 'var(--kt-text)' }}>{b.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  )
}
```

- [ ] **Step 2: Wire into page**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`:

(a) Add import:

```tsx
import { KeyboardHelpOverlay } from '../../components/ApplicantManagement/KeyboardHelpOverlay'
```

(b) Render before the closing container div:

```tsx
<KeyboardHelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
```

(c) Also add a header button for the `?` shortcut:

Inside the `<header className={styles.pageHeader}>` element, add a right-side button:

```tsx
<button
  type="button"
  onClick={() => setHelpOpen(true)}
  style={{
    height: 32,
    padding: '0 12px',
    border: '1px solid var(--kt-border)',
    borderRadius: 'var(--kt-radius-md)',
    background: 'var(--kt-surface)',
    color: 'var(--kt-text)',
    fontSize: 12,
    cursor: 'pointer',
  }}
>
  ? Shortcuts
</button>
```

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/site/components/ApplicantManagement/KeyboardHelpOverlay.tsx src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(applicants): KeyboardHelpOverlay + ? shortcut"
```

---

## Task 15: Empty / loading / error / skeleton states

**Files:**

- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`

- [ ] **Step 1: Replace the stubbed loading/empty/error blocks**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`, replace the list pane's conditional rendering (currently `loading ? ... : errorMessage ? ... : rows.length === 0 ? ... : <ApplicantList ...>`) with:

```tsx
{
  loading ? (
    <ul className={styles.skeletonList}>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className={styles.skeletonRow}>
          <span className={styles.skeletonAvatar} />
          <span className={styles.skeletonText} />
        </li>
      ))}
    </ul>
  ) : errorMessage ? (
    <div className={styles.errorBanner}>
      <p className={styles.errorText}>Couldn't load applicants.</p>
      <button type="button" onClick={load} className={styles.retryBtn}>
        Retry
      </button>
    </div>
  ) : rows.length === 0 ? (
    <div className={styles.emptyState}>
      <p className={styles.emptyText}>
        {total === 0 &&
        filters.search === '' &&
        filters.stage === 'all' &&
        filters.jobId === 'all' &&
        !filters.regulixOnly &&
        !filters.appliedFrom &&
        !filters.appliedTo
          ? 'No applicants yet.'
          : 'No applicants match these filters.'}
      </p>
      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => {
            setFilters(DEFAULT_FILTERS)
            setPage(1)
          }}
          className={styles.clearBtn}
        >
          Clear filters
        </button>
      )}
    </div>
  ) : (
    <ApplicantList
      applicants={rows}
      selectedId={selectedId}
      onSelect={(id) => setSelectedId(id)}
      checkedIds={selectedIds}
      onToggleCheck={toggleCheck}
      totalCount={total}
    />
  )
}
```

Add a helper function inside the component (above `return`):

```tsx
function hasActiveFilters(f: ApplicantFilters): boolean {
  return Boolean(
    f.search ||
    f.stage !== 'all' ||
    f.jobId !== 'all' ||
    f.regulixOnly ||
    f.appliedFrom ||
    f.appliedTo
  )
}
```

- [ ] **Step 2: Append state styles to `ApplicantManagementPage.module.css`**

Append to `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`:

```css
/* ── Loading skeleton ───────────────────────────────────────────────────── */

.skeletonList {
  list-style: none;
  margin: 0;
  padding: 0;
}

.skeletonRow {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px var(--kt-space-4);
  border-bottom: 1px solid var(--kt-border);
}

.skeletonAvatar,
.skeletonText {
  background: linear-gradient(
    90deg,
    var(--kt-grey-100) 0%,
    var(--kt-grey-200) 50%,
    var(--kt-grey-100) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 4px;
}

.skeletonAvatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.skeletonText {
  height: 16px;
  width: 80%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 50%;
  }
  100% {
    background-position: -200% 50%;
  }
}

/* ── Empty / error ──────────────────────────────────────────────────────── */

.emptyState {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--kt-space-3);
}

.emptyText {
  font-size: 13px;
  color: var(--kt-text-muted);
  margin: 0;
}

.clearBtn {
  padding: 6px 14px;
  background: var(--kt-primary);
  color: var(--kt-primary-fg);
  border: none;
  border-radius: var(--kt-radius-md);
  font-size: 12px;
  font-weight: var(--kt-weight-medium);
  cursor: pointer;
}

.errorBanner {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--kt-space-3);
}

.errorText {
  font-size: 13px;
  color: var(--kt-danger);
  margin: 0;
}

.retryBtn {
  padding: 6px 14px;
  background: var(--kt-surface);
  color: var(--kt-text);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  font-size: 12px;
  font-weight: var(--kt-weight-medium);
  cursor: pointer;
}

.retryBtn:hover {
  background: var(--kt-secondary);
}

/* Remove stub styles now that real components landed */
.filterBarStub,
.bulkBarStub,
.loadingStub,
.errorStub,
.emptyStub,
.listStub,
.rowStub,
.rowStubSelected,
.detailStub {
  display: none;
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css
git commit -m "feat(applicants): loading skeleton, empty state, error banner with retry"
```

---

## Task 16: Responsive layout — push-in detail on medium, stacked on narrow

**Files:**

- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`

- [ ] **Step 1: Conditional rendering for push and stacked modes**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`, replace the main layout block with:

```tsx
<div className={[styles.mainLayout, styles[`layout_${layoutMode}`]].join(' ')}>
  {/* List pane — always visible except on stacked mode when a row is selected */}
  {(layoutMode !== 'stacked' || !selected) && (
    <div className={styles.listPane}>
      {/* ... existing loading/error/empty/list rendering ... */}
    </div>
  )}

  {/* Detail pane — desktop shows always; push/stacked show only when selected */}
  {layoutMode === 'split' ? (
    <div className={styles.detailPane}>
      {selected ? (
        <ApplicantDetail {...detailProps(selected)} />
      ) : (
        <div className={styles.detailPlaceholder}>Select an applicant to view details.</div>
      )}
    </div>
  ) : selected ? (
    <>
      {layoutMode === 'push' && (
        <div className={styles.scrim} onClick={() => setSelectedId(null)} aria-hidden />
      )}
      <div className={[styles.detailPane, styles[`detailPane_${layoutMode}`]].join(' ')}>
        <ApplicantDetail {...detailProps(selected)} />
      </div>
    </>
  ) : null}
</div>
```

Add a `detailProps` helper inside the component (above `return`):

```tsx
const detailProps = (a: RankedApplicant) => ({
  applicant: a,
  savedToTalentPool: savedIds.has(a.id),
  regulixLinked: false, // Task 17 wires
  onClose: () => setSelectedId(null),
  onShortlist: handleShortlist,
  onAdvance: handleAdvance,
  onReject: handleReject,
  onHire: () => setHireModalFor(a),
  onMessage: handleMessage,
  onSaveToTalentPool: handleSaveToPool,
  onStartRegulixOnboarding: () => setRegulixModalFor(a),
})
```

- [ ] **Step 2: Responsive CSS**

Append to `src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css`:

```css
/* ── Push mode (768-1279px) ──────────────────────────────────────────────── */

.layout_push {
  position: relative;
}

.detailPane_push {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(640px, 90vw);
  background: var(--kt-surface);
  border: 1px solid var(--kt-border);
  border-radius: 0;
  z-index: 30;
  overflow: hidden;
  box-shadow: var(--kt-shadow-lg);
  animation: slideIn 0.2s ease-out;
}

.scrim {
  position: fixed;
  inset: 0;
  background: var(--kt-surface-overlay);
  z-index: 20;
  animation: fadeIn 0.2s ease-out;
}

/* ── Stacked mode (< 768px) ──────────────────────────────────────────────── */

.detailPane_stacked {
  position: fixed;
  inset: 0;
  background: var(--kt-surface);
  z-index: 40;
  overflow: hidden;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx src/site/pages/ApplicantManagement/ApplicantManagementPage.module.css
git commit -m "feat(applicants): responsive layout — push-in detail + stacked mobile"
```

---

## Task 17: AuthContext — `company.regulixLinked` derived value

**Files:**

- Modify: `src/site/context/AuthContext.tsx`
- Modify: `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`

- [ ] **Step 1: Add `regulixLinked` to the `AuthState` type**

In `src/site/context/AuthContext.tsx`, find the `interface AuthState { ... }` block (starts around line 7). Add this property inside the interface, after `isLoading`:

```ts
/** True when the company has linked their Regulix account. V1 always false. */
regulixLinked: boolean
```

- [ ] **Step 2: Add `regulixLinked` to the default context value**

Find the `createContext<AuthState>({ ... })` block (around line 33). Add this property after `isLoading: true,`:

```ts
regulixLinked: false,
```

- [ ] **Step 3: Add `regulixLinked` to the provider value**

Find the `<AuthContext.Provider value={{ ... }}>` block (around line 157). Add this property after `isEmailVerified: !!user?.email_confirmed_at,`:

```ts
// V1 always false. Wire to company_profiles.regulix_linked when the
// account-linking flow ships.
regulixLinked: false,
```

- [ ] **Step 4: Use it in the page**

In `src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx`, update the `useAuth` destructuring:

```tsx
const { user, regulixLinked } = useAuth()
```

In `detailProps`, replace `regulixLinked: false` with:

```tsx
regulixLinked,
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/site/context/AuthContext.tsx src/site/pages/ApplicantManagement/ApplicantManagementPage.tsx
git commit -m "feat(auth): add company.regulixLinked derived value (v1 always false)"
```

---

## Task 18: Router wiring

**Files:**

- Modify: `src/site/Router.tsx`

- [ ] **Step 1: Swap the page component and add the per-job route**

Read `src/site/Router.tsx` and find the company-only route block. Replace:

```tsx
<Route path="/site/dashboard/applicants" element={<AllApplicantsPage />} />
```

with:

```tsx
<Route path="/site/dashboard/applicants" element={<ApplicantManagementPage />} />
<Route path="/site/dashboard/applicants/:jobId" element={<ApplicantManagementPage />} />
```

Also update the imports at the top — replace `AllApplicantsPage` with `ApplicantManagementPage` in the import list.

- [ ] **Step 2: Smoke test**

Run: `npm run dev`

Navigate to `http://localhost:5173/site/dashboard/applicants` (log in as a company user first). Confirm:

- Page renders with filter bar, list, detail panel.
- Selecting a row shows detail.
- Filters, keyboard nav, hire modal, and Regulix onboarding button all behave per spec.
- `/site/dashboard/applicants/:jobId` works when you pass a valid jobId.

Kill the dev server once verified.

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/site/Router.tsx
git commit -m "feat(applicants): route /dashboard/applicants and /:jobId to new page"
```

---

## Task 19: Delete old `AllApplicantsPage` + `ApplicantSlideover`

**Files:**

- Delete: `src/site/pages/AllApplicantsPage.tsx`
- Delete: `src/site/pages/AllApplicantsPage.module.css`
- Delete: `src/site/components/ApplicantSlideover/ApplicantSlideover.tsx`
- Delete: `src/site/components/ApplicantSlideover/ApplicantSlideover.module.css` (if present)
- Modify: `src/site/pages/index.ts`
- Modify: `src/site/services/applicantService.ts` (remove the `getAllApplicants` alias)

- [ ] **Step 1: Delete the files**

Run from the repo root:

```bash
rm -f src/site/pages/AllApplicantsPage.tsx src/site/pages/AllApplicantsPage.module.css
rm -rf src/site/components/ApplicantSlideover/
```

- [ ] **Step 2: Remove the export from `pages/index.ts`**

Edit `src/site/pages/index.ts`. Remove the line:

```ts
export { AllApplicantsPage } from './AllApplicantsPage'
```

- [ ] **Step 3: Remove the compat alias**

Edit `src/site/services/applicantService.ts`. Remove these lines at the bottom:

```ts
// TEMPORARY COMPAT: the old AllApplicantsPage still imports getAllApplicants.
// This alias will be removed in Task 19 when that page is deleted.
export const getAllApplicants = getRankedApplicants
```

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck`
Expected: exits 0.

Run: `npm run lint`
Expected: 0 new errors. Pre-existing warnings are fine.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(applicants): remove old AllApplicantsPage + ApplicantSlideover

Replaced by ApplicantManagementPage (split list-detail, keyboard-first,
responsive). Also drops the temporary getAllApplicants compat alias."
```

---

## Task 20: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exits 0 with no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0. Pre-existing warnings in files not touched by this work (JobDetailPage.tsx, WorkerProfileEditPage.tsx) are acceptable. New warnings from files in this plan should be addressed.

- [ ] **Step 3: Full test suite**

Run: `npm test -- --run`
Expected: all tests pass. Test count should be at least 30+ (18 from regulixService + 11 from rankComposition + ~10 from applicantService).

- [ ] **Step 4: Dev smoke test**

Run: `npm run dev`. Open `/site/dashboard/applicants` and:

- Confirm ranked list renders with rank numbers.
- Click a row — detail panel shows name, rank breakdown, Regulix sections.
- Filter by stage — list updates, URL updates.
- Press `j` / `k` — selection moves.
- Press `?` — help overlay appears. Press `Esc` — closes.
- Click Hire on an applicant — modal opens with today's date, confirms successfully.
- Start Regulix onboarding button is hidden (regulixLinked=false).
- Resize browser to < 1280px — detail pane becomes overlay.
- Resize to < 768px — list-only; tap row → fullscreen detail with back.

Kill the dev server once verified.

- [ ] **Step 5: Commit nothing (verification only)**

If everything passes, no commit needed. The plan is complete.

If something fails, create a fix-up commit with the minimum change needed to resolve the issue, using message `fix(applicants): <what was fixed>`.

---

## Summary

After this plan is executed the repo will have:

- A brand-new applicant management surface at `/site/dashboard/applicants` (and per-job at `/:jobId`), replacing the old table-based page.
- Split list-detail layout with keyboard-first navigation, responsive down to mobile via push-in and stacked layouts.
- Ranked list with rank score composed from four signals (match, Regulix Ready, endorsements, recency).
- Decoupled hire (pipeline-only) vs. Regulix onboarding (separate conditional action) — supporting companies that don't use Regulix.
- Unit-test coverage for rank composition and service-layer mutations.
- Old code deleted: `AllApplicantsPage.tsx`, `ApplicantSlideover/`.

Next spec in the dashboard sprint (per parent spec §6.4): **Talent pool** implementation.
