# Pipeline Kanban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a drag-and-drop pipeline kanban board to the company dashboard, letting employers move applicants between stages (new → reviewed → interview → offer) by dragging cards.

**Architecture:** New `PipelineKanban` component tree rendered inside `CompanyDashboard.tsx` below the stat cards. Uses `@dnd-kit/core` for DnD. Loads data via a new `getKanbanApplicants(companyId)` service function; mutates via the existing `setApplicantStage()`. Optimistic local state with revert-on-error.

**Tech Stack:** React 18 + TypeScript (strict), `@dnd-kit/core`, CSS Modules + `--kt-*` tokens, Supabase, Vitest.

**Spec:** [docs/superpowers/specs/2026-04-24-pipeline-kanban-design.md](../specs/2026-04-24-pipeline-kanban-design.md)

---

## File Structure

**Create:**

- `src/site/components/PipelineKanban/PipelineKanban.tsx` — board; owns data + DnD context + drop handler
- `src/site/components/PipelineKanban/KanbanColumn.tsx` — droppable column (header + list)
- `src/site/components/PipelineKanban/KanbanCard.tsx` — draggable applicant card
- `src/site/components/PipelineKanban/PipelineKanban.module.css` — all board styles
- `src/site/components/PipelineKanban/index.ts` — re-export `PipelineKanban`
- `src/site/services/__tests__/applicantService.kanban.test.ts` — test for the new service function
- `src/site/components/PipelineKanban/__tests__/PipelineKanban.test.tsx` — component test for optimistic update + revert

**Modify:**

- `package.json` — add `@dnd-kit/core`
- `src/site/services/applicantService.ts` — add `getKanbanApplicants(companyId)`
- `src/site/pages/CompanyDashboard.tsx` — render `<PipelineKanban companyId={user.id} />` below the stats grid

---

## Task 1: Install @dnd-kit/core

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run from repo root:

```bash
npm install @dnd-kit/core
```

- [ ] **Step 2: Verify install**

Run:

```bash
npm ls @dnd-kit/core
```

Expected: prints a version (e.g. `@dnd-kit/core@6.x.x`) with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit/core for pipeline kanban"
```

---

## Task 2: Add `getKanbanApplicants` service function (test first)

**Files:**

- Test: `src/site/services/__tests__/applicantService.kanban.test.ts`
- Modify: `src/site/services/applicantService.ts`

- [ ] **Step 1: Write the failing test**

Create `src/site/services/__tests__/applicantService.kanban.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase client before importing the service under test.
const orderMock = vi.fn()
const inMock = vi.fn(() => ({ order: orderMock }))
const eqMock = vi.fn(() => ({ in: inMock }))
const selectMock = vi.fn(() => ({ eq: eqMock }))
const fromMock = vi.fn(() => ({ select: selectMock }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

import { getKanbanApplicants } from '../applicantService'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getKanbanApplicants', () => {
  it('queries active stages only and returns mapped applicants', async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        {
          id: 'app-1',
          kanban_stage: 'new',
          match_score: 80,
          is_shortlisted: false,
          interview_answers: [],
          created_at: '2026-04-20T00:00:00Z',
          worker_profiles: {
            id: 'w-1',
            first_name: 'Jane',
            last_name: 'Doe',
            avatar_url: null,
            primary_trade: 'Electrician',
            city: 'Austin',
            region: 'TX',
            is_regulix_ready: false,
          },
          jobs: { id: 'j-1', title: 'Senior Electrician', status: 'active' },
          application_notes: [],
        },
      ],
      error: null,
    })

    const result = await getKanbanApplicants('company-1')

    expect(fromMock).toHaveBeenCalledWith('applications')
    expect(eqMock).toHaveBeenCalledWith('jobs.company_id', 'company-1')
    expect(inMock).toHaveBeenCalledWith('kanban_stage', ['new', 'reviewed', 'interview', 'offer'])
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      id: 'app-1',
      workerFullName: 'Jane Doe',
      workerInitials: 'JD',
      jobTitle: 'Senior Electrician',
      stage: 'new',
    })
  })

  it('returns error message when supabase returns an error', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: { message: 'rls denied' } })
    const result = await getKanbanApplicants('company-1')
    expect(result.data).toEqual([])
    expect(result.error).toBe('rls denied')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/site/services/__tests__/applicantService.kanban.test.ts
```

Expected: FAIL — `getKanbanApplicants is not a function` (or import error).

- [ ] **Step 3: Add the service function**

In `src/site/services/applicantService.ts`, add this function below `getRecentApplicants` (around line 160):

```ts
/**
 * Pipeline kanban board: all applicants in active stages across all jobs
 * for the company. Flat list — caller groups by `stage` client-side.
 * Newest-applied first.
 */
export async function getKanbanApplicants(
  companyId: string
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select(APPLICANT_SELECT)
    .eq('jobs.company_id', companyId)
    .in('kanban_stage', ACTIVE_STAGES)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row) => toCompanyApplicant(row as unknown as JoinedApplicantRow)),
    error: null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/site/services/__tests__/applicantService.kanban.test.ts
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/applicantService.ts src/site/services/__tests__/applicantService.kanban.test.ts
git commit -m "feat(applicants): add getKanbanApplicants service function"
```

---

## Task 3: Kanban CSS module

**Files:**

- Create: `src/site/components/PipelineKanban/PipelineKanban.module.css`

- [ ] **Step 1: Write the stylesheet**

Create `src/site/components/PipelineKanban/PipelineKanban.module.css`:

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--kt-space-3);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--kt-text-muted);
}

.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--kt-space-3);
  align-items: start;
}

.column {
  background: var(--kt-surface-raised);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-md);
  padding: var(--kt-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--kt-space-2);
  min-height: 120px;
  transition: background 120ms ease;
}

.columnOver {
  background: var(--kt-bg-subtle);
  border-color: var(--kt-border-strong);
}

.columnHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.columnLabel {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.count {
  background: var(--kt-surface);
  border-radius: var(--kt-radius-full);
  padding: 1px 8px;
  font-size: 10px;
  font-weight: 600;
}

.cardList {
  display: flex;
  flex-direction: column;
  gap: var(--kt-space-2);
}

.card {
  background: var(--kt-surface);
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius-sm);
  padding: var(--kt-space-3);
  display: flex;
  align-items: center;
  gap: var(--kt-space-2);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.card:active {
  cursor: grabbing;
}

.cardDragging {
  opacity: 0.4;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--kt-radius-full);
  background: var(--kt-bg-subtle);
  color: var(--kt-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.cardBody {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cardName {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cardJob {
  font-size: 11px;
  color: var(--kt-text-muted);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  border: 1.5px dashed var(--kt-border);
  border-radius: var(--kt-radius-sm);
  padding: var(--kt-space-4);
  text-align: center;
  font-size: 11px;
  color: var(--kt-text-muted);
}

.skeleton {
  height: 140px;
  background: var(--kt-surface-raised);
  border-radius: var(--kt-radius-md);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/site/components/PipelineKanban/PipelineKanban.module.css
git commit -m "feat(kanban): add pipeline kanban stylesheet"
```

---

## Task 4: KanbanCard component

**Files:**

- Create: `src/site/components/PipelineKanban/KanbanCard.tsx`

- [ ] **Step 1: Write the component**

Create `src/site/components/PipelineKanban/KanbanCard.tsx`:

```tsx
import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { CompanyApplicant } from '../../types'
import styles from './PipelineKanban.module.css'

type Props = {
  applicant: CompanyApplicant
}

export const KanbanCard: React.FC<Props> = ({ applicant }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: applicant.id,
  })

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  const className = isDragging ? `${styles.card} ${styles.cardDragging}` : styles.card

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...listeners}
      {...attributes}
      aria-label={`${applicant.workerFullName}, ${applicant.jobTitle}`}
    >
      <div className={styles.avatar} aria-hidden="true">
        {applicant.workerInitials}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{applicant.workerFullName}</div>
        <div className={styles.cardJob}>{applicant.jobTitle}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors related to `KanbanCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/site/components/PipelineKanban/KanbanCard.tsx
git commit -m "feat(kanban): add KanbanCard draggable component"
```

---

## Task 5: KanbanColumn component

**Files:**

- Create: `src/site/components/PipelineKanban/KanbanColumn.tsx`

- [ ] **Step 1: Write the component**

Create `src/site/components/PipelineKanban/KanbanColumn.tsx`:

```tsx
import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { KanbanCard } from './KanbanCard'
import styles from './PipelineKanban.module.css'

type Props = {
  stage: KanbanStage
  label: string
  applicants: CompanyApplicant[]
}

export const KanbanColumn: React.FC<Props> = ({ stage, label, applicants }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const className = isOver ? `${styles.column} ${styles.columnOver}` : styles.column

  return (
    <div ref={setNodeRef} className={className} data-stage={stage}>
      <div className={styles.columnHeader}>
        <span className={styles.columnLabel}>{label}</span>
        <span className={styles.count}>{applicants.length}</span>
      </div>
      <div className={styles.cardList}>
        {applicants.map((a) => (
          <KanbanCard key={a.id} applicant={a} />
        ))}
        {applicants.length === 0 && <div className={styles.empty}>Drop here</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors related to `KanbanColumn.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/site/components/PipelineKanban/KanbanColumn.tsx
git commit -m "feat(kanban): add KanbanColumn droppable component"
```

---

## Task 6: PipelineKanban component (test first)

**Files:**

- Test: `src/site/components/PipelineKanban/__tests__/PipelineKanban.test.tsx`
- Create: `src/site/components/PipelineKanban/PipelineKanban.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/site/components/PipelineKanban/__tests__/PipelineKanban.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import type { CompanyApplicant } from '../../../types'

const getKanbanApplicantsMock = vi.fn()
const setApplicantStageMock = vi.fn()

vi.mock('../../../services/applicantService', () => ({
  getKanbanApplicants: (...a: unknown[]) => getKanbanApplicantsMock(...a),
  setApplicantStage: (...a: unknown[]) => setApplicantStageMock(...a),
}))

import { PipelineKanban } from '../PipelineKanban'

function makeApplicant(id: string, stage: CompanyApplicant['stage']): CompanyApplicant {
  return {
    id,
    workerId: `w-${id}`,
    workerFirstName: 'Jane',
    workerLastInitial: 'D',
    workerFullName: `Jane ${id}`,
    workerAvatar: '',
    workerInitials: 'JD',
    workerPrimaryTrade: 'Electrician',
    workerLocation: 'Austin, TX',
    workerAvailability: 'available',
    workerTopSkills: [],
    workerCertifications: [],
    workerJobHistory: [],
    workerRating: null,
    workerRatingCount: 0,
    workerRegulixRating: null,
    workerRegulixRatingCount: 0,
    jobId: 'j-1',
    jobTitle: 'Senior Electrician',
    jobStatus: 'active',
    stage,
    matchScore: 80,
    matchBreakdown: { skills: 80, location: 80, availability: 0 },
    isRegulixReady: false,
    isShortlisted: false,
    appliedAt: '2026-04-20T00:00:00Z',
    notes: [],
    preInterviewAnswers: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PipelineKanban', () => {
  it('loads applicants and renders them in the right columns', async () => {
    getKanbanApplicantsMock.mockResolvedValue({
      data: [makeApplicant('a1', 'new'), makeApplicant('a2', 'interview')],
      error: null,
    })

    render(<PipelineKanban companyId="c-1" />)

    await waitFor(() => {
      expect(screen.getByText('Jane a1')).toBeInTheDocument()
      expect(screen.getByText('Jane a2')).toBeInTheDocument()
    })
  })

  it('optimistically moves a card on drag end and reverts on service error', async () => {
    getKanbanApplicantsMock.mockResolvedValue({
      data: [makeApplicant('a1', 'new')],
      error: null,
    })
    setApplicantStageMock.mockResolvedValue({ error: 'db_error' })

    const { container } = render(<PipelineKanban companyId="c-1" />)
    await waitFor(() => expect(screen.getByText('Jane a1')).toBeInTheDocument())

    // Find the component instance's onDragEnd via exposed test hook.
    const ref = (
      window as unknown as {
        __kanbanTest?: { triggerDragEnd(id: string, to: string): Promise<void> }
      }
    ).__kanbanTest
    expect(ref).toBeDefined()

    await act(async () => {
      await ref!.triggerDragEnd('a1', 'interview')
    })

    expect(setApplicantStageMock).toHaveBeenCalledWith('a1', 'interview')

    // After revert, card should still be in 'new' column (count 1)
    const newCol = container.querySelector('[data-stage="new"]')
    expect(newCol?.textContent).toContain('Jane a1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/site/components/PipelineKanban/__tests__/PipelineKanban.test.tsx
```

Expected: FAIL — `PipelineKanban` is not exported.

- [ ] **Step 3: Write the component**

Create `src/site/components/PipelineKanban/PipelineKanban.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { getKanbanApplicants, setApplicantStage } from '../../services/applicantService'
import { KanbanColumn } from './KanbanColumn'
import styles from './PipelineKanban.module.css'

type Props = {
  companyId: string
}

const COLUMNS: Array<{ stage: KanbanStage; label: string }> = [
  { stage: 'new', label: 'New' },
  { stage: 'reviewed', label: 'Reviewed' },
  { stage: 'interview', label: 'Interview' },
  { stage: 'offer', label: 'Offer' },
]

export const PipelineKanban: React.FC<Props> = ({ companyId }) => {
  const [applicants, setApplicants] = useState<CompanyApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getKanbanApplicants(companyId).then(({ data, error }) => {
      if (cancelled) return
      setApplicants(data)
      setLoadError(error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [companyId])

  const byStage = useMemo(() => {
    const map: Record<KanbanStage, CompanyApplicant[]> = {
      new: [],
      reviewed: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    }
    for (const a of applicants) map[a.stage]?.push(a)
    return map
  }, [applicants])

  async function handleDragEnd(event: DragEndEvent) {
    const applicationId = String(event.active.id)
    const target = event.over?.id
    if (!target) return
    const nextStage = target as KanbanStage
    const current = applicants.find((a) => a.id === applicationId)
    if (!current || current.stage === nextStage) return

    const previous = applicants
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, stage: nextStage } : a))
    )
    const { error } = await setApplicantStage(applicationId, nextStage)
    if (error) setApplicants(previous)
  }

  // Test hook: lets unit tests invoke drag-end without simulating pointer events.
  // Guarded on NODE_ENV so it never lands in production bundles.
  if (process.env.NODE_ENV === 'test') {
    ;(window as unknown as { __kanbanTest?: unknown }).__kanbanTest = {
      triggerDragEnd: (id: string, to: string) =>
        handleDragEnd({
          active: { id },
          over: { id: to },
        } as unknown as DragEndEvent),
    }
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.title}>Pipeline</span>
        </div>
        <div className={styles.board}>
          {COLUMNS.map((c) => (
            <div key={c.stage} className={styles.skeleton} />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>Couldn't load pipeline: {loadError}</div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Pipeline</span>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {COLUMNS.map((c) => (
            <KanbanColumn
              key={c.stage}
              stage={c.stage}
              label={c.label}
              applicants={byStage[c.stage]}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/site/components/PipelineKanban/__tests__/PipelineKanban.test.tsx
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/site/components/PipelineKanban/PipelineKanban.tsx src/site/components/PipelineKanban/__tests__/PipelineKanban.test.tsx
git commit -m "feat(kanban): add PipelineKanban board with optimistic drag-drop"
```

---

## Task 7: Barrel export

**Files:**

- Create: `src/site/components/PipelineKanban/index.ts`

- [ ] **Step 1: Write the barrel file**

Create `src/site/components/PipelineKanban/index.ts`:

```ts
export { PipelineKanban } from './PipelineKanban'
```

- [ ] **Step 2: Commit**

```bash
git add src/site/components/PipelineKanban/index.ts
git commit -m "feat(kanban): add barrel export"
```

---

## Task 8: Wire PipelineKanban into CompanyDashboard

**Files:**

- Modify: `src/site/pages/CompanyDashboard.tsx`

- [ ] **Step 1: Add the import**

In `src/site/pages/CompanyDashboard.tsx`, add this import near the other component imports (around line 7):

```tsx
import { PipelineKanban } from '../components/PipelineKanban'
```

- [ ] **Step 2: Render the board below the stat cards**

In the same file, locate the stats grid closing `</div>` (around line 290) and the `RecentApplicantsWidget` that follows. Insert the kanban between them:

```tsx
{
  /* Stats */
}
;<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
  {stats.map((s) => (
    <StatCard key={s.label} {...s} />
  ))}
</div>

{
  /* Pipeline kanban — cross-job, active stages only */
}
{
  user?.id && <PipelineKanban companyId={user.id} />
}

{
  /* Recent applicants — cross-job widget, active stages only */
}
{
  user?.id && (
    <RecentApplicantsWidget companyId={user.id} lastSignInAt={user.last_sign_in_at ?? null} />
  )
}
```

- [ ] **Step 3: Typecheck + lint**

Run:

```bash
npx tsc --noEmit && npx eslint src/site/pages/CompanyDashboard.tsx src/site/components/PipelineKanban
```

Expected: no errors.

- [ ] **Step 4: Run the full test suite**

Run:

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Manual smoke test**

Start the dev server and verify in browser:

```bash
npm run dev
```

Log in as a company user, open the dashboard. Expected:

- Below the 4 stat cards, a "PIPELINE" section appears with 4 columns (New, Reviewed, Interview, Offer)
- Applicant cards show avatar initials, name, and job title
- Dragging a card to a different column moves it and persists (refresh the page — card stays in new column)
- Dragging a card back to its original column is a no-op
- Empty columns show a "Drop here" dashed placeholder

- [ ] **Step 6: Commit**

```bash
git add src/site/pages/CompanyDashboard.tsx
git commit -m "feat(dashboard): render pipeline kanban below stat cards"
```

---

## Done Criteria

- [ ] `npm test -- --run` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npx eslint src/site/components/PipelineKanban src/site/pages/CompanyDashboard.tsx` passes
- [ ] Board appears below stat cards on CompanyDashboard
- [ ] Cards can be dragged between columns; drop persists to database via `setApplicantStage`
- [ ] Service errors revert the optimistic move
- [ ] Hired/rejected applicants never appear on the board
