import { supabase } from '@/lib/supabase'
import type { Application, ApplicationEvent, Job } from '@site/types'
import { daysSince } from '@site/utils/date'

// ── Worker Profile ─────────────────────────────────────────────────────────────

export type WorkerProfileRow = {
  first_name: string | null
  last_name: string | null
  city: string | null
  region: string | null
  primary_trade: string | null
  avatar_url: string | null
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
      'first_name, last_name, city, region, primary_trade, avatar_url, is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked'
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
        viewCount: 0,
        postedDaysAgo: 0,
        createdAt: a.created_at as string,
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

// ── Submit Application ─────────────────────────────────────────────────────────

export async function submitApplication(
  workerId: string,
  jobId: string,
  notes: string,
  isBoosted: boolean
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      worker_id: workerId,
      job_id: jobId,
      notes,
      is_boosted: isBoosted,
      status: 'Applied',
    })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  return { id: data.id, error: null }
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
        viewCount: 0,
        postedDaysAgo: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
      }
    }),
    error: null,
  }
}

// ── Full Worker Profile (view page) ───────────────────────────────────────────

export type FullWorkerProfile = {
  firstName: string
  lastName: string
  city: string
  region: string
  phone: string
  primaryTrade: string
  bio: string
  avatarUrl: string | null
  resumeUrl: string | null
  isRegulixReady: boolean
  performanceScore: number | null
  profileCompletePct: number
  totalHoursWorked: number | null
  industries: string[]
  skills: { id: string; name: string; yearsExp: number | null; industryId: string | null }[]
  certifications: {
    id: string
    certName: string
    issuingBody: string
    earnedDate: string | null
  }[]
  socialLinks: { id: string; platform: string; url: string }[]
  workHistory: {
    id: string
    employerName: string
    roleTitle: string
    startDate: string | null
    endDate: string | null
    isCurrent: boolean
    contractType: string
    industryId: string | null
    description: string
  }[]
}

export async function getFullWorkerProfile(
  userId: string
): Promise<{ data: FullWorkerProfile | null; error: string | null }> {
  const [
    profileRes,
    industriesRes,
    skillsRes,
    certsRes,
    socialLinksRes,
    workHistoryRes,
    resumeRes,
  ] = await Promise.all([
    supabase
      .from('worker_profiles')
      .select(
        'first_name, last_name, city, region, phone, primary_trade, bio, avatar_url, is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked'
      )
      .eq('id', userId)
      .single(),
    supabase.from('worker_industries').select('industry_id').eq('worker_id', userId),
    supabase
      .from('worker_skills')
      .select('id, name, years_exp, industry_id')
      .eq('worker_id', userId),
    supabase
      .from('worker_certifications')
      .select('id, cert_name, issuing_body, expiry_date')
      .eq('worker_id', userId),
    supabase.from('worker_social_links').select('id, platform, url').eq('worker_id', userId),
    supabase
      .from('worker_work_history')
      .select(
        'id, employer_name, role_title, start_date, end_date, is_current, contract_type, industry_id, description'
      )
      .eq('worker_id', userId)
      .order('start_date', { ascending: false }),
    supabase
      .from('worker_resumes')
      .select('file_path')
      .eq('worker_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileRes.error) return { data: null, error: profileRes.error.message }
  if (!profileRes.data) return { data: null, error: 'Profile not found' }

  const p = profileRes.data

  return {
    data: {
      firstName: p.first_name ?? '',
      lastName: p.last_name ?? '',
      city: p.city ?? '',
      region: p.region ?? '',
      phone: p.phone ?? '',
      primaryTrade: p.primary_trade ?? '',
      bio: p.bio ?? '',
      avatarUrl: p.avatar_url ?? null,
      resumeUrl: resumeRes.data?.file_path
        ? supabase.storage.from('resumes').getPublicUrl(resumeRes.data.file_path).data.publicUrl
        : null,
      isRegulixReady: p.is_regulix_ready,
      performanceScore: p.performance_score,
      profileCompletePct: p.profile_complete_pct,
      totalHoursWorked: p.total_hours_worked,
      industries: (industriesRes.data ?? []).map((r) => r.industry_id),
      skills: (skillsRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        yearsExp: r.years_exp,
        industryId: r.industry_id,
      })),
      certifications: (certsRes.data ?? []).map((r) => ({
        id: r.id,
        certName: r.cert_name,
        issuingBody: r.issuing_body,
        earnedDate: r.expiry_date,
      })),
      socialLinks: (socialLinksRes.data ?? []).map((r) => ({
        id: r.id,
        platform: r.platform,
        url: r.url,
      })),
      workHistory: (workHistoryRes.data ?? []).map((r) => ({
        id: r.id,
        employerName: r.employer_name,
        roleTitle: r.role_title,
        startDate: r.start_date ? r.start_date.slice(0, 7) : null,
        endDate: r.end_date ? r.end_date.slice(0, 7) : null,
        isCurrent: r.is_current,
        contractType: r.contract_type,
        industryId: r.industry_id,
        description: r.description,
      })),
    },
    error: null,
  }
}

// ── Avatar Upload ──────────────────────────────────────────────────────────────

export async function uploadWorkerAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Bust cache so the new image shows immediately
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}

export async function updateWorkerAvatarUrl(
  userId: string,
  avatarUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('worker_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
  if (error) return { error: error.message }
  return { error: null }
}

// ── Resume Upload ──────────────────────────────────────────────────────────────

export async function uploadWorkerResume(
  userId: string,
  file: File
): Promise<{ error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const path = `${userId}/${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const sizeKb = Math.round(file.size / 1024)
  const { error: dbError } = await supabase.from('worker_resumes').insert({
    worker_id: userId,
    filename: file.name,
    file_path: path,
    file_type: ext as 'pdf' | 'doc' | 'docx',
    size_kb: sizeKb,
    is_primary: true,
  })

  if (dbError) return { error: dbError.message }
  return { error: null }
}

// ── Upsert Worker Profile ──────────────────────────────────────────────────────

export type UpsertWorkerProfileParams = {
  p_first_name: string
  p_last_name: string
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
