# Regulix Service Stubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `src/site/services/regulixService.ts` — a mock-backed service layer that exposes every Regulix read/write interface defined in the company dashboard design spec §3.7, so downstream features (ranking score, talent pool, applicant redesign) can consume it without waiting for the real Regulix API.

**Architecture:** Pure TypeScript service file that imports from in-repo mock data only — no Supabase, no network calls. All functions are `async`, return `{ data, error }` to match the project service convention, and resolve instantly from in-memory fixtures. This mirrors the real API's shape exactly so swapping mocks for a real HTTP client later is a contained change inside the service file.

**Tech Stack:** TypeScript 5 strict mode, Vitest (unit tests), existing mock fixtures in `src/site/data/mock.ts`, types in `src/site/types/index.ts`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-04-20-company-dashboard-design.md](../specs/2026-04-20-company-dashboard-design.md) §3.7, §6.4 step 1.

---

## File Structure

| File                                                 | Action | Responsibility                                                                                                                                                             |
| ---------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/site/types/index.ts`                            | Modify | Add Regulix-specific types: `RegulixStatus`, `RegulixEndorsement`, `VerifiedWorkHistoryEntry`, `PastHire`, `HireHandoffParams`, `HireHandoffResult`, `RegulixInviteParams` |
| `src/site/data/mock.ts`                              | Modify | Add fixtures: `regulixStatuses`, `regulixEndorsements`, `regulixWorkHistory`, `regulixPastHires`, `regulixAccountMap`                                                      |
| `src/site/services/regulixService.ts`                | Create | All 8 Regulix interface functions; mock-backed v1 implementations                                                                                                          |
| `src/test/setup.ts`                                  | Create | Vitest setup file (referenced by `vite.config.ts` but missing)                                                                                                             |
| `src/site/services/__tests__/regulixService.test.ts` | Create | Unit tests for every service function                                                                                                                                      |

**Boundaries:**

- `regulixService.ts` is the ONLY place that reads Regulix mock fixtures. No other file imports `regulixStatuses` or siblings directly.
- The service file exports named functions + typed parameter interfaces. No default export.
- Tests live alongside the service in a `__tests__` folder (Vitest convention, no config needed).

---

## Task 1: Add Regulix types to shared types file

**Files:**

- Modify: `src/site/types/index.ts` (append at end, before final newline)

- [ ] **Step 1: Read the bottom of the types file to find the insertion point**

Run: read the last 10 lines of `src/site/types/index.ts` to confirm where to append.

- [ ] **Step 2: Append the Regulix type block**

Append this block to the end of `src/site/types/index.ts`:

```ts
// ============================================================
// REGULIX INTEGRATION TYPES
// Mirror the v1 regulixService interface (see docs/superpowers/specs
// 2026-04-20-company-dashboard-design.md §3.7). Shapes are frozen now
// so mock and real implementations stay swap-compatible.
// ============================================================

export type RegulixStatus = {
  ready: boolean
  onboarded: boolean
  immediateHire: boolean
}

export type RegulixEndorsement = {
  id: string
  workerId: string
  fromCompanyId: string
  fromCompanyName: string
  role: string
  rating: number // 1-5
  quote: string
  date: string // ISO
}

export type VerifiedWorkHistoryEntry = {
  id: string
  workerId: string
  companyName: string // may be anonymized as "Construction Co." if Regulix policy hides it
  role: string
  startDate: string // ISO
  endDate: string | null // null if current
  verified: true
}

export type PastHire = {
  workerId: string
  companyId: string
  lastHiredAt: string // ISO
  jobTitle: string
  rehireable: boolean
}

export type HireHandoffParams = {
  companyId: string
  workerId: string
  jobId: string
  hireDate: string // ISO
  payRate: number
}

export type HireHandoffResult = {
  regulixHireId: string
}

export type RegulixInviteParams = {
  companyId: string
  workerId: string
  jobId: string
}
```

- [ ] **Step 3: Run typecheck to confirm no breakage**

Run: `npm run typecheck`
Expected: exits 0 with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/site/types/index.ts
git commit -m "feat(types): add Regulix integration types"
```

---

## Task 2: Bootstrap the Vitest test harness

The project has `test/setup.ts` referenced in `vite.config.ts` but the file doesn't exist, so `npm test` fails before any test runs. This task creates the minimal setup file so subsequent tasks can run tests.

**Files:**

- Create: `src/test/setup.ts`

- [ ] **Step 1: Create the setup file**

Create `src/test/setup.ts` with this content:

```ts
// Vitest global setup.
// Add testing-library cleanup, jest-dom matchers, or MSW handlers here as the
// test suite grows. Kept minimal for now — Regulix service tests are pure.
```

- [ ] **Step 2: Verify vitest runs cleanly on an empty suite**

Run: `npm test -- --run`
Expected: exits 0, output contains "No test files found" (not an error — just confirms the runner works).

- [ ] **Step 3: Commit**

```bash
git add src/test/setup.ts
git commit -m "test: add vitest setup file referenced by vite.config"
```

---

## Task 3: Add Regulix mock fixtures

**Files:**

- Modify: `src/site/data/mock.ts` (append near the bottom, after `companyApplicants`)

- [ ] **Step 1: Extend the type import block at top of mock.ts**

In `src/site/data/mock.ts`, find the `export type { ... } from '../types'` block (lines 5–31) and add these entries at the end of the list (before the closing `}`):

```ts
  RegulixStatus,
  RegulixEndorsement,
  VerifiedWorkHistoryEntry,
  PastHire,
```

Then find the `import type { ... } from '../types'` block (lines 33–54) and add the same four entries before the closing `}`:

```ts
  RegulixStatus,
  RegulixEndorsement,
  VerifiedWorkHistoryEntry,
  PastHire,
```

- [ ] **Step 2: Append the Regulix fixtures block to the end of mock.ts**

Append this block to the end of `src/site/data/mock.ts`:

```ts
// ============================================================
// REGULIX FIXTURES (v1 mock data for regulixService)
// Replace with real Regulix API reads when available.
// ============================================================

// Worker-id → Regulix status. Missing keys mean the worker is NOT on Regulix.
export const regulixStatuses: Record<string, RegulixStatus> = {
  w1: { ready: true, onboarded: true, immediateHire: true },
  w2: { ready: true, onboarded: true, immediateHire: false },
  w3: { ready: true, onboarded: false, immediateHire: true },
  w4: { ready: false, onboarded: false, immediateHire: false },
  w5: { ready: true, onboarded: false, immediateHire: false },
}

// Workers whose id appears as a key in regulixStatuses have a Regulix account.
// Separate lookup because the check is used frequently in the invite flow.
export const regulixAccountMap: Record<string, boolean> = {
  w1: true,
  w2: true,
  w3: true,
  w4: false, // on krewtree but not Regulix yet
  w5: true,
  w6: false,
  w7: false,
}

export const regulixEndorsements: RegulixEndorsement[] = [
  {
    id: 'end-1',
    workerId: 'w1',
    fromCompanyId: 'c2',
    fromCompanyName: 'Desert Sun Construction',
    role: 'Lead Carpenter',
    rating: 5,
    quote: 'Shows up early, leads the crew well, zero safety incidents.',
    date: '2025-11-20',
  },
  {
    id: 'end-2',
    workerId: 'w1',
    fromCompanyId: 'c3',
    fromCompanyName: 'Pinnacle Builds',
    role: 'Framing Carpenter',
    rating: 5,
    quote: 'Excellent blueprint reading. Would rehire.',
    date: '2024-02-10',
  },
  {
    id: 'end-3',
    workerId: 'w2',
    fromCompanyId: 'c4',
    fromCompanyName: 'SunState Health',
    role: 'CNA',
    rating: 5,
    quote: 'Patients ask for her by name. Dependable and kind.',
    date: '2025-08-05',
  },
  {
    id: 'end-4',
    workerId: 'w3',
    fromCompanyId: 'c5',
    fromCompanyName: 'Swift Transport',
    role: 'Regional Driver',
    rating: 4,
    quote: 'Clean DOT record, on-time deliveries.',
    date: '2025-09-14',
  },
]

export const regulixWorkHistory: VerifiedWorkHistoryEntry[] = [
  {
    id: 'wh-1',
    workerId: 'w1',
    companyName: 'Desert Sun Construction',
    role: 'Lead Carpenter',
    startDate: '2021-03-01',
    endDate: null,
    verified: true,
  },
  {
    id: 'wh-2',
    workerId: 'w1',
    companyName: 'Pinnacle Builds',
    role: 'Framing Carpenter',
    startDate: '2018-06-01',
    endDate: '2021-02-28',
    verified: true,
  },
  {
    id: 'wh-3',
    workerId: 'w2',
    companyName: 'SunState Health',
    role: 'CNA',
    startDate: '2020-01-01',
    endDate: null,
    verified: true,
  },
  {
    id: 'wh-4',
    workerId: 'w3',
    companyName: 'Swift Transport',
    role: 'Regional Driver',
    startDate: '2022-01-01',
    endDate: null,
    verified: true,
  },
]

export const regulixPastHires: PastHire[] = [
  {
    workerId: 'w1',
    companyId: 'c1',
    lastHiredAt: '2026-01-15',
    jobTitle: 'Framing Carpenter',
    rehireable: true,
  },
  {
    workerId: 'w3',
    companyId: 'c1',
    lastHiredAt: '2025-11-02',
    jobTitle: 'CDL-A Driver',
    rehireable: true,
  },
  {
    workerId: 'w5',
    companyId: 'c1',
    lastHiredAt: '2025-09-10',
    jobTitle: 'Landscape Crew Leader',
    rehireable: false,
  },
]
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/site/data/mock.ts
git commit -m "feat(mock): add Regulix fixtures for service stubs"
```

---

## Task 4: Create the service file shell + `getRegulixStatus`

**Files:**

- Create: `src/site/services/regulixService.ts`
- Create: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/site/services/__tests__/regulixService.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { getRegulixStatus } from '../regulixService'

describe('getRegulixStatus', () => {
  it('returns the status for a worker with a Regulix account', async () => {
    const { data, error } = await getRegulixStatus('w1')
    expect(error).toBeNull()
    expect(data).toEqual({ ready: true, onboarded: true, immediateHire: true })
  })

  it('returns null data for an unknown worker', async () => {
    const { data, error } = await getRegulixStatus('does-not-exist')
    expect(error).toBeNull()
    expect(data).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL with "Cannot find module '../regulixService'" or similar.

- [ ] **Step 3: Create the service file with `getRegulixStatus`**

Create `src/site/services/regulixService.ts` with:

```ts
// ============================================================
// KREWTREE — Regulix Service (v1: mock-backed stubs)
//
// All Regulix reads/writes from the company dashboard go through this file.
// The real Regulix HTTP API does not exist yet — v1 resolves against in-repo
// fixtures so downstream features (rank score, talent pool, applicant
// redesign) can ship. Swap the function bodies for HTTP calls when the API
// lands; the callers do not change.
//
// Never import PII, timesheets, hours, or payroll data here — those are
// outside krewtree's scope (see spec §1.2).
// ============================================================

import type {
  RegulixStatus,
  RegulixEndorsement,
  VerifiedWorkHistoryEntry,
  PastHire,
  HireHandoffParams,
  HireHandoffResult,
  RegulixInviteParams,
} from '@site/types'
import {
  regulixStatuses,
  regulixAccountMap,
  regulixEndorsements,
  regulixWorkHistory,
  regulixPastHires,
} from '@site/data/mock'

// ── Reads ──────────────────────────────────────────────────────────────────

export async function getRegulixStatus(
  workerId: string
): Promise<{ data: RegulixStatus | null; error: string | null }> {
  const status = regulixStatuses[workerId] ?? null
  return { data: status, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add getRegulixStatus stub + tests"
```

---

## Task 5: `getEndorsements`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Two edits to `src/site/services/__tests__/regulixService.test.ts`:

**Edit A.** Change the top import line from:

```ts
import { getRegulixStatus } from '../regulixService'
```

to:

```ts
import { getRegulixStatus, getEndorsements } from '../regulixService'
```

**Edit B.** Append this describe block to the end of the file:

```ts
describe('getEndorsements', () => {
  it('returns endorsements for a worker who has them', async () => {
    const { data, error } = await getEndorsements('w1')
    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({
      workerId: 'w1',
      fromCompanyName: expect.any(String),
      rating: expect.any(Number),
    })
  })

  it('returns an empty array for a worker with no endorsements', async () => {
    const { data, error } = await getEndorsements('w99')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
```

This two-edit pattern (merge into top import + append describe block) repeats in every subsequent task.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `getEndorsements` tests with "getEndorsements is not a function" or import error.

- [ ] **Step 3: Add the function to the service**

Append to `src/site/services/regulixService.ts` (after `getRegulixStatus`):

```ts
export async function getEndorsements(
  workerId: string
): Promise<{ data: RegulixEndorsement[]; error: string | null }> {
  const data = regulixEndorsements.filter((e) => e.workerId === workerId)
  return { data, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add getEndorsements stub + tests"
```

---

## Task 6: `getVerifiedWorkHistory`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Merge `getVerifiedWorkHistory` into the existing import at the top of the test file, then append this describe block:

```ts
describe('getVerifiedWorkHistory', () => {
  it('returns verified entries for a worker, newest first', async () => {
    const { data, error } = await getVerifiedWorkHistory('w1')
    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data.every((e) => e.verified === true)).toBe(true)
    // Newest first: the entry with endDate=null (current) should come first
    expect(data[0].endDate).toBeNull()
  })

  it('returns empty for a worker with no verified history', async () => {
    const { data, error } = await getVerifiedWorkHistory('w99')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `getVerifiedWorkHistory` tests.

- [ ] **Step 3: Add the function**

Append to `src/site/services/regulixService.ts`:

```ts
export async function getVerifiedWorkHistory(
  workerId: string
): Promise<{ data: VerifiedWorkHistoryEntry[]; error: string | null }> {
  const entries = regulixWorkHistory
    .filter((e) => e.workerId === workerId)
    .slice()
    .sort((a, b) => {
      // null endDate (current job) sorts first; otherwise newest endDate first
      if (a.endDate === null && b.endDate !== null) return -1
      if (b.endDate === null && a.endDate !== null) return 1
      if (a.endDate === null && b.endDate === null) return 0
      return (b.endDate as string).localeCompare(a.endDate as string)
    })
  return { data: entries, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add getVerifiedWorkHistory stub + tests"
```

---

## Task 7: `getPastHires`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Merge `getPastHires` into the top import, then append:

```ts
describe('getPastHires', () => {
  it('returns past hires for a company', async () => {
    const { data, error } = await getPastHires('c1')
    expect(error).toBeNull()
    expect(data.length).toBeGreaterThan(0)
    expect(data.every((p) => p.companyId === 'c1')).toBe(true)
  })

  it('returns empty for a company with no past hires', async () => {
    const { data, error } = await getPastHires('c-unknown')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `getPastHires` tests.

- [ ] **Step 3: Add the function**

Append to `src/site/services/regulixService.ts`:

```ts
export async function getPastHires(
  companyId: string
): Promise<{ data: PastHire[]; error: string | null }> {
  const data = regulixPastHires.filter((p) => p.companyId === companyId)
  return { data, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add getPastHires stub + tests"
```

---

## Task 8: `hasRegulixAccount`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Merge `hasRegulixAccount` into the top import, then append:

```ts
describe('hasRegulixAccount', () => {
  it('returns true for a worker on Regulix', async () => {
    const { data, error } = await hasRegulixAccount('w1')
    expect(error).toBeNull()
    expect(data).toBe(true)
  })

  it('returns false for a krewtree-only worker', async () => {
    const { data, error } = await hasRegulixAccount('w4')
    expect(error).toBeNull()
    expect(data).toBe(false)
  })

  it('returns false for an unknown worker', async () => {
    const { data, error } = await hasRegulixAccount('w99')
    expect(error).toBeNull()
    expect(data).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `hasRegulixAccount` tests.

- [ ] **Step 3: Add the function**

Append to `src/site/services/regulixService.ts`:

```ts
export async function hasRegulixAccount(
  workerId: string
): Promise<{ data: boolean; error: string | null }> {
  return { data: regulixAccountMap[workerId] === true, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add hasRegulixAccount stub + tests"
```

---

## Task 9: `submitHireHandoff`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Merge `submitHireHandoff` into the top import, then append:

```ts
describe('submitHireHandoff', () => {
  it('returns a generated regulixHireId on success', async () => {
    const { data, error } = await submitHireHandoff({
      companyId: 'c1',
      workerId: 'w1',
      jobId: 'j1',
      hireDate: '2026-04-21',
      payRate: 32,
    })
    expect(error).toBeNull()
    expect(data?.regulixHireId).toMatch(/^mock-hire-/)
  })

  it('generates a unique id per call', async () => {
    const params = {
      companyId: 'c1',
      workerId: 'w1',
      jobId: 'j1',
      hireDate: '2026-04-21',
      payRate: 32,
    }
    const a = await submitHireHandoff(params)
    const b = await submitHireHandoff(params)
    expect(a.data?.regulixHireId).not.toBe(b.data?.regulixHireId)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `submitHireHandoff` tests.

- [ ] **Step 3: Add the write section and function**

Append to `src/site/services/regulixService.ts`:

```ts
// ── Writes ─────────────────────────────────────────────────────────────────

export async function submitHireHandoff(
  params: HireHandoffParams
): Promise<{ data: HireHandoffResult | null; error: string | null }> {
  // v1 just returns a synthetic id. v2 will POST to Regulix and return the
  // real hire id from the response.
  const regulixHireId = `mock-hire-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  void params // keep param reference so linters don't flag it; real impl will use it
  return { data: { regulixHireId }, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add submitHireHandoff stub + tests"
```

---

## Task 10: `linkCompanyAccount`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Merge `linkCompanyAccount` into the top import, then append:

```ts
describe('linkCompanyAccount', () => {
  it('returns success for valid company ids', async () => {
    const { error } = await linkCompanyAccount('c1', 'regulix-company-123')
    expect(error).toBeNull()
  })

  it('returns an error when companyId is empty', async () => {
    const { error } = await linkCompanyAccount('', 'regulix-company-123')
    expect(error).toBe('companyId is required')
  })

  it('returns an error when regulixCompanyId is empty', async () => {
    const { error } = await linkCompanyAccount('c1', '')
    expect(error).toBe('regulixCompanyId is required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `linkCompanyAccount` tests.

- [ ] **Step 3: Add the function**

Append to `src/site/services/regulixService.ts`:

```ts
export async function linkCompanyAccount(
  companyId: string,
  regulixCompanyId: string
): Promise<{ error: string | null }> {
  if (!companyId) return { error: 'companyId is required' }
  if (!regulixCompanyId) return { error: 'regulixCompanyId is required' }
  // v1 no-op. v2 will persist the link in Supabase and notify Regulix.
  return { error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add linkCompanyAccount stub + tests"
```

---

## Task 11: `inviteWorker`

**Files:**

- Modify: `src/site/services/regulixService.ts`
- Modify: `src/site/services/__tests__/regulixService.test.ts`

- [ ] **Step 1: Append failing test**

Merge `inviteWorker` into the top import, then append:

```ts
describe('inviteWorker', () => {
  it('returns success when the worker has a Regulix account', async () => {
    const { error } = await inviteWorker({
      companyId: 'c1',
      workerId: 'w1',
      jobId: 'j1',
    })
    expect(error).toBeNull()
  })

  it('returns an error when the worker is not on Regulix', async () => {
    // Callers should route krewtree-only workers through a different channel;
    // this Regulix-side function refuses them explicitly.
    const { error } = await inviteWorker({
      companyId: 'c1',
      workerId: 'w4', // in regulixAccountMap as false
      jobId: 'j1',
    })
    expect(error).toBe('worker has no Regulix account')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: FAIL on `inviteWorker` tests.

- [ ] **Step 3: Add the function**

Append to `src/site/services/regulixService.ts`:

```ts
export async function inviteWorker(params: RegulixInviteParams): Promise<{ error: string | null }> {
  // This is the Regulix-side channel of the dual-channel invite flow
  // described in spec §3.5. The caller must check hasRegulixAccount first
  // and fall back to the krewtree email channel for non-Regulix workers.
  // Regulix-side function refuses non-Regulix workers explicitly.
  if (regulixAccountMap[params.workerId] !== true) {
    return { error: 'worker has no Regulix account' }
  }
  return { error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/site/services/__tests__/regulixService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/regulixService.ts src/site/services/__tests__/regulixService.test.ts
git commit -m "feat(regulix): add inviteWorker stub + tests"
```

---

## Task 12: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0 with no errors.

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: exits 0 with no errors. If ESLint flags the `void params` line in `submitHireHandoff` or the unused `regulixAccountMap` import (it's used in `hasRegulixAccount` and `inviteWorker`), address case-by-case — do NOT disable rules globally.

- [ ] **Step 3: Run the full test suite**

Run: `npm test -- --run`
Expected: all regulixService tests pass. Test count should be 18+ (2 getRegulixStatus + 2 getEndorsements + 2 getVerifiedWorkHistory + 2 getPastHires + 3 hasRegulixAccount + 2 submitHireHandoff + 3 linkCompanyAccount + 2 inviteWorker).

- [ ] **Step 4: Verify the service file exports match the spec**

Run this one-liner to list exported names:

```bash
grep -E '^export (async )?function' src/site/services/regulixService.ts
```

Expected output (8 lines):

```
export async function getRegulixStatus(
export async function getEndorsements(
export async function getVerifiedWorkHistory(
export async function getPastHires(
export async function hasRegulixAccount(
export async function submitHireHandoff(
export async function linkCompanyAccount(
export async function inviteWorker(
```

If any function is missing, go back to the task that was skipped and complete it.

- [ ] **Step 5: No commit needed if verification passes**

If steps 1–4 all pass, the plan is complete and no commit is needed. If any step failed, create a fix-up commit with the minimum change needed to make it pass, using message `fix(regulix): <what you fixed>`.

---

## Summary

After this plan is executed, the repo will have:

- Types for all Regulix integration shapes (§3.7 of the spec) in `src/site/types/index.ts`.
- Mock fixtures that resemble real Regulix data in `src/site/data/mock.ts`.
- A single service file `src/site/services/regulixService.ts` exposing 8 functions that downstream features can consume today against mocks and tomorrow against the real API with zero call-site changes.
- Unit-test coverage for every function, with Vitest bootstrapped for the rest of the project.

Each subsequent plan in §6.4 (ranking score, applicant redesign, talent pool, etc.) imports from this service without touching mock fixtures directly.
