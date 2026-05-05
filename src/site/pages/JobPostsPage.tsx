import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../../components'
import { DotsHorizontalIcon, RocketIcon, RegulixMarkIcon, SearchIcon } from '../icons'
import { useAuth } from '../context/AuthContext'
import { getCompanyJobs, updateJob } from '../services/jobService'
import type { Job } from '../types'
import { ManageListingModal } from '../components/ManageListingModal/ManageListingModal'
import { ArchiveListingModal } from '../components/ArchiveListingModal/ArchiveListingModal'
import { BoostListingModal } from '../components/BoostListingModal/BoostListingModal'
import styles from './JobPostsPage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatShortDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusLabel(status: Job['status']): string {
  if (status === 'active') return 'Open'
  if (status === 'paused') return 'Paused'
  return 'Archived'
}

function statusVariant(status: Job['status']): 'success' | 'warning' | 'secondary' {
  if (status === 'active') return 'success'
  if (status === 'paused') return 'warning'
  return 'secondary'
}

// ── Sub-components ────────────────────────────────────────────────────────────

const BoostIndicator: React.FC<{ boosted: boolean }> = ({ boosted }) => {
  if (!boosted) return null
  return <RocketIcon size={16} color="var(--kt-olive-600)" />
}

const ApplicantCount: React.FC<{ total: number; regulixReady: number }> = ({
  total,
  regulixReady,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 12, color: 'var(--kt-text)' }}>{total}</span>
    {regulixReady > 0 && (
      <>
        <span style={{ color: 'var(--kt-text-muted)', fontSize: 11 }}>·</span>
        <span style={{ fontSize: 12, color: 'var(--kt-text)' }}>{regulixReady}</span>
        <RegulixMarkIcon size={14} />
      </>
    )}
  </span>
)

type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={styles.overflowBtn}
        title="More actions"
        type="button"
      >
        <DotsHorizontalIcon size={12} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className={[styles.overflowItem, item.danger ? styles.danger : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// ── Sort types ────────────────────────────────────────────────────────────────

type SortKey = 'title' | 'createdAt' | 'views' | 'applicants'
type SortDir = 'asc' | 'desc'

const SortIndicator: React.FC<{ active: boolean; direction: SortDir }> = ({
  active,
  direction,
}) => {
  if (!active) return <span style={{ color: 'var(--kt-text-muted)', fontSize: 10 }}>↕</span>
  return <span className={styles.sortIndicator}>{direction === 'asc' ? '↑' : '↓'}</span>
}

// ── Main component ────────────────────────────────────────────────────────────

export const JobPostsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [boostFilter, setBoostFilter] = useState<'all' | 'boosted' | 'unboosted'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | Job['status']>('all')

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Pause confirmation modal target (null = closed)
  const [pauseTarget, setPauseTarget] = useState<Job | null>(null)

  // Boost (sponsor) modal target (null = closed)
  const [boostTarget, setBoostTarget] = useState<Job | null>(null)

  // Archive confirmation modal target (null = closed)
  const [archiveTarget, setArchiveTarget] = useState<Job | null>(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    getCompanyJobs(user.id).then(({ data }) => {
      setAllJobs(data ?? [])
      setLoading(false)
    })
  }, [user?.id])

  // Clear selection when filters/sort/page change
  useEffect(() => {
    setSelectedIds(new Set())
  }, [search, boostFilter, dateFrom, dateTo, statusTab, sortKey, sortDir, page, perPage])

  // ── Derived data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = allJobs

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((j) => j.title.toLowerCase().includes(q))
    }

    if (boostFilter === 'boosted') list = list.filter((j) => j.isSponsored)
    if (boostFilter === 'unboosted') list = list.filter((j) => !j.isSponsored)

    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      list = list.filter((j) => new Date(j.createdAt).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000
      list = list.filter((j) => new Date(j.createdAt).getTime() <= to)
    }

    return list
  }, [allJobs, search, boostFilter, dateFrom, dateTo])

  const statusCounts = useMemo(
    () => ({
      all: filtered.length,
      active: filtered.filter((j) => j.status === 'active').length,
      paused: filtered.filter((j) => j.status === 'paused').length,
      closed: filtered.filter((j) => j.status === 'closed').length,
    }),
    [filtered]
  )

  const filteredByStatus = useMemo(() => {
    if (statusTab === 'all') return filtered
    return filtered.filter((j) => j.status === statusTab)
  }, [filtered, statusTab])

  const sorted = useMemo(() => {
    const list = [...filteredByStatus]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'title') {
        cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      } else if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortKey === 'views') {
        cmp = a.viewCount - b.viewCount
      } else if (sortKey === 'applicants') {
        cmp = a.totalApplicants - b.totalApplicants
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filteredByStatus, sortKey, sortDir])

  const totalCount = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * perPage
  const pageEnd = Math.min(pageStart + perPage, totalCount)
  const pageRows = sorted.slice(pageStart, pageEnd)
  const pageIds = pageRows.map((j) => j.id)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'title' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  const handleToggleAll = () => {
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]))
    }
  }

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkPause = async () => {
    const ids = [...selectedIds].filter(
      (id) => allJobs.find((j) => j.id === id)?.status === 'active'
    )
    await Promise.all(ids.map((id) => updateJob(id, { status: 'paused' })))
    setAllJobs((prev) =>
      prev.map((j) => (ids.includes(j.id) ? { ...j, status: 'paused' as const } : j))
    )
    setSelectedIds(new Set())
  }

  const handleBulkClose = async () => {
    const ids = [...selectedIds].filter(
      (id) => allJobs.find((j) => j.id === id)?.status !== 'closed'
    )
    await Promise.all(ids.map((id) => updateJob(id, { status: 'closed' })))
    setAllJobs((prev) =>
      prev.map((j) => (ids.includes(j.id) ? { ...j, status: 'closed' as const } : j))
    )
    setSelectedIds(new Set())
  }

  const handleStatusChange = async (jobId: string, status: Job['status']) => {
    const { error } = await updateJob(jobId, { status })
    if (!error) {
      setAllJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setBoostFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = search || boostFilter !== 'all' || dateFrom || dateTo

  const selectedCount = selectedIds.size
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  // ── Pagination buttons ────────────────────────────────────────────────────

  const pageButtons = useMemo(() => {
    const pages: Array<number | '…'> = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('…')
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }
    return pages
  }, [totalPages, safePage])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/site/dashboard/company" className={styles.breadcrumb}>
          ← Back to dashboard
        </Link>

        <header className={styles.pageHeader}>
          <h1 className={styles.title}>Job posts</h1>
        </header>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search job title…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className={styles.searchInput}
            />
          </div>

          <select
            value={boostFilter}
            onChange={(e) => {
              setBoostFilter(e.target.value as typeof boostFilter)
              setPage(1)
            }}
            className={styles.select}
          >
            <option value="all">All boost</option>
            <option value="boosted">Boosted</option>
            <option value="unboosted">Unboosted</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            title="Posted from"
            className={styles.dateInput}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            title="Posted to"
            className={styles.dateInput}
          />

          {hasFilters && (
            <button type="button" className={styles.clearLink} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className={styles.statusTabs}>
          {(
            [
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'active', label: 'Open', count: statusCounts.active },
              { key: 'paused', label: 'Paused', count: statusCounts.paused },
              { key: 'closed', label: 'Archived', count: statusCounts.closed },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setStatusTab(key)
                setPage(1)
              }}
              className={[styles.statusTab, statusTab === key ? styles.statusTabActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {label}
              <span className={styles.statusTabCount}>{count}</span>
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selectedCount} selected</span>
            <div className={styles.bulkActions}>
              <button type="button" className={styles.bulkBtn} onClick={handleBulkPause}>
                Pause
              </button>
              <button
                type="button"
                className={[styles.bulkBtn, styles.bulkBtnDanger].join(' ')}
                onClick={handleBulkClose}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.bulkDeselect}
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect all
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableCard}>
          {/* Header row */}
          <div className={[styles.row, styles.headerRow].join(' ')}>
            <div className={styles.checkCell}>
              <input type="checkbox" checked={allPageSelected} onChange={handleToggleAll} />
            </div>
            <button
              type="button"
              className={styles.sortableHeader}
              onClick={() => handleSort('title')}
            >
              Job title <SortIndicator active={sortKey === 'title'} direction={sortDir} />
            </button>
            <div>Status</div>
            <button
              type="button"
              className={styles.sortableHeader}
              onClick={() => handleSort('createdAt')}
            >
              Posted <SortIndicator active={sortKey === 'createdAt'} direction={sortDir} />
            </button>
            <div className={styles.alignCenter}>
              <button
                type="button"
                className={styles.sortableHeader}
                onClick={() => handleSort('views')}
              >
                Views <SortIndicator active={sortKey === 'views'} direction={sortDir} />
              </button>
            </div>
            <div className={styles.alignCenter}>
              <button
                type="button"
                className={styles.sortableHeader}
                onClick={() => handleSort('applicants')}
              >
                Applicants <SortIndicator active={sortKey === 'applicants'} direction={sortDir} />
              </button>
            </div>
            <div className={styles.alignCenter}>Boost</div>
            <div />
          </div>

          {/* Empty / loading */}
          {loading && <div className={styles.emptyRow}>Loading…</div>}
          {!loading && pageRows.length === 0 && (
            <div className={styles.emptyRow}>
              {allJobs.length === 0 ? (
                <>
                  No job posts yet.{' '}
                  <Link to="/site/post-job" style={{ color: 'var(--kt-primary)' }}>
                    Post your first job →
                  </Link>
                </>
              ) : (
                'No posts match the current filters.'
              )}
            </div>
          )}

          {/* Data rows */}
          {pageRows.map((job) => {
            const isSelected = selectedIds.has(job.id)

            const overflowItems: OverflowItem[] =
              job.status === 'active'
                ? [
                    { label: 'Edit', onClick: () => navigate(`/site/post-job/${job.id}`) },
                    { label: 'Pause', onClick: () => setPauseTarget(job) },
                    {
                      label: 'Duplicate',
                      onClick: () => navigate(`/site/post-job?duplicate=${job.id}`),
                    },
                    { label: 'Boost', onClick: () => setBoostTarget(job) },
                    {
                      label: 'Archive',
                      danger: true,
                      onClick: () => setArchiveTarget(job),
                    },
                  ]
                : job.status === 'paused'
                  ? [
                      { label: 'Edit', onClick: () => navigate(`/site/post-job/${job.id}`) },
                      {
                        label: 'Duplicate',
                        onClick: () => navigate(`/site/post-job?duplicate=${job.id}`),
                      },
                      {
                        label: 'Archive',
                        danger: true,
                        onClick: () => setArchiveTarget(job),
                      },
                    ]
                  : [
                      {
                        label: 'Duplicate',
                        onClick: () => navigate(`/site/post-job?duplicate=${job.id}`),
                      },
                      { label: 'Delete', danger: true, onClick: () => {} },
                    ]

            const primaryAction =
              job.status === 'active' ? (
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => navigate(`/site/dashboard/applicants?jobId=${job.id}`)}
                >
                  View applicants
                </button>
              ) : job.status === 'paused' ? (
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => handleStatusChange(job.id, 'active')}
                >
                  Resume
                </button>
              ) : (
                <button type="button" className={styles.primaryAction} onClick={() => {}}>
                  Repost
                </button>
              )

            return (
              <div
                key={job.id}
                className={[styles.row, isSelected ? styles.rowSelected : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.checkCell}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleRow(job.id)}
                  />
                </div>
                <div className={styles.jobTitleCell}>
                  <Link to={`/site/jobs/${job.id}`} className={styles.jobTitleLink}>
                    {job.title}
                  </Link>
                </div>
                <div>
                  <Badge variant={statusVariant(job.status)} size="sm">
                    {statusLabel(job.status)}
                  </Badge>
                </div>
                <div style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                  {formatShortDate(job.createdAt)}
                </div>
                <div
                  className={styles.alignCenter}
                  style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}
                >
                  {job.viewCount.toLocaleString()}
                </div>
                <div className={styles.alignCenter}>
                  <ApplicantCount
                    total={job.totalApplicants}
                    regulixReady={job.regulixReadyApplicants}
                  />
                </div>
                <div className={styles.alignCenter}>
                  <BoostIndicator boosted={job.isSponsored} />
                </div>
                <div className={styles.actionsCell}>
                  {primaryAction}
                  <OverflowMenu items={overflowItems} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              {pageStart + 1}–{pageEnd} of {totalCount} posts
            </div>
            <div className={styles.paginationRight}>
              <label className={styles.pageSizeLabel}>
                Rows per page
                <select
                  className={styles.select}
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value) as 25 | 50 | 100)
                    setPage(1)
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <div className={styles.pagerButtons}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {pageButtons.map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className={styles.pagerEllipsis}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={[styles.pagerBtn, safePage === p ? styles.pagerBtnActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className={styles.pagerBtn}
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ManageListingModal
        open={pauseTarget !== null}
        onClose={() => setPauseTarget(null)}
        jobTitle={pauseTarget?.title ?? ''}
        companyName={pauseTarget?.company.name ?? ''}
        onPauseConfirm={async () => {
          if (pauseTarget) await handleStatusChange(pauseTarget.id, 'paused')
        }}
      />

      <ArchiveListingModal
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        jobTitle={archiveTarget?.title ?? ''}
        companyName={archiveTarget?.company.name ?? ''}
        onConfirm={async () => {
          if (archiveTarget) await handleStatusChange(archiveTarget.id, 'closed')
        }}
      />

      <BoostListingModal
        open={boostTarget !== null}
        onClose={() => setBoostTarget(null)}
        jobTitle={boostTarget?.title ?? ''}
        companyName={boostTarget?.company.name ?? ''}
        onConfirm={async () => {
          if (!boostTarget) return
          const { error } = await updateJob(boostTarget.id, { isSponsored: true })
          if (!error) {
            setAllJobs((prev) =>
              prev.map((j) => (j.id === boostTarget.id ? { ...j, isSponsored: true } : j))
            )
          }
        }}
      />
    </div>
  )
}
