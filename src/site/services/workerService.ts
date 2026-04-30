import { supabase } from '@/lib/supabase'
import type { Application, ApplicationEvent, Job, SavedJob } from '@site/types'
import { daysSince } from '@site/utils/date'

// ── Worker Profile ─────────────────────────────────────────────────────────────

export type WorkerProfileRow = {
  first_name: string | null
  last_name: string | null
  city: string | null
  region: string | null
  primary_trade: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
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
      'first_name, last_name, city, region, primary_trade, avatar_url, bio, phone, is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked'
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

// ── Dashboard-specific types ───────────────────────────────────────────────────

export type DashboardApplication = {
  id: string
  jobId: string
  jobTitle: string
  companyId: string
  companyName: string
  companyLocation: string
  /** Worker-facing stage — maps from DB status */
  stage: 'Applied' | 'Reviewed' | 'Interview' | 'Offer' | 'Closed'
  appliedAt: string
  isBoosted: boolean
}

export type DashboardSavedJob = {
  id: string
  jobId: string
  jobTitle: string
  companyName: string
  jobStatus: 'active' | 'paused' | 'closed'
  closingAt: string | null
  savedAt: string
  jobPostedAt: string | null
  hasApplied: boolean
  staleness: 'open' | 'expiring_soon' | 'closed'
}

export type JobForYou = {
  jobId: string
  jobTitle: string
  companyName: string
  location: string
  matchScore: number
}

export type WorkerCompleteness = {
  hasPhoto: boolean
  hasBio: boolean
  hasPrimaryTrade: boolean
  hasLocation: boolean
  hasPhone: boolean
  hasSkills: boolean
  hasWorkHistory: boolean
  hasCerts: boolean
  hasResume: boolean
  hasSocialLinks: boolean
}

export type RegulixNudgeData = {
  subState: 'connect' | 'import' | 'complete'
  dismissedAt: string | null
}

// ── Dashboard Applications ─────────────────────────────────────────────────────

const DB_TO_WORKER_STAGE: Record<string, DashboardApplication['stage']> = {
  new: 'Applied',
  reviewed: 'Reviewed',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Offer',
  rejected: 'Closed',
}

export async function getDashboardApplications(
  userId: string,
  limit = 5
): Promise<{ data: DashboardApplication[]; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, kanban_stage, is_boosted, created_at, job_id, jobs(id, title, location, company_profiles(id, name))'
    )
    .eq('worker_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  return {
    data: data.map((a) => {
      const j = a.jobs as unknown as {
        id: string
        title: string
        location: string
        company_profiles: { id: string; name: string } | null
      } | null
      return {
        id: a.id,
        jobId: a.job_id,
        jobTitle: j?.title ?? '',
        companyId: j?.company_profiles?.id ?? '',
        companyName: j?.company_profiles?.name ?? '',
        companyLocation: j?.location ?? '',
        stage: DB_TO_WORKER_STAGE[a.kanban_stage as string] ?? 'Applied',
        appliedAt: a.created_at,
        isBoosted: a.is_boosted,
      }
    }),
    error: null,
  }
}

// ── Withdraw Application ───────────────────────────────────────────────────────

export async function withdrawApplication(
  applicationId: string,
  reason: string,
  message: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'Rejected', notes: message || reason })
    .eq('id', applicationId)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Dashboard Saved Jobs ───────────────────────────────────────────────────────

function computeStaleness(
  jobStatus: string,
  closingAt: string | null
): DashboardSavedJob['staleness'] {
  if (jobStatus === 'closed' || jobStatus === 'paused') return 'closed'
  if (closingAt) {
    const daysUntilClose = Math.ceil((new Date(closingAt).getTime() - Date.now()) / 86_400_000)
    if (daysUntilClose >= 0 && daysUntilClose <= 7) return 'expiring_soon'
  }
  return 'open'
}

export async function getDashboardSavedJobs(
  userId: string,
  limit = 5
): Promise<{ data: DashboardSavedJob[]; error: string | null }> {
  const [savedRes, appliedRes] = await Promise.all([
    supabase
      .from('saved_jobs')
      .select(
        'id, created_at, job_id, jobs(id, title, status, closing_at, created_at, company_profiles(name))'
      )
      .eq('worker_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit * 2),
    supabase.from('applications').select('job_id').eq('worker_id', userId),
  ])

  if (savedRes.error) return { data: [], error: savedRes.error.message }

  const appliedJobIds = new Set((appliedRes.data ?? []).map((a) => a.job_id))

  const rows = (savedRes.data ?? []).map((s) => {
    const j = s.jobs as unknown as {
      id: string
      title: string
      status: string
      closing_at: string | null
      created_at: string
      company_profiles: { name: string } | null
    } | null

    const jobStatus = (j?.status ?? 'active') as DashboardSavedJob['jobStatus']
    const closingAt = j?.closing_at ?? null

    return {
      id: s.id,
      jobId: s.job_id,
      jobTitle: j?.title ?? '',
      companyName: j?.company_profiles?.name ?? '',
      jobStatus,
      closingAt,
      savedAt: s.created_at,
      jobPostedAt: j?.created_at ?? null,
      hasApplied: appliedJobIds.has(s.job_id),
      staleness: computeStaleness(jobStatus, closingAt),
    } satisfies DashboardSavedJob
  })

  // Closed always at bottom; within groups preserve saved-date desc order
  rows.sort((a, b) => {
    const aIsClosed = a.staleness === 'closed' ? 1 : 0
    const bIsClosed = b.staleness === 'closed' ? 1 : 0
    return aIsClosed - bIsClosed
  })

  return { data: rows.slice(0, limit), error: null }
}

// ── Remove Saved Job ───────────────────────────────────────────────────────────

export async function removeSavedJob(savedJobId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('saved_jobs').delete().eq('id', savedJobId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function saveJob(
  userId: string,
  jobId: string
): Promise<{ savedJobId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .insert({ worker_id: userId, job_id: jobId })
    .select('id')
    .single()
  if (error) return { savedJobId: null, error: error.message }
  return { savedJobId: data.id, error: null }
}

export async function getIsSavedJob(
  userId: string,
  jobId: string
): Promise<{ savedJobId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('worker_id', userId)
    .eq('job_id', jobId)
    .maybeSingle()
  if (error) return { savedJobId: null, error: error.message }
  return { savedJobId: data?.id ?? null, error: null }
}

// ── Saved Jobs Page ────────────────────────────────────────────────────────────

export async function getSavedJobs(
  userId: string
): Promise<{ data: SavedJob[]; error: string | null }> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(
      `
      id,
      created_at,
      note,
      job_id,
      jobs(
        id,
        company_id,
        title,
        industry,
        industry_slug,
        type,
        location,
        pay_min,
        pay_max,
        pay_type,
        description,
        skills,
        is_sponsored,
        status,
        created_at,
        experience_level,
        company_profiles(id, name, is_verified)
      )
    `
    )
    .eq('worker_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }

  const rows = (data ?? []).map((s) => {
    type DBJob = {
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
      skills: string[]
      is_sponsored: boolean
      status: string
      created_at: string
      experience_level: string | null
      company_profiles: { id: string; name: string; is_verified: boolean } | null
    }
    const j = s.jobs as unknown as DBJob | null

    const job: Job = {
      id: j?.id ?? s.job_id,
      companyId: j?.company_id ?? '',
      company: {
        id: j?.company_profiles?.id ?? '',
        name: j?.company_profiles?.name ?? '',
        logo: '',
        location: j?.location ?? '',
        industry: j?.industry ?? '',
        isVerified: j?.company_profiles?.is_verified ?? false,
        description: '',
        size: '',
        website: '',
      },
      title: j?.title ?? '',
      industry: j?.industry ?? '',
      industrySlug: j?.industry_slug ?? '',
      type: (j?.type as Job['type']) ?? 'Full-time',
      location: j?.location ?? '',
      payMin: Number(j?.pay_min ?? 0),
      payMax: Number(j?.pay_max ?? 0),
      payType: (j?.pay_type as Job['payType']) ?? 'hour',
      description: j?.description ?? '',
      requirements: [],
      skills: j?.skills ?? [],
      isSponsored: j?.is_sponsored ?? false,
      regulixReadyApplicants: 0,
      totalApplicants: 0,
      viewCount: 0,
      postedDaysAgo: j ? daysSince(j.created_at) : 0,
      createdAt: j?.created_at ?? '',
      status: (j?.status as Job['status']) ?? 'active',
      experienceLevel: j?.experience_level ?? null,
    }

    return {
      id: s.id,
      jobId: s.job_id,
      job,
      savedDaysAgo: daysSince(s.created_at),
      note: s.note ?? '',
    }
  })

  return { data: rows, error: null }
}

// ── New Jobs For You ───────────────────────────────────────────────────────────

export async function getNewJobsForYou(
  userId: string,
  limit = 5
): Promise<{ data: JobForYou[]; isFallback: boolean; error: string | null }> {
  const [skillsRes, appliedRes] = await Promise.all([
    supabase.from('worker_skills').select('name').eq('worker_id', userId),
    supabase.from('applications').select('job_id').eq('worker_id', userId),
  ])

  if (skillsRes.error) return { data: [], isFallback: false, error: skillsRes.error.message }

  const workerSkills = (skillsRes.data ?? []).map((s) => s.name.toLowerCase())
  const appliedJobIds = (appliedRes.data ?? []).map((a) => a.job_id)

  let query = supabase
    .from('jobs')
    .select('id, title, location, skills, company_profiles(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(25)

  if (appliedJobIds.length > 0) {
    query = query.not('id', 'in', `(${appliedJobIds.join(',')})`)
  }

  const { data: jobData, error: jobError } = await query
  if (jobError) return { data: [], isFallback: false, error: jobError.message }

  const scored = (jobData ?? []).map((j) => {
    const jobSkillsRaw = (j.skills ?? []) as string[]
    const jobSkills = jobSkillsRaw.map((s) => s.toLowerCase())
    const matchScore = workerSkills.filter((ws) =>
      jobSkills.some((js) => js.includes(ws) || ws.includes(js))
    ).length
    const co = j.company_profiles as unknown as { name: string } | null
    return {
      jobId: j.id,
      jobTitle: j.title,
      companyName: co?.name ?? '',
      location: j.location,
      matchScore,
    }
  })

  scored.sort((a, b) => b.matchScore - a.matchScore)

  const hasMatches = workerSkills.length > 0 && scored.some((s) => s.matchScore > 0)

  return {
    data: scored.slice(0, limit),
    isFallback: !hasMatches,
    error: null,
  }
}

// ── Worker Completeness ────────────────────────────────────────────────────────

export async function getWorkerCompleteness(
  userId: string
): Promise<{ data: WorkerCompleteness | null; error: string | null }> {
  const [skillsRes, workHistRes, certsRes, resumeRes, socialRes] = await Promise.all([
    supabase
      .from('worker_skills')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', userId),
    supabase
      .from('worker_work_history')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', userId),
    supabase
      .from('worker_certifications')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', userId),
    supabase
      .from('worker_resumes')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', userId),
    supabase
      .from('worker_social_links')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', userId),
  ])

  if (skillsRes.error) return { data: null, error: skillsRes.error.message }

  return {
    data: {
      // caller fills profile-derived fields from profile row
      hasPhoto: false,
      hasBio: false,
      hasPrimaryTrade: false,
      hasLocation: false,
      hasPhone: false,
      hasSkills: (skillsRes.count ?? 0) > 0,
      hasWorkHistory: (workHistRes.count ?? 0) > 0,
      hasCerts: (certsRes.count ?? 0) > 0,
      hasResume: (resumeRes.count ?? 0) > 0,
      hasSocialLinks: (socialRes.count ?? 0) > 0,
    },
    error: null,
  }
}

// ── Regulix Nudge ─────────────────────────────────────────────────────────────

export async function getRegulixNudgeData(
  userId: string
): Promise<{ data: RegulixNudgeData | null; error: string | null }> {
  const [intRes, prefRes] = await Promise.all([
    supabase
      .from('worker_integrations')
      .select('regulix_connected, regulix_reviews_imported')
      .eq('worker_id', userId)
      .maybeSingle(),
    supabase
      .from('worker_preferences')
      .select('regulix_nudge_dismissed_at')
      .eq('worker_id', userId)
      .maybeSingle(),
  ])

  if (intRes.error) return { data: null, error: intRes.error.message }

  const connected = intRes.data?.regulix_connected ?? false
  const imported = intRes.data?.regulix_reviews_imported ?? false

  let subState: RegulixNudgeData['subState']
  if (!connected) subState = 'connect'
  else if (!imported) subState = 'import'
  else subState = 'complete'

  return {
    data: {
      subState,
      dismissedAt: prefRes.data?.regulix_nudge_dismissed_at ?? null,
    },
    error: null,
  }
}

export async function dismissRegulixNudge(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('worker_preferences')
    .upsert(
      { worker_id: userId, regulix_nudge_dismissed_at: new Date().toISOString() },
      { onConflict: 'worker_id' }
    )
  if (error) return { error: error.message }
  return { error: null }
}
