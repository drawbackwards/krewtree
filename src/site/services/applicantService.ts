// ============================================================
// KREWTREE — Applicant Service
// Company-side read/write API for the applicant pipeline
// (dashboard widget + /site/dashboard/applicants page).
//
// Currently backed by mock data — see note at bottom of file for the
// Supabase wiring plan. Service functions return `{ data, error }` so the
// call sites can switch over without API changes.
// ============================================================

import type { CompanyApplicant, KanbanStage } from '../types'
import { companyApplicants as initialApplicants } from '../data/mock'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

// Active pipeline stages (exclude resolved/terminal).
const ACTIVE_STAGES: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer']

const STAGE_ORDER: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer', 'hired', 'rejected']

// In-memory mutable store. Replaces the mock import once loaded so mutations
// (advance/reject/shortlist/note) persist for the session. TODO: swap this
// for a real Supabase-backed read+write layer before launch.
let applicants: CompanyApplicant[] = initialApplicants.map((a) => ({ ...a }))

// ── Types ─────────────────────────────────────────────────────────────────

export type ApplicantSort = 'applicant' | 'job' | 'match' | 'applied'

export type ApplicantFilters = {
  search: string
  stage: KanbanStage | 'all'
  jobId: string | 'all'
  regulixOnly: boolean
  appliedFrom: string | null // ISO
  appliedTo: string | null // ISO
}

export const DEFAULT_FILTERS: ApplicantFilters = {
  search: '',
  stage: 'all',
  jobId: 'all',
  regulixOnly: false,
  appliedFrom: null,
  appliedTo: null,
}

export type GetAllParams = {
  filters?: ApplicantFilters
  sort?: { column: ApplicantSort; direction: 'asc' | 'desc' }
  page?: number // 1-indexed
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
    // Inclusive end of day.
    const end = new Date(f.appliedTo)
    end.setHours(23, 59, 59, 999)
    if (new Date(a.appliedAt) > end) return false
  }
  return true
}

function sortApplicants(
  list: CompanyApplicant[],
  sort: { column: ApplicantSort; direction: 'asc' | 'desc' }
): CompanyApplicant[] {
  const dir = sort.direction === 'asc' ? 1 : -1
  const sorted = [...list].sort((a, b) => {
    switch (sort.column) {
      case 'applicant': {
        const cmp =
          a.workerLastInitial.localeCompare(b.workerLastInitial, undefined, {
            sensitivity: 'base',
          }) ||
          a.workerFirstName.localeCompare(b.workerFirstName, undefined, { sensitivity: 'base' })
        return cmp * dir
      }
      case 'job':
        return a.jobTitle.localeCompare(b.jobTitle, undefined, { sensitivity: 'base' }) * dir
      case 'match':
        return (a.matchScore - b.matchScore) * dir
      case 'applied':
        return (new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()) * dir
    }
  })
  return sorted
}

// Keep-alive: matchesFilters + sortApplicants are retained for the
// mock-backed mutation helpers below until Tasks 9–11 replace them.
// Once mutations are DB-backed these helpers (and this reference) go away.
void matchesFilters
void sortApplicants

type AppRow = Database['public']['Tables']['applications']['Row']
type WorkerRow = Database['public']['Tables']['worker_profiles']['Row']
type JobRow = Database['public']['Tables']['jobs']['Row']

type JoinedApplicantRow = AppRow & {
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

/**
 * Convert a joined Supabase row into the UI-shaped CompanyApplicant.
 * Regulix ratings are null until the Regulix service is wired.
 * Match breakdown doubles up match_score into both skills and location slots
 * because the DB function stores only the aggregate — the UI still renders
 * a value in both pillars. Revisit if we split the column later.
 */
function toCompanyApplicant(a: JoinedApplicantRow): CompanyApplicant {
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
    workerAvailability: 'available',
    workerTopSkills: [],
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
    matchBreakdown: { skills: a.match_score, location: a.match_score, availability: 0 },
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

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Dashboard widget: most recent applicants in active pipeline stages
 * (excludes hired and rejected). Sorted newest-applied first.
 */
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
  return {
    data: (data ?? []).map((row) => toCompanyApplicant(row as unknown as JoinedApplicantRow)),
    error: null,
  }
}

/**
 * Count applicants that arrived after the given ISO timestamp. Used to render
 * a "# since last login" badge on the dashboard. Counts across ALL stages so
 * freshly-submitted applicants that the employer already moved (reviewed,
 * interview, etc.) still contribute to the "new" count.
 */
export async function countNewApplicantsSince(
  _companyId: string,
  sinceIso: string | null
): Promise<{ count: number; error: string | null }> {
  if (!sinceIso) return { count: applicants.length, error: null }
  const since = new Date(sinceIso).getTime()
  const count = applicants.filter((a) => new Date(a.appliedAt).getTime() > since).length
  return { count, error: null }
}

/**
 * Full page: cross-job applicant list with filters, sort, and pagination.
 * Returns the sliced page plus the pre-pagination total count so the caller
 * can render "N of M" and page controls.
 */
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

  let rows = (data ?? []).map((row) => toCompanyApplicant(row as unknown as JoinedApplicantRow))
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) => r.workerFullName.toLowerCase().includes(s) || r.jobTitle.toLowerCase().includes(s)
    )
  }
  if (filters.regulixOnly) rows = rows.filter((r) => r.isRegulixReady)

  return { data: rows, total: count ?? rows.length, error: null }
}

/**
 * Convenience: unique (jobId, jobTitle) pairs across all applicants. Used to
 * populate the "Job" filter dropdown on the full page.
 */
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

/**
 * Company applicant profile page: all applications a given worker has filed
 * at this company, sorted newest-applied first. Used by the per-worker
 * company view so the header strip can list every job this worker applied to.
 */
export async function getWorkerApplicationsAtCompany(
  workerId: string,
  _companyId: string
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const matches = applicants.filter((a) => a.workerId === workerId)
  const sorted = [...matches].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  )
  return { data: sorted, error: null }
}

// ── Mutations ─────────────────────────────────────────────────────────────

export async function advanceApplicantStage(
  applicationId: string
): Promise<{ error: string | null }> {
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  const current = applicants[idx].stage
  // Spec §9: Advance only applies to active stages (new/reviewed/interview/offer).
  const activeIdx = STAGE_ORDER.indexOf(current)
  if (activeIdx < 0 || current === 'hired' || current === 'rejected') {
    return { error: 'cannot_advance' }
  }
  const next = STAGE_ORDER[activeIdx + 1]
  if (!next) return { error: 'no_next_stage' }
  applicants[idx] = { ...applicants[idx], stage: next }
  return { error: null }
}

export async function setApplicantStage(
  applicationId: string,
  stage: KanbanStage
): Promise<{ error: string | null }> {
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  applicants[idx] = { ...applicants[idx], stage }
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
    if (a.stage === 'rejected') return a // skip already-rejected per spec §5.6
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
  note: string,
  authorName: string
): Promise<{ error: string | null }> {
  const trimmed = note.trim()
  if (!trimmed) return { error: 'empty_note' }
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  const entry = { text: trimmed, authorName, createdAt: new Date().toISOString() }
  applicants[idx] = { ...applicants[idx], notes: [...applicants[idx].notes, entry] }
  return { error: null }
}

// ============================================================
// SUPABASE WIRING NOTE
// ------------------------------------------------------------
// When applications move to the DB:
//   - getRecentApplicants / getAllApplicants: select from `applications`
//     with `.select('*, worker_profiles!inner(...), jobs!inner(company_id, title, status)')`
//     and filter `jobs.company_id = companyId`. Apply filters server-side.
//   - advance/reject/shortlist: update the applications row's `stage`,
//     `is_shortlisted` columns. Add a `status_updated_at` timestamp on change.
//   - notes: insert into an `applicant_notes` table keyed on (application_id).
//   - match_score: either store as a generated column on `applications` or
//     compute client-side from worker + job skills/location/availability.
//     Spec §7/§10.4: equal 33/33/33 weight as a starting point.
// ============================================================
