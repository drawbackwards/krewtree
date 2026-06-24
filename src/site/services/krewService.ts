// ─── My Krew service ────────────────────────────────────────────────────────
// All Supabase calls for the My Krew product surface. Each procedure returns
// { data, error } per the established service convention. RLS scopes rows to
// the calling company (company_profiles.id = auth.uid()); we still pass
// company_id explicitly for defensive query planning + readability.
// ────────────────────────────────────────────────────────────────────────────

import { supabase, getCurrentUserId } from '../../lib/supabase'
import { getCompanyJobs } from './jobService'
import {
  getCityCoords as resolveCityCoords,
  getCompanyCoords as fetchCompanyCoords,
  haversineMi as haversineMiles,
} from './locationService'
import type { Job } from '../types'
import { invalidateSessionCache, withSessionCache } from '../utils/sessionCache'

// ─── Public types ──────────────────────────────────────────────────────────

export type KrewSource =
  | 'past_hire'
  | 'inbound_application'
  | 'referral'
  | 'marketplace'
  | 'manual_add'

export type KrewSortColumn = 'worker' | 'trade' | 'lastHired' | 'lastInteraction' | 'matches'
export type KrewSortDir = 'asc' | 'desc'

export type KrewWorker = {
  id: string
  firstName: string
  lastName: string
  trade: string | null
  isRegulixReady: boolean
  avatarUrl: string | null
  source: KrewSource
  /** Latest hire date for this (company, worker). Deferred — returns null until the
   *  drawer chunk wires it via a JOIN through applications/jobs. */
  lastHired: string | null
  lastInteraction: string | null
  /** Count of the company's active jobs this worker matches against (excludes
   *  jobs they've already applied to). Hydrated from compute_krew_match_counts. */
  matchesCount: number
  /** Subset of matchesCount that hit the "strong" threshold (location + skill/trade,
   *  or skill overlap ≥ 2). Drives the "Strong matches only" filter. */
  strongMatchesCount: number
  inKrew: boolean
}

export type KrewList = {
  id: string
  name: string
  count: number
  createdAt: string
  updatedAt: string
}

export type GetKrewOptions = {
  /** Filter to workers in a specific list */
  listId?: string
  /** Free-text match against first_name + last_name (ILIKE) */
  search?: string
  /** krew_relationships.source IN (...) */
  sources?: string[]
  /** Accepted for URL pass-through; not yet acted on (no skill filtering yet). */
  skills?: string[]
  /** Accepted for URL pass-through; not yet acted on (no matching algorithm). */
  strongMatchesOnly?: boolean
  regulixReadyOnly?: boolean
  sort?: { column: KrewSortColumn; direction: KrewSortDir }
  /** 1-based */
  page?: number
  pageSize?: number
}

export type GetKrewResult = {
  workers: KrewWorker[]
  total: number
}

type ServiceError = string | null

// ─── Helpers ───────────────────────────────────────────────────────────────

async function currentCompanyId(): Promise<string | null> {
  return getCurrentUserId()
}

/** Shape of a row returned from getKrew's embedded select on worker_profiles. */
type KrewRelWithProfile = {
  company_id: string
  worker_id: string
  in_krew: boolean
  source: KrewSource
  last_interaction_at: string | null
  worker_profiles: {
    first_name: string | null
    last_name: string | null
    primary_trade: string | null
    avatar_url: string | null
    is_regulix_ready: boolean | null
  } | null
}

function mapWorker(row: KrewRelWithProfile): KrewWorker {
  const p = row.worker_profiles
  return {
    id: row.worker_id,
    firstName: p?.first_name ?? '',
    lastName: p?.last_name ?? '',
    trade: p?.primary_trade ?? null,
    isRegulixReady: p?.is_regulix_ready === true,
    avatarUrl: p?.avatar_url ?? null,
    source: row.source,
    lastHired: null, // deferred — see note on KrewWorker.lastHired
    lastInteraction: row.last_interaction_at,
    matchesCount: 0, // hydrated below from compute_krew_match_counts
    strongMatchesCount: 0,
    inKrew: row.in_krew,
  }
}

// ─── Match-count hydration ─────────────────────────────────────────────────
// Single round-trip to the SQL function that scores every (worker, job) pair
// against the caller's active jobs and returns the totals. Failure here is
// non-fatal — we render workers with 0 matches rather than block the page.
type MatchCountRow = { worker_id: string; matches: number; strong_matches: number }

async function fetchMatchCounts(workerIds: string[]): Promise<Map<string, MatchCountRow>> {
  const map = new Map<string, MatchCountRow>()
  if (workerIds.length === 0) return map
  const { data, error } = await supabase.rpc('compute_krew_match_counts', {
    p_worker_ids: workerIds,
  })
  if (error || !data) return map
  for (const row of data as MatchCountRow[]) {
    map.set(row.worker_id, row)
  }
  return map
}

function applyCounts(worker: KrewWorker, counts: Map<string, MatchCountRow>): KrewWorker {
  const row = counts.get(worker.id)
  if (!row) return worker
  return {
    ...worker,
    matchesCount: row.matches,
    strongMatchesCount: row.strong_matches,
  }
}

// ─── Procedures: krew.list ─────────────────────────────────────────────────

export async function getKrew(
  opts: GetKrewOptions = {}
): Promise<{ data: GetKrewResult; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: { workers: [], total: 0 }, error: 'Not signed in' }

  // If a list filter is on, find member worker IDs first. Two queries is fine
  // here — lists are small and the alternative is a complex PostgREST join.
  let memberIds: string[] | null = null
  if (opts.listId) {
    const { data: members, error: memErr } = await supabase
      .from('krew_list_memberships')
      .select('worker_id')
      .eq('list_id', opts.listId)
    if (memErr) return { data: { workers: [], total: 0 }, error: memErr.message }
    memberIds = (members ?? []).map((m) => m.worker_id)
    if (memberIds.length === 0) return { data: { workers: [], total: 0 }, error: null }
  }

  // The match counts have to be known up-front when they drive ranking or
  // pruning ("strong matches only"). Postgres can sort matchesCount per row,
  // but we'd still need every row's count before paginating — so the fastest
  // honest version is: fetch the full candidate set unpaginated, hydrate
  // counts, then sort/filter/paginate in JS.
  const matchDriven = opts.sort?.column === 'matches' || opts.strongMatchesOnly === true
  const page = opts.page ?? 1
  const pageSize = opts.pageSize ?? 25

  // Builder shared by both paths — everything except sort/range.
  const buildBaseQuery = (withCount: boolean) => {
    let q = supabase
      .from('krew_relationships')
      .select(
        `
        company_id,
        worker_id,
        in_krew,
        source,
        last_interaction_at,
        worker_profiles!inner (
          first_name,
          last_name,
          primary_trade,
          avatar_url,
          is_regulix_ready
        )
      `,
        withCount ? { count: 'exact' } : undefined
      )
      .eq('company_id', companyId)
      .eq('in_krew', true)

    if (opts.regulixReadyOnly) {
      q = q.eq('worker_profiles.is_regulix_ready', true)
    }
    if (opts.sources && opts.sources.length > 0) {
      q = q.in('source', opts.sources)
    }
    if (opts.search && opts.search.trim().length > 0) {
      // Escape LIKE metacharacters so a user typing `_` or `%` doesn't widen the match.
      const term = opts.search.trim().replace(/[%_\\]/g, '\\$&')
      const pattern = `%${term}%`
      q = q.or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`, {
        foreignTable: 'worker_profiles',
      })
    }
    if (memberIds) {
      q = q.in('worker_id', memberIds)
    }
    return q
  }

  // ─── Match-driven path ────────────────────────────────────────────────────
  // Sort by matches OR filter to strong-only. Fetch everything, score, prune,
  // sort, then paginate in JS. The unpaginated set is bounded by the company's
  // krew size (small in practice) so this is acceptable.
  if (matchDriven) {
    // Stable tiebreaker — workers with the same match count fall back to
    // last-interaction order so the ranking doesn't shuffle between requests.
    const all = await buildBaseQuery(false)
      .order('last_interaction_at', { ascending: false, nullsFirst: false })
      .range(0, 9999)

    if (all.error) return { data: { workers: [], total: 0 }, error: all.error.message }

    const baseRows = ((all.data ?? []) as unknown as KrewRelWithProfile[]).map(mapWorker)
    const counts = await fetchMatchCounts(baseRows.map((w) => w.id))
    let scored = baseRows.map((w) => applyCounts(w, counts))

    if (opts.strongMatchesOnly) {
      scored = scored.filter((w) => w.strongMatchesCount > 0)
    }

    if (opts.sort?.column === 'matches') {
      const asc = opts.sort.direction === 'asc'
      scored.sort((a, b) =>
        asc ? a.matchesCount - b.matchesCount : b.matchesCount - a.matchesCount
      )
    }

    const total = scored.length
    const from = (page - 1) * pageSize
    const slice = scored.slice(from, from + pageSize)
    return { data: { workers: slice, total }, error: null }
  }

  // ─── Default path ─────────────────────────────────────────────────────────
  // Sort happens server-side; only the visible page's match counts are fetched.
  let query = buildBaseQuery(true)

  const dir = opts.sort?.direction ?? 'desc'
  const asc = dir === 'asc'
  if (opts.sort?.column === 'worker') {
    query = query.order('first_name', { ascending: asc, foreignTable: 'worker_profiles' })
  } else if (opts.sort?.column === 'trade') {
    query = query.order('primary_trade', { ascending: asc, foreignTable: 'worker_profiles' })
  } else if (opts.sort?.column === 'lastInteraction') {
    query = query.order('last_interaction_at', { ascending: asc, nullsFirst: false })
  } else {
    query = query.order('last_interaction_at', { ascending: false, nullsFirst: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) return { data: { workers: [], total: 0 }, error: error.message }

  const baseRows = ((data ?? []) as unknown as KrewRelWithProfile[]).map(mapWorker)
  const counts = await fetchMatchCounts(baseRows.map((w) => w.id))
  const workers = baseRows.map((w) => applyCounts(w, counts))
  return { data: { workers, total: count ?? 0 }, error: null }
}

// ─── Procedure: krew.countRegulixReady ─────────────────────────────────────
// Count-only variant of getKrew({ regulixReadyOnly: true }) used by the
// sidebar badge. head:true tells PostgREST to skip row hydration entirely —
// the previous approach pulled a full row + nested worker_profiles select
// just to read `count`, which is wasted work for a single integer.

export async function getRegulixReadyCount(): Promise<{
  data: number
  error: ServiceError
}> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: 0, error: 'Not signed in' }

  const { count, error } = await supabase
    .from('krew_relationships')
    .select('worker_id, worker_profiles!inner(is_regulix_ready)', {
      count: 'exact',
      head: true,
    })
    .eq('company_id', companyId)
    .eq('in_krew', true)
    .eq('worker_profiles.is_regulix_ready', true)

  if (error) return { data: 0, error: error.message }
  return { data: count ?? 0, error: null }
}

// ─── Procedure: discover.workers ───────────────────────────────────────────
// Browse-all-workers directory for the Discover page. Unlike getKrew, this
// returns every worker_profile in the system (not just the calling company's
// krew) with each row tagged as inKrew / not so the UI can render "Add to My
// Krew" vs an already-in-krew indicator.

export type DiscoverJobMatch = {
  locationMatch: boolean
  tradeMatch: boolean
  matchedSkills: string[]
  score: number
}

export type DiscoverWorker = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  primaryTrade: string
  bio: string
  location: string
  isRegulixReady: boolean
  topSkills: string[]
  inKrew: boolean
  /** Per-job match signals against the currently-selected job. Hydrated only
   *  when discoverWorkers is called with `matchJobId`; null otherwise. */
  jobMatch: DiscoverJobMatch | null
  /** Distance to the calling company in miles (Haversine). Populated only on
   *  the 'nearest' sort path; null when unavailable (worker missing coords). */
  distanceMi: number | null
}

export type DiscoverSort = 'recent' | 'name' | 'nearest' | 'match'

export type DiscoverWorkersOpts = {
  search?: string
  /** Filter to workers who have at least one matching tag in worker_skills.name.
   *  The list of values comes from getDiscoverSkills() so the filter values and
   *  the on-card pills share a source of truth. */
  skills?: string[]
  regulixReadyOnly?: boolean
  /** 'recent' sorts by worker_profiles.updated_at desc — used as a proxy for a
   *  real `last_active_at` field, which isn't on worker_profiles yet. */
  sort?: DiscoverSort
  /** When set, the result set is scored against this specific active job and
   *  ranked by score desc. Each worker's `jobMatch` is populated. Sorting via
   *  `sort` is ignored on this path. */
  matchJobId?: string
  /** Filter to workers within this many miles of the anchor location (see
   *  `nearCity` / `nearState`; defaults to the company's saved coords).
   *  Workers without coords are excluded (they can't be inside any radius). */
  radiusMi?: number
  /** Override the radius/Nearest anchor with a user-picked city. Resolved
   *  against us_cities; falls back to the company's coords if missing or
   *  unresolvable. */
  nearCity?: string
  nearState?: string
  page?: number
  pageSize?: number
}

export type DiscoverWorkersResult = {
  workers: DiscoverWorker[]
  total: number
}

type DiscoverRow = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  primary_trade: string | null
  bio: string | null
  city: string | null
  region: string | null
  is_regulix_ready: boolean | null
  latitude: number | null
  longitude: number | null
  worker_skills: Array<{ name: string }>
}

// Location helpers were moved into locationService.ts so the worker-side
// Find Jobs page can share them. Re-exported here so existing call sites
// (Discover page, etc.) keep compiling without churn.
export { searchCities, getCityCoords, getCompanyCoords, haversineMi } from './locationService'
export type { CityOption, Coords } from './locationService'
// Keep the legacy alias since older code reads CompanyCoords.
export type CompanyCoords = { latitude: number; longitude: number } | null

/** Cap for match-driven pagination (fetched unpaginated so we can score &
 *  sort everything). Pick something well above the realistic directory size
 *  in this app; revisit when the worker pool grows past it. */
const DISCOVER_MATCH_FETCH_CAP = 500

function mapDiscoverRow(r: DiscoverRow, krewIds: Set<string>): DiscoverWorker {
  const cityRegion = [r.city, r.region].filter(Boolean).join(', ')
  const skills = Array.from(
    new Set((r.worker_skills ?? []).map((s) => s.name).filter(Boolean))
  ).slice(0, 3)
  return {
    id: r.id,
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    avatarUrl: r.avatar_url,
    primaryTrade: r.primary_trade ?? '',
    bio: r.bio ?? '',
    location: cityRegion,
    isRegulixReady: r.is_regulix_ready ?? false,
    topSkills: skills,
    inKrew: krewIds.has(r.id),
    jobMatch: null,
    distanceMi: null,
  }
}

type WorkerJobMatchRow = {
  worker_id: string
  location_match: boolean
  trade_match: boolean
  matched_skills: string[] | null
  score: number
}

async function fetchDiscoverJobMatch(
  workerIds: string[],
  jobId: string
): Promise<Map<string, DiscoverJobMatch>> {
  const map = new Map<string, DiscoverJobMatch>()
  if (workerIds.length === 0) return map
  // `as never` lets us call the new RPC before database.types.ts is regenerated
  // post-migration. Behavior at runtime is identical.
  const { data, error } = await supabase.rpc(
    'compute_worker_job_match' as never,
    {
      p_worker_ids: workerIds,
      p_job_id: jobId,
    } as never
  )
  if (error || !data) return map
  for (const row of data as unknown as WorkerJobMatchRow[]) {
    map.set(row.worker_id, {
      locationMatch: row.location_match,
      tradeMatch: row.trade_match,
      matchedSkills: row.matched_skills ?? [],
      score: row.score,
    })
  }
  return map
}

async function fetchKrewIds(companyId: string, workerIds: string[]): Promise<Set<string>> {
  if (workerIds.length === 0) return new Set()
  const { data } = await supabase
    .from('krew_relationships')
    .select('worker_id')
    .eq('company_id', companyId)
    .eq('in_krew', true)
    .in('worker_id', workerIds)
  return new Set(((data ?? []) as Array<{ worker_id: string }>).map((r) => r.worker_id))
}

export async function discoverWorkers(
  opts: DiscoverWorkersOpts = {}
): Promise<{ data: DiscoverWorkersResult; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: { workers: [], total: 0 }, error: 'Not signed in' }

  const page = opts.page ?? 1
  const pageSize = opts.pageSize ?? 12

  // When filtering by skill, the embed must be `!inner` so PostgREST excludes
  // worker_profiles rows that have no matching worker_skills entry. Without it,
  // `.in('worker_skills.name', …)` only narrows the embedded array per worker.
  const skillsEmbed =
    opts.skills && opts.skills.length > 0 ? 'worker_skills!inner(name)' : 'worker_skills(name)'

  const selectCols = `id, first_name, last_name, avatar_url, primary_trade, bio, city, region, is_regulix_ready, latitude, longitude, ${skillsEmbed}`

  // Anything that needs cross-row scoring or filtering against company coords
  // can't paginate server-side. Drop into a fetch-all-then-process-in-JS path.
  const clientPaginated = !!opts.matchJobId || opts.sort === 'nearest' || opts.radiusMi != null

  // ─── Server-paginated fast path (no match-to-job, no nearest, no radius). ─
  if (!clientPaginated) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let q = supabase.from('worker_profiles').select(selectCols, { count: 'exact' })
    if (opts.search) {
      const term = opts.search.replace(/[,*]/g, '')
      q = q.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,primary_trade.ilike.%${term}%`)
    }
    if (opts.skills && opts.skills.length > 0) q = q.in('worker_skills.name', opts.skills)
    if (opts.regulixReadyOnly) q = q.eq('is_regulix_ready', true)
    if (opts.sort === 'recent') {
      q = q.order('updated_at', { ascending: false, nullsFirst: false })
    } else {
      q = q.order('first_name', { ascending: true })
    }
    q = q.range(from, to)

    const { data, error, count } = await q
    if (error) return { data: { workers: [], total: 0 }, error: error.message }

    const rows = (data ?? []) as unknown as DiscoverRow[]
    const krewIds = await fetchKrewIds(
      companyId,
      rows.map((r) => r.id)
    )
    const workers = rows.map((r) => mapDiscoverRow(r, krewIds))
    return { data: { workers, total: count ?? 0 }, error: null }
  }

  // ─── Client-paginated path: fetch up to the cap, then score/sort/filter in
  //     JS. Used whenever results depend on cross-row computation (match
  //     score, distance) or a coord-aware predicate (radius).
  let baseQ = supabase.from('worker_profiles').select(selectCols)
  if (opts.search) {
    const term = opts.search.replace(/[,*]/g, '')
    baseQ = baseQ.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,primary_trade.ilike.%${term}%`
    )
  }
  if (opts.skills && opts.skills.length > 0) baseQ = baseQ.in('worker_skills.name', opts.skills)
  if (opts.regulixReadyOnly) baseQ = baseQ.eq('is_regulix_ready', true)
  // SQL-side order: name (A–Z) only when explicitly requested; otherwise
  // updated_at desc. This is the order workers retain when no JS-side sort
  // (matchJobId or nearest) overrides it, and provides a stable tiebreaker.
  if (opts.sort === 'name') {
    baseQ = baseQ.order('first_name', { ascending: true })
  } else {
    baseQ = baseQ.order('updated_at', { ascending: false, nullsFirst: false })
  }
  baseQ = baseQ.range(0, DISCOVER_MATCH_FETCH_CAP - 1)

  // Need anchor coords any time we score/filter on distance. The anchor is
  // the user-picked city if provided; otherwise the company's saved coords.
  const needsCoords = opts.sort === 'nearest' || opts.radiusMi != null
  const anchorP: Promise<{ data: CompanyCoords; error: ServiceError }> = needsCoords
    ? opts.nearCity && opts.nearState
      ? resolveCityCoords(opts.nearCity, opts.nearState).then((res) =>
          res.data ? res : fetchCompanyCoords()
        )
      : fetchCompanyCoords()
    : Promise.resolve({ data: null, error: null as ServiceError })

  const [anchorRes, workersRes] = await Promise.all([anchorP, baseQ])

  if (workersRes.error) return { data: { workers: [], total: 0 }, error: workersRes.error.message }
  if (needsCoords && !anchorRes.data) {
    return {
      data: { workers: [], total: 0 },
      error: 'Pick a location (or set your company location) to use distance-based filtering',
    }
  }
  const cLat = anchorRes.data?.latitude ?? null
  const cLng = anchorRes.data?.longitude ?? null

  const rows = (workersRes.data ?? []) as unknown as DiscoverRow[]
  const ids = rows.map((r) => r.id)
  const [krewIds, jobMatchMap] = await Promise.all([
    fetchKrewIds(companyId, ids),
    opts.matchJobId
      ? fetchDiscoverJobMatch(ids, opts.matchJobId)
      : Promise.resolve(new Map<string, DiscoverJobMatch>()),
  ])

  let processed = rows.map((r) => {
    const w = mapDiscoverRow(r, krewIds)
    if (cLat != null && cLng != null && r.latitude != null && r.longitude != null) {
      w.distanceMi = haversineMiles(cLat, cLng, r.latitude, r.longitude)
    }
    if (opts.matchJobId) {
      w.jobMatch = jobMatchMap.get(r.id) ?? null
    }
    return w
  })

  // Radius filter — drop anyone outside the disc. Workers without coords
  // also drop (we can't prove they're inside).
  if (opts.radiusMi != null && cLat != null && cLng != null) {
    const radius = opts.radiusMi
    processed = processed.filter((w) => w.distanceMi != null && w.distanceMi <= radius)
  }

  // Match-to-job: drop zero-score workers (no matching axis at all).
  if (opts.matchJobId) {
    processed = processed.filter((w) => (w.jobMatch?.score ?? 0) > 0)
  }

  // Sort selection:
  //   sort='match' (only meaningful when matchJobId set) → desc by score
  //   sort='nearest'                                     → asc by distance
  //   otherwise → SQL-side order already correct.
  // Match-to-job is purely a filter now; sort stays under user control.
  if (opts.sort === 'match' && opts.matchJobId) {
    processed.sort((a, b) => (b.jobMatch?.score ?? 0) - (a.jobMatch?.score ?? 0))
  } else if (opts.sort === 'nearest') {
    processed.sort(
      (a, b) =>
        (a.distanceMi ?? Number.POSITIVE_INFINITY) - (b.distanceMi ?? Number.POSITIVE_INFINITY)
    )
  }

  const total = processed.length
  const start = (page - 1) * pageSize
  return { data: { workers: processed.slice(start, start + pageSize), total }, error: null }
}

// ─── Discover: saved searches ──────────────────────────────────────────────
// Company-scoped saved filter sets for the Discover page. The companion table
// `company_discover_saved_searches` is gated by RLS to the calling company.

export type DiscoverSavedSearch = {
  id: string
  label: string
  query: string
  skills: string[]
  regulixOnly: boolean
  sort: DiscoverSort
  radiusMi: number | null
  nearCity: string | null
  nearState: string | null
  matchJobId: string | null
  createdAt: string
}

type DbDiscoverSavedSearch = {
  id: string
  company_id: string
  label: string
  query: string
  skills: string[] | null
  regulix_only: boolean
  sort: string
  radius_mi: number | null
  near_city: string | null
  near_state: string | null
  match_job_id: string | null
  created_at: string
}

function mapDiscoverSavedSearch(r: DbDiscoverSavedSearch): DiscoverSavedSearch {
  // `sort` is stored as free text; only re-emit known values so callers can
  // trust the union type. Anything else falls back to 'recent'.
  const knownSort: DiscoverSort =
    r.sort === 'name' || r.sort === 'nearest' || r.sort === 'recent' || r.sort === 'match'
      ? (r.sort as DiscoverSort)
      : 'recent'
  const radius = r.radius_mi != null && [10, 25, 50, 100].includes(r.radius_mi) ? r.radius_mi : null
  return {
    id: r.id,
    label: r.label,
    query: r.query ?? '',
    skills: r.skills ?? [],
    regulixOnly: r.regulix_only === true,
    sort: knownSort,
    radiusMi: radius,
    nearCity: r.near_city ?? null,
    nearState: r.near_state ?? null,
    matchJobId: r.match_job_id ?? null,
    createdAt: r.created_at,
  }
}

export async function getDiscoverSavedSearches(): Promise<{
  data: DiscoverSavedSearch[]
  error: ServiceError
}> {
  const { data, error } = await supabase
    // `as never` is a type-side workaround: the generated database.types.ts is
    // re-generated only after a `supabase db push`, so the new table isn't in
    // the typed schema yet. Runtime calls still succeed once the migration
    // lands. Drop the cast after the next types regeneration.
    .from('company_discover_saved_searches' as never)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return {
    data: ((data ?? []) as unknown as DbDiscoverSavedSearch[]).map(mapDiscoverSavedSearch),
    error: null,
  }
}

export async function createDiscoverSavedSearch(params: {
  label: string
  query: string
  skills: string[]
  regulixOnly: boolean
  sort: DiscoverSort
  radiusMi: number | null
  nearCity: string | null
  nearState: string | null
  matchJobId: string | null
}): Promise<{ data: DiscoverSavedSearch | null; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: null, error: 'Not signed in' }
  const label = params.label.trim()
  if (!label) return { data: null, error: 'Name required' }

  const { data, error } = await supabase
    .from('company_discover_saved_searches' as never)
    .insert({
      company_id: companyId,
      label,
      query: params.query,
      skills: params.skills,
      regulix_only: params.regulixOnly,
      sort: params.sort,
      radius_mi: params.radiusMi,
      near_city: params.nearCity,
      near_state: params.nearState,
      match_job_id: params.matchJobId,
    } as never)
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return {
    data: mapDiscoverSavedSearch(data as unknown as DbDiscoverSavedSearch),
    error: null,
  }
}

export async function deleteDiscoverSavedSearch(id: string): Promise<{ error: ServiceError }> {
  const { error } = await supabase
    .from('company_discover_saved_searches' as never)
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

// Caller's currently-active jobs, used to populate the Discover "Match to
// job" dropdown. Returns only the lightweight (id, title) pair the dropdown
// needs; full job rendering still goes through jobService.getCompanyJobs.
export type CompanyActiveJobOption = { id: string; title: string }

export async function getCompanyActiveJobs(): Promise<{
  data: CompanyActiveJobOption[]
  error: ServiceError
}> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: [], error: 'Not signed in' }
  // Session-cached — the active-jobs list only changes when the user posts,
  // edits, or closes a job. Those flows call invalidateActiveJobsCache().
  return withSessionCache('discover_active_jobs', companyId, async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) return { data: [], error: error.message }
    return {
      data: ((data ?? []) as Array<{ id: string; title: string }>).map((r) => ({
        id: r.id,
        title: r.title,
      })),
      error: null,
    }
  })
}

/** Drop the cached active-jobs list for the calling company. Callers that
 *  change a job's status (post / edit / close) should invoke this so the next
 *  Discover mount re-fetches. */
export async function invalidateActiveJobsCache(): Promise<void> {
  const companyId = await currentCompanyId()
  if (!companyId) return
  invalidateSessionCache('discover_active_jobs', companyId)
  invalidateSessionCache('discover_skills', companyId)
}

// Distinct skill tag values across worker_skills — feeds the Skill filter on
// the Discover page. Same source as the chips that render on each worker card,
// so the filter list and the card pills stay in sync. When the current company
// has an industry set, the list is scoped to skills tagged with that industry.
export async function getDiscoverSkills(): Promise<{
  data: string[]
  error: ServiceError
}> {
  const companyId = await currentCompanyId()
  const scope = companyId ?? 'anon'
  // Session-cached — distinct skill names rarely shift inside a tab session.
  // Cleared via invalidateActiveJobsCache() when the company posts a job, which
  // is the most plausible trigger for the visible skill set to change.
  return withSessionCache('discover_skills', scope, async () => {
    let industrySlugs: string[] = []
    if (companyId) {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('industry')
        .eq('id', companyId)
        .maybeSingle()
      const slug = profile?.industry?.trim()
      if (slug) industrySlugs = [slug]
    }

    let query =
      industrySlugs.length > 0
        ? supabase.from('worker_skills').select('name, industries!inner(slug)')
        : supabase.from('worker_skills').select('name')

    if (industrySlugs.length > 0) {
      query = query.in('industries.slug', industrySlugs)
    }

    const { data, error } = await query
    if (error) return { data: [], error: error.message }
    const set = new Set<string>()
    for (const row of (data ?? []) as Array<{ name: string | null }>) {
      const t = (row.name ?? '').trim()
      if (t) set.add(t)
    }
    return { data: Array.from(set).sort((a, b) => a.localeCompare(b)), error: null }
  })
}

// ─── Procedures: krew.lists.list / create / rename / delete ────────────────

/** Shape returned when selecting krew_lists with an embedded count. */
type KrewListWithCount = {
  id: string
  name: string
  created_at: string
  updated_at: string
  krew_list_memberships: Array<{ count: number }>
}

function mapList(row: KrewListWithCount): KrewList {
  return {
    id: row.id,
    name: row.name,
    count: row.krew_list_memberships?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getKrewLists(): Promise<{ data: KrewList[]; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: [], error: 'Not signed in' }

  const { data, error } = await supabase
    .from('krew_lists')
    .select(`id, name, created_at, updated_at, krew_list_memberships(count)`)
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  const lists = ((data ?? []) as unknown as KrewListWithCount[]).map(mapList)
  return { data: lists, error: null }
}

export async function createKrewList(
  name: string
): Promise<{ data: KrewList | null; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: null, error: 'Not signed in' }
  const trimmed = name.trim()
  if (!trimmed) return { data: null, error: 'Name required' }

  const { data, error } = await supabase
    .from('krew_lists')
    .insert({ company_id: companyId, name: trimmed })
    .select('id, name, created_at, updated_at')
    .single()
  if (error || !data) return { data: null, error: error?.message ?? 'Insert failed' }

  return {
    data: {
      id: data.id,
      name: data.name,
      count: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    error: null,
  }
}

export async function renameKrewList(
  id: string,
  name: string
): Promise<{ data: KrewList | null; error: ServiceError }> {
  const trimmed = name.trim()
  if (!trimmed) return { data: null, error: 'Name required' }

  const { data, error } = await supabase
    .from('krew_lists')
    .update({ name: trimmed })
    .eq('id', id)
    .select(`id, name, created_at, updated_at, krew_list_memberships(count)`)
    .single()
  if (error || !data) return { data: null, error: error?.message ?? 'Update failed' }

  return { data: mapList(data as unknown as KrewListWithCount), error: null }
}

export async function deleteKrewList(id: string): Promise<{ data: null; error: ServiceError }> {
  const { error } = await supabase.from('krew_lists').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Procedures: krew.addToList / removeFromList ───────────────────────────

export async function addWorkerToList(
  workerId: string,
  listId: string
): Promise<{ data: null; error: ServiceError }> {
  const { error } = await supabase
    .from('krew_list_memberships')
    .upsert({ list_id: listId, worker_id: workerId }, { onConflict: 'list_id,worker_id' })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function removeWorkerFromList(
  workerId: string,
  listId: string
): Promise<{ data: null; error: ServiceError }> {
  const { error } = await supabase
    .from('krew_list_memberships')
    .delete()
    .eq('list_id', listId)
    .eq('worker_id', workerId)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Procedures: krew.addToKrew / removeFromKrew ───────────────────────────

export async function addWorkerToKrew(
  workerId: string,
  opts?: { source?: KrewSource }
): Promise<{ data: null; error: ServiceError }> {
  // Single round-trip via the add_worker_to_krew SQL function: INSERT … ON
  // CONFLICT preserves the original `source` so re-adding a referral or
  // past-hire worker keeps their attribution history intact. Previously this
  // path took two trips (SELECT then UPDATE/INSERT).
  const { error } = await supabase.rpc(
    'add_worker_to_krew' as never,
    {
      p_worker_id: workerId,
      p_source: opts?.source ?? 'manual_add',
    } as never
  )
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function removeWorkerFromKrew(
  workerId: string
): Promise<{ data: null; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: null, error: 'Not signed in' }

  const { error } = await supabase
    .from('krew_relationships')
    .update({ in_krew: false, removed_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('worker_id', workerId)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Krew relationship lookup (used by ApplicantSlideover's relationship
//     strip — lighter than getWorkerDetail when only the strip is needed). ──

export type WorkerRelationshipSummary = {
  inKrew: boolean
  source: KrewSource
  lastInteractionAt: string | null
}

export async function getKrewRelationship(
  workerId: string
): Promise<{ data: WorkerRelationshipSummary | null; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: null, error: 'Not signed in' }

  const { data, error } = await supabase
    .from('krew_relationships')
    .select('in_krew, source, last_interaction_at')
    .eq('company_id', companyId)
    .eq('worker_id', workerId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }

  return {
    data: {
      inKrew: data.in_krew,
      source: data.source as KrewSource,
      lastInteractionAt: data.last_interaction_at,
    },
    error: null,
  }
}

// ─── Worker detail (drives the WorkerDrawer Summary tab) ───────────────────

export type WorkerDetail = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  primaryTrade: string
  location: string
  isRegulixReady: boolean
  topSkills: string[]
  certifications: Array<{ name: string; issuer: string; expiresOn: string | null }>
  jobHistory: Array<{ employer: string; title: string; duration: string; isCurrent: boolean }>
  /** Self-reported references. Empty when the viewer isn't allowed access per
   *  RLS (no application, or consent revoked). */
  references: Array<{
    id: string
    name: string
    company: string
    phone: string | null
    email: string | null
  }>
  /** Relationship summary for the calling company — null when worker isn't in
   *  the company's krew (e.g. an inbound applicant who hasn't been added yet). */
  relationship: {
    inKrew: boolean
    source: KrewSource
    addedAt: string
    lastInteractionAt: string | null
  } | null
}

type JoinedWorkerRow = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  primary_trade: string | null
  city: string | null
  region: string | null
  is_regulix_ready: boolean | null
  worker_skills: Array<{ name: string; years_exp: number | null }>
  worker_certifications: Array<{
    cert_name: string
    issuing_body: string
    expiry_date: string | null
  }>
  worker_work_history: Array<{
    employer_name: string
    role_title: string
    start_date: string | null
    end_date: string | null
    is_current: boolean
  }>
}

function formatMonthYear(d: string | null | undefined): string {
  if (!d) return ''
  const [yStr, mStr] = d.split('-')
  const y = Number(yStr)
  const m = Number(mStr)
  if (!y || !m) return d
  const month = new Date(y, m - 1).toLocaleString('default', { month: 'short' })
  return `${month} ${y}`
}

function formatJobDuration(start: string | null, end: string | null, isCurrent: boolean): string {
  const startLabel = formatMonthYear(start)
  const endLabel = isCurrent ? 'Present' : formatMonthYear(end)
  if (!startLabel && !endLabel) return ''
  if (!startLabel) return endLabel
  if (!endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
}

const WORKER_DETAIL_SELECT = `
  id, first_name, last_name, avatar_url, primary_trade, city, region, is_regulix_ready,
  worker_skills(name, years_exp),
  worker_certifications(cert_name, issuing_body, expiry_date),
  worker_work_history(employer_name, role_title, start_date, end_date, is_current)
`

export async function getWorkerDetail(
  workerId: string
): Promise<{ data: WorkerDetail | null; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: null, error: 'Not signed in' }

  // Three parallel reads: the worker profile + nested relations, the calling
  // company's relationship row (one or zero results), and self-reported
  // references (RLS returns rows only when the worker has applied to this
  // company with active consent).
  const [workerRes, relRes, refsRes] = await Promise.all([
    supabase.from('worker_profiles').select(WORKER_DETAIL_SELECT).eq('id', workerId).maybeSingle(),
    supabase
      .from('krew_relationships')
      .select('in_krew, source, added_at, last_interaction_at')
      .eq('company_id', companyId)
      .eq('worker_id', workerId)
      .maybeSingle(),
    supabase
      .from('worker_references')
      .select('id, name, company, phone, email')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: true }),
  ])

  if (workerRes.error) return { data: null, error: workerRes.error.message }
  if (!workerRes.data) return { data: null, error: null }

  const w = workerRes.data as unknown as JoinedWorkerRow

  const topSkills = Array.from(
    [...(w.worker_skills ?? [])]
      .sort((s1, s2) => (s2.years_exp ?? 0) - (s1.years_exp ?? 0))
      .reduce((acc, s) => {
        if (!acc.has(s.name)) acc.set(s.name, true)
        return acc
      }, new Map<string, true>())
      .keys()
  ).slice(0, 5)

  const certifications = (w.worker_certifications ?? []).map((c) => ({
    name: c.cert_name,
    issuer: c.issuing_body,
    expiresOn: formatMonthYear(c.expiry_date) || null,
  }))

  const jobHistory = [...(w.worker_work_history ?? [])]
    .sort((j1, j2) => {
      if (j1.is_current !== j2.is_current) return j1.is_current ? -1 : 1
      return (j2.start_date ?? '').localeCompare(j1.start_date ?? '')
    })
    .map((h) => ({
      employer: h.employer_name,
      title: h.role_title,
      duration: formatJobDuration(h.start_date, h.end_date, h.is_current),
      isCurrent: h.is_current === true,
    }))

  const references = (refsRes.data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    company: r.company as string,
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
  }))

  const relationship = relRes.data
    ? {
        inKrew: relRes.data.in_krew,
        source: relRes.data.source as KrewSource,
        addedAt: relRes.data.added_at,
        lastInteractionAt: relRes.data.last_interaction_at,
      }
    : null

  return {
    data: {
      id: w.id,
      firstName: w.first_name ?? '',
      lastName: w.last_name ?? '',
      avatarUrl: w.avatar_url,
      primaryTrade: w.primary_trade ?? '',
      location: [w.city, w.region].filter(Boolean).join(', '),
      isRegulixReady: w.is_regulix_ready === true,
      topSkills,
      certifications,
      jobHistory,
      references,
      relationship,
    },
    error: null,
  }
}

// ─── Worker applications (drives the WorkerDrawer History tab) ────────────
// One card per (worker, company, job) engagement. State + primary date are
// derived here so the card component stays dumb. Completed/Terminated are in
// the matrix but never produced today — the job_engagement layer that splits
// terminal_hired into active/completed/terminated has not shipped yet, so
// every hire renders as Active. Ratings are also null until that layer ships.
// See `Worker Drawer History Card` spec §4.1, §7, §8.

export type WorkerHistoryCardState =
  | 'applied'
  | 'in_review'
  | 'rejected'
  | 'withdrawn'
  | 'archived'
  | 'active'
  | 'completed'
  | 'terminated'

export type WorkerHistoryCard = {
  applicationId: string
  jobId: string
  jobTitle: string
  state: WorkerHistoryCardState
  /** Reverse-chronological sort field. Verb prefix on the card is derived
   *  from `state`, the timestamp is rendered from this field. */
  primaryDate: string
  /** Populated only when state is `applied` or `in_review`. */
  currentStageName: string | null
  /** Always null until job_engagement.rating ships. */
  rating: number | null
  /** Review pills captured when a company closes out an engagement (Completed
   *  or Terminated). The reviewer picks from a fixed vocabulary — "punctual",
   *  "poor work ethic", etc. Renders as a third row on finished cards. Empty
   *  array until the review flow ships. */
  reviewTags: string[]
  /** Job meta surfaced under the title — mirrors the matches card meta row. */
  jobLocation: string | null
  jobType: string | null
  jobPayMin: number | null
  jobPayMax: number | null
  jobPayType: string | null
}

type ApplicationStatusRaw =
  | 'active'
  | 'terminal_hired'
  | 'terminal_rejected'
  | 'terminal_withdrawn'
  | 'terminal_archived'

type SnapshotStage = { id: string; name: string; order: number }

type JoinedApplicationRow = {
  id: string
  created_at: string
  status_updated_at: string | null
  status: ApplicationStatusRaw
  current_stage_id: string | null
  jobs: {
    id: string
    title: string
    company_id: string
    location: string | null
    type: string | null
    pay_min: number | null
    pay_max: number | null
    pay_type: string | null
    pipeline_snapshot: { stages?: SnapshotStage[] } | null
  } | null
}

function deriveCardState(
  status: ApplicationStatusRaw,
  currentStageId: string | null,
  stages: SnapshotStage[]
): WorkerHistoryCardState {
  if (status === 'terminal_rejected') return 'rejected'
  if (status === 'terminal_withdrawn') return 'withdrawn'
  if (status === 'terminal_archived') return 'archived'
  // No job_engagement layer yet → every hire renders as Active.
  if (status === 'terminal_hired') return 'active'

  // status === 'active' → either applied or in_review depending on stage.
  if (!currentStageId || stages.length === 0) return 'applied'
  const firstStageId = [...stages].sort((a, b) => a.order - b.order)[0]?.id
  return currentStageId === firstStageId ? 'applied' : 'in_review'
}

function primaryDateFor(state: WorkerHistoryCardState, row: JoinedApplicationRow): string {
  if (state === 'applied' || state === 'in_review') return row.created_at
  return row.status_updated_at ?? row.created_at
}

// Shared row→card mapping used by both the company-scoped drawer history
// (`getWorkerApplications`) and the worker profile's full activity log
// (`getWorkerActivityLog`). The events covered are identical; only the row
// scope (RLS) differs between the two callers.
function mapApplicationRowsToHistoryCards(rows: JoinedApplicationRow[]): WorkerHistoryCard[] {
  return rows
    .filter((r) => r.jobs !== null)
    .map<WorkerHistoryCard>((r) => {
      const job = r.jobs!
      const stages = job.pipeline_snapshot?.stages ?? []
      const state = deriveCardState(r.status, r.current_stage_id, stages)
      const stageName =
        (state === 'applied' || state === 'in_review') && r.current_stage_id
          ? (stages.find((s) => s.id === r.current_stage_id)?.name ?? null)
          : null
      return {
        applicationId: r.id,
        jobId: job.id,
        jobTitle: job.title,
        state,
        primaryDate: primaryDateFor(state, r),
        currentStageName: stageName,
        rating: null,
        reviewTags: [],
        jobLocation: job.location,
        jobType: job.type,
        jobPayMin: job.pay_min,
        jobPayMax: job.pay_max,
        jobPayType: job.pay_type,
      }
    })
}

// ─── DEMO SEED (REMOVE) ───────────────────────────────────────────────────
// Throwaway: previews the finished cards (Completed with rating + review
// pills, Completed with em-dash) plus a Terminated and a Rejected card.
// Delete this whole helper + its call sites when job_engagement + the review
// flow ship.
function seedDemoHistoryCards(cards: WorkerHistoryCard[]): void {
  const firstActive = cards.find((c) => c.state === 'active')
  if (!firstActive) return
  firstActive.state = 'completed'
  firstActive.rating = 4.6
  firstActive.reviewTags = ['Punctual', 'Reliable', 'Great attitude']
  const baseTime = new Date(firstActive.primaryDate).getTime()
  const dayMs = 24 * 60 * 60 * 1000
  cards.push({
    applicationId: `${firstActive.applicationId}-demo-empty`,
    jobId: firstActive.jobId,
    jobTitle: firstActive.jobTitle,
    state: 'completed',
    primaryDate: new Date(baseTime - 7 * dayMs).toISOString(),
    currentStageName: null,
    rating: null,
    reviewTags: [],
    jobLocation: firstActive.jobLocation,
    jobType: firstActive.jobType,
    jobPayMin: firstActive.jobPayMin,
    jobPayMax: firstActive.jobPayMax,
    jobPayType: firstActive.jobPayType,
  })
  cards.push({
    applicationId: `${firstActive.applicationId}-demo-terminated`,
    jobId: firstActive.jobId,
    jobTitle: firstActive.jobTitle,
    state: 'terminated',
    primaryDate: new Date(baseTime - 14 * dayMs).toISOString(),
    currentStageName: null,
    rating: null,
    reviewTags: ['No-show', 'Poor work ethic'],
    jobLocation: firstActive.jobLocation,
    jobType: firstActive.jobType,
    jobPayMin: firstActive.jobPayMin,
    jobPayMax: firstActive.jobPayMax,
    jobPayType: firstActive.jobPayType,
  })
  cards.push({
    applicationId: `${firstActive.applicationId}-demo-rejected`,
    jobId: firstActive.jobId,
    jobTitle: firstActive.jobTitle,
    state: 'rejected',
    primaryDate: new Date(baseTime - 21 * dayMs).toISOString(),
    currentStageName: null,
    rating: null,
    reviewTags: [],
    jobLocation: firstActive.jobLocation,
    jobType: firstActive.jobType,
    jobPayMin: firstActive.jobPayMin,
    jobPayMax: firstActive.jobPayMax,
    jobPayType: firstActive.jobPayType,
  })
}
// ─── END DEMO SEED ────────────────────────────────────────────────────────

export async function getWorkerApplications(
  workerId: string
): Promise<{ data: WorkerHistoryCard[]; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: [], error: 'Not signed in' }

  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, created_at, status_updated_at, status, current_stage_id, jobs!inner(id, title, company_id, location, type, pay_min, pay_max, pay_type, pipeline_snapshot)'
    )
    .eq('worker_id', workerId)
    .eq('company_id', companyId)

  if (error) return { data: [], error: error.message }

  const cards = mapApplicationRowsToHistoryCards((data ?? []) as unknown as JoinedApplicationRow[])
  seedDemoHistoryCards(cards)

  // Strict reverse chronological by primary date — see spec §7.
  cards.sort((a, b) => (a.primaryDate < b.primaryDate ? 1 : -1))
  return { data: cards, error: null }
}

// Full activity log for a worker, surfaced on the worker profile's Activity
// tab. Same high-level events as the My Krew drawer history, but NOT scoped to
// a single company: RLS does the scoping for us — a worker viewing their own
// profile reads every application across all companies (`worker_own` policy),
// while a company viewing the profile is auto-limited to applications to its
// own jobs (`company_read` policy). The card shape and event set are identical
// to `getWorkerApplications`.
export async function getWorkerActivityLog(
  workerId: string
): Promise<{ data: WorkerHistoryCard[]; error: ServiceError }> {
  const userId = await getCurrentUserId()
  if (!userId) return { data: [], error: 'Not signed in' }

  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, created_at, status_updated_at, status, current_stage_id, jobs!inner(id, title, company_id, location, type, pay_min, pay_max, pay_type, pipeline_snapshot)'
    )
    .eq('worker_id', workerId)

  if (error) return { data: [], error: error.message }

  const cards = mapApplicationRowsToHistoryCards((data ?? []) as unknown as JoinedApplicationRow[])
  seedDemoHistoryCards(cards)

  // Strict reverse chronological by primary date — see spec §7.
  cards.sort((a, b) => (a.primaryDate < b.primaryDate ? 1 : -1))
  return { data: cards, error: null }
}

// ─── Worker notes (UI-only stub; persists to localStorage until a real table
//     lands). Same shape as application_notes so swapping to a real backend
//     later is mechanical. Keyed by company × worker. ───────────────────────

export type WorkerNote = {
  id: string
  text: string
  authorName: string
  createdAt: string
}

function workerNotesKey(companyId: string, workerId: string): string {
  return `kt:worker_notes:${companyId}:${workerId}`
}

export async function listWorkerNotes(
  workerId: string
): Promise<{ data: WorkerNote[]; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: [], error: 'Not signed in' }
  try {
    const raw = window.localStorage.getItem(workerNotesKey(companyId, workerId))
    if (!raw) return { data: [], error: null }
    return { data: JSON.parse(raw) as WorkerNote[], error: null }
  } catch {
    return { data: [], error: null }
  }
}

export async function addWorkerNote(
  workerId: string,
  text: string,
  authorName: string
): Promise<{ data: WorkerNote | null; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: null, error: 'Not signed in' }
  const trimmed = text.trim()
  if (!trimmed) return { data: null, error: 'Note text is required' }

  const note: WorkerNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: trimmed,
    authorName,
    createdAt: new Date().toISOString(),
  }
  try {
    const key = workerNotesKey(companyId, workerId)
    const raw = window.localStorage.getItem(key)
    const existing = raw ? (JSON.parse(raw) as WorkerNote[]) : []
    const next = [note, ...existing]
    window.localStorage.setItem(key, JSON.stringify(next))
    return { data: note, error: null }
  } catch {
    return { data: null, error: 'Could not save note' }
  }
}

// ─── Worker → job matches (drives the WorkerDrawer Matches tab) ────────────
// Mirrors the SQL in compute_krew_match_counts so the per-row "MATCHES" pill on
// the krew table and the per-job cards in the drawer agree on what counts as a
// match. Jobs the worker has already applied to are excluded — those belong on
// the History tab, not as a "we should reach out about this" signal.

export type WorkerJobMatch = {
  job: Job
  isStrong: boolean
  signals: {
    locationMatch: boolean
    matchedSkills: string[]
    tradeMatch: boolean
  }
}

const norm = (s: string | null | undefined): string => (s ?? '').trim().toLowerCase()

export async function getWorkerMatches(
  workerId: string
): Promise<{ data: WorkerJobMatch[]; error: ServiceError }> {
  const companyId = await currentCompanyId()
  if (!companyId) return { data: [], error: 'Not signed in' }

  // Parallel: worker fields needed for scoring, company's *active* jobs (the
  // only ones eligible to match against — pulling closed/draft jobs and
  // filtering them out in JS was wasted payload), and the worker's
  // applications (to filter out jobs they're already on).
  const [workerRes, jobsRes, appsRes] = await Promise.all([
    supabase
      .from('worker_profiles')
      .select('city, primary_trade, worker_skills(name)')
      .eq('id', workerId)
      .maybeSingle(),
    getCompanyJobs(companyId, { activeOnly: true }),
    supabase.from('applications').select('job_id').eq('worker_id', workerId),
  ])

  if (workerRes.error) return { data: [], error: workerRes.error.message }
  if (!workerRes.data) return { data: [], error: null }
  if (jobsRes.error) return { data: [], error: jobsRes.error }

  const w = workerRes.data as unknown as {
    city: string | null
    primary_trade: string | null
    worker_skills: Array<{ name: string }>
  }
  const workerCity = norm(w.city)
  const workerTrade = norm(w.primary_trade)
  const workerSkills = new Set((w.worker_skills ?? []).map((s) => norm(s.name)).filter(Boolean))
  const appliedJobIds = new Set(
    ((appsRes.data ?? []) as Array<{ job_id: string }>).map((a) => a.job_id)
  )

  const matches: WorkerJobMatch[] = []
  for (const job of jobsRes.data) {
    if (appliedJobIds.has(job.id)) continue

    const jobLoc = norm(job.location)
    const jobTitle = norm(job.title)
    const locationMatch = workerCity !== '' && jobLoc !== '' && jobLoc.includes(workerCity)
    const tradeMatch = workerTrade !== '' && jobTitle !== '' && jobTitle.includes(workerTrade)
    const matchedSkills = (job.skills ?? []).filter((s) => workerSkills.has(norm(s)))
    const skillOverlap = matchedSkills.length

    const isMatch = locationMatch || skillOverlap > 0 || tradeMatch
    if (!isMatch) continue

    const isStrong = (locationMatch && (skillOverlap >= 1 || tradeMatch)) || skillOverlap >= 2

    matches.push({
      job,
      isStrong,
      signals: { locationMatch, matchedSkills, tradeMatch },
    })
  }

  // Strong matches first, then by skill overlap, then most recent.
  matches.sort((a, b) => {
    if (a.isStrong !== b.isStrong) return a.isStrong ? -1 : 1
    const skillDiff = b.signals.matchedSkills.length - a.signals.matchedSkills.length
    if (skillDiff !== 0) return skillDiff
    return a.job.postedDaysAgo - b.job.postedDaysAgo
  })

  return { data: matches, error: null }
}

// ─── WorkerDrawer bootstrap ────────────────────────────────────────────────
// Single round-trip that fans out every fetch the drawer needs (detail +
// matches + history + notes) in parallel. Before this existed the drawer ran
// two separate effects: one for detail, one for badge counts — and then each
// tab refetched its own data when opened. That meant getWorkerMatches and
// getWorkerApplications fired twice per drawer open. Now we fetch each source
// exactly once, and the tabs render from the hoisted data.

export type WorkerDrawerBootstrap = {
  detail: WorkerDetail | null
  matches: WorkerJobMatch[]
  history: WorkerHistoryCard[]
  notes: WorkerNote[]
}

export async function getWorkerDrawerBootstrap(
  workerId: string
): Promise<{ data: WorkerDrawerBootstrap; error: ServiceError }> {
  const [detailRes, matchesRes, historyRes, notesRes] = await Promise.all([
    getWorkerDetail(workerId),
    getWorkerMatches(workerId),
    getWorkerApplications(workerId),
    listWorkerNotes(workerId),
  ])

  const firstError = detailRes.error ?? matchesRes.error ?? historyRes.error ?? notesRes.error

  return {
    data: {
      detail: detailRes.data,
      matches: matchesRes.data,
      history: historyRes.data,
      notes: notesRes.data,
    },
    error: firstError,
  }
}
