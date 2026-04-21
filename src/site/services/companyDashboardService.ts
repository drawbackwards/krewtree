import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DashboardStat = {
  key: 'active_posts' | 'new_applicants_today' | 'regulix_ready' | 'pending_interviews'
  value: number
  delta: number | null
  deltaLabel: string
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

async function fetchActivePosts(companyId: string): Promise<DashboardStat> {
  const sevenDaysAgo = daysAgoMidnightUTC(7)

  const [currentRes, historicalRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),
    // Jobs that were open 7 days ago: created before then, and not yet paused/closed at that point
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .lte('created_at', sevenDaysAgo)
      .or(`paused_at.is.null,paused_at.gt.${sevenDaysAgo}`)
      .or(`closed_at.is.null,closed_at.gt.${sevenDaysAgo}`)
      .neq('status', 'closed'), // exclude jobs closed AND reopened (closed_at cleared)
  ])

  const current = currentRes.error ? 0 : (currentRes.count ?? 0)
  const historical = historicalRes.error ? null : (historicalRes.count ?? 0)

  return {
    key: 'active_posts',
    value: current,
    delta: historical !== null ? current - historical : null,
    deltaLabel: 'vs last week',
  }
}

async function fetchNewApplicantsToday(companyId: string): Promise<DashboardStat> {
  const todayStart = todayMidnightUTC()
  const lastWeekSameDay = daysAgoMidnightUTC(7)
  const lastWeekNextDay = daysAgoMidnightUTC(6)

  const [todayRes, lastWeekRes] = await Promise.all([
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
  ])

  const todayCount = todayRes.error ? 0 : (todayRes.count ?? 0)
  const lastWeekCount = lastWeekRes.error ? 0 : (lastWeekRes.count ?? 0)

  return {
    key: 'new_applicants_today',
    value: todayCount,
    delta: todayCount - lastWeekCount,
    deltaLabel: `vs last ${shortWeekday()}`,
  }
}

async function fetchRegulixReady(companyId: string): Promise<DashboardStat> {
  const thisMonday = mondayOfWeekUTC(0)
  const lastMonday = mondayOfWeekUTC(1)

  const [thisWeekRes, lastWeekRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id), worker_profiles:worker_id!inner(is_regulix_ready)', {
        count: 'exact',
        head: true,
      })
      .eq('jobs.company_id', companyId)
      .eq('worker_profiles.is_regulix_ready', true)
      .gte('created_at', thisMonday),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id), worker_profiles:worker_id!inner(is_regulix_ready)', {
        count: 'exact',
        head: true,
      })
      .eq('jobs.company_id', companyId)
      .eq('worker_profiles.is_regulix_ready', true)
      .gte('created_at', lastMonday)
      .lt('created_at', thisMonday),
  ])

  const thisWeek = thisWeekRes.error ? 0 : (thisWeekRes.count ?? 0)
  const lastWeek = lastWeekRes.error ? 0 : (lastWeekRes.count ?? 0)

  return {
    key: 'regulix_ready',
    value: thisWeek,
    delta: thisWeek - lastWeek,
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
    // Moved into Interviewing this week
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .eq('status', 'Interviewing')
      .gte('status_updated_at', thisMonday),
    // Moved into Interviewing last week
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

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getCompanyDashboardStats(
  companyId: string
): Promise<{ data: DashboardStat[]; error: string | null }> {
  try {
    const cards = await Promise.all([
      fetchActivePosts(companyId),
      fetchNewApplicantsToday(companyId),
      fetchRegulixReady(companyId),
      fetchPendingInterviews(companyId),
    ])
    return { data: cards, error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
