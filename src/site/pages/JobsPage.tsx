import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Badge } from '../../components'
import { JobCard } from '../components/JobCard/JobCard'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import type { SavedSearch, Job } from '../types'
import {
  jobs,
  industries,
  locationRegions,
  savedSearches as initialSavedSearches,
} from '../data/mock'

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

  // ---- Local UI state (not URL-syncable) ----
  const [locationView, setLocationView] = useState(false)
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null)

  // Saved searches
  const [mySearches, setMySearches] = useState<SavedSearch[]>(initialSavedSearches)
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
    let list = [...jobs]
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
  }, [searchQ, selectedIndustries, selectedTypes, regulixOnly, sponsoredOnly, payRangeIdx, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = () => {
    updateFilters({ q: searchQ || null })
  }

  const handleSaveSearch = () => {
    if (!saveLabel.trim()) return
    const newSearch: SavedSearch = {
      id: `ss-${Date.now()}`,
      label: saveLabel,
      query: searchQ,
      industrySlug: selectedIndustries[0] ?? null,
      types: selectedTypes,
      payRangeIdx,
      regulixOnly,
      createdDaysAgo: 0,
      alertEnabled: saveAlerts,
      newMatchesCount: filtered.length,
    }
    setMySearches((prev) => [newSearch, ...prev])
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

  const handleDeleteSearch = (id: string) => {
    setMySearches((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Page header */}
      <div
        style={{
          background: 'var(--kt-bg)',
          padding: '48px var(--kt-space-6) 36px',
          borderBottom: '1px solid var(--kt-border)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <h1
              style={{
                fontSize: 'var(--kt-text-3xl)',
                fontWeight: 'var(--kt-weight-display)',
                color: 'var(--kt-text)',
                letterSpacing: '-0.03em',
              }}
            >
              Browse Jobs
            </h1>
            <button
              onClick={() => {
                setLocationView((v) => !v)
                goToPage(1)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--kt-radius-md)',
                border: `1.5px solid ${locationView ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                background: locationView
                  ? 'color-mix(in srgb, var(--kt-primary) 8%, transparent)'
                  : 'transparent',
                color: locationView ? 'var(--kt-primary)' : 'var(--kt-text-muted)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                transition: 'all 0.15s',
              }}
            >
              {locationView ? '← List View' : '📍 Browse by Location'}
            </button>
          </div>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: 12, maxWidth: 700, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input
                placeholder="Job title, skill, or keyword..."
                value={searchQ}
                onChange={(e) => updateFilters({ q: e.target.value || null })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
            <button
              onClick={handleSearch}
              style={{
                background: 'var(--kt-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--kt-radius-md)',
                padding: '0 24px',
                fontWeight: 'var(--kt-weight-semibold)',
                fontSize: 'var(--kt-text-md)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                height: 40,
              }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px var(--kt-space-6)',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {/* ---- Sidebar ---- */}
        {!locationView && (
          <aside
            style={{
              width: 240,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Saved Searches */}
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  Saved Searches
                </span>
                <button
                  onClick={() => setShowSaveForm((v) => !v)}
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-primary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    fontWeight: 'var(--kt-weight-medium)',
                  }}
                >
                  {showSaveForm ? 'Cancel' : '+ Save'}
                </button>
              </div>

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
                      padding: '6px',
                      background: 'var(--kt-primary)',
                      color: 'var(--kt-primary-fg)',
                      border: 'none',
                      borderRadius: 'var(--kt-radius-sm)',
                      fontSize: 'var(--kt-text-xs)',
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
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    fontSize: 'var(--kt-text-md)',
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
                    count={ind.jobCount}
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
        <div style={{ flex: 1, minWidth: 0 }}>
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
                    <div style={{ fontSize: '28px', marginBottom: 8 }}>📍</div>
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
              {/* Toolbar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

              {filtered.length === 0 ? (
                <div
                  style={{ textAlign: 'center', padding: '60px 0', color: 'var(--kt-text-muted)' }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
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
                        <JobCard job={job} />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setQuickApplyJob(job)
                            }}
                            style={{
                              padding: '6px 14px',
                              background: 'var(--kt-olive-700)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--kt-radius-md)',
                              fontSize: 'var(--kt-text-xs)',
                              fontWeight: 'var(--kt-weight-semibold)',
                              cursor: 'pointer',
                              fontFamily: 'var(--kt-font-sans)',
                              whiteSpace: 'nowrap',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'var(--kt-olive-800)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'var(--kt-olive-700)')
                            }
                          >
                            ⚡ Quick Apply
                          </button>
                        </div>
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

      {/* Quick Apply Modal */}
      {quickApplyJob && (
        <QuickApplyModal
          job={quickApplyJob}
          open={!!quickApplyJob}
          onClose={() => setQuickApplyJob(null)}
          onApplied={() => setQuickApplyJob(null)}
        />
      )}
    </div>
  )
}
