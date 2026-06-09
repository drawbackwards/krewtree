// ─── Location service ──────────────────────────────────────────────────────
// Shared lat/lng helpers used by both worker- and company-facing surfaces.
// City lookups read us_cities (seeded from the US Census Gazetteer); the
// per-row geocoding columns are populated by BEFORE INSERT/UPDATE triggers
// on worker_profiles, company_profiles, and jobs (see migrations 005, 008,
// 011, 015). The TS layer assumes the trigger has already run and reads
// latitude / longitude directly.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from '../../lib/supabase'
import { withSessionCache } from '../utils/sessionCache'

export type Coords = { latitude: number; longitude: number }
export type CityOption = { city: string; state: string; latitude: number; longitude: number }

/** Haversine distance in miles between two lat/lng pairs. Earth radius 3958.8 mi. */
export function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const toRad = (d: number): number => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Substring-match us_cities for radius-anchor / distance-filter typeaheads.
 *  Case-insensitive on city. If the query is a 2-letter state code we short
 *  circuit to cities in that state. Capped at 10 results. */
export async function searchCities(
  query: string
): Promise<{ data: CityOption[]; error: string | null }> {
  const term = query.trim()
  if (term.length < 2) return { data: [], error: null }
  const stateMatch = /^[A-Za-z]{2}$/.test(term) ? term.toUpperCase() : null

  // us_cities isn't in database.types.ts yet; cast through never.
  let q = supabase
    .from('us_cities' as never)
    .select('city, state, latitude, longitude')
    .limit(10)

  if (stateMatch) {
    q = q.eq('state', stateMatch).order('city', { ascending: true })
  } else {
    const escaped = term.replace(/[%_\\]/g, '\\$&')
    q = q.ilike('city', `${escaped}%`).order('city', { ascending: true })
  }

  const { data, error } = await q
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as CityOption[], error: null }
}

/** Resolve a single (city, state) pair to its coordinates from us_cities. */
export async function getCityCoords(
  city: string,
  state: string
): Promise<{ data: Coords | null; error: string | null }> {
  if (!city || !state) return { data: null, error: null }
  const { data, error } = await supabase.rpc(
    'lookup_city_coords' as never,
    {
      p_city: city,
      p_state: state,
    } as never
  )
  if (error) return { data: null, error: error.message }
  const row = (data as unknown as Array<{ lat: number; lng: number }> | null)?.[0]
  if (!row) return { data: null, error: null }
  return { data: { latitude: row.lat, longitude: row.lng }, error: null }
}

/** Fetch the caller's company coords (used by Discover). Returns null when
 *  the company's `location` field is blank or unresolvable.
 *
 *  Session-cached — the company's saved location doesn't change inside a tab
 *  unless the user edits their profile, in which case a refresh covers it.
 *  Saves a Supabase round-trip on every Discover mount after the first. */
export async function getCompanyCoords(): Promise<{
  data: Coords | null
  error: string | null
}> {
  const { data: userRes } = await supabase.auth.getUser()
  const id = userRes.user?.id
  if (!id) return { data: null, error: 'Not signed in' }
  return withSessionCache('company_coords', id, async () => {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('latitude, longitude' as never)
      .eq('id', id)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    const row = data as unknown as { latitude: number | null; longitude: number | null } | null
    if (!row || row.latitude == null || row.longitude == null) {
      return { data: null, error: null }
    }
    return { data: { latitude: row.latitude, longitude: row.longitude }, error: null }
  })
}

/** Fetch the caller's worker coords (used by Find Jobs distance filtering).
 *  Returns null when the worker's city/region don't resolve in us_cities. */
export async function getWorkerCoords(): Promise<{
  data: Coords | null
  error: string | null
}> {
  const { data: userRes } = await supabase.auth.getUser()
  const id = userRes.user?.id
  if (!id) return { data: null, error: 'Not signed in' }
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('latitude, longitude' as never)
    .eq('id', id)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  const row = data as unknown as { latitude: number | null; longitude: number | null } | null
  if (!row || row.latitude == null || row.longitude == null) {
    return { data: null, error: null }
  }
  return { data: { latitude: row.latitude, longitude: row.longitude }, error: null }
}
