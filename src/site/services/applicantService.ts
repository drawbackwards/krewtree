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

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Dashboard widget: most recent applicants in active pipeline stages
 * (excludes hired and rejected). Sorted newest-applied first.
 */
export async function getRecentApplicants(
  _companyId: string,
  limit = 5
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  // Note: mock store is already scoped to the current company (all entries
  // belong to c1). Real impl will filter by company_id via a jobs!inner join.
  const active = applicants.filter((a) => ACTIVE_STAGES.includes(a.stage))
  const sorted = sortApplicants(active, { column: 'applied', direction: 'desc' })
  return { data: sorted.slice(0, limit), error: null }
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
  _companyId: string,
  params: GetAllParams = {}
): Promise<{
  data: CompanyApplicant[]
  total: number
  error: string | null
}> {
  const filters = params.filters ?? DEFAULT_FILTERS
  const sort = params.sort ?? { column: 'applied' as const, direction: 'desc' as const }
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 25

  const filtered = applicants.filter((a) => matchesFilters(a, filters))
  const sorted = sortApplicants(filtered, sort)
  const start = (page - 1) * pageSize
  const slice = sorted.slice(start, start + pageSize)

  return { data: slice, total: filtered.length, error: null }
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
  note: string
): Promise<{ error: string | null }> {
  const trimmed = note.trim()
  if (!trimmed) return { error: 'empty_note' }
  const idx = applicants.findIndex((a) => a.id === applicationId)
  if (idx < 0) return { error: 'not_found' }
  applicants[idx] = { ...applicants[idx], notes: [...applicants[idx].notes, trimmed] }
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
