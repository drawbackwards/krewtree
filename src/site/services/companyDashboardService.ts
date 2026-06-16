import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DashboardStat = {
  key: 'new_applicants' | 'interviews_this_week' | 'open_posts' | 'time_to_fill'
  value: number | string
  subtext: string
}

export type CompletenessItemKey =
  | 'basics'
  | 'logo'
  | 'description'
  | 'website'
  | 'founded'
  | 'size'
  | 'licenses'
  | 'photos'
  | 'benefits'

export type CompanyCompleteness = {
  pct: number
  items: Record<CompletenessItemKey, boolean>
}

// All read-only dashboard aggregates in a single round trip (see the
// get_company_dashboard RPC). Stat scalars + the profile-completeness payload.
export type CompanyDashboardData = {
  stats: { new_applicants_week: number; new_applicants_yesterday: number }
  completeness: CompanyCompleteness
}

// ── Stat assembly ────────────────────────────────────────────────────────────

// The `open_posts` stat is derived client-side from the company's job list,
// which the dashboard already loads via getCompanyJobs — counting it server-side
// would re-read data already held in memory.
export function buildOpenPostsStat(jobs: { status: string }[]): DashboardStat {
  const openCount = jobs.filter((j) => j.status === 'active').length
  const pausedCount = jobs.filter((j) => j.status === 'paused').length
  return {
    key: 'open_posts',
    value: openCount,
    subtext: pausedCount === 1 ? '1 paused' : `${pausedCount} paused`,
  }
}

// Builds the four stat cards in display order from the RPC aggregates (nullable
// while still loading) and the already-loaded job list. interviews/time-to-fill
// remain stubs until their data sources land.
export function buildDashboardStats(
  stats: CompanyDashboardData['stats'] | null,
  jobs: { status: string }[]
): DashboardStat[] {
  const week = stats?.new_applicants_week ?? 0
  const yesterday = stats?.new_applicants_yesterday ?? 0
  const delta = week - yesterday
  return [
    {
      key: 'new_applicants',
      value: week,
      subtext: delta >= 0 ? `+${delta} since yesterday` : `${delta} since yesterday`,
    },
    { key: 'interviews_this_week', value: 0, subtext: '0 today' },
    buildOpenPostsStat(jobs),
    { key: 'time_to_fill', value: '—', subtext: '90-day avg' },
  ]
}

// ── Public API ─────────────────────────────────────────────────────────────────

const EMPTY_COMPLETENESS: CompanyCompleteness = {
  pct: 0,
  items: {
    basics: false,
    logo: false,
    description: false,
    website: false,
    founded: false,
    size: false,
    licenses: false,
    photos: false,
    benefits: false,
  },
}

export async function getCompanyDashboard(): Promise<{
  data: CompanyDashboardData | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('get_company_dashboard')
  if (error) return { data: null, error: error.message }

  // jsonb comes back loosely typed; narrow defensively.
  const raw = (data ?? {}) as {
    stats?: { new_applicants_week?: number; new_applicants_yesterday?: number }
    completeness?: { pct?: number; items?: Partial<Record<CompletenessItemKey, boolean>> }
  }

  const items = raw.completeness?.items ?? {}
  return {
    data: {
      stats: {
        new_applicants_week: raw.stats?.new_applicants_week ?? 0,
        new_applicants_yesterday: raw.stats?.new_applicants_yesterday ?? 0,
      },
      completeness: {
        pct: raw.completeness?.pct ?? 0,
        items: { ...EMPTY_COMPLETENESS.items, ...items },
      },
    },
    error: null,
  }
}
