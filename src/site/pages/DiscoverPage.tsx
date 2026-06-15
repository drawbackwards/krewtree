import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '../../components'
import { useToast } from '../../components/Toast/Toast'
import { DiscoverWorkerCard } from '../components/DiscoverWorkerCard/DiscoverWorkerCard'
import {
  addWorkerToKrew,
  createDiscoverSavedSearch,
  deleteDiscoverSavedSearch,
  discoverWorkers,
  getCompanyActiveJobs,
  getCompanyCoords,
  getDiscoverSavedSearches,
  getDiscoverSkills,
  removeWorkerFromKrew,
  searchCities,
  type CityOption,
  type CompanyActiveJobOption,
  type DiscoverSavedSearch,
  type DiscoverSort,
  type DiscoverWorker,
} from '../services/krewService'
import { useChatPane } from '../components/ChatPane/ChatPaneContext'
import { useDebounce } from '../hooks/useDebounce'
import { SearchIcon } from '../icons'
import styles from './DiscoverPage.module.css'

const PAGE_SIZE = 12

const FilterSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className={styles.filterTitle}>{children}</p>
)

const Checkbox: React.FC<{
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  count?: number
}> = ({ label, checked, onChange, count }) => (
  <label className={styles.checkRow}>
    <span className={styles.checkLeft}>
      <span
        className={[styles.checkBox, checked ? styles.checkBoxOn : ''].filter(Boolean).join(' ')}
        aria-hidden="true"
      >
        {checked && (
          <svg
            width="9"
            height="7"
            viewBox="0 0 9 7"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1 3.5l2.5 2.5 5-5" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span className={styles.checkLabel}>{label}</span>
    </span>
    {count !== undefined && <span className={styles.checkCount}>{count}</span>}
  </label>
)

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { openChat } = useChatPane()

  // URL-driven filter state.
  const searchQ = searchParams.get('q') ?? ''
  // Input renders searchQ live; the worker fetch trails it so we don't refire
  // the (potentially 500-row) discover query on every keystroke.
  const debouncedSearchQ = useDebounce(searchQ)
  const selectedSkills = useMemo(
    () => searchParams.get('skill')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  )
  const regulixOnly = searchParams.get('regulix') === '1'
  const sortBy = (searchParams.get('sort') ?? 'recent') as DiscoverSort
  const matchJobId = searchParams.get('job') ?? null
  const radiusParam = Number(searchParams.get('radius') ?? '')
  const radiusMi: number | null = [10, 25, 50, 100].includes(radiusParam) ? radiusParam : null
  // Distance-anchor city ("Phoenix, AZ"). Stored as a single param so saved
  // searches and URLs stay compact; split into city/state when passing to the
  // service.
  const nearParam = searchParams.get('near') ?? ''
  const [nearCity, nearState] = useMemo(() => {
    const m = /^([^,]+?)\s*,\s*([A-Za-z]{2})$/.exec(nearParam.trim())
    return m ? [m[1], m[2].toUpperCase()] : [null, null]
  }, [nearParam])
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const updateFilters = (updates: Record<string, string | null>): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === '') next.delete(key)
          else next.set(key, value)
        }
        if (Object.keys(updates).some((k) => k !== 'page')) next.delete('page')
        return next
      },
      { replace: false }
    )
  }

  // Data state.
  const [workers, setWorkers] = useState<DiscoverWorker[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>({})
  const [addingId, setAddingId] = useState<string | null>(null)

  // Saved searches state.
  const [savedSearches, setSavedSearches] = useState<DiscoverSavedSearch[]>([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [saving, setSaving] = useState(false)

  // Active jobs for the "Match to job" dropdown.
  const [activeJobs, setActiveJobs] = useState<CompanyActiveJobOption[]>([])
  const matchedJob = matchJobId ? (activeJobs.find((j) => j.id === matchJobId) ?? null) : null

  // Whether the company has a saved location (drives the Nearest sort pill).
  const [hasCompanyCoords, setHasCompanyCoords] = useState(false)

  // City-picker typeahead state — used only for the radius anchor.
  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([])
  const [cityPickerOpen, setCityPickerOpen] = useState(false)

  // Load the skill list once (distinct worker_skills.name — same source as
  // the pills rendered on each card, so filter values match the chips).
  useEffect(() => {
    getDiscoverSkills().then(({ data }) => setSkills(data))
  }, [])

  // Load saved searches once. Errors are silent — the empty state covers a
  // missing/un-migrated table without breaking the page.
  useEffect(() => {
    getDiscoverSavedSearches().then(({ data }) => setSavedSearches(data))
  }, [])

  // Load this company's active jobs once. Drives the "Match to job" dropdown;
  // dropdown is empty (and disabled) if none are active.
  useEffect(() => {
    getCompanyActiveJobs().then(({ data }) => setActiveJobs(data))
  }, [])

  // Load company coords once. Drives whether the Nearest sort pill is enabled.
  useEffect(() => {
    getCompanyCoords().then(({ data }) => {
      setHasCompanyCoords(data !== null)
      setCoordsChecked(true)
    })
  }, [])

  // Self-heal stuck distance state. If the URL carries `sort=nearest` or
  // `radius=N` from a prior session but the current company has no saved
  // coords AND no `near` city is picked, the service can't resolve an anchor
  // and errors. The user gets stranded because the Nearest pill is disabled
  // and the radius radios are hidden in that state. Drop the offending params
  // so the page lands in a usable state. Waits one tick until the company-
  // coords load resolves so we don't fire on every render before the fetch.
  const [coordsChecked, setCoordsChecked] = useState(false)
  useEffect(() => {
    if (!coordsChecked) return
    const anchorAvailable = hasCompanyCoords || nearCity !== null
    if (anchorAvailable) return
    const stuckSort = sortBy === 'nearest'
    const stuckRadius = radiusMi !== null
    if (!stuckSort && !stuckRadius) return
    updateFilters({
      sort: stuckSort ? null : sortBy,
      radius: null,
    })
  }, [coordsChecked, hasCompanyCoords, nearCity, sortBy, radiusMi])

  // Debounced city-typeahead lookup.
  useEffect(() => {
    if (cityInput.trim().length < 2) {
      setCitySuggestions([])
      return
    }
    const t = setTimeout(() => {
      searchCities(cityInput).then(({ data }) => setCitySuggestions(data))
    }, 200)
    return () => clearTimeout(t)
  }, [cityInput])

  // Re-fetch on any filter change. Distance-anchor queries (sort=nearest or
  // any radius) need the company's coords resolved before they fire, otherwise
  // the service errors with "Pick a location" — wasting one round-trip on
  // every deep link that carries a stale `sort=nearest`. We wait one tick for
  // the coord-load to land; the self-heal effect below cleans up the URL if
  // no anchor is available.
  const refetch = (): void => {
    const needsAnchor = sortBy === 'nearest' || radiusMi !== null
    if (needsAnchor && !coordsChecked) return
    setLoading(true)
    setError(null)
    discoverWorkers({
      search: debouncedSearchQ || undefined,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      regulixReadyOnly: regulixOnly || undefined,
      sort: sortBy,
      matchJobId: matchJobId ?? undefined,
      radiusMi: radiusMi ?? undefined,
      nearCity: nearCity ?? undefined,
      nearState: nearState ?? undefined,
      page,
      pageSize: PAGE_SIZE,
    }).then(({ data, error }) => {
      setWorkers(data.workers)
      setTotal(data.total)
      setError(error)
      setLoading(false)
    })
  }

  useEffect(refetch, [
    debouncedSearchQ,
    selectedSkills,
    regulixOnly,
    sortBy,
    matchJobId,
    radiusMi,
    nearCity,
    nearState,
    page,
    coordsChecked,
  ])

  // Compute per-skill counts against the *currently visible* page so the side
  // counts roughly track active filters. Each worker carries up to N skill
  // chips (topSkills); we tally one count per (worker, skill) pair, matching
  // what the user sees in the pills.
  useEffect(() => {
    const counts: Record<string, number> = {}
    for (const w of workers) {
      for (const skill of w.topSkills) {
        counts[skill] = (counts[skill] ?? 0) + 1
      }
    }
    setSkillCounts(counts)
  }, [workers])

  const toggleSkill = (skill: string): void => {
    const set = new Set(selectedSkills)
    if (set.has(skill)) set.delete(skill)
    else set.add(skill)
    updateFilters({ skill: Array.from(set).join(',') || null })
  }

  const handleSaveSearch = async (): Promise<void> => {
    if (!saveLabel.trim() || saving) return
    setSaving(true)
    const { data, error } = await createDiscoverSavedSearch({
      label: saveLabel,
      query: searchQ,
      skills: selectedSkills,
      regulixOnly,
      sort: sortBy,
      radiusMi,
      nearCity,
      nearState,
      matchJobId,
    })
    setSaving(false)
    if (error || !data) {
      toast({
        title: 'Could not save search',
        description: error ?? 'Unknown error',
        variant: 'danger',
      })
      return
    }
    setSavedSearches((prev) => [data, ...prev])
    setShowSaveForm(false)
    setSaveLabel('')
    toast({
      title: 'Search saved',
      description: `"${data.label}" is now in your saved list.`,
      variant: 'success',
    })
  }

  const handleLoadSearch = (s: DiscoverSavedSearch): void => {
    setSearchParams(
      () => {
        const next = new URLSearchParams()
        if (s.query) next.set('q', s.query)
        if (s.skills.length > 0) next.set('skill', s.skills.join(','))
        if (s.regulixOnly) next.set('regulix', '1')
        if (s.sort !== 'recent') next.set('sort', s.sort)
        if (s.radiusMi != null) next.set('radius', String(s.radiusMi))
        if (s.nearCity && s.nearState) next.set('near', `${s.nearCity}, ${s.nearState}`)
        if (s.matchJobId) next.set('job', s.matchJobId)
        return next
      },
      { replace: false }
    )
  }

  const handleDeleteSearch = async (id: string): Promise<void> => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id))
    const { error } = await deleteDiscoverSavedSearch(id)
    if (error) {
      toast({ title: 'Could not delete', description: error, variant: 'danger' })
    }
  }

  const handleAdd = async (worker: DiscoverWorker): Promise<void> => {
    setAddingId(worker.id)
    const { error } = await addWorkerToKrew(worker.id)
    setAddingId(null)
    if (error) {
      toast({ title: 'Could not add to krew', description: error, variant: 'danger' })
      return
    }
    toast({
      title: 'Added to My Krew',
      description: `${worker.firstName} ${worker.lastName} is now in your krew.`,
      variant: 'success',
    })
    setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, inKrew: true } : w)))
  }

  const handleRemove = async (worker: DiscoverWorker): Promise<void> => {
    const { error } = await removeWorkerFromKrew(worker.id)
    if (error) {
      toast({ title: 'Could not remove from krew', description: error, variant: 'danger' })
      return
    }
    toast({
      title: 'Removed from My Krew',
      description: `${worker.firstName} ${worker.lastName} is no longer in your krew.`,
      variant: 'success',
    })
    setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, inKrew: false } : w)))
  }

  const handleViewProfile = (worker: DiscoverWorker): void => {
    navigate(`/site/profile/${worker.id}`)
  }

  // Direct messages don't require an application — open the docked chat
  // pane for this worker (LinkedIn-style) without leaving the page.
  const handleMessage = (worker: DiscoverWorker): void => {
    openChat({
      workerId: worker.id,
      name: `${worker.firstName} ${worker.lastName}`.trim(),
      avatarUrl: worker.avatarUrl,
    })
  }

  const hasActiveFilters =
    selectedSkills.length > 0 ||
    regulixOnly ||
    searchQ.length > 0 ||
    radiusMi !== null ||
    nearCity !== null ||
    matchJobId !== null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, total)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Discover workers</h1>
              <p className={styles.subtitle}>
                Browse the full directory and add great fits to your krew.
              </p>
            </div>
          </div>
          <div className={styles.searchRow}>
            <Input
              placeholder="Search by name or trade…"
              value={searchQ}
              onChange={(e) => updateFilters({ q: e.target.value || null })}
              style={{ background: 'white' }}
              leadingIcon={<SearchIcon size={15} />}
            />
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {/* Saved Searches */}
          <div className={styles.savedSearches}>
            <p className={styles.savedSearchesTitle}>
              {savedSearches.length} Saved Search{savedSearches.length === 1 ? '' : 'es'}
            </p>

            {showSaveForm && (
              <div className={styles.saveForm}>
                <input
                  className={styles.saveFormInput}
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="Name this search…"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveSearch()
                    if (e.key === 'Escape') {
                      setShowSaveForm(false)
                      setSaveLabel('')
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.saveFormSubmit}
                  onClick={handleSaveSearch}
                  disabled={!saveLabel.trim() || saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}

            {savedSearches.length > 0 ? (
              <div className={styles.savedSearchesList}>
                {savedSearches.map((s) => (
                  <div key={s.id} className={styles.savedSearchRow}>
                    <button
                      type="button"
                      className={styles.savedSearchLoad}
                      onClick={() => handleLoadSearch(s)}
                    >
                      {s.label}
                    </button>
                    <button
                      type="button"
                      className={styles.savedSearchDelete}
                      onClick={() => handleDeleteSearch(s.id)}
                      aria-label={`Delete ${s.label}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !showSaveForm && <p className={styles.savedSearchesEmpty}>No saved searches yet</p>
            )}

            {!showSaveForm ? (
              <button
                type="button"
                className={styles.savedSearchesBtn}
                onClick={() => setShowSaveForm(true)}
                disabled={!hasActiveFilters}
                title={!hasActiveFilters ? 'Apply a filter or search term first' : undefined}
              >
                Save Current Search
              </button>
            ) : (
              <button
                type="button"
                className={styles.savedSearchesCancel}
                onClick={() => {
                  setShowSaveForm(false)
                  setSaveLabel('')
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <div className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <p className={styles.filterCardTitle}>Filters</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className={styles.clearLink}
                  onClick={() => setSearchParams({}, { replace: true })}
                >
                  Clear all
                </button>
              )}
            </div>

            <FilterSectionTitle>Match to job</FilterSectionTitle>
            {matchedJob ? (
              <div className={styles.jobChip}>
                <span className={styles.jobChipValue}>{matchedJob.title}</span>
                <button
                  type="button"
                  className={styles.jobChipClear}
                  onClick={() => {
                    // Drop sort=match if it was leaning on this filter.
                    updateFilters({ job: null, sort: sortBy === 'match' ? null : sortBy })
                  }}
                  aria-label="Clear matched job"
                >
                  ✕
                </button>
              </div>
            ) : activeJobs.length === 0 ? (
              <p className={styles.radiusHint}>Post a job to filter by best match.</p>
            ) : (
              <select
                className={styles.matchSelect}
                value=""
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return
                  // Picking a job defaults the sort to "Best match" so the
                  // primary intent (rank candidates by score) is satisfied
                  // without the user clicking the sort pill too.
                  updateFilters({ job: v, sort: 'match' })
                }}
              >
                <option value="">Select a job…</option>
                {activeJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            )}

            <div className={styles.divider} />

            <FilterSectionTitle>Distance</FilterSectionTitle>

            {/* Anchor city picker — defaults to the company office.
                Typeahead opens on focus; clicking a result sets ?near=. */}
            <div className={styles.cityPicker}>
              {nearCity && nearState ? (
                <div className={styles.cityChip}>
                  <span className={styles.cityChipLabel}>Near</span>
                  <span className={styles.cityChipValue}>
                    {nearCity}, {nearState}
                  </span>
                  <button
                    type="button"
                    className={styles.cityChipClear}
                    onClick={() => updateFilters({ near: null })}
                    aria-label="Reset to company office"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className={styles.cityInput}
                    placeholder={
                      hasCompanyCoords ? 'Near your office, or type a city…' : 'Type a city…'
                    }
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onFocus={() => setCityPickerOpen(true)}
                    onBlur={() => setTimeout(() => setCityPickerOpen(false), 150)}
                  />
                  {cityPickerOpen && citySuggestions.length > 0 && (
                    <ul className={styles.citySuggestions} role="listbox">
                      {citySuggestions.map((c) => (
                        <li key={`${c.state}-${c.city}`}>
                          <button
                            type="button"
                            className={styles.citySuggestion}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              updateFilters({ near: `${c.city}, ${c.state}` })
                              setCityInput('')
                              setCityPickerOpen(false)
                            }}
                          >
                            {c.city}, {c.state}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {hasCompanyCoords || nearCity ? (
              <div className={styles.radiusList}>
                {([null, 10, 25, 50, 100] as const).map((mi) => {
                  const checked = (mi === null && radiusMi === null) || radiusMi === mi
                  const label = mi === null ? 'Any' : `${mi} miles`
                  return (
                    <label key={String(mi)} className={styles.radioRow}>
                      <span
                        className={[styles.radio, checked ? styles.radioOn : '']
                          .filter(Boolean)
                          .join(' ')}
                        aria-hidden="true"
                      >
                        {checked && <span className={styles.radioDot} />}
                      </span>
                      <input
                        type="radio"
                        name="radius"
                        checked={checked}
                        onChange={() => updateFilters({ radius: mi === null ? null : String(mi) })}
                        style={{ display: 'none' }}
                      />
                      <span className={styles.checkLabel}>{label}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className={styles.radiusHint}>
                Pick a city above (or set your company location) to filter by distance.
              </p>
            )}

            <div className={styles.divider} />

            <FilterSectionTitle>Special</FilterSectionTitle>
            <Checkbox
              label="Regulix Ready only"
              checked={regulixOnly}
              onChange={(v) => updateFilters({ regulix: v ? '1' : null })}
            />

            <div className={styles.divider} />

            <FilterSectionTitle>Skill</FilterSectionTitle>
            <div className={styles.skillList}>
              {skills.length === 0 ? (
                <p className={styles.empty}>No skills yet.</p>
              ) : (
                skills.map((s) => (
                  <Checkbox
                    key={s}
                    label={s}
                    count={skillCounts[s] ?? 0}
                    checked={selectedSkills.includes(s)}
                    onChange={() => toggleSkill(s)}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        <div className={styles.results}>
          <div className={styles.sortBar}>
            <span className={styles.resultsCount}>
              {loading ? 'Loading…' : `${total} worker${total === 1 ? '' : 's'}`}
            </span>
            <div className={styles.sortButtons}>
              <span className={styles.sortLabel}>Sort:</span>
              {/* "Best match" only shows when a job is picked; it's a no-op
                  otherwise. Comes first so it lands left-most when present. */}
              {matchedJob && (
                <button
                  type="button"
                  className={[styles.sortPill, sortBy === 'match' ? styles.sortPillActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => updateFilters({ sort: 'match' })}
                >
                  Best match
                </button>
              )}
              {(['recent', 'nearest', 'name'] as const).map((s) => {
                const distanceDisabled = s === 'nearest' && !hasCompanyCoords && !nearCity
                return (
                  <button
                    key={s}
                    type="button"
                    className={[styles.sortPill, sortBy === s ? styles.sortPillActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => updateFilters({ sort: s === 'recent' ? null : s })}
                    disabled={distanceDisabled}
                    title={
                      distanceDisabled
                        ? 'Pick a city or set your company location to enable Nearest sort'
                        : undefined
                    }
                  >
                    {s === 'recent' ? 'Most Recent' : s === 'nearest' ? 'Nearest' : 'Name (A–Z)'}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <p className={styles.stateMessage}>Loading workers…</p>
          ) : error ? (
            <p className={styles.stateMessage}>Could not load workers: {error}</p>
          ) : workers.length === 0 ? (
            <div className={styles.emptyState}>
              <SearchIcon size={36} />
              <p className={styles.emptyTitle}>No workers match your filters</p>
              <p className={styles.emptyBody}>
                Try adjusting your search or clearing some filters.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.cardList}>
                {workers.map((w) => (
                  <DiscoverWorkerCard
                    key={w.id}
                    worker={w}
                    isAdding={addingId === w.id}
                    onAddToKrew={() => handleAdd(w)}
                    onRemoveFromKrew={() => handleRemove(w)}
                    onViewProfile={() => handleViewProfile(w)}
                    onMessage={() => handleMessage(w)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page === 1}
                    onClick={() => updateFilters({ page: String(Math.max(1, page - 1)) })}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={[styles.pageNum, page === n ? styles.pageNumActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => updateFilters({ page: n === 1 ? null : String(n) })}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page === totalPages}
                    onClick={() => updateFilters({ page: String(Math.min(totalPages, page + 1)) })}
                  >
                    Next →
                  </button>
                </div>
              )}
              <p className={styles.showingLine}>
                Showing {showingFrom}–{showingTo} of {total}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
