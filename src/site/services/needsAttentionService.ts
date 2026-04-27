import { supabase } from '@/lib/supabase'

export type AttentionAlertType = 'zero_applicants' | 'boost_expiring' | 'unanswered_messages'

export type AttentionAlert = {
  id: string
  type: AttentionAlertType
  primaryText: string
  metaText: string
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

async function fetchZeroApplicantAlerts(companyId: string): Promise<AttentionAlert[]> {
  const sevenDaysAgo = daysAgo(7)
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, created_at')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .eq('total_applicants', 0)
    .lte('created_at', sevenDaysAgo)

  if (error || !data) return []

  return data.map((job) => ({
    id: `zero-${job.id}`,
    type: 'zero_applicants' as const,
    primaryText: `"${job.title}" has no applicants`,
    metaText: `Posted ${daysSince(job.created_at)} days ago`,
  }))
}

async function fetchBoostExpiringAlerts(_companyId: string): Promise<AttentionAlert[]> {
  // boost_expires_at column not yet in schema — stubbed until jobs table is extended
  return []
}

export async function getNeedsAttentionAlerts(
  companyId: string
): Promise<{ data: AttentionAlert[]; error: string | null }> {
  try {
    const [zeroApplicant, boostExpiring] = await Promise.all([
      fetchZeroApplicantAlerts(companyId),
      fetchBoostExpiringAlerts(companyId),
      // unanswered_messages stubbed until messaging data model is built
    ])
    return { data: [...zeroApplicant, ...boostExpiring], error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
