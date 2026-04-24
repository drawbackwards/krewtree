import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DashboardStat = {
  key: 'new_applicants_today' | 'screening' | 'pending_interviews' | 'final_round'
  value: number
  delta: number | null
  deltaLabel: string
  subtext?: string
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function todayMidnightUTC(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function daysAgoMidnightUTC(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function mondayOfWeekUTC(weeksAgo: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()
  const diff = day === 0 ? 6 : day - 1 // days since Monday
  d.setUTCDate(d.getUTCDate() - diff - weeksAgo * 7)
  return d.toISOString()
}

function shortWeekday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short' })
}

// ── Queries ────────────────────────────────────────────────────────────────────

async function fetchNewApplicantsToday(companyId: string): Promise<DashboardStat> {
  const todayStart = todayMidnightUTC()
  const lastWeekSameDay = daysAgoMidnightUTC(7)
  const lastWeekNextDay = daysAgoMidnightUTC(6)

  const [todayRes, lastWeekRes, regulixRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .gte('created_at', todayStart),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .gte('created_at', lastWeekSameDay)
      .lt('created_at', lastWeekNextDay),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id), worker_profiles:worker_id!inner(is_regulix_ready)', {
        count: 'exact',
        head: true,
      })
      .eq('jobs.company_id', companyId)
      .eq('worker_profiles.is_regulix_ready', true),
  ])

  const todayCount = todayRes.error ? 0 : (todayRes.count ?? 0)
  const lastWeekCount = lastWeekRes.error ? 0 : (lastWeekRes.count ?? 0)
  const regulixCount = regulixRes.error ? 0 : (regulixRes.count ?? 0)

  return {
    key: 'new_applicants_today',
    value: todayCount,
    delta: todayCount - lastWeekCount,
    deltaLabel: `vs last ${shortWeekday()}`,
    subtext: `${regulixCount} Regulix Ready`,
  }
}

async function fetchScreening(companyId: string): Promise<DashboardStat> {
  const thisMonday = mondayOfWeekUTC(0)
  const lastMonday = mondayOfWeekUTC(1)

  const [currentRes, thisWeekRes, lastWeekRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .in('status', ['Applied', 'Viewed']),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .in('status', ['Applied', 'Viewed'])
      .gte('status_updated_at', thisMonday),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .in('status', ['Applied', 'Viewed'])
      .gte('status_updated_at', lastMonday)
      .lt('status_updated_at', thisMonday),
  ])

  const current = currentRes.error ? 0 : (currentRes.count ?? 0)
  const thisWeek = thisWeekRes.error ? null : (thisWeekRes.count ?? 0)
  const lastWeek = lastWeekRes.error ? null : (lastWeekRes.count ?? 0)

  return {
    key: 'screening',
    value: current,
    delta: thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null,
    deltaLabel: 'vs last week',
  }
}

async function fetchPendingInterviews(companyId: string): Promise<DashboardStat> {
  const thisMonday = mondayOfWeekUTC(0)
  const lastMonday = mondayOfWeekUTC(1)

  const [currentRes, thisWeekRes, lastWeekRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Interviewing'),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Interviewing')
      .gte('status_updated_at', thisMonday),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Interviewing')
      .gte('status_updated_at', lastMonday)
      .lt('status_updated_at', thisMonday),
  ])

  const current = currentRes.error ? 0 : (currentRes.count ?? 0)
  const thisWeek = thisWeekRes.error ? null : (thisWeekRes.count ?? 0)
  const lastWeek = lastWeekRes.error ? null : (lastWeekRes.count ?? 0)

  return {
    key: 'pending_interviews',
    value: current,
    delta: thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null,
    deltaLabel: 'vs last week',
  }
}

async function fetchFinalRound(companyId: string): Promise<DashboardStat> {
  const thisMonday = mondayOfWeekUTC(0)
  const lastMonday = mondayOfWeekUTC(1)

  const [currentRes, thisWeekRes, lastWeekRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Offer'),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Offer')
      .gte('status_updated_at', thisMonday),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Offer')
      .gte('status_updated_at', lastMonday)
      .lt('status_updated_at', thisMonday),
  ])

  const current = currentRes.error ? 0 : (currentRes.count ?? 0)
  const thisWeek = thisWeekRes.error ? null : (thisWeekRes.count ?? 0)
  const lastWeek = lastWeekRes.error ? null : (lastWeekRes.count ?? 0)

  return {
    key: 'final_round',
    value: current,
    delta: thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null,
    deltaLabel: 'vs last week',
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getCompanyDashboardStats(
  companyId: string
): Promise<{ data: DashboardStat[]; error: string | null }> {
  try {
    const cards = await Promise.all([
      fetchNewApplicantsToday(companyId),
      fetchScreening(companyId),
      fetchPendingInterviews(companyId),
      fetchFinalRound(companyId),
    ])
    return { data: cards, error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
