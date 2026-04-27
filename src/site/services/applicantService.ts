// ============================================================
// KREWTREE — Applicant Service
// Company-side read/write API for the applicant pipeline
// (dashboard widget + /site/dashboard/applicants page).
//
// All reads + mutations hit Supabase. RLS on `applications`,
// `jobs`, and `application_notes` scopes per-company access.
// Service functions return `{ data, error }` so callers can
// handle both paths uniformly.
// ============================================================

import type { CompanyApplicant, KanbanStage } from '../types'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

// Active pipeline stages (exclude resolved/terminal).
const ACTIVE_STAGES: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer']

const STAGE_ORDER: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer', 'hired', 'rejected']

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

type AppRow = Database['public']['Tables']['applications']['Row']
type WorkerRow = Database['public']['Tables']['worker_profiles']['Row']
type JobRow = Database['public']['Tables']['jobs']['Row']

type JoinedApplicantRow = AppRow & {
  worker_profiles: Pick<
    WorkerRow,
    | 'id'
    | 'first_name'
    | 'last_name'
    | 'avatar_url'
    | 'primary_trade'
    | 'city'
    | 'region'
    | 'is_regulix_ready'
  > & {
    worker_skills: Array<{ name: string; years_exp: number | null }>
    worker_certifications: Array<{
      cert_name: string
      issuing_body: string
      expiry_date: string | null
    }>
    worker_work_history: Array<{
      employer_name: string
      role_title: string
      start_date: string | null
      end_date: string | null
      is_current: boolean
    }>
  }
  jobs: Pick<JobRow, 'id' | 'title' | 'status'>
  application_notes: Array<{
    text: string
    author_name: string
    created_at: string
  }>
}

/** Format YYYY-MM(-DD) as "Mon YYYY"; falls back to the raw string. */
function formatMonthYear(d: string | null | undefined): string {
  if (!d) return ''
  const [yStr, mStr] = d.split('-')
  const y = Number(yStr)
  const m = Number(mStr)
  if (!y || !m) return d
  const month = new Date(y, m - 1).toLocaleString('default', { month: 'short' })
  return `${month} ${y}`
}

function formatJobDuration(start: string | null, end: string | null, isCurrent: boolean): string {
  const startLabel = formatMonthYear(start)
  const endLabel = isCurrent ? 'Present' : formatMonthYear(end)
  if (!startLabel && !endLabel) return ''
  if (!startLabel) return endLabel
  if (!endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
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
    workerTopSkills: Array.from(
      [...(w.worker_skills ?? [])]
        .sort((s1, s2) => (s2.years_exp ?? 0) - (s1.years_exp ?? 0))
        .reduce((acc, s) => {
          if (!acc.has(s.name)) acc.set(s.name, true)
          return acc
        }, new Map<string, true>())
        .keys()
    ).slice(0, 5),
    workerCertifications: (w.worker_certifications ?? []).map((c) => ({
      name: c.cert_name,
      issuer: c.issuing_body,
      expiresOn: formatMonthYear(c.expiry_date) || null,
    })),
    workerJobHistory: [...(w.worker_work_history ?? [])]
      .sort((j1, j2) => {
        if (j1.is_current !== j2.is_current) return j1.is_current ? -1 : 1
        return (j2.start_date ?? '').localeCompare(j1.start_date ?? '')
      })
      .map((j) => ({
        employer: j.employer_name,
        title: j.role_title,
        duration: formatJobDuration(j.start_date, j.end_date, j.is_current),
      })),
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
    isRegulixReady: w.is_regulix_ready,
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
  worker_profiles!inner(
    id, first_name, last_name, avatar_url, primary_trade, city, region, is_regulix_ready,
    worker_skills(name, years_exp),
    worker_certifications(cert_name, issuing_body, expiry_date),
    worker_work_history(employer_name, role_title, start_date, end_date, is_current)
  ),
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

/**
 * Count applicants that arrived after the given ISO timestamp. Used to render
 * a "# since last login" badge on the dashboard. Counts across ALL stages so
 * freshly-submitted applicants that the employer already moved (reviewed,
 * interview, etc.) still contribute to the "new" count.
 */
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
  if (filters.regulixOnly) q = q.eq('worker_profiles.is_regulix_ready', true)

  const ascending = sort.direction === 'asc'
  switch (sort.column) {
    case 'applied':
      q = q.order('created_at', { ascending })
      break
    case 'match':
      q = q.order('match_score', { ascending })
      break
    case 'job':
      q = q.order('title', { referencedTable: 'jobs', ascending })
      break
    case 'applicant':
      q = q.order('last_name', { referencedTable: 'worker_profiles', ascending })
      break
  }

  const start = (page - 1) * pageSize
  q = q.range(start, start + pageSize - 1)

  const { data, error, count } = await q
  if (error) return { data: [], total: 0, error: error.message }

  let rows = (data ?? []).map((row) => toCompanyApplicant(row as unknown as JoinedApplicantRow))
  // NOTE: `total` (from the server) is pre-search; UI "N of M" may overcount
  // while a search term is active. TODO: push search server-side via .or(...).
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) => r.workerFullName.toLowerCase().includes(s) || r.jobTitle.toLowerCase().includes(s)
    )
  }

  return { data: rows, total: count ?? rows.length, error: null }
}

/**
 * Convenience: unique (jobId, jobTitle) pairs across all applicants. Used to
 * populate the "Job" filter dropdown on the full page.
 */
export async function getJobFilterOptions(
  companyId: string
): Promise<{ data: Array<{ id: string; title: string }>; error: string | null }> {
  // TODO: fetches one row per application to produce N distinct jobs — wasteful
  // for companies with 1000s of applications. Move to an RPC or view
  // (SELECT DISTINCT j.id, j.title FROM jobs j JOIN applications a ...) post-MVP.
  const { data, error } = await supabase
    .from('applications')
    .select('jobs!inner(id, title)')
    .eq('jobs.company_id', companyId)

  if (error) return { data: [], error: error.message }

  type JobFilterRow = { jobs: Pick<JobRow, 'id' | 'title'> }
  const seen = new Map<string, string>()
  for (const row of data ?? []) {
    const job = (row as unknown as JobFilterRow).jobs
    if (job && !seen.has(job.id)) seen.set(job.id, job.title)
  }
  return {
    data: Array.from(seen, ([id, title]) => ({ id, title })).sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    ),
    error: null,
  }
}

/**
 * Company applicant profile page: all applications a given worker has filed
 * at this company, sorted newest-applied first. Used by the per-worker
 * company view so the header strip can list every job this worker applied to.
 */
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
  return {
    data: (data ?? []).map((row) => toCompanyApplicant(row as unknown as JoinedApplicantRow)),
    error: null,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────

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

export async function rejectApplicant(applicationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ kanban_stage: 'rejected' })
    .eq('id', applicationId)
  return { error: error?.message ?? null }
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

// N+1 round trips (1 SELECT + 1 UPDATE per id). Fine at current bulk sizes
// (5-20). Post-MVP candidate for a Postgres RPC that advances via CASE in a
// single statement.
export async function advanceApplicants(
  applicationIds: string[]
): Promise<{ affected: number; failed: string[]; error: string | null }> {
  let affected = 0
  const failed: string[] = []
  for (const id of applicationIds) {
    const { error } = await advanceApplicantStage(id)
    if (error) failed.push(id)
    else affected += 1
  }
  return { affected, failed, error: failed.length > 0 ? 'partial_failure' : null }
}

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
