import { supabase, untypedDb } from '@/lib/supabase'
import type { Json } from '@/lib/database.types'
import type { Job } from '@site/types'
import { daysSince } from '@site/utils/date'
import { invalidateSessionCache, withSessionCache } from '@site/utils/sessionCache'
import { FEATURES } from '@site/config/features'

// ── Types ──────────────────────────────────────────────────────────────────────

type DbJob = {
  id: string
  company_id: string
  title: string
  industry: string
  industry_slug: string
  type: string
  location: string
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  description: string
  requirements: string[]
  skills: string[]
  is_sponsored: boolean
  regulix_ready_applicants: number
  total_applicants: number
  status: string
  created_at: string
  experience_level: string | null
  pre_interview_questions: string[]
  urgent_hiring: boolean
  regulix_preferred: boolean
  auto_pause_limit: number | null
  closing_at: string | null
  publish_at: string | null
  latitude: number | null
  longitude: number | null
  company_profiles: {
    id: string
    name: string
    logo_url: string | null
    location: string
    industry: string
    is_verified: boolean
    description: string
    size: string
    website: string
    avg_rating: number
    review_count: number
  } | null
  job_analytics: { views_total: number } | null
  applications: Array<{ count: number }>
}

export type CreateJobParams = {
  companyId: string
  title: string
  industry: string
  industrySlug: string
  type: Job['type']
  location: string
  payMin: number | null
  payMax: number | null
  payType: Job['payType']
  description: string
  requirements: string[]
  skills: string[]
  isSponsored: boolean
  experienceLevel: string | null
  preInterviewQuestions: string[]
  urgentHiring: boolean
  regulixPreferred: boolean
  autoPauseLimit: number | null
  closingAt?: string | null
  /** When set (and in the future), the job is created as 'scheduled' and
   *  auto-publishes at this ISO timestamp. Omit for immediate publish. */
  publishAt?: string | null
  /** Save as a 'draft' instead of publishing. Takes precedence over publishAt. */
  asDraft?: boolean
}

export type UpdateJobParams = Partial<Omit<CreateJobParams, 'companyId'>> & {
  status?: Job['status']
}

// ── Job templates ────────────────────────────────────────────────────────────

/** The job-posting form fields a template captures (everything except the
 *  owning company). Stored as jsonb so it survives as the form grows. */
export type JobTemplatePayload = Omit<CreateJobParams, 'companyId'>

export type JobTemplate = {
  id: string
  name: string
  payload: Partial<JobTemplatePayload>
  createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const JOB_SELECT = `
  id, company_id, title, industry, industry_slug, type, location,
  pay_min, pay_max, pay_type, description, requirements, skills,
  is_sponsored, regulix_ready_applicants, total_applicants, status, created_at,
  experience_level, pre_interview_questions, urgent_hiring, regulix_preferred, auto_pause_limit, closing_at,
  publish_at, latitude, longitude,
  company_profiles(id, name, logo_url, location, industry, is_verified, description, size, website, avg_rating, review_count),
  job_analytics(views_total),
  applications(count)
`

function mapJob(j: DbJob): Job {
  const co = j.company_profiles
  return {
    id: j.id,
    companyId: j.company_id,
    company: {
      id: co?.id ?? '',
      name: co?.name ?? '',
      logo: co?.logo_url ?? '',
      location: co?.location ?? '',
      industry: co?.industry ?? '',
      isVerified: co?.is_verified ?? false,
      description: co?.description ?? '',
      size: co?.size ?? '',
      website: co?.website ?? '',
      avgRating: co?.avg_rating,
      reviewCount: co?.review_count,
    },
    title: j.title,
    industry: j.industry,
    industrySlug: j.industry_slug,
    type: j.type as Job['type'],
    location: j.location,
    payMin: j.pay_min ?? 0,
    payMax: j.pay_max ?? 0,
    payType: (j.pay_type ?? 'hour') as Job['payType'],
    description: j.description,
    requirements: j.requirements ?? [],
    skills: j.skills ?? [],
    isSponsored: j.is_sponsored,
    regulixReadyApplicants: j.regulix_ready_applicants,
    totalApplicants: j.applications?.[0]?.count ?? j.total_applicants,
    viewCount: j.job_analytics?.views_total ?? 0,
    postedDaysAgo: daysSince(j.created_at),
    createdAt: j.created_at,
    status: j.status as Job['status'],
    experienceLevel: j.experience_level ?? null,
    preInterviewQuestions: j.pre_interview_questions ?? [],
    urgentHiring: j.urgent_hiring ?? false,
    regulixPreferred: j.regulix_preferred ?? false,
    autoPauseLimit: j.auto_pause_limit ?? null,
    closingAt: j.closing_at ?? null,
    publishAt: j.publish_at ?? null,
    latitude: j.latitude ?? null,
    longitude: j.longitude ?? null,
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

export type SearchJobsParams = {
  search?: string
  industries?: string[]
  types?: string[]
  sponsoredOnly?: boolean
  regulixOnly?: boolean
  payMin?: number | null
  payMax?: number | null
  anchorLat?: number | null
  anchorLng?: number | null
  radiusMi?: number | null
  sort?: 'recent' | 'pay' | 'applicants' | 'nearest'
  page?: number
  pageSize?: number
}

/**
 * Server-side jobs board query. Filtering, search (title / company name /
 * skills / industry), distance, sort, and pagination all happen in Postgres
 * via the search_jobs RPC; we then hydrate full rows for just the returned
 * page of ids. Replaces the old getJobs(), which fetched every active job
 * on the platform and filtered client-side.
 */
export async function searchJobs(
  params: SearchJobsParams = {}
): Promise<{ data: Job[]; total: number; error: string | null }> {
  const { data: pageRows, error: rpcError } = await supabase.rpc('search_jobs', {
    p_search: params.search?.trim() || null,
    p_industries: params.industries?.length ? params.industries : null,
    p_types: params.types?.length ? params.types : null,
    p_sponsored_only: params.sponsoredOnly ?? false,
    p_regulix_only: FEATURES.regulix ? (params.regulixOnly ?? false) : false,
    p_pay_min: params.payMin ?? null,
    p_pay_max: params.payMax ?? null,
    p_anchor_lat: params.anchorLat ?? null,
    p_anchor_lng: params.anchorLng ?? null,
    p_radius_mi: params.radiusMi ?? null,
    p_sort: params.sort ?? 'recent',
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 5,
  })

  if (rpcError) return { data: [], total: 0, error: rpcError.message }
  if (!pageRows || pageRows.length === 0) return { data: [], total: 0, error: null }

  const ids = pageRows.map((r) => r.job_id)
  const { data, error } = await supabase.from('jobs').select(JOB_SELECT).in('id', ids)
  if (error) return { data: [], total: 0, error: error.message }

  // .in() loses the RPC's ordering; restore it and attach distance.
  const byId = new Map((data ?? []).map((j) => [(j as unknown as DbJob).id, j]))
  const jobs: Job[] = []
  for (const row of pageRows) {
    const raw = byId.get(row.job_id)
    if (!raw) continue
    const job = mapJob(raw as unknown as DbJob)
    job.distanceMi = row.distance_mi
    jobs.push(job)
  }

  return { data: jobs, total: pageRows[0].total_count, error: null }
}

/**
 * Jobs-per-industry and jobs-per-type tallies for the filter sidebar,
 * aggregated in Postgres (previously tallied client-side over a full
 * job-list fetch).
 */
export async function getJobFacetCounts(): Promise<{
  data: { industries: Record<string, number>; types: Record<string, number> }
  error: string | null
}> {
  // Facet counts aggregate every active job and change slowly. Cache for the
  // page session so revisiting the jobs board doesn't re-run the RPC on each
  // mount; the cache clears on refresh and on logout (clearSessionCache).
  return withSessionCache('job_facet_counts', 'global', async () => {
    const { data, error } = await supabase.rpc('get_job_facet_counts')
    if (error) return { data: { industries: {}, types: {} }, error: error.message }

    const industries: Record<string, number> = {}
    const types: Record<string, number> = {}
    for (const row of data ?? []) {
      industries[row.industry_slug] = (industries[row.industry_slug] ?? 0) + row.job_count
      types[row.job_type] = (types[row.job_type] ?? 0) + row.job_count
    }
    return { data: { industries, types }, error: null }
  })
}

export async function getJobById(id: string): Promise<{ data: Job | null; error: string | null }> {
  const { data, error } = await supabase.from('jobs').select(JOB_SELECT).eq('id', id).maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }

  return { data: mapJob(data as unknown as DbJob), error: null }
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function getSimilarJobs(
  jobId: string,
  industry: string
): Promise<{ data: Job[]; error: string | null }> {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('status', 'active')
    .eq('industry', industry)
    .neq('id', jobId)
    .limit(4)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((j) => mapJob(j as unknown as DbJob)), error: null }
}

export async function getAppliedJobIds(
  workerId: string
): Promise<{ data: Array<{ jobId: string; appliedAt: string }>; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('job_id, created_at')
    .eq('worker_id', workerId)

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      jobId: r.job_id as string,
      appliedAt: r.created_at as string,
    })),
    error: null,
  }
}

export async function submitApplication(
  jobId: string,
  workerId: string,
  coverNote: string,
  isBoosted: boolean,
  questionAnswers: Array<{ question: string; answer: string }> = []
): Promise<{ error: string | null }> {
  const { data: jobRow, error: jobErr } = await supabase
    .from('jobs')
    .select('company_id')
    .eq('id', jobId)
    .single()
  if (jobErr || !jobRow) return { error: jobErr?.message ?? 'job_not_found' }

  const db = untypedDb
  const { data: firstStage } = await db
    .from('pipeline_stage')
    .select('id, company_pipeline!inner(company_id)')
    .eq('company_pipeline.company_id', jobRow.company_id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .single()

  const stageId = (firstStage as { id: string } | null)?.id
  if (!stageId) return { error: 'no_pipeline_stages' }

  const payload: Record<string, unknown> = {
    job_id: jobId,
    worker_id: workerId,
    notes: coverNote,
    is_boosted: isBoosted,
    status: 'active',
    current_stage_id: stageId,
  }
  if (questionAnswers.length > 0) {
    payload.interview_answers = questionAnswers
  }
  const { error } = await db.from('applications').insert(payload)

  if (error) {
    if (error.code === '23505') return { error: 'already_applied' }
    return { error: error.message }
  }
  return { error: null }
}

async function fetchPipelineSnapshot(companyId: string): Promise<Json> {
  const db = untypedDb

  const { data: pipeline } = await db
    .from('company_pipeline')
    .select('id')
    .eq('company_id', companyId)
    .single()

  const pipelineRow = pipeline as { id: string } | null
  if (!pipelineRow) return { stages: [] }

  const { data: stages } = await db
    .from('pipeline_stage')
    .select('id, name, sort_order')
    .eq('pipeline_id', pipelineRow.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (!stages) return { stages: [] }

  return {
    stages: (stages as Array<{ id: string; name: string; sort_order: number }>).map((s) => ({
      id: s.id,
      name: s.name,
      order: s.sort_order,
      triggers: [],
      task_template: [],
    })),
  }
}

export async function createJob(
  params: CreateJobParams
): Promise<{ data: { id: string } | null; error: string | null }> {
  const snapshot = await fetchPipelineSnapshot(params.companyId)

  // A future publish_at parks the job as 'scheduled'; publish_scheduled_jobs()
  // flips it to 'active' when the time arrives. A draft takes precedence.
  const scheduled =
    !params.asDraft && !!params.publishAt && new Date(params.publishAt).getTime() > Date.now()
  const status = params.asDraft ? 'draft' : scheduled ? 'scheduled' : 'active'

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: params.companyId,
      title: params.title,
      industry: params.industry,
      industry_slug: params.industrySlug,
      type: params.type,
      location: params.location,
      pay_min: params.payMin,
      pay_max: params.payMax,
      pay_type: params.payType,
      description: params.description,
      requirements: params.requirements,
      skills: params.skills,
      is_sponsored: params.isSponsored,
      experience_level: params.experienceLevel,
      pre_interview_questions: params.preInterviewQuestions,
      urgent_hiring: params.urgentHiring,
      regulix_preferred: params.regulixPreferred,
      auto_pause_limit: params.autoPauseLimit,
      closing_at: params.closingAt ?? null,
      publish_at: scheduled ? params.publishAt : null,
      status,
      pipeline_snapshot: snapshot,
    })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }
  // Discover's active-jobs dropdown caches in session; new job invalidates it.
  invalidateSessionCache('discover_active_jobs', params.companyId)
  return { data: { id: data.id }, error: null }
}

export async function updateJob(
  id: string,
  params: UpdateJobParams
): Promise<{ error: string | null }> {
  const patch: Record<string, unknown> = {}
  if (params.title !== undefined) patch.title = params.title
  if (params.industry !== undefined) patch.industry = params.industry
  if (params.industrySlug !== undefined) patch.industry_slug = params.industrySlug
  if (params.type !== undefined) patch.type = params.type
  if (params.location !== undefined) patch.location = params.location
  if (params.payMin !== undefined) patch.pay_min = params.payMin
  if (params.payMax !== undefined) patch.pay_max = params.payMax
  if (params.payType !== undefined) patch.pay_type = params.payType
  if (params.description !== undefined) patch.description = params.description
  if (params.requirements !== undefined) patch.requirements = params.requirements
  if (params.skills !== undefined) patch.skills = params.skills
  if (params.isSponsored !== undefined) patch.is_sponsored = params.isSponsored
  if (params.experienceLevel !== undefined) patch.experience_level = params.experienceLevel
  if (params.preInterviewQuestions !== undefined)
    patch.pre_interview_questions = params.preInterviewQuestions
  if (params.urgentHiring !== undefined) patch.urgent_hiring = params.urgentHiring
  if (params.regulixPreferred !== undefined) patch.regulix_preferred = params.regulixPreferred
  if (params.autoPauseLimit !== undefined) patch.auto_pause_limit = params.autoPauseLimit
  if (params.closingAt !== undefined) patch.closing_at = params.closingAt
  if (params.publishAt !== undefined) patch.publish_at = params.publishAt
  if (params.status !== undefined) patch.status = params.status

  const { error } = await supabase.from('jobs').update(patch).eq('id', id)
  if (error) return { error: error.message }
  // Title/status edits change the dropdown; cheaper to invalidate than diff.
  const { data: row } = await supabase.from('jobs').select('company_id').eq('id', id).maybeSingle()
  if (row?.company_id) {
    invalidateSessionCache('discover_active_jobs', row.company_id)
  }
  return { error: null }
}

/** Hard-delete a job. Intended for drafts (never public); RLS restricts
 *  deletion to the owning company. */
export async function deleteJob(id: string): Promise<{ error: string | null }> {
  const { data: row } = await supabase.from('jobs').select('company_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) return { error: error.message }
  if (row?.company_id) invalidateSessionCache('discover_active_jobs', row.company_id)
  return { error: null }
}

export async function getCompanyJobs(
  companyId: string,
  opts: { activeOnly?: boolean } = {}
): Promise<{ data: Job[]; error: string | null }> {
  let q = supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (opts.activeOnly) q = q.eq('status', 'active')

  const { data, error } = await q

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  return { data: data.map((j) => mapJob(j as unknown as DbJob)), error: null }
}

// ── Job template mutations ───────────────────────────────────────────────────

export async function getCompanyTemplates(
  companyId: string
): Promise<{ data: JobTemplate[]; error: string | null }> {
  const { data, error } = await supabase
    .from('job_templates')
    .select('id, name, payload, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      payload: (t.payload ?? {}) as Partial<JobTemplatePayload>,
      createdAt: t.created_at,
    })),
    error: null,
  }
}

export async function saveJobTemplate(
  companyId: string,
  name: string,
  payload: Partial<JobTemplatePayload>
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('job_templates')
    .insert({ company_id: companyId, name, payload: payload as unknown as Json })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: { id: data.id }, error: null }
}

export async function deleteJobTemplate(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('job_templates').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export async function getCompanyIndustry(
  companyId: string
): Promise<{ data: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('industry')
    .eq('id', companyId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data?.industry as string | null) ?? null, error: null }
}
