import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Badge } from '../../components'
import { JobCard } from '../components/JobCard/JobCard'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import type { SavedSearch, Job } from '../types'
import { industries, locationRegions } from '../data/mock'
import { getJobs, getAppliedJobIds } from '../services/jobService'
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} from '../services/savedSearchService'
import { useAuth } from '../context/AuthContext'
import { LocationIcon, SearchIcon, SlidersIcon, SortIcon, CloseIcon, ListIcon } from '../icons'
import styles from './JobsPage.module.css'

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary']
const PAY_RANGES = [
  { label: 'Any Pay', min: 0, max: Infinity },
  { label: '$15–$20/hr', min: 15, max: 20 },
  { label: '$20–$30/hr', min: 20, max: 30 },
  { label: '$30+/hr', min: 30, max: Infinity },
]
const PAGE_SIZE = 5

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <p
      style={{
        fontSize: 'var(--kt-text-sm)',
        fontWeight: 'var(--kt-weight-semibold)',
        color: 'var(--kt-text)',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
    </p>
    {children}
  </div>
)

const CheckFilter = ({
  label,
  checked,
  onChange,
  count,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  count?: number
}) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      cursor: 'pointer',
      padding: '5px 0',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `2px solid ${checked ? 'var(--kt-accent)' : 'var(--kt-border-strong)'}`,
          background: checked ? 'var(--kt-accent)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--kt-duration-fast)',
        }}
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
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>{label}</span>
    </div>
    {count !== undefined && (
      <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>{count}</span>
    )}
  </label>
)

export const JobsPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // ---- All filter state derived from URL params ----
  const searchQ = searchParams.get('q') ?? ''
  // Memoized so the array reference is stable across renders (prevents useMemo churning)
  const selectedIndustries = useMemo(
    () => searchParams.get('industry')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  )
  const selectedTypes = useMemo(
    () => searchParams.get('type')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  )
  const payRangeIdx = Number(searchParams.get('pay') ?? '0')
  const regulixOnly = searchParams.get('regulix') === '1'
  const sponsoredOnly = searchParams.get('sponsored') === '1'
  const sortBy = (searchParams.get('sort') ?? 'recent') as 'recent' | 'pay' | 'applicants'
  const page = Number(searchParams.get('page') ?? '1')

  // ---- Jobs data ----
  const [jobsList, setJobsList] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    getJobs().then(({ data, error }) => {
      setJobsList(data)
      setJobsError(error)
      setJobsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    getAppliedJobIds(user.id).then(({ data }) => {
      setAppliedJobIds(new Set(data))
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    getSavedSearches(user.id).then(({ data }) => {
      setMySearches(data)
    })
  }, [user])

  // ---- Local UI state (not URL-syncable) ----
  const [locationView, setLocationView] = useState(false)
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null)
  const [drawerType, setDrawerType] = useState<'filter' | 'sort' | null>(null)

  const activeFilterCount =
    selectedIndustries.length +
    selectedTypes.length +
    (regulixOnly ? 1 : 0) +
    (sponsoredOnly ? 1 : 0) +
    (payRangeIdx > 0 ? 1 : 0)

  const handleResetFilters = () => setSearchParams({}, { replace: true })

  // ---- Live industry + type counts from real job data ----
  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    jobsList.forEach((j) => {
      counts[j.industrySlug] = (counts[j.industrySlug] ?? 0) + 1
    })
    return counts
  }, [jobsList])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    jobsList.forEach((j) => {
      counts[j.type] = (counts[j.type] ?? 0) + 1
    })
    return counts
  }, [jobsList])

  // ---- Saved searches ----
  const [mySearches, setMySearches] = useState<SavedSearch[]>([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [saveAlerts, setSaveAlerts] = useState(true)

  // ---- Helpers ----
  const toggleSet = (set: string[], val: string) =>
    set.includes(val) ? set.filter((v) => v !== val) : [...set, val]

  /** Merge a patch into current URL params; always resets page to 1. */
  const updateFilters = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(patch).forEach(([k, v]) => {
          if (v === null || v === '') next.delete(k)
          else next.set(k, v)
        })
        next.delete('page')
        return next
      },
      { replace: true }
    )
  }

  /** Navigate pages without resetting other params. */
  const goToPage = (p: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (p <= 1) next.delete('page')
        else next.set('page', String(p))
        return next
      },
      { replace: true }
    )
  }

  const filtered = useMemo(() => {
    let list = [...jobsList]
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.name.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)) ||
          j.industry.toLowerCase().includes(q)
      )
    }
    if (selectedIndustries.length)
      list = list.filter((j) => selectedIndustries.includes(j.industrySlug))
    if (selectedTypes.length) list = list.filter((j) => selectedTypes.includes(j.type))
    if (regulixOnly) list = list.filter((j) => j.regulixReadyApplicants > 0)
    if (sponsoredOnly) list = list.filter((j) => j.isSponsored)
    const pr = PAY_RANGES[payRangeIdx]
    if (pr.min > 0 || pr.max < Infinity)
      list = list.filter((j) => j.payMin >= pr.min && j.payMax <= pr.max + 5)
    list = [...list].sort((a, b) => {
      if (sortBy === 'recent') return a.postedDaysAgo - b.postedDaysAgo
      if (sortBy === 'pay') return b.payMax - a.payMax
      return b.totalApplicants - a.totalApplicants
    })
    return list
  }, [
    jobsList,
    searchQ,
    selectedIndustries,
    selectedTypes,
    regulixOnly,
    sponsoredOnly,
    payRangeIdx,
    sortBy,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSaveSearch = async () => {
    if (!saveLabel.trim() || !user) return
    const params = {
      label: saveLabel,
      query: searchQ,
      industrySlug: selectedIndustries[0] ?? null,
      types: selectedTypes,
      payRangeIdx,
      regulixOnly,
      alertEnabled: saveAlerts,
    }
    const { data } = await createSavedSearch(user.id, params)
    if (data) {
      setMySearches((prev) => [{ ...data, newMatchesCount: filtered.length }, ...prev])
    }
    setSaveLabel('')
    setShowSaveForm(false)
  }

  const handleLoadSearch = (s: SavedSearch) => {
    const params: Record<string, string | null> = {
      q: s.query || null,
      industry: s.industrySlug ?? null,
      type: s.types.length ? s.types.join(',') : null,
      pay: s.payRangeIdx > 0 ? String(s.payRangeIdx) : null,
      regulix: s.regulixOnly ? '1' : null,
    }
    setSearchParams(
      () => {
        const next = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => {
          if (v) next.set(k, v)
        })
        return next
      },
      { replace: true }
    )
  }

  const handleDeleteSearch = async (id: string) => {
    setMySearches((prev) => prev.filter((s) => s.id !== id))
    await deleteSavedSearch(id)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Page header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <h1
            style={{
              fontSize: 'var(--kt-text-3xl)',
              fontWeight: 'var(--kt-weight-display)',
              color: 'var(--kt-text)',
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}
          >
            Browse Jobs
          </h1>
          {/* Search bar + view toggle */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 700 }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Job title, skill, or keyword..."
                value={searchQ}
                onChange={(e) => updateFilters({ q: e.target.value || null })}
                style={{ background: 'white' }}
                leadingIcon={
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
              />
            </div>
            <div
              style={{
                display: 'flex',
                border: '1.5px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                overflow: 'hidden',
                flexShrink: 0,
                height: 40,
              }}
            >
              <button
                aria-label="List view"
                onClick={() => {
                  setLocationView(false)
                  goToPage(1)
                }}
                style={{
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: !locationView ? 'var(--kt-primary)' : 'var(--kt-surface)',
                  color: !locationView ? 'var(--kt-text-on-primary)' : 'var(--kt-text-muted)',
                  border: 'none',
                  borderRight: '1.5px solid var(--kt-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ListIcon size={15} />
              </button>
              <button
                aria-label="Map view"
                onClick={() => {
                  setLocationView(true)
                  goToPage(1)
                }}
                style={{
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: locationView ? 'var(--kt-primary)' : 'var(--kt-surface)',
                  color: locationView ? 'var(--kt-text-on-primary)' : 'var(--kt-text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <LocationIcon size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ---- Sidebar (desktop only — mobile uses bottom drawer) ---- */}
        {!locationView && (
          <aside className={styles.sidebar}>
            {/* Saved Searches */}
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 18,
              }}
            >
              <p
                style={{
                  fontSize: 'var(--kt-text-lg)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  marginBottom: 12,
                }}
              >
                {mySearches.length} Saved Searches
              </p>

              {showSaveForm && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    background: 'var(--kt-bg)',
                    borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)',
                  }}
                >
                  <input
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="Name this search..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      marginBottom: 8,
                      border: '1px solid var(--kt-border)',
                      borderRadius: 'var(--kt-radius-sm)',
                      background: 'var(--kt-surface)',
                      color: 'var(--kt-text)',
                      fontFamily: 'var(--kt-font-sans)',
                      fontSize: 'var(--kt-text-xs)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={saveAlerts}
                      onChange={(e) => setSaveAlerts(e.target.checked)}
                    />
                    <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      Enable alerts
                    </span>
                  </label>
                  <button
                    onClick={handleSaveSearch}
                    disabled={!saveLabel.trim()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--kt-primary)',
                      color: 'var(--kt-primary-fg)',
                      border: 'none',
                      borderRadius: 'var(--kt-radius-sm)',
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                      opacity: saveLabel.trim() ? 1 : 0.5,
                    }}
                  >
                    Save Search
                  </button>
                </div>
              )}

              {mySearches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mySearches.map((s) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => handleLoadSearch(s)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          padding: '5px 8px',
                          borderRadius: 'var(--kt-radius-sm)',
                          border: '1px solid var(--kt-border)',
                          background: 'transparent',
                          color: 'var(--kt-text)',
                          fontSize: 'var(--kt-text-xs)',
                          cursor: 'pointer',
                          fontFamily: 'var(--kt-font-sans)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{s.label}</span>
                        {s.alertEnabled && s.newMatchesCount > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              background: 'var(--kt-primary)',
                              color: 'var(--kt-primary-fg)',
                              borderRadius: 'var(--kt-radius-full)',
                              padding: '1px 5px',
                              fontWeight: 'var(--kt-weight-bold)',
                            }}
                          >
                            {s.newMatchesCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSearch(s.id)}
                        style={{
                          padding: '4px 6px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--kt-text-muted)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: 1,
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-placeholder)',
                    fontStyle: 'italic',
                  }}
                >
                  No saved searches yet
                </p>
              )}

              {/* Save Current Search button */}
              {!showSaveForm && (
                <button
                  onClick={() => setShowSaveForm(true)}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: '9px',
                    background: 'transparent',
                    color: 'var(--kt-primary)',
                    border: `1.5px solid var(--kt-primary)`,
                    borderRadius: 'var(--kt-radius-md)',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                  }}
                >
                  Save Current Search
                </button>
              )}
              {showSaveForm && (
                <button
                  onClick={() => {
                    setShowSaveForm(false)
                    setSaveLabel('')
                  }}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '9px',
                    background: 'transparent',
                    color: 'var(--kt-text-muted)',
                    border: `1px solid var(--kt-border)`,
                    borderRadius: 'var(--kt-radius-md)',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-medium)',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Filters */}
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    fontSize: 'var(--kt-text-lg)',
                  }}
                >
                  Filters
                </p>
                {(selectedIndustries.length ||
                  selectedTypes.length ||
                  regulixOnly ||
                  sponsoredOnly ||
                  payRangeIdx > 0) && (
                  <button
                    onClick={() => setSearchParams({}, { replace: true })}
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-accent)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FilterSection title="Industry">
                {industries.map((ind) => (
                  <CheckFilter
                    key={ind.id}
                    label={ind.name}
                    count={industryCounts[ind.slug] ?? 0}
                    checked={selectedIndustries.includes(ind.slug)}
                    onChange={() => {
                      const next = toggleSet(selectedIndustries, ind.slug)
                      updateFilters({ industry: next.join(',') || null })
                    }}
                  />
                ))}
              </FilterSection>

              <div style={{ height: 1, background: 'var(--kt-border)', margin: '16px 0' }} />

              <FilterSection title="Job Type">
                {TYPES.map((t) => (
                  <CheckFilter
                    key={t}
                    label={t}
                    count={typeCounts[t] ?? 0}
                    checked={selectedTypes.includes(t)}
                    onChange={() => {
                      const next = toggleSet(selectedTypes, t)
                      updateFilters({ type: next.join(',') || null })
                    }}
                  />
                ))}
              </FilterSection>

              <div style={{ height: 1, background: 'var(--kt-border)', margin: '16px 0' }} />

              <FilterSection title="Pay Range">
                {PAY_RANGES.map((pr, i) => (
                  <label
                    key={pr.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${payRangeIdx === i ? 'var(--kt-accent)' : 'var(--kt-border-strong)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {payRangeIdx === i && (
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: 'var(--kt-accent)',
                          }}
                        />
                      )}
                    </div>
                    <input
                      type="radio"
                      checked={payRangeIdx === i}
                      onChange={() => {
                        updateFilters({ pay: i === 0 ? null : String(i) })
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                      {pr.label}
                    </span>
                  </label>
                ))}
              </FilterSection>

              <div style={{ height: 1, background: 'var(--kt-border)', margin: '16px 0' }} />

              <FilterSection title="Special">
                <CheckFilter
                  label="Regulix Ready Applicants"
                  checked={regulixOnly}
                  onChange={(v) => updateFilters({ regulix: v ? '1' : null })}
                />
                <CheckFilter
                  label="Featured / Sponsored"
                  checked={sponsoredOnly}
                  onChange={(v) => updateFilters({ sponsored: v ? '1' : null })}
                />
              </FilterSection>
            </div>
          </aside>
        )}

        {/* ---- Results ---- */}
        <div className={styles.results}>
          {/* Location Grid View */}
          {locationView ? (
            <>
              <h2
                style={{
                  fontSize: 'var(--kt-text-xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  marginBottom: 20,
                }}
              >
                Browse by Location
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                {locationRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => {
                      setLocationView(false)
                      updateFilters({ q: region.city })
                    }}
                    style={{
                      padding: '20px',
                      background: 'var(--kt-surface)',
                      border: '1px solid var(--kt-border)',
                      borderRadius: 'var(--kt-radius-lg)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                        'var(--kt-primary)'
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                        'var(--kt-shadow-sm)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--kt-border)'
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ marginBottom: 8, color: 'var(--kt-text-muted)' }}>
                      <LocationIcon size={28} />
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--kt-text-lg)',
                        fontWeight: 'var(--kt-weight-bold)',
                        color: 'var(--kt-text)',
                        marginBottom: 2,
                      }}
                    >
                      {region.city}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                        marginBottom: 10,
                      }}
                    >
                      {region.state}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-primary)',
                        marginBottom: 8,
                      }}
                    >
                      {region.jobCount.toLocaleString()} jobs
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {region.featuredIndustries.map((ind) => (
                        <span
                          key={ind}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: 'color-mix(in srgb, var(--kt-primary) 8%, transparent)',
                            color: 'var(--kt-primary)',
                            borderRadius: 'var(--kt-radius-full)',
                            fontWeight: 'var(--kt-weight-medium)',
                          }}
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Mobile filter + sort toolbar */}
              <div className={styles.mobileToolbar}>
                <button
                  className={[styles.mobileToolbarBtn, activeFilterCount > 0 ? styles.active : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setDrawerType('filter')}
                >
                  <SlidersIcon size={15} />
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                <button
                  className={[styles.mobileToolbarBtn, sortBy !== 'recent' ? styles.active : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setDrawerType('sort')}
                >
                  <SortIcon size={15} />
                  Sort{sortBy !== 'recent' ? `: ${sortBy === 'pay' ? 'Pay' : 'Applied'}` : ''}
                </button>
              </div>

              {/* Desktop toolbar */}
              <div className={styles.sortBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      fontSize: 'var(--kt-text-lg)',
                    }}
                  >
                    {filtered.length} jobs found
                  </span>
                  {regulixOnly && (
                    <Badge variant="accent" size="sm" dot>
                      Regulix Ready
                    </Badge>
                  )}
                </div>
                <div className={styles.sortButtons}>
                  <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                    Sort:
                  </span>
                  {(['recent', 'pay', 'applicants'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateFilters({ sort: s === 'recent' ? null : s })}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--kt-radius-full)',
                        border: `1.5px solid ${sortBy === s ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                        background: sortBy === s ? 'var(--kt-primary-subtle)' : 'transparent',
                        color: sortBy === s ? 'var(--kt-primary)' : 'var(--kt-text-muted)',
                        fontWeight:
                          sortBy === s ? 'var(--kt-weight-semibold)' : 'var(--kt-weight-normal)',
                        fontSize: 'var(--kt-text-sm)',
                        cursor: 'pointer',
                        fontFamily: 'var(--kt-font-sans)',
                        transition: 'all var(--kt-duration-fast)',
                      }}
                    >
                      {s === 'recent'
                        ? 'Most Recent'
                        : s === 'pay'
                          ? 'Highest Pay'
                          : 'Most Applied'}
                    </button>
                  ))}
                </div>
              </div>

              {jobsLoading ? (
                <div
                  style={{ textAlign: 'center', padding: '60px 0', color: 'var(--kt-text-muted)' }}
                >
                  <p style={{ fontSize: 'var(--kt-text-sm)' }}>Loading jobs…</p>
                </div>
              ) : jobsError ? (
                <div
                  style={{ textAlign: 'center', padding: '60px 0', color: 'var(--kt-text-muted)' }}
                >
                  <p
                    style={{
                      fontWeight: 'var(--kt-weight-semibold)',
                      fontSize: 'var(--kt-text-lg)',
                      marginBottom: 8,
                    }}
                  >
                    Could not load jobs
                  </p>
                  <p style={{ fontSize: 'var(--kt-text-sm)' }}>{jobsError}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div
                  style={{ textAlign: 'center', padding: '60px 0', color: 'var(--kt-text-muted)' }}
                >
                  <div style={{ marginBottom: 12, color: 'var(--kt-text-muted)' }}>
                    <SearchIcon size={40} />
                  </div>
                  <p
                    style={{
                      fontWeight: 'var(--kt-weight-semibold)',
                      fontSize: 'var(--kt-text-lg)',
                      marginBottom: 8,
                    }}
                  >
                    No jobs match your filters
                  </p>
                  <p style={{ fontSize: 'var(--kt-text-sm)' }}>
                    Try adjusting your search or clearing some filters.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {paginated.map((job) => (
                      <div key={job.id} style={{ position: 'relative' }}>
                        <JobCard
                          job={job}
                          applied={appliedJobIds.has(job.id)}
                          onQuickApply={() => setQuickApplyJob(job)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 28,
                      }}
                    >
                      <button
                        onClick={() => goToPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        style={{
                          padding: '6px 14px',
                          border: '1px solid var(--kt-border)',
                          borderRadius: 'var(--kt-radius-md)',
                          background: 'var(--kt-surface)',
                          color: page === 1 ? 'var(--kt-text-placeholder)' : 'var(--kt-text)',
                          cursor: page === 1 ? 'not-allowed' : 'pointer',
                          fontSize: 'var(--kt-text-sm)',
                          fontFamily: 'var(--kt-font-sans)',
                        }}
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => goToPage(n)}
                          style={{
                            width: 36,
                            height: 36,
                            border: `1.5px solid ${page === n ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                            borderRadius: 'var(--kt-radius-md)',
                            background: page === n ? 'var(--kt-primary)' : 'var(--kt-surface)',
                            color: page === n ? 'var(--kt-primary-fg)' : 'var(--kt-text)',
                            fontWeight:
                              page === n ? 'var(--kt-weight-semibold)' : 'var(--kt-weight-normal)',
                            cursor: 'pointer',
                            fontSize: 'var(--kt-text-sm)',
                            fontFamily: 'var(--kt-font-sans)',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() => goToPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        style={{
                          padding: '6px 14px',
                          border: '1px solid var(--kt-border)',
                          borderRadius: 'var(--kt-radius-md)',
                          background: 'var(--kt-surface)',
                          color:
                            page === totalPages ? 'var(--kt-text-placeholder)' : 'var(--kt-text)',
                          cursor: page === totalPages ? 'not-allowed' : 'pointer',
                          fontSize: 'var(--kt-text-sm)',
                          fontFamily: 'var(--kt-font-sans)',
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: 10,
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text-muted)',
                    }}
                  >
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom drawer — filter & sort (mobile) */}
      <div
        className={[styles.drawerOverlay, drawerType ? styles.drawerVisible : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setDrawerType(null)}
      />
      <div
        className={[styles.drawer, drawerType ? styles.drawerVisible : '']
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={drawerType === 'filter' ? 'Filters' : 'Sort'}
      >
        <div className={styles.drawerHandle} />
        <div className={styles.drawerHeader}>
          <button
            className={styles.drawerCloseBtn}
            onClick={() => setDrawerType(null)}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
          <span className={styles.drawerTitle}>{drawerType === 'filter' ? 'Filters' : 'Sort'}</span>
          <button
            className={styles.drawerResetBtn}
            onClick={() => {
              if (drawerType === 'filter') handleResetFilters()
              else updateFilters({ sort: null })
            }}
          >
            Reset
          </button>
        </div>

        <div className={styles.drawerBody}>
          {drawerType === 'filter' && (
            <>
              {/* Saved Searches in drawer */}
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    marginBottom: 12,
                  }}
                >
                  {mySearches.length} Saved Searches
                </p>
                {mySearches.length > 0 && (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}
                  >
                    {mySearches.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => {
                            handleLoadSearch(s)
                            setDrawerType(null)
                          }}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            padding: '7px 10px',
                            borderRadius: 'var(--kt-radius-sm)',
                            border: '1px solid var(--kt-border)',
                            background: 'transparent',
                            color: 'var(--kt-text)',
                            fontSize: 'var(--kt-text-sm)',
                            cursor: 'pointer',
                            fontFamily: 'var(--kt-font-sans)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{s.label}</span>
                          {s.alertEnabled && s.newMatchesCount > 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: 'var(--kt-primary)',
                                color: 'var(--kt-primary-fg)',
                                borderRadius: 'var(--kt-radius-full)',
                                padding: '1px 5px',
                                fontWeight: 'var(--kt-weight-bold)',
                              }}
                            >
                              {s.newMatchesCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSearch(s.id)}
                          style={{
                            padding: '4px 6px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--kt-text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--kt-border)', marginBottom: 24 }} />

              {/* Industry */}
              <FilterSection title="Industry">
                {industries.map((ind) => (
                  <CheckFilter
                    key={ind.id}
                    label={ind.name}
                    count={industryCounts[ind.slug] ?? 0}
                    checked={selectedIndustries.includes(ind.slug)}
                    onChange={() => {
                      const next = toggleSet(selectedIndustries, ind.slug)
                      updateFilters({ industry: next.join(',') || null })
                    }}
                  />
                ))}
              </FilterSection>

              <div style={{ height: 1, background: 'var(--kt-border)', margin: '16px 0' }} />

              {/* Job Type */}
              <FilterSection title="Job Type">
                {TYPES.map((t) => (
                  <CheckFilter
                    key={t}
                    label={t}
                    count={typeCounts[t] ?? 0}
                    checked={selectedTypes.includes(t)}
                    onChange={() => {
                      const next = toggleSet(selectedTypes, t)
                      updateFilters({ type: next.join(',') || null })
                    }}
                  />
                ))}
              </FilterSection>

              <div style={{ height: 1, background: 'var(--kt-border)', margin: '16px 0' }} />

              {/* Pay Range */}
              <FilterSection title="Pay Range">
                {PAY_RANGES.map((pr, i) => (
                  <label
                    key={pr.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${payRangeIdx === i ? 'var(--kt-accent)' : 'var(--kt-border-strong)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {payRangeIdx === i && (
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: 'var(--kt-accent)',
                          }}
                        />
                      )}
                    </div>
                    <input
                      type="radio"
                      checked={payRangeIdx === i}
                      onChange={() => updateFilters({ pay: i === 0 ? null : String(i) })}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                      {pr.label}
                    </span>
                  </label>
                ))}
              </FilterSection>

              <div style={{ height: 1, background: 'var(--kt-border)', margin: '16px 0' }} />

              {/* Special */}
              <FilterSection title="Special">
                <CheckFilter
                  label="Regulix Ready Applicants"
                  checked={regulixOnly}
                  onChange={(v) => updateFilters({ regulix: v ? '1' : null })}
                />
                <CheckFilter
                  label="Featured / Sponsored"
                  checked={sponsoredOnly}
                  onChange={(v) => updateFilters({ sponsored: v ? '1' : null })}
                />
              </FilterSection>
            </>
          )}

          {drawerType === 'sort' && (
            <div style={{ paddingTop: 4 }}>
              {(['recent', 'pay', 'applicants'] as const).map((s) => (
                <button
                  key={s}
                  className={[styles.sortOption, sortBy === s ? styles.sortActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => updateFilters({ sort: s === 'recent' ? null : s })}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${sortBy === s ? 'var(--kt-primary)' : 'var(--kt-border-strong)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {sortBy === s && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--kt-primary)',
                        }}
                      />
                    )}
                  </div>
                  {s === 'recent' ? 'Most Recent' : s === 'pay' ? 'Highest Pay' : 'Most Applied'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.drawerFooter}>
          <button className={styles.drawerCTA} onClick={() => setDrawerType(null)}>
            {drawerType === 'sort' ? 'Sort Results' : `Show Results (${filtered.length})`}
          </button>
        </div>
      </div>

      {/* Quick Apply Modal */}
      {quickApplyJob && (
        <QuickApplyModal
          job={quickApplyJob}
          open={!!quickApplyJob}
          onClose={() => setQuickApplyJob(null)}
          onApplied={(jobId) => {
            setAppliedJobIds((prev) => new Set(prev).add(jobId))
            setQuickApplyJob(null)
          }}
        />
      )}
    </div>
  )
}
