import { supabase } from '@/lib/supabase'
import { daysSince } from '@site/utils/date'
import type { Job } from '@site/types'

// ── Get all active jobs (worker browse) ───────────────────────────────────────

export async function getJobs(): Promise<{ data: Job[]; error: string | null }> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, company_id, title, industry, industry_slug, type, location, pay_min, pay_max, pay_type, description, requirements, skills, is_sponsored, regulix_ready_applicants, total_applicants, status, pre_interview_questions, auto_pause_limit, experience_level, created_at, company_profiles(id, name, is_verified, location, description, size, website, industry)'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  const jobs: Job[] = data.map((d) => {
    const cp = d.company_profiles as unknown as {
      id: string
      name: string
      is_verified: boolean
      location: string
      description: string
      size: string
      website: string
      industry: string
    } | null

    return {
      id: d.id,
      companyId: d.company_id,
      title: d.title,
      industry: d.industry ?? '',
      industrySlug: d.industry_slug ?? '',
      type: (d.type as Job['type']) ?? 'Full-time',
      location: d.location ?? '',
      payMin: d.pay_min ?? 0,
      payMax: d.pay_max ?? 0,
      payType: (d.pay_type as Job['payType']) ?? 'hour',
      description: d.description ?? '',
      requirements: (d.requirements as string[]) ?? [],
      skills: (d.skills as string[]) ?? [],
      isSponsored: d.is_sponsored ?? false,
      regulixReadyApplicants: d.regulix_ready_applicants ?? 0,
      totalApplicants: d.total_applicants ?? 0,
      status: d.status ?? 'active',
      postedDaysAgo: daysSince(d.created_at),
      preInterviewQuestions: (d.pre_interview_questions as string[]) ?? [],
      autoPauseLimit: d.auto_pause_limit ?? null,
      experienceLevel: d.experience_level ?? null,
      company: {
        id: cp?.id ?? d.company_id,
        name: cp?.name ?? '',
        logo: '',
        isVerified: cp?.is_verified ?? false,
        industry: cp?.industry ?? d.industry ?? '',
        location: cp?.location ?? d.location ?? '',
        size: cp?.size ?? '',
        website: cp?.website ?? '',
        description: cp?.description ?? '',
      },
    }
  })

  return { data: jobs, error: null }
}

// ── Get job by ID (real Supabase row) ─────────────────────────────────────────

export async function getJobById(id: string): Promise<{ data: Job | null; error: string | null }> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      '*, company_profiles(id, name, is_verified, location, description, size, website, industry)'
    )
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Job not found' }

  const cp = data.company_profiles as unknown as {
    id: string
    name: string
    is_verified: boolean
    location: string
    description: string
    size: string
    website: string
    industry: string
  } | null

  const job: Job = {
    id: data.id,
    companyId: data.company_id,
    title: data.title,
    industry: data.industry ?? '',
    industrySlug: data.industry_slug ?? '',
    type: (data.type as Job['type']) ?? 'Full-time',
    location: data.location ?? '',
    payMin: data.pay_min ?? 0,
    payMax: data.pay_max ?? 0,
    payType: (data.pay_type as Job['payType']) ?? 'hour',
    description: data.description ?? '',
    requirements: (data.requirements as string[]) ?? [],
    skills: (data.skills as string[]) ?? [],
    isSponsored: data.is_sponsored ?? false,
    regulixReadyApplicants: data.regulix_ready_applicants ?? 0,
    totalApplicants: data.total_applicants ?? 0,
    status: data.status ?? 'active',
    postedDaysAgo: daysSince(data.created_at),
    preInterviewQuestions: (data.pre_interview_questions as string[]) ?? [],
    autoPauseLimit: data.auto_pause_limit ?? null,
    experienceLevel: data.experience_level ?? null,
    company: {
      id: cp?.id ?? data.company_id,
      name: cp?.name ?? '',
      logo: '',
      isVerified: cp?.is_verified ?? false,
      industry: cp?.industry ?? data.industry ?? '',
      location: cp?.location ?? data.location ?? '',
      size: cp?.size ?? '',
      website: cp?.website ?? '',
      description: cp?.description ?? '',
    },
  }

  return { data: job, error: null }
}

// ── Create job ────────────────────────────────────────────────────────────────

export type CreateJobParams = {
  company_id: string
  title: string
  industry: string
  industry_slug: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary'
  location: string
  pay_min: number | null
  pay_max: number | null
  pay_type: 'hour' | 'salary'
  description: string
  requirements: string[]
  skills: string[]
  is_sponsored: boolean
  status: 'active' | 'paused' | 'closed'
  pre_interview_questions: string[]
  auto_pause_limit: number | null
  experience_level: string | null
}

export async function updateJob(
  id: string,
  params: Partial<CreateJobParams>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('jobs').update(params).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function createJob(
  params: CreateJobParams
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.from('jobs').insert(params).select('id').single()

  if (error) return { id: null, error: error.message }
  return { id: data.id, error: null }
}
