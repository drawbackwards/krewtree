import { supabase } from '@/lib/supabase'
import type { Job } from '@site/types'
import { daysSince } from '@site/utils/date'

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
}

export type UpdateJobParams = Partial<Omit<CreateJobParams, 'companyId'>> & {
  status?: Job['status']
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const JOB_SELECT = `
  id, company_id, title, industry, industry_slug, type, location,
  pay_min, pay_max, pay_type, description, requirements, skills,
  is_sponsored, regulix_ready_applicants, total_applicants, status, created_at,
  experience_level, pre_interview_questions, urgent_hiring, regulix_preferred, auto_pause_limit,
  company_profiles(id, name, logo_url, location, industry, is_verified, description, size, website, avg_rating, review_count)
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
    totalApplicants: j.total_applicants,
    postedDaysAgo: daysSince(j.created_at),
    status: j.status as Job['status'],
    experienceLevel: j.experience_level ?? null,
    preInterviewQuestions: j.pre_interview_questions ?? [],
    urgentHiring: j.urgent_hiring ?? false,
    regulixPreferred: j.regulix_preferred ?? false,
    autoPauseLimit: j.auto_pause_limit ?? null,
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getJobs(): Promise<{ data: Job[]; error: string | null }> {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  return { data: data.map((j) => mapJob(j as unknown as DbJob)), error: null }
}

export async function getJobById(id: string): Promise<{ data: Job | null; error: string | null }> {
  const { data, error } = await supabase.from('jobs').select(JOB_SELECT).eq('id', id).maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }

  return { data: mapJob(data as unknown as DbJob), error: null }
}

// ── Mutations ──────────────────────────────────────────────────────────────────

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
  const base = {
    job_id: jobId,
    worker_id: workerId,
    notes: coverNote,
    is_boosted: isBoosted,
    status: 'Applied' as const,
  }
  const { error } = await supabase
    .from('applications')
    .insert(
      questionAnswers.length > 0
        ? ({ ...base, interview_answers: questionAnswers } as typeof base)
        : base
    )

  if (error) {
    if (error.code === '23505') return { error: 'already_applied' }
    return { error: error.message }
  }
  return { error: null }
}

export async function createJob(
  params: CreateJobParams
): Promise<{ data: { id: string } | null; error: string | null }> {
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
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }
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
  if (params.status !== undefined) patch.status = params.status

  const { error } = await supabase.from('jobs').update(patch).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
