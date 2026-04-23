import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Modal } from '../../components'
import { useAuth } from '../context/AuthContext'
import type { CompanyApplicant, KanbanStage } from '../types'
import {
  getAllApplicants,
  getJobFilterOptions,
  advanceApplicantStage,
  advanceApplicants,
  rejectApplicant,
  rejectApplicants,
  setApplicantStage,
  shortlistApplicant,
  shortlistApplicants,
  addApplicantNote,
  DEFAULT_FILTERS,
  type ApplicantFilters,
  type ApplicantSort,
} from '../services/applicantService'
import {
  CheckSmallIcon,
  CloseIcon,
  DotsHorizontalIcon,
  RegulixMarkIcon,
  SearchIcon,
  SortIcon,
} from '../icons'
import { StagePill } from '../components/StagePill/StagePill'
import { ApplicantDetailPane } from '../components/ApplicantDetailPane/ApplicantDetailPane'
import styles from './AllApplicantsPage.module.css'

const STAGE_OPTIONS: Array<{ value: KanbanStage | 'all'; label: string }> = [
  { value: 'all', label: 'All stages' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

const PAGE_SIZES = [25, 50, 100]

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
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
        <DotsHorizontalIcon size={13} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            style={{ top: pos.top, right: pos.right }}
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

export const AllApplicantsPage: React.FC = () => {
  const { user } = useAuth()

  const [filters, setFilters] = useState<ApplicantFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<{ column: ApplicantSort; direction: 'asc' | 'desc' }>({
    column: 'applied',
    direction: 'desc',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [rows, setRows] = useState<CompanyApplicant[]>([])
  const [total, setTotal] = useState(0)
  const [jobOptions, setJobOptions] = useState<Array<{ id: string; title: string }>>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<CompanyApplicant | null>(null)

  // Bulk reject confirmation
  const [confirmBulkReject, setConfirmBulkReject] = useState(false)

  const load = useCallback(() => {
    if (!user?.id) return
    getAllApplicants(user.id, { filters, sort, page, pageSize }).then((res) => {
      setRows(res.data)
      setTotal(res.total)
    })
  }, [user?.id, filters, sort, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user?.id) return
    getJobFilterOptions(user.id).then(({ data }) => setJobOptions(data))
  }, [user?.id])

  // Clear selection when page/filters/sort change.
  useEffect(() => {
    setSelected(new Set())
  }, [page, filters, sort, pageSize])

  const updateFilter = <K extends keyof ApplicantFilters>(key: K, value: ApplicantFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const handleSort = (column: ApplicantSort) => {
    setSort((s) => {
      if (s.column !== column) {
        // Sensible default direction per column.
        const direction = column === 'match' || column === 'applied' ? 'desc' : 'asc'
        return { column, direction }
      }
      return { column, direction: s.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const pageEnd = Math.min(page * pageSize, total)

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        rows.forEach((r) => next.delete(r.id))
      } else {
        rows.forEach((r) => next.add(r.id))
      }
      return next
    })
  }

  // ── Row actions ──────────────────────────────────────────────────────────
  const handleAdvance = async (id: string) => {
    await advanceApplicantStage(id)
    if (open?.id === id) setOpen(null)
    load()
  }
  const handleReject = async (id: string) => {
    await rejectApplicant(id)
    if (open?.id === id) setOpen(null)
    load()
  }
  const handleSetStage = async (id: string, stage: KanbanStage) => {
    await setApplicantStage(id, stage)
    if (open?.id === id) setOpen({ ...open, stage })
    load()
  }
  const handleShortlist = async (id: string) => {
    await shortlistApplicant(id)
    load()
  }
  const handleMessage = (_id: string) => {
    // TODO: open messaging UI
    window.alert('Messaging UI not built yet. Navigate to /site/messages to continue.')
  }
  const handleAddNote = async (id: string) => {
    const text = window.prompt('Add a note about this applicant:')
    if (text && text.trim()) {
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
      const authorName =
        (meta.company_name as string) || (meta.first_name as string) || user?.email || 'Unknown'
      await addApplicantNote(id, text.trim(), authorName)
      load()
    }
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const bulkIds = useMemo(() => Array.from(selected), [selected])
  const bulkApplicants = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected])

  const doBulkAdvance = async () => {
    await advanceApplicants(bulkIds)
    setSelected(new Set())
    load()
  }
  const doBulkShortlist = async () => {
    await shortlistApplicants(bulkIds)
    setSelected(new Set())
    load()
  }
  const doBulkMessage = () => {
    handleMessage('__bulk__')
  }
  const doBulkReject = async () => {
    await rejectApplicants(bulkIds)
    setSelected(new Set())
    setConfirmBulkReject(false)
    load()
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const hasFilters =
    filters.search ||
    filters.stage !== 'all' ||
    filters.jobId !== 'all' ||
    filters.regulixOnly ||
    filters.appliedFrom ||
    filters.appliedTo

  // ── Pagination buttons (truncated to max 7) ──────────────────────────────
  const pageButtons = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
    const result: Array<number | '…'> = []
    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b)
    let prev = 0
    for (const p of sorted) {
      if (p - prev > 1) result.push('…')
      result.push(p)
      prev = p
    }
    return result
  }, [page, totalPages])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/site/dashboard/company" className={styles.breadcrumb}>
          ← Back to dashboard
        </Link>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>All applicants</h1>
            <p className={styles.subtitle}>
              Cross-job pipeline across every posting on your company.
            </p>
          </div>
        </header>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search applicants or jobs"
              className={styles.searchInput}
            />
          </div>
          <select
            value={filters.stage}
            onChange={(e) => updateFilter('stage', e.target.value as KanbanStage | 'all')}
            className={styles.select}
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filters.jobId}
            onChange={(e) => updateFilter('jobId', e.target.value)}
            className={styles.select}
          >
            <option value="all">All jobs</option>
            {jobOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.regulixOnly}
              onChange={(e) => updateFilter('regulixOnly', e.target.checked)}
            />
            Regulix only
          </label>
          <div className={styles.dateGroup}>
            <input
              type="date"
              value={filters.appliedFrom ?? ''}
              onChange={(e) => updateFilter('appliedFrom', e.target.value || null)}
              className={styles.dateInput}
              aria-label="Applied from"
            />
            <span className={styles.dateSep}>to</span>
            <input
              type="date"
              value={filters.appliedTo ?? ''}
              onChange={(e) => updateFilter('appliedTo', e.target.value || null)}
              className={styles.dateInput}
              aria-label="Applied to"
            />
          </div>
          {hasFilters && (
            <button type="button" className={styles.clearLink} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selected.size} selected</span>
            <div className={styles.bulkActions}>
              <button type="button" className={styles.bulkBtn} onClick={doBulkAdvance}>
                Advance stage
              </button>
              <button type="button" className={styles.bulkBtn} onClick={doBulkShortlist}>
                Shortlist
              </button>
              <button type="button" className={styles.bulkBtn} onClick={doBulkMessage}>
                Message
              </button>
              <button
                type="button"
                className={[styles.bulkBtn, styles.bulkBtnDanger].join(' ')}
                onClick={() => setConfirmBulkReject(true)}
              >
                Reject
              </button>
              <button
                type="button"
                className={styles.bulkDeselect}
                onClick={() => setSelected(new Set())}
              >
                Deselect all
              </button>
            </div>
          </div>
        )}

        {/* Split layout: list + detail */}
        <div className={styles.splitLayout}>
          <div className={styles.listPane}>
            <div className={styles.tableCard}>
              <div className={[styles.row, styles.headerRow].join(' ')}>
                <div className={styles.checkCell}>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                  />
                </div>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('applicant')}
                >
                  Applicant{' '}
                  <SortIndicator active={sort.column === 'applicant'} direction={sort.direction} />
                </button>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('job')}
                >
                  Job title{' '}
                  <SortIndicator active={sort.column === 'job'} direction={sort.direction} />
                </button>
                <div>Stage</div>
                <button
                  type="button"
                  className={[styles.sortableHeader, styles.alignRight].join(' ')}
                  onClick={() => handleSort('match')}
                >
                  Match{' '}
                  <SortIndicator active={sort.column === 'match'} direction={sort.direction} />
                </button>
                <div className={styles.alignCenter}>Regulix</div>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('applied')}
                >
                  Applied{' '}
                  <SortIndicator active={sort.column === 'applied'} direction={sort.direction} />
                </button>
                <div />
              </div>

              {rows.length === 0 ? (
                <div className={styles.emptyRow}>No applicants match the current filters.</div>
              ) : (
                rows.map((a) => {
                  const isSelected = selected.has(a.id)
                  const overflowItems: OverflowItem[] = [
                    { label: 'View profile', onClick: () => setOpen(a) },
                  ]
                  if (a.stage !== 'hired' && a.stage !== 'rejected') {
                    overflowItems.push({
                      label: 'Advance stage',
                      onClick: () => handleAdvance(a.id),
                    })
                  }
                  overflowItems.push(
                    { label: 'Message', onClick: () => handleMessage(a.id) },
                    {
                      label: a.isShortlisted ? 'Unshortlist' : 'Shortlist',
                      onClick: () => handleShortlist(a.id),
                    },
                    { label: 'Add note', onClick: () => handleAddNote(a.id) }
                  )
                  if (a.stage !== 'rejected') {
                    overflowItems.push({
                      label: 'Reject',
                      danger: true,
                      onClick: () => handleReject(a.id),
                    })
                  }

                  const isOpen = open?.id === a.id
                  return (
                    <div
                      key={a.id}
                      className={[
                        styles.row,
                        isSelected ? styles.rowSelected : '',
                        isOpen ? styles.rowOpen : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className={styles.checkCell}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(a.id)}
                          aria-label={`Select ${a.workerFirstName} ${a.workerLastInitial}.`}
                        />
                      </div>
                      <div className={styles.applicantCell}>
                        <div className={styles.avatar}>{a.workerInitials}</div>
                        <button
                          type="button"
                          className={styles.applicantName}
                          onClick={() => setOpen(a)}
                        >
                          {a.workerFirstName} {a.workerLastInitial}.
                        </button>
                      </div>
                      <div className={styles.jobCell}>
                        <Link to={`/site/dashboard/jobs`} className={styles.jobLink}>
                          {a.jobTitle}
                        </Link>
                      </div>
                      <div>
                        <StagePill stage={a.stage} size="sm" />
                      </div>
                      <div className={[styles.alignRight, styles.matchCell].join(' ')}>
                        {a.matchScore}%
                      </div>
                      <div className={styles.alignCenter}>
                        {a.isRegulixReady ? <RegulixMarkIcon size={16} /> : null}
                      </div>
                      <div className={styles.dateCell}>{formatShortDate(a.appliedAt)}</div>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.primaryAction}
                          onClick={() => setOpen(a)}
                        >
                          View profile
                        </button>
                        <OverflowMenu items={overflowItems} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination footer */}
            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                {total === 0 ? '0 applicants' : `${pageStart}–${pageEnd} of ${total} applicants`}
              </div>
              <div className={styles.paginationRight}>
                <label className={styles.pageSizeLabel}>
                  Rows per page
                  <select
                    className={styles.select}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.pagerButtons}>
                  <button
                    type="button"
                    className={styles.pagerBtn}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  {pageButtons.map((b, i) =>
                    b === '…' ? (
                      <span key={`dots-${i}`} className={styles.pagerEllipsis}>
                        …
                      </span>
                    ) : (
                      <button
                        key={b}
                        type="button"
                        className={[styles.pagerBtn, b === page ? styles.pagerBtnActive : '']
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setPage(b)}
                      >
                        {b}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className={styles.pagerBtn}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.detailPane}>
            <ApplicantDetailPane
              applicant={open}
              onSetStage={handleSetStage}
              onMessage={handleMessage}
              onShortlist={handleShortlist}
            />
          </div>
        </div>
      </div>

      {/* Bulk reject confirmation */}
      <Modal
        open={confirmBulkReject}
        onClose={() => setConfirmBulkReject(false)}
        size="sm"
        title={
          <>
            <CloseIcon size={16} color="var(--kt-danger)" /> Reject {bulkApplicants.length}{' '}
            applicant{bulkApplicants.length === 1 ? '' : 's'}?
          </>
        }
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              onClick={() => setConfirmBulkReject(false)}
              className={styles.modalSecondary}
            >
              Cancel
            </button>
            <button type="button" onClick={doBulkReject} className={styles.modalDanger}>
              Reject {bulkApplicants.length}
            </button>
          </div>
        }
      >
        <p className={styles.confirmBody}>
          This will move the following applicants to the Rejected stage. Already-rejected applicants
          are skipped.
        </p>
        <ul className={styles.confirmList}>
          {bulkApplicants.slice(0, 6).map((a) => (
            <li key={a.id}>
              <CheckSmallIcon size={10} /> {a.workerFirstName} {a.workerLastInitial}. — {a.jobTitle}
            </li>
          ))}
          {bulkApplicants.length > 6 && (
            <li className={styles.confirmMore}>+{bulkApplicants.length - 6} more</li>
          )}
        </ul>
      </Modal>
    </div>
  )
}

// ── Little helper component for sort arrows ─────────────────────────────────
const SortIndicator: React.FC<{ active: boolean; direction: 'asc' | 'desc' }> = ({
  active,
  direction,
}) => {
  if (!active) return <SortIcon size={10} color="var(--kt-text-placeholder)" />
  return <span className={styles.sortIndicator}>{direction === 'asc' ? '↑' : '↓'}</span>
}
