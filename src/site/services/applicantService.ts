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

import type { ApplicationStatus, CompanyApplicant } from '../types'
import { supabase, getCurrentUserId } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import { getPipelineStages, instantiateTemplatesForStage } from './pipelineService'
import { FEATURES } from '../config/features'

// ── Types ─────────────────────────────────────────────────────────────────

export type ApplicantSort = 'applicant' | 'job' | 'match' | 'applied'

export type ApplicantFilters = {
  search: string
  stageId: string | 'all'
  jobId: string | 'all'
  regulixOnly: boolean
  appliedFrom: string | null // ISO
  appliedTo: string | null // ISO
  showArchived: boolean
}

export const DEFAULT_FILTERS: ApplicantFilters = {
  search: '',
  stageId: 'all',
  jobId: 'all',
  regulixOnly: false,
  appliedFrom: null,
  appliedTo: null,
  showArchived: false,
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
    worker_references: Array<{
      id: string
      name: string
      company: string
      phone: string | null
      email: string | null
    }>
  }
  jobs: Pick<JobRow, 'id' | 'title' | 'status'>
  application_notes: Array<{
    text: string
    author_name: string
    created_at: string
  }>
  application_task: Array<{
    label: string
    is_flagged: boolean
  }>
}

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

function toCompanyApplicant(
  a: JoinedApplicantRow,
  stageNameMap: Map<string, string>
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

  const currentStageId =
    ((a as unknown as Record<string, unknown>).current_stage_id as string) ?? ''

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
      .map((h) => ({
        employer: h.employer_name,
        title: h.role_title,
        duration: formatJobDuration(h.start_date, h.end_date, h.is_current),
        isCurrent: h.is_current === true,
      })),
    workerReferences: (w.worker_references ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      company: r.company,
      phone: r.phone ?? null,
      email: r.email ?? null,
    })),
    workerRating: null,
    workerRatingCount: 0,
    workerRegulixRating: null,
    workerRegulixRatingCount: 0,
    jobId: j.id,
    jobTitle: j.title,
    jobStatus: j.status as CompanyApplicant['jobStatus'],
    currentStageId,
    currentStageName: stageNameMap.get(currentStageId) ?? '',
    status: ((a as unknown as Record<string, unknown>).status as ApplicationStatus) ?? 'active',
    matchScore: a.match_score,
    matchBreakdown: { skills: a.match_score, location: a.match_score, availability: 0 },
    isRegulixReady: w.is_regulix_ready,
    isShortlisted: a.is_shortlisted,
    isBoosted: a.is_boosted,
    appliedAt: a.created_at,
    stageEnteredAt: a.status_updated_at ?? a.created_at,
    slaState: 'none',
    flagged: (a.application_task ?? []).some((t) => t.is_flagged),
    flaggedTaskLabels: (a.application_task ?? []).filter((t) => t.is_flagged).map((t) => t.label),
    notes: (a.application_notes ?? []).map((n) => ({
      text: n.text,
      authorName: n.author_name,
      createdAt: n.created_at,
    })),
    preInterviewAnswers: answers,
  }
}

async function buildStageNameMap(companyId: string): Promise<Map<string, string>> {
  const { data } = await getPipelineStages(companyId)
  const map = new Map<string, string>()
  for (const s of data) {
    map.set(s.id, s.name)
  }
  return map
}

// Full row shape, including the worker's skills/certs/work-history and notes.
// Only the slideover detail view (getApplicantDetail) needs these nested
// relations — they are expensive to fetch per applicant.
const APPLICANT_SELECT = `
  *,
  worker_profiles!inner(
    id, first_name, last_name, avatar_url, primary_trade, city, region, is_regulix_ready,
    worker_skills(name, years_exp),
    worker_certifications(cert_name, issuing_body, expiry_date),
    worker_work_history(employer_name, role_title, start_date, end_date, is_current),
    worker_references(id, name, company, phone, email)
  ),
  jobs!inner(id, title, status, company_id),
  application_notes(text, author_name, created_at),
  application_task(label, is_flagged)
`

// Lightweight row shape for the dashboard list/kanban widgets, which render
// only name, avatar, job, stage, and signal icons (flags). Drops the worker's
// skills/certs/work-history and notes — those load on demand via
// getApplicantDetail when the slideover opens.
const WIDGET_SELECT = `
  *,
  worker_profiles!inner(
    id, first_name, last_name, avatar_url, primary_trade, city, region, is_regulix_ready
  ),
  jobs!inner(id, title, status, company_id),
  application_task(label, is_flagged)
`

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Dashboard widget: most recent applicants in the active pipeline.
 * Excludes terminal applications (hired, rejected, withdrawn, archived).
 * Sorted newest-applied first.
 */
export async function getRecentApplicants(
  companyId: string,
  limit = 5
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const [{ data, error }, stageNameMap] = await Promise.all([
    supabase
      .from('applications')
      .select(WIDGET_SELECT)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit),
    buildStageNameMap(companyId),
  ])

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row) =>
      toCompanyApplicant(row as unknown as JoinedApplicantRow, stageNameMap)
    ),
    error: null,
  }
}

/**
 * Pipeline kanban board: all active applicants across all jobs for the
 * company. Flat list — caller groups by `currentStageId` client-side.
 * Newest-applied first.
 */
export async function getKanbanApplicants(
  companyId: string
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const [{ data, error }, stageNameMap] = await Promise.all([
    supabase
      .from('applications')
      .select(WIDGET_SELECT)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    buildStageNameMap(companyId),
  ])

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row) =>
      toCompanyApplicant(row as unknown as JoinedApplicantRow, stageNameMap)
    ),
    error: null,
  }
}

/**
 * Full detail for a single applicant, including the worker's skills,
 * certifications, and work history. Used by the slideover summary tab, which
 * opens from the lightweight list/kanban widgets and hydrates the heavy
 * relations on demand.
 */
export async function getApplicantDetail(
  applicationId: string,
  companyId: string
): Promise<{ data: CompanyApplicant | null; error: string | null }> {
  const [{ data, error }, stageNameMap] = await Promise.all([
    supabase.from('applications').select(APPLICANT_SELECT).eq('id', applicationId).maybeSingle(),
    buildStageNameMap(companyId),
  ])

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return {
    data: toCompanyApplicant(data as unknown as JoinedApplicantRow, stageNameMap),
    error: null,
  }
}

export type WidgetFilters = {
  search: string
  jobId: string | 'all'
  regulixOnly: boolean
}

export const DEFAULT_WIDGET_FILTERS: WidgetFilters = {
  search: '',
  jobId: 'all',
  regulixOnly: false,
}

/**
 * Dashboard applicants widget: up to `limit` most recently active applicants
 * across all jobs, sorted by last-activity descending.
 * Returns total pre-filter count for "+N more" affordances.
 */
export async function getWidgetApplicants(
  companyId: string,
  filters: WidgetFilters = DEFAULT_WIDGET_FILTERS,
  limit = 15
): Promise<{ data: CompanyApplicant[]; total: number; error: string | null }> {
  let q = supabase
    .from('applications')
    .select(WIDGET_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('status_updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.jobId !== 'all') q = q.eq('job_id', filters.jobId)
  if (FEATURES.regulix && filters.regulixOnly) q = q.eq('worker_profiles.is_regulix_ready', true)

  const [{ data, error, count }, stageNameMap] = await Promise.all([
    q,
    buildStageNameMap(companyId),
  ])
  if (error) return { data: [], total: 0, error: error.message }

  let rows = (data ?? []).map((row) =>
    toCompanyApplicant(row as unknown as JoinedApplicantRow, stageNameMap)
  )

  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) => r.workerFullName.toLowerCase().includes(s) || r.jobTitle.toLowerCase().includes(s)
    )
  }

  return { data: rows, total: count ?? rows.length, error: null }
}

/**
 * Count applicants that arrived after the given ISO timestamp. Used to render
 * a "# since last login" badge on the dashboard.
 */
export async function countNewApplicantsSince(
  companyId: string,
  sinceIso: string | null
): Promise<{ count: number; error: string | null }> {
  let q = supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
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

  // List rows only need the lightweight shape — the slideover hydrates the
  // heavy nested relations on demand via getApplicantDetail.
  let q = supabase
    .from('applications')
    .select(WIDGET_SELECT, { count: 'exact' })
    .eq('company_id', companyId)

  // When showArchived is false only show active applications; otherwise include all statuses.
  if (!filters.showArchived) {
    q = q.eq('status', 'active')
  }

  if (filters.stageId !== 'all') q = q.eq('current_stage_id', filters.stageId)
  if (filters.jobId !== 'all') q = q.eq('job_id', filters.jobId)
  if (filters.appliedFrom) q = q.gte('created_at', filters.appliedFrom)
  if (filters.appliedTo) q = q.lte('created_at', filters.appliedTo)
  if (FEATURES.regulix && filters.regulixOnly) q = q.eq('worker_profiles.is_regulix_ready', true)

  // Server-side search: match worker name OR job title. PostgREST can't OR
  // across two embedded tables in one filter, so we prefilter each side with
  // a cheap id-only query and OR the id lists into the main query. This also
  // fixes pagination/totals, which the old fetch-page-then-filter approach
  // got wrong (it only searched within the current page).
  if (filters.search.trim()) {
    const tokens = filters.search
      .trim()
      .split(/\s+/)
      // Escape LIKE metacharacters so a typed `%` or `_` doesn't widen the match.
      .map((t) => t.replace(/[%_\\]/g, '\\$&'))

    let nameQ = supabase
      .from('applications')
      .select('id, worker_profiles!inner(id)')
      .eq('company_id', companyId)
    // Every token must match the first or last name ("john sm" → John Smith).
    for (const t of tokens) {
      nameQ = nameQ.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%`, {
        foreignTable: 'worker_profiles',
      })
    }

    const wholeTerm = tokens.join(' ')
    const [nameRes, jobRes] = await Promise.all([
      nameQ,
      supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyId)
        .ilike('title', `%${wholeTerm}%`),
    ])
    if (nameRes.error) return { data: [], total: 0, error: nameRes.error.message }
    if (jobRes.error) return { data: [], total: 0, error: jobRes.error.message }

    const appIds = (nameRes.data ?? []).map((r) => r.id)
    const jobIds = (jobRes.data ?? []).map((r) => r.id)
    if (appIds.length === 0 && jobIds.length === 0) {
      return { data: [], total: 0, error: null }
    }
    const orParts: string[] = []
    if (appIds.length > 0) orParts.push(`id.in.(${appIds.join(',')})`)
    if (jobIds.length > 0) orParts.push(`job_id.in.(${jobIds.join(',')})`)
    q = q.or(orParts.join(','))
  }

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

  const [{ data, error, count }, stageNameMap] = await Promise.all([
    q,
    buildStageNameMap(companyId),
  ])
  if (error) return { data: [], total: 0, error: error.message }

  const rows = (data ?? []).map((row) =>
    toCompanyApplicant(row as unknown as JoinedApplicantRow, stageNameMap)
  )

  return { data: rows, total: count ?? rows.length, error: null }
}

/**
 * Convenience: unique (jobId, jobTitle) pairs across all applicants for a
 * company. Used to populate the "Job" filter dropdown on the full page.
 */
export async function getJobFilterOptions(
  companyId: string
): Promise<{ data: Array<{ id: string; title: string }>; error: string | null }> {
  // One row per job (with an aggregate application count), not one row per
  // application — keeps this constant-size as the applicant pool grows.
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, applications(count)')
    .eq('company_id', companyId)

  if (error) return { data: [], error: error.message }

  type JobFilterRow = { id: string; title: string; applications: Array<{ count: number }> }
  return {
    data: (data ?? [])
      .map((row) => row as unknown as JobFilterRow)
      .filter((row) => (row.applications?.[0]?.count ?? 0) > 0)
      .map(({ id, title }) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })),
    error: null,
  }
}

/**
 * Returns all applications a given worker has filed at this company.
 * Sorted newest-applied first. Used by the per-worker company view.
 */
export async function getWorkerApplicationsAtCompany(
  workerId: string,
  companyId: string
): Promise<{ data: CompanyApplicant[]; error: string | null }> {
  const [{ data, error }, stageNameMap] = await Promise.all([
    supabase
      .from('applications')
      .select(APPLICANT_SELECT)
      .eq('worker_id', workerId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    buildStageNameMap(companyId),
  ])

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row) =>
      toCompanyApplicant(row as unknown as JoinedApplicantRow, stageNameMap)
    ),
    error: null,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────

/** Move an applicant to the next stage by explicit stage UUID. */
export async function advanceApplicant(
  applicationId: string,
  nextStageId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ current_stage_id: nextStageId } as unknown as Record<string, unknown>)
    .eq('id', applicationId)
  if (error) return { error: error.message }
  await instantiateTemplatesForStage(applicationId, nextStageId)
  return { error: null }
}

/** Set an applicant's current stage to any arbitrary stage UUID. */
export async function setApplicantStage(
  applicationId: string,
  stageId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ current_stage_id: stageId } as unknown as Record<string, unknown>)
    .eq('id', applicationId)
  if (error) return { error: error.message }
  await instantiateTemplatesForStage(applicationId, stageId)
  return { error: null }
}

export async function rejectApplicant(applicationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'terminal_rejected' } as unknown as Record<string, unknown>)
    .eq('id', applicationId)
  return { error: error?.message ?? null }
}

export async function hireApplicant(applicationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'terminal_hired' } as unknown as Record<string, unknown>)
    .eq('id', applicationId)
  return { error: error?.message ?? null }
}

export async function archiveApplicant(applicationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'terminal_archived' } as unknown as Record<string, unknown>)
    .eq('id', applicationId)
  return { error: error?.message ?? null }
}

export async function bulkReject(
  applicationIds: string[]
): Promise<{ affected: number; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'terminal_rejected' } as unknown as Record<string, unknown>)
    .in('id', applicationIds)
    .neq('status', 'terminal_rejected')
    .select('id')
  if (error) return { affected: 0, error: error.message }
  return { affected: data?.length ?? 0, error: null }
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

  const userId = await getCurrentUserId()
  if (!userId) return { error: 'not_authenticated' }

  const { error } = await supabase.from('application_notes').insert({
    application_id: applicationId,
    author_id: userId,
    author_name: authorName,
    text: trimmed,
  })
  return { error: error?.message ?? null }
}
