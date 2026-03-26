import { supabase } from '@/lib/supabase'
import type { Application, ApplicationEvent, Job } from '@site/types'
import { daysSince } from '@site/utils/date'

// ── Worker Profile ─────────────────────────────────────────────────────────────

export type WorkerProfileRow = {
  full_name: string | null
  city: string | null
  region: string | null
  is_regulix_ready: boolean
  performance_score: number | null
  profile_complete_pct: number
  total_hours_worked: number | null
}

export async function getWorkerProfile(
  userId: string
): Promise<{ data: WorkerProfileRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(
      'full_name, city, region, is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked'
    )
    .eq('id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Applications ───────────────────────────────────────────────────────────────

export async function getWorkerApplications(
  userId: string
): Promise<{ data: Application[]; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, status, is_boosted, created_at, job_id, jobs(id, title, industry, industry_slug, type, location, pay_min, pay_max, pay_type, is_sponsored, company_profiles(id, name))'
    )
    .eq('worker_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  const mapped: Application[] = data.map((a) => {
    const j = a.jobs as unknown as {
      id: string
      title: string
      industry: string
      industry_slug: string
      type: string
      location: string
      pay_min: number
      pay_max: number
      pay_type: string
      is_sponsored: boolean
      company_profiles: { id: string; name: string }
    } | null

    return {
      id: a.id,
      jobId: a.job_id,
      status: a.status as Application['status'],
      isBoosted: a.is_boosted,
      appliedDaysAgo: daysSince(a.created_at),
      job: {
        id: j?.id ?? '',
        companyId: j?.company_profiles?.id ?? '',
        company: {
          id: j?.company_profiles?.id ?? '',
          name: j?.company_profiles?.name ?? '',
          logo: '',
          location: '',
          industry: '',
          isVerified: false,
          description: '',
          size: '',
          website: '',
        },
        title: j?.title ?? '',
        industry: j?.industry ?? '',
        industrySlug: j?.industry_slug ?? '',
        type: (j?.type ?? 'Full-time') as Job['type'],
        location: j?.location ?? '',
        payMin: j?.pay_min ?? 0,
        payMax: j?.pay_max ?? 0,
        payType: (j?.pay_type ?? 'hour') as Job['payType'],
        description: '',
        requirements: [],
        skills: [],
        isSponsored: j?.is_sponsored ?? false,
        regulixReadyApplicants: 0,
        totalApplicants: 0,
        postedDaysAgo: 0,
        status: 'active',
      },
    }
  })

  return { data: mapped, error: null }
}

// ── Application Events ─────────────────────────────────────────────────────────

export async function getApplicationEvents(
  applicationIds: string[]
): Promise<{ data: ApplicationEvent[]; error: string | null }> {
  if (applicationIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('application_events')
    .select('id, application_id, status, note, created_at')
    .in('application_id', applicationIds)

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  return {
    data: data.map((e) => ({
      id: e.id,
      applicationId: e.application_id,
      status: e.status as Application['status'],
      note: e.note,
      occurredDaysAgo: daysSince(e.created_at),
    })),
    error: null,
  }
}

// ── Saved Jobs ─────────────────────────────────────────────────────────────────

export async function getSavedJobsCount(
  userId: string
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from('saved_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('worker_id', userId)

  if (error) return { count: 0, error: error.message }
  return { count: count ?? 0, error: null }
}

// ── Recommended Jobs ───────────────────────────────────────────────────────────

export async function getRecommendedJobs(
  limit = 3
): Promise<{ data: Job[]; error: string | null }> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, title, industry, industry_slug, type, location, pay_min, pay_max, pay_type, is_sponsored, company_profiles(id, name)'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  return {
    data: data.map((j) => {
      const co = j.company_profiles as unknown as { id: string; name: string } | null
      return {
        id: j.id,
        companyId: co?.id ?? '',
        company: {
          id: co?.id ?? '',
          name: co?.name ?? '',
          logo: '',
          location: '',
          industry: '',
          isVerified: false,
          description: '',
          size: '',
          website: '',
        },
        title: j.title,
        industry: j.industry,
        industrySlug: j.industry_slug,
        type: j.type as Job['type'],
        location: j.location,
        payMin: j.pay_min ?? 0,
        payMax: j.pay_max ?? 0,
        payType: (j.pay_type ?? 'hour') as Job['payType'],
        description: '',
        requirements: [],
        skills: [],
        isSponsored: j.is_sponsored,
        regulixReadyApplicants: 0,
        totalApplicants: 0,
        postedDaysAgo: 0,
        status: 'active',
      }
    }),
    error: null,
  }
}

// ── Upsert Worker Profile ──────────────────────────────────────────────────────

export type UpsertWorkerProfileParams = {
  p_full_name: string
  p_city: string
  p_region: string
  p_phone: string
  p_primary_trade: string
  p_bio: string
  p_industries: string[]
  p_skills: { skill_id: string | null; name: string; years_exp: number | null; source: string }[]
  p_certs: { cert_name: string; issuing_body: string; expiry_date: string | null }[]
  p_social_links: { platform: string; url: string }[]
  p_work_history: {
    employer_name: string
    role_title: string
    start_date: string | null
    end_date: string | null
    is_current: boolean
    contract_type: string
    industry_id: string | null
    description: string
  }[]
}

export async function upsertWorkerProfile(
  params: UpsertWorkerProfileParams
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('upsert_worker_profile', params)
  if (error) return { error: error.message }
  return { error: null }
}
