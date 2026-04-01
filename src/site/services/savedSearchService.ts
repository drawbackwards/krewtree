import { supabase } from '@/lib/supabase'
import type { SavedSearch } from '@site/types'
import { daysSince } from '@site/utils/date'

type DbSavedSearch = {
  id: string
  worker_id: string
  label: string
  query: string
  industry_slug: string | null
  types: string[]
  pay_range_idx: number
  regulix_only: boolean
  alert_enabled: boolean
  created_at: string
}

function mapSavedSearch(r: DbSavedSearch): SavedSearch {
  return {
    id: r.id,
    label: r.label,
    query: r.query,
    industrySlug: r.industry_slug,
    types: r.types ?? [],
    payRangeIdx: r.pay_range_idx,
    regulixOnly: r.regulix_only,
    alertEnabled: r.alert_enabled,
    createdDaysAgo: daysSince(r.created_at),
    newMatchesCount: 0, // computed client-side after load
  }
}

export async function getSavedSearches(
  workerId: string
): Promise<{ data: SavedSearch[]; error: string | null }> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => mapSavedSearch(r as DbSavedSearch)), error: null }
}

export async function createSavedSearch(
  workerId: string,
  params: Omit<SavedSearch, 'id' | 'createdDaysAgo' | 'newMatchesCount'>
): Promise<{ data: SavedSearch | null; error: string | null }> {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      worker_id: workerId,
      label: params.label,
      query: params.query,
      industry_slug: params.industrySlug ?? null,
      types: params.types,
      pay_range_idx: params.payRangeIdx,
      regulix_only: params.regulixOnly,
      alert_enabled: params.alertEnabled,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapSavedSearch(data as DbSavedSearch), error: null }
}

export async function deleteSavedSearch(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('saved_searches').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateSavedSearch(
  id: string,
  patch: { alertEnabled?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('saved_searches')
    .update({ alert_enabled: patch.alertEnabled })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}
