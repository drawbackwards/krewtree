import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DashboardStat = {
  key: 'new_applicants' | 'interviews_this_week' | 'open_posts' | 'time_to_fill'
  value: number | string
  subtext: string
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

function mondayOfWeekUTC(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString()
}

// ── Queries ────────────────────────────────────────────────────────────────────

async function fetchNewApplicants(companyId: string): Promise<DashboardStat> {
  const weekStart = mondayOfWeekUTC()
  const yesterday = daysAgoMidnightUTC(1)
  const today = todayMidnightUTC()

  const [weekRes, yesterdayRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .gte('created_at', weekStart),
    supabase
      .from('applications')
      .select('id, jobs!inner(company_id)', { count: 'exact', head: true })
      .eq('jobs.company_id', companyId)
      .gte('created_at', yesterday)
      .lt('created_at', today),
  ])

  const weekCount = weekRes.error ? 0 : (weekRes.count ?? 0)
  const yesterdayCount = yesterdayRes.error ? 0 : (yesterdayRes.count ?? 0)
  const delta = weekCount - yesterdayCount

  return {
    key: 'new_applicants',
    value: weekCount,
    subtext: delta >= 0 ? `+${delta} since yesterday` : `${delta} since yesterday`,
  }
}

async function fetchInterviewsThisWeek(_companyId: string): Promise<DashboardStat> {
  // interviews table is stubbed — Supabase types will be regenerated after migration is applied
  return {
    key: 'interviews_this_week',
    value: 0,
    subtext: '0 today',
  }
}

async function fetchOpenPosts(companyId: string): Promise<DashboardStat> {
  const [openRes, pausedRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'paused'),
  ])

  const openCount = openRes.error ? 0 : (openRes.count ?? 0)
  const pausedCount = pausedRes.error ? 0 : (pausedRes.count ?? 0)

  return {
    key: 'open_posts',
    value: openCount,
    subtext: pausedCount === 1 ? '1 paused' : `${pausedCount} paused`,
  }
}

async function fetchTimeToFill(): Promise<DashboardStat> {
  // Requires hire event timestamps — not yet available. Stub.
  return {
    key: 'time_to_fill',
    value: '—',
    subtext: '90-day avg',
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getCompanyDashboardStats(
  companyId: string
): Promise<{ data: DashboardStat[]; error: string | null }> {
  try {
    const cards = await Promise.all([
      fetchNewApplicants(companyId),
      fetchInterviewsThisWeek(companyId),
      fetchOpenPosts(companyId),
      fetchTimeToFill(),
    ])
    return { data: cards, error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
