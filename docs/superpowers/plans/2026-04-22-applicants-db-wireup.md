# Applicants DB Wire-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all applicant-related mock data with real Supabase-backed queries, persist notes + pre-apply answers + shortlist + match score to the DB, and add a dev seed so the UI still demos after mocks disappear.

**Architecture:** Migrations first (schema + RLS), then the service layer (`applicantService.ts` + `submitApplication` in `jobService.ts`) gets rewritten query-by-query to hit Supabase. Mocks are removed last so intermediate states still render. Match score is computed server-side at insert time by a Postgres function (simple weighted overlap on skills + location) and stored on `applications.match_score`. Regulix ratings stay stubbed (separate Regulix integration, out of scope).

**Tech Stack:** Supabase Postgres (migrations in `supabase/migrations/`), RLS policies, TypeScript services with `supabase-js` client, Vitest for pure-function tests, manual browser verification for DB-backed surfaces.

**Spec:** This conversation's accumulated requirements — see `CLAUDE.md` for service/auth/RLS conventions.

---

## File Structure

### Migrations (Supabase)

| File                                                                        | Responsibility                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `supabase/migrations/20260422000001_applications_kanban_stage_reviewed.sql` | Rename `screening` → `reviewed` stage value to match TS types                                          |
| `supabase/migrations/20260422000002_applications_shortlist_match.sql`       | Add `is_shortlisted BOOLEAN`, `match_score INT`, `status_updated_at TIMESTAMPTZ` columns               |
| `supabase/migrations/20260422000003_application_notes.sql`                  | Create `application_notes` table + trigger + RLS                                                       |
| `supabase/migrations/20260422000004_match_score_fn.sql`                     | Create `compute_match_score(worker_id, job_id)` function + trigger to populate `match_score` on insert |

### Services (TypeScript)

| File                                    | Responsibility                                                      |
| --------------------------------------- | ------------------------------------------------------------------- |
| `src/site/services/applicantService.ts` | Full rewrite — every query hits Supabase; mutations hit real tables |
| `src/site/services/jobService.ts`       | `submitApplication()` now persists `interview_answers`              |

### Types + helpers

| File                                                      | Responsibility                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/site/types/index.ts`                                 | `KanbanStage` type already matches schema after stage rename                                 |
| `src/lib/database.types.ts`                               | Regenerated after migrations                                                                 |
| `src/site/services/matchScore.ts` (create)                | Pure helper `computeMatch({ workerSkills, jobSkills, workerCity, jobCity })` with unit tests |
| `src/site/services/__tests__/matchScore.test.ts` (create) | Vitest suite for the helper                                                                  |

### Seed data

| File                | Responsibility                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `supabase/seed.sql` | Append a block that inserts 3–4 test applications for the user's company with varied stages, notes, and answers |

### Deletions

- `src/site/data/mock.ts` — remove `companyApplicants`, `kanbanApplicants`, `applicationEvents`, `recentApplicants`, the `daysAgoIso` helper if now unused, and any other applicant-scoped mocks. Worker/job/company mocks stay until their respective features are wired later (out of scope).

**Boundaries:**

- No UI component changes required in this plan — the page + modal already accept `CompanyApplicant`, which survives the migration unchanged.
- Regulix ratings (`workerRegulixRating`, `workerRegulixRatingCount`) keep returning null/0 from the service until Regulix integration lands — do not schema them here.
- `addApplicantNote` keeps the same signature; only its body changes.

---

## Task 1: Rename kanban_stage value `screening` → `reviewed`

**Why:** The TS `KanbanStage` type is `'new' | 'reviewed' | 'interview' | 'offer' | 'hired' | 'rejected'`. The DB uses `'new' | 'screening' | ...`. Align on `reviewed` (matches product copy).

**Files:**

- Create: `supabase/migrations/20260422000001_applications_kanban_stage_reviewed.sql`

- [ ] **Step 1: Write migration**

```sql
-- Rename kanban stage "screening" → "reviewed" to match TS types + product copy.
-- Drop the old CHECK, remap existing rows, install new CHECK.

ALTER TABLE applications DROP CONSTRAINT applications_kanban_stage_check;

UPDATE applications SET kanban_stage = 'reviewed' WHERE kanban_stage = 'screening';

ALTER TABLE applications
  ADD CONSTRAINT applications_kanban_stage_check
  CHECK (kanban_stage IN ('new', 'reviewed', 'interview', 'offer', 'hired', 'rejected'));
```

- [ ] **Step 2: Apply migration locally**

Run: `supabase db reset` (resets local DB and re-runs all migrations + seed)
Expected: no errors; all prior applications now have `kanban_stage = 'reviewed'` where they had `'screening'`.

- [ ] **Step 3: Verify constraint**

Run:

```bash
supabase db execute --sql "INSERT INTO applications (worker_id, job_id, kanban_stage) VALUES ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','screening');"
```

Expected: error containing `applications_kanban_stage_check`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260422000001_applications_kanban_stage_reviewed.sql
git commit -m "feat(db): rename kanban stage 'screening' to 'reviewed'"
```

---

## Task 2: Add shortlist, match score, and status_updated_at columns

**Files:**

- Create: `supabase/migrations/20260422000002_applications_shortlist_match.sql`

- [ ] **Step 1: Write migration**

```sql
-- Add columns the company applicant UI needs:
--   is_shortlisted      — per-application favorite flag
--   match_score         — 0-100, populated by trigger on insert (see migration 004)
--   status_updated_at   — stamped whenever kanban_stage changes; drives "N since last login"

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS is_shortlisted   BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_score      INTEGER      NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Stamp status_updated_at on kanban_stage change
CREATE OR REPLACE FUNCTION stamp_status_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kanban_stage IS DISTINCT FROM OLD.kanban_stage THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER stamp_applications_status_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION stamp_status_updated_at();

-- Index to make "recent applicants for my company" cheap
CREATE INDEX idx_applications_company_recent
  ON applications (job_id, status_updated_at DESC);
```

- [ ] **Step 2: Apply + verify**

Run: `supabase db reset`
Expected: success; `\d applications` shows the new columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260422000002_applications_shortlist_match.sql
git commit -m "feat(db): add is_shortlisted, match_score, status_updated_at to applications"
```

---

## Task 3: Create `application_notes` table + RLS

**Files:**

- Create: `supabase/migrations/20260422000003_application_notes.sql`

- [ ] **Step 1: Write migration**

```sql
-- Per-application notes authored by company users.
-- One row per note; author_id references auth.users so we can derive author name later.

CREATE TABLE application_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name     TEXT NOT NULL,                -- snapshot at write time (company_name / first_name / email)
  text            TEXT NOT NULL CHECK (length(text) > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_notes_application ON application_notes (application_id, created_at DESC);

ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;

-- Worker can read notes on their own applications (transparency — optional; skip if you want private notes)
-- For now companies only.
CREATE POLICY "company_read"
  ON application_notes FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

CREATE POLICY "company_insert"
  ON application_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = auth.uid()
    )
  );

CREATE POLICY "author_delete"
  ON application_notes FOR DELETE
  USING (author_id = auth.uid());
```

- [ ] **Step 2: Apply + verify RLS**

Run: `supabase db reset`
Expected: table exists, RLS enabled (`\d+ application_notes`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260422000003_application_notes.sql
git commit -m "feat(db): add application_notes table + RLS"
```

---

## Task 4: Write `computeMatch()` pure helper + unit tests (TDD)

**Files:**

- Create: `src/site/services/matchScore.ts`
- Create: `src/site/services/__tests__/matchScore.test.ts`

- [ ] **Step 1: Write failing test**

`src/site/services/__tests__/matchScore.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeMatch } from '../matchScore'

describe('computeMatch', () => {
  it('returns 0 when neither skills nor location match', () => {
    expect(
      computeMatch({
        workerSkills: ['Plumbing'],
        jobSkills: ['Carpentry'],
        workerCity: 'Phoenix',
        jobCity: 'Denver',
      })
    ).toEqual({ total: 0, skills: 0, location: 0 })
  })

  it('returns 100 when all skills overlap and city matches exactly', () => {
    expect(
      computeMatch({
        workerSkills: ['Carpentry', 'Framing'],
        jobSkills: ['Carpentry', 'Framing'],
        workerCity: 'Phoenix',
        jobCity: 'Phoenix',
      })
    ).toEqual({ total: 100, skills: 100, location: 100 })
  })

  it('skills are % of job skills the worker covers (case-insensitive)', () => {
    // Worker has 1 of 2 job skills = 50% skills
    // Location match = 100%
    // Average = 75%
    expect(
      computeMatch({
        workerSkills: ['carpentry', 'Electrical'],
        jobSkills: ['Carpentry', 'Welding'],
        workerCity: 'Phoenix',
        jobCity: 'PHOENIX',
      })
    ).toEqual({ total: 75, skills: 50, location: 100 })
  })

  it('empty job skills → skills pillar is 100 (nothing required)', () => {
    expect(
      computeMatch({
        workerSkills: [],
        jobSkills: [],
        workerCity: 'Phoenix',
        jobCity: 'Phoenix',
      })
    ).toEqual({ total: 100, skills: 100, location: 100 })
  })
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run src/site/services/__tests__/matchScore.test.ts`
Expected: module-not-found error for `../matchScore`.

- [ ] **Step 3: Implement**

`src/site/services/matchScore.ts`:

```ts
export interface MatchInput {
  workerSkills: string[]
  jobSkills: string[]
  workerCity: string
  jobCity: string
}

export interface MatchResult {
  total: number
  skills: number
  location: number
}

/**
 * Simple 50/50 weighted match score for an application.
 * Skills pillar = % of job-required skills the worker has.
 * Location pillar = 100 if cities match case-insensitively, else 0.
 * Both pillars are integers 0-100. `total` is the integer average.
 */
export function computeMatch({
  workerSkills,
  jobSkills,
  workerCity,
  jobCity,
}: MatchInput): MatchResult {
  const skills = pctSkillOverlap(workerSkills, jobSkills)
  const location = sameCity(workerCity, jobCity) ? 100 : 0
  const total = Math.round((skills + location) / 2)
  return { total, skills, location }
}

function pctSkillOverlap(worker: string[], job: string[]): number {
  if (job.length === 0) return 100
  const workerSet = new Set(worker.map((s) => s.trim().toLowerCase()))
  const hit = job.filter((s) => workerSet.has(s.trim().toLowerCase())).length
  return Math.round((hit / job.length) * 100)
}

function sameCity(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== ''
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/site/services/__tests__/matchScore.test.ts`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/matchScore.ts src/site/services/__tests__/matchScore.test.ts
git commit -m "feat: add computeMatch pure helper + tests"
```

---

## Task 5: Postgres `compute_match_score` function + insert trigger

**Why:** We populate `applications.match_score` server-side at insert time so listing queries don't join/compute every request.

**Files:**

- Create: `supabase/migrations/20260422000004_match_score_fn.sql`

- [ ] **Step 1: Write migration**

```sql
-- Compute a 0-100 match score for one (worker, job) pair.
-- Skills pillar = % of job.pre_interview_questions... wait: job skills live elsewhere.
-- For MVP we treat jobs.experience_level + worker primary_trade as the skill signal.
-- Location: worker_profiles.city vs. job.location (case-insensitive contains).
-- Keep this simple; revisit when job_skills table lands.

CREATE OR REPLACE FUNCTION compute_match_score(p_worker_id UUID, p_job_id UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_worker_city TEXT;
  v_worker_trade TEXT;
  v_job_location TEXT;
  v_job_title TEXT;
  v_location_score INT;
  v_skills_score INT;
BEGIN
  SELECT city, primary_trade INTO v_worker_city, v_worker_trade
    FROM worker_profiles WHERE id = p_worker_id;
  SELECT location, title INTO v_job_location, v_job_title
    FROM jobs WHERE id = p_job_id;

  IF v_worker_city IS NULL OR v_job_location IS NULL THEN
    v_location_score := 0;
  ELSIF lower(v_job_location) LIKE '%' || lower(v_worker_city) || '%' THEN
    v_location_score := 100;
  ELSE
    v_location_score := 0;
  END IF;

  IF v_worker_trade IS NULL OR v_job_title IS NULL THEN
    v_skills_score := 0;
  ELSIF lower(v_job_title) LIKE '%' || lower(v_worker_trade) || '%' THEN
    v_skills_score := 100;
  ELSE
    v_skills_score := 50;  -- partial credit when we have both but no overlap
  END IF;

  RETURN (v_location_score + v_skills_score) / 2;
END $$;

-- Populate match_score on insert
CREATE OR REPLACE FUNCTION populate_application_match()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.match_score := compute_match_score(NEW.worker_id, NEW.job_id);
  RETURN NEW;
END $$;

CREATE TRIGGER populate_applications_match_score
  BEFORE INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION populate_application_match();
```

- [ ] **Step 2: Apply + verify**

Run: `supabase db reset`
Expected: success; inserting an application produces a `match_score` between 0 and 100.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260422000004_match_score_fn.sql
git commit -m "feat(db): add compute_match_score fn + insert trigger"
```

---

## Task 6: Regenerate `database.types.ts`

**Files:**

- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Regenerate**

Run: `supabase gen types typescript --local > src/lib/database.types.ts`

- [ ] **Step 2: Verify diff includes new columns**

Run: `git diff src/lib/database.types.ts | grep -E 'is_shortlisted|match_score|status_updated_at|application_notes|reviewed'`
Expected: lines showing all four additions + stage rename.

- [ ] **Step 3: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "chore: regenerate database.types"
```

---

## Task 7: Rewrite `getRecentApplicants` + `getAllApplicants` against Supabase

**Files:**

- Modify: `src/site/services/applicantService.ts`

These two functions feed the dashboard widget and applicants table. Both return `CompanyApplicant[]`, which is a UI-shaped projection — we build it from a Supabase query joining `applications` + `worker_profiles` + `jobs`.

- [ ] **Step 1: Add the projection helper at top of file**

Insert after existing imports:

```ts
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

type AppRow = Database['public']['Tables']['applications']['Row']
type WorkerRow = Database['public']['Tables']['worker_profiles']['Row']
type JobRow = Database['public']['Tables']['jobs']['Row']

/**
 * Convert a joined Supabase row into the UI-shaped CompanyApplicant.
 * Regulix ratings are null until the Regulix service is wired.
 */
function toCompanyApplicant(
  a: AppRow & {
    worker_profiles: Pick<
      WorkerRow,
      'id' | 'first_name' | 'last_name' | 'avatar_url' | 'primary_trade' | 'city' | 'region'
    >
    jobs: Pick<JobRow, 'id' | 'title' | 'status'>
    application_notes: Array<{
      text: string
      author_name: string
      created_at: string
    }>
  }
): CompanyApplicant {
  const w = a.worker_profiles
  const j = a.jobs
  const first = w.first_name ?? ''
  const last = w.last_name ?? ''
  const fullName = `${first} ${last}`.trim() || 'Unknown'
  const initials = (first[0] ?? '?') + (last[0] ?? '')
  const answers = Array.isArray(a.interview_answers)
    ? (a.interview_answers as Array<{ question: string; answer: string }>)
    : []

  return {
    id: a.id,
    workerId: w.id,
    workerFirstName: first,
    workerLastInitial: last[0] ?? '',
    workerFullName: fullName,
    workerAvatar: w.avatar_url ?? '',
    workerInitials: initials.toUpperCase(),
    workerPrimaryTrade: w.primary_trade ?? '',
    workerLocation: [w.city, w.region].filter(Boolean).join(', '),
    workerAvailability: 'available', // not in schema yet
    workerTopSkills: [], // TODO: join worker_skills when needed for matching
    workerCertifications: [],
    workerJobHistory: [],
    workerRating: null,
    workerRatingCount: 0,
    workerRegulixRating: null,
    workerRegulixRatingCount: 0,
    jobId: j.id,
    jobTitle: j.title,
    jobStatus: j.status as CompanyApplicant['jobStatus'],
    stage: a.kanban_stage as CompanyApplicant['stage'],
    matchScore: a.match_score,
    matchBreakdown: { skills: 0, location: 0, availability: 0 },
    isRegulixReady: false,
    isShortlisted: a.is_shortlisted,
    appliedAt: a.created_at,
    notes: a.application_notes.map((n) => ({
      text: n.text,
      authorName: n.author_name,
      createdAt: n.created_at,
    })),
    preInterviewAnswers: answers,
  }
}

const APPLICANT_SELECT = `
  *,
  worker_profiles!inner(id, first_name, last_name, avatar_url, primary_trade, city, region),
  jobs!inner(id, title, status, company_id),
  application_notes(text, author_name, created_at)
`
```

- [ ] **Step 2: Replace `getRecentApplicants`**

Replace the existing body (around line 107):

```ts
export async function getRecentApplicants(
  companyId: string,
  limit = 5
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select(APPLICANT_SELECT)
    .eq('jobs.company_id', companyId)
    .in('kanban_stage', ACTIVE_STAGES)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toCompanyApplicant), error: null }
}
```

- [ ] **Step 3: Replace `getAllApplicants`**

```ts
export async function getAllApplicants(
  companyId: string,
  params: GetAllParams = {}
): Promise<{ data: CompanyApplicant[]; total: number; error: string | null }> {
  const filters = params.filters ?? DEFAULT_FILTERS
  const sort = params.sort ?? { column: 'applied' as const, direction: 'desc' as const }
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 25

  let q = supabase
    .from('applications')
    .select(APPLICANT_SELECT, { count: 'exact' })
    .eq('jobs.company_id', companyId)

  if (filters.stage !== 'all') q = q.eq('kanban_stage', filters.stage)
  if (filters.jobId !== 'all') q = q.eq('job_id', filters.jobId)
  if (filters.appliedFrom) q = q.gte('created_at', filters.appliedFrom)
  if (filters.appliedTo) q = q.lte('created_at', filters.appliedTo)

  const sortCol =
    sort.column === 'applied'
      ? 'created_at'
      : sort.column === 'match'
        ? 'match_score'
        : sort.column === 'job'
          ? 'jobs.title'
          : 'worker_profiles.first_name'
  q = q.order(sortCol, { ascending: sort.direction === 'asc' })

  const start = (page - 1) * pageSize
  q = q.range(start, start + pageSize - 1)

  const { data, error, count } = await q
  if (error) return { data: [], total: 0, error: error.message }

  // Search + regulixOnly filter applied client-side for now (search hits name/job)
  let rows = (data ?? []).map(toCompanyApplicant)
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) => r.workerFullName.toLowerCase().includes(s) || r.jobTitle.toLowerCase().includes(s)
    )
  }
  if (filters.regulixOnly) rows = rows.filter((r) => r.isRegulixReady)

  return { data: rows, total: count ?? rows.length, error: null }
}
```

- [ ] **Step 4: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/site/services/applicantService.ts
git commit -m "feat: wire getRecentApplicants + getAllApplicants to Supabase"
```

---

## Task 8: Rewrite `countNewApplicantsSince` + `getJobFilterOptions` + `getWorkerApplicationsAtCompany`

**Files:**

- Modify: `src/site/services/applicantService.ts`

- [ ] **Step 1: Replace `countNewApplicantsSince`**

```ts
export async function countNewApplicantsSince(
  companyId: string,
  sinceIso: string | null
): Promise<{ count: number; error: string | null }> {
  let q = supabase
    .from('applications')
    .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
    .eq('jobs.company_id', companyId)
  if (sinceIso) q = q.gt('created_at', sinceIso)
  const { count, error } = await q
  if (error) return { count: 0, error: error.message }
  return { count: count ?? 0, error: null }
}
```

- [ ] **Step 2: Replace `getJobFilterOptions`**

```ts
export async function getJobFilterOptions(
  companyId: string
): Promise<{ data: Array<{ id: string; title: string }>; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('jobs!inner(id, title, company_id)')
    .eq('jobs.company_id', companyId)

  if (error) return { data: [], error: error.message }

  const seen = new Map<string, string>()
  for (const row of data ?? []) {
    const job = (row as { jobs: { id: string; title: string } }).jobs
    if (job && !seen.has(job.id)) seen.set(job.id, job.title)
  }
  return {
    data: Array.from(seen, ([id, title]) => ({ id, title })).sort((a, b) =>
      a.title.localeCompare(b.title)
    ),
    error: null,
  }
}
```

- [ ] **Step 3: Replace `getWorkerApplicationsAtCompany`**

```ts
export async function getWorkerApplicationsAtCompany(
  workerId: string,
  companyId: string
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select(APPLICANT_SELECT)
    .eq('worker_id', workerId)
    .eq('jobs.company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toCompanyApplicant), error: null }
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
./node_modules/.bin/tsc --noEmit
git add src/site/services/applicantService.ts
git commit -m "feat: wire countNew + filterOptions + workerApps to Supabase"
```

---

## Task 9: Rewrite stage mutations (`setApplicantStage`, advance, reject, bulk variants)

**Files:**

- Modify: `src/site/services/applicantService.ts`

- [ ] **Step 1: Replace `setApplicantStage`**

```ts
export async function setApplicantStage(
  applicationId: string,
  stage: KanbanStage
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ kanban_stage: stage })
    .eq('id', applicationId)
  return { error: error?.message ?? null }
}
```

- [ ] **Step 2: Replace `advanceApplicantStage`**

```ts
export async function advanceApplicantStage(
  applicationId: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('kanban_stage')
    .eq('id', applicationId)
    .single()
  if (error) return { error: error.message }

  const current = data.kanban_stage as KanbanStage
  const idx = STAGE_ORDER.indexOf(current)
  if (idx < 0 || current === 'hired' || current === 'rejected') {
    return { error: 'cannot_advance' }
  }
  const next = STAGE_ORDER[idx + 1]
  if (!next) return { error: 'no_next_stage' }

  const { error: updErr } = await supabase
    .from('applications')
    .update({ kanban_stage: next })
    .eq('id', applicationId)
  return { error: updErr?.message ?? null }
}
```

- [ ] **Step 3: Replace `rejectApplicant`**

```ts
export async function rejectApplicant(applicationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ kanban_stage: 'rejected' })
    .eq('id', applicationId)
  return { error: error?.message ?? null }
}
```

- [ ] **Step 4: Replace bulk variants**

```ts
export async function advanceApplicants(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  let affected = 0
  for (const id of applicationIds) {
    const { error } = await advanceApplicantStage(id)
    if (!error) affected += 1
  }
  return { affected, error: null }
}

export async function rejectApplicants(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .update({ kanban_stage: 'rejected' })
    .in('id', applicationIds)
    .neq('kanban_stage', 'rejected')
    .select('id')
  if (error) return { affected: 0, error: error.message }
  return { affected: data?.length ?? 0, error: null }
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
./node_modules/.bin/tsc --noEmit
git add src/site/services/applicantService.ts
git commit -m "feat: wire stage mutations to Supabase"
```

---

## Task 10: Rewrite shortlist mutations

**Files:**

- Modify: `src/site/services/applicantService.ts`

- [ ] **Step 1: Replace `shortlistApplicant`**

```ts
export async function shortlistApplicant(
  applicationId: string
): Promise<{ isShortlisted: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('is_shortlisted')
    .eq('id', applicationId)
    .single()
  if (error) return { isShortlisted: false, error: error.message }

  const next = !data.is_shortlisted
  const { error: updErr } = await supabase
    .from('applications')
    .update({ is_shortlisted: next })
    .eq('id', applicationId)
  if (updErr) return { isShortlisted: data.is_shortlisted, error: updErr.message }
  return { isShortlisted: next, error: null }
}
```

- [ ] **Step 2: Replace `shortlistApplicants` (bulk — sets true, skips already-shortlisted)**

```ts
export async function shortlistApplicants(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .update({ is_shortlisted: true })
    .in('id', applicationIds)
    .eq('is_shortlisted', false)
    .select('id')
  if (error) return { affected: 0, error: error.message }
  return { affected: data?.length ?? 0, error: null }
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
./node_modules/.bin/tsc --noEmit
git add src/site/services/applicantService.ts
git commit -m "feat: wire shortlist mutations to Supabase"
```

---

## Task 11: Rewrite `addApplicantNote` to insert into `application_notes`

**Files:**

- Modify: `src/site/services/applicantService.ts`

- [ ] **Step 1: Replace function body**

```ts
export async function addApplicantNote(
  applicationId: string,
  note: string,
  authorName: string
): Promise<{ error: string | null }> {
  const trimmed = note.trim()
  if (!trimmed) return { error: 'empty_note' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' }

  const { error } = await supabase.from('application_notes').insert({
    application_id: applicationId,
    author_id: user.id,
    author_name: authorName,
    text: trimmed,
  })
  return { error: error?.message ?? null }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
./node_modules/.bin/tsc --noEmit
git add src/site/services/applicantService.ts
git commit -m "feat: wire addApplicantNote to application_notes table"
```

---

## Task 12: Wire `submitApplication` to persist `interview_answers`

**Files:**

- Modify: `src/site/services/jobService.ts`

- [ ] **Step 1: Update signature + insert**

Find the current `submitApplication` function and replace:

```ts
export async function submitApplication(
  jobId: string,
  workerId: string,
  notes: string,
  isBoosted: boolean,
  answers: Array<{ question: string; answer: string }> = []
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      worker_id: workerId,
      job_id: jobId,
      notes,
      is_boosted: isBoosted,
      interview_answers: answers,
    })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') return { id: null, error: 'already_applied' }
    return { id: null, error: error.message }
  }
  return { id: data.id, error: null }
}
```

- [ ] **Step 2: Verify no other callers break**

Run: `grep -rn "submitApplication" src/`
Expected: calls match the new signature (the QuickApplyModal already passes an `answers` array).

- [ ] **Step 3: Typecheck + commit**

```bash
./node_modules/.bin/tsc --noEmit
git add src/site/services/jobService.ts
git commit -m "feat: persist interview_answers on submitApplication"
```

---

## Task 13: Remove applicant-related mock data

**Files:**

- Modify: `src/site/data/mock.ts`

- [ ] **Step 1: Identify applicant-related exports**

Open `src/site/data/mock.ts` and delete these exports (and the fixtures backing them):

- `companyApplicants`
- `kanbanApplicants`
- `applicationEvents`
- `recentApplicants` (derived from companyApplicants)

Leave alone: `workers`, `companies`, `jobs`, `industries`, `skills`, `locationRegions`, `workerReviews`, `companyReviews`, `companyDetails`, `notifications`, `referrals`, `messages` / `conversations`, `currentWorker`, `currentCompany`, `myApplications`, `savedJobs`, `savedSearches`, `resumeDocuments`, `portfolioItems`, `skillEndorsements`, `companyJobs`.

- [ ] **Step 2: Remove unused helper if applicable**

`daysAgoIso` — check if anything else uses it with Grep. Keep if used, delete if not.

- [ ] **Step 3: Fix any broken imports**

Run: `./node_modules/.bin/tsc --noEmit`
Fix any module-not-found errors by removing the broken import or replacing with the real service call.

- [ ] **Step 4: Commit**

```bash
git add src/site/data/mock.ts
git commit -m "chore: remove applicant-related mock data"
```

---

## Task 14: Update `CompanyApplicantProfilePage` stub fallback

**Why:** The stub-from-applicant fallback was built for mock workers whose IDs weren't real UUIDs. Now that applicants are real DB rows with real worker UUIDs, the real `getFullWorkerProfile` should always succeed. The stub is dead code — but leave it as a safety net in case `getFullWorkerProfile` fails for other reasons (e.g., profile not yet created).

**Files:**

- Modify: `src/site/pages/CompanyApplicantProfilePage.tsx`

- [ ] **Step 1: Verify stub fallback still compiles** (no code changes expected)

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 errors. The `stubProfileFromApplicant` helper + its callsite remain untouched.

- [ ] **Step 2: Commit (no-op if no changes)**

---

## Task 15: Dev seed — applications for test company

**Files:**

- Modify: `supabase/seed.sql`

- [ ] **Step 1: Append at end of seed.sql**

```sql
-- ── Applicant demo data ────────────────────────────────────
-- Requires the first worker (a0000000-0000-0000-0000-000000000001)
-- and a real test company (use your own auth.users id in CI; this block
-- is guarded so it no-ops when the company doesn't exist).

DO $$
DECLARE
  v_company UUID;
  v_job1 UUID;
  v_job2 UUID;
  v_worker UUID := 'a0000000-0000-0000-0000-000000000001';
  v_app UUID;
BEGIN
  -- Use the first company in company_profiles as the demo target.
  SELECT id INTO v_company FROM company_profiles ORDER BY created_at LIMIT 1;
  IF v_company IS NULL THEN RETURN; END IF;

  SELECT id INTO v_job1 FROM jobs WHERE company_id = v_company ORDER BY created_at LIMIT 1;
  SELECT id INTO v_job2 FROM jobs WHERE company_id = v_company ORDER BY created_at OFFSET 1 LIMIT 1;
  IF v_job1 IS NULL THEN RETURN; END IF;

  -- Two applications for the same worker
  INSERT INTO applications (worker_id, job_id, kanban_stage, is_shortlisted, interview_answers)
  VALUES
    (v_worker, v_job1, 'interview', TRUE, '[
      {"question":"Do you have a valid drivers license?","answer":"Yes, Class C."},
      {"question":"How soon can you start?","answer":"Two weeks notice."}
    ]'::jsonb),
    (v_worker, COALESCE(v_job2, v_job1), 'new', FALSE, '[]'::jsonb)
  ON CONFLICT (worker_id, job_id) DO NOTHING
  RETURNING id INTO v_app;

  -- One note on the interview-stage application
  SELECT id INTO v_app FROM applications
    WHERE worker_id = v_worker AND job_id = v_job1 LIMIT 1;
  IF v_app IS NOT NULL THEN
    INSERT INTO application_notes (application_id, author_id, author_name, text)
    VALUES (v_app, v_company, 'Demo Company', 'Strong candidate - scheduled interview Tue.');
  END IF;
END $$;
```

- [ ] **Step 2: Apply seed**

Run: `supabase db reset`
Expected: one worker has two applications against the first company's first two jobs, one note exists.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore: seed applicant demo data for dev"
```

---

## Task 16: Manual browser verification

**Files:** None (verification only)

- [ ] **Step 1: Start dev server, log in as company**

Run: `npm run dev` (or use preview_start in agent mode)
Navigate to `/site/dashboard/applicants` as your test company user.

- [ ] **Step 2: Verify each surface**

Check each of these renders real DB data (no console errors):

- `/site/dashboard/applicants` — list shows seeded applications, filters work, stage picker in detail pane updates DB
- `/site/dashboard/applicants/worker/:workerId` — full-page profile, application rows show correct stage/match, modal opens with stage picker + match + answers + notes
- `/site/dashboard/company` (RecentApplicantsWidget) — shows the seeded applicants
- Add-note flow inside the modal — typing + submitting persists the note (refresh to confirm)
- Stage change from the modal's header picker — value persists on refresh
- Shortlist icon button — toggles on refresh

- [ ] **Step 3: Check console/network**

Open DevTools → Network. Confirm the requests go to Supabase (not just local state) and return 2xx.

- [ ] **Step 4: Commit the plan file if not already**

```bash
git add docs/superpowers/plans/2026-04-22-applicants-db-wireup.md
git commit -m "docs: add applicants DB wireup plan"
```

---

## Rollout order summary

1. Tasks 1-6: schema migrations + types regen (no runtime impact yet — services still hit mocks).
2. Task 7-12: service rewrite (runtime now hits DB; mocks still defined but unused).
3. Task 13: delete mocks.
4. Task 15: seed, so the UI keeps demoing.
5. Task 16: verify every surface.

Each numbered task is a single commit; the branch stays working after every one.
