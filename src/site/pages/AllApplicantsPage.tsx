import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Modal, Tooltip } from '../../components'
import { useToast } from '../../components/Toast/Toast'
import { JobCell } from '../components/ApplicantsWidget/cells/JobCell'
import { StageCell } from '../components/ApplicantsWidget/cells/StageCell'
import { FEATURES } from '../config/features'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import type { CompanyApplicant } from '../types'
import {
  getAllApplicants,
  getJobFilterOptions,
  advanceApplicant,
  bulkReject,
  rejectApplicant,
  shortlistApplicant,
  shortlistApplicants,
  addApplicantNote,
  DEFAULT_FILTERS,
  type ApplicantFilters,
  type ApplicantSort,
  type WidgetFilters,
} from '../services/applicantService'
import {
  CheckSmallIcon,
  CloseIcon,
  DotsHorizontalIcon,
  FlagFilledIcon,
  HourglassFilledIcon,
  RegulixMarkIcon,
  RocketIcon,
  SearchIcon,
  SortIcon,
  StarIcon,
} from '../icons'

function flagTooltip(labels: string[]): string {
  if (labels.length === 0) return 'Flagged for follow-up'
  if (labels.length === 1) {
    const label = labels[0]
    const truncated = label.length > 50 ? `${label.slice(0, 50)}…` : label
    return `Flagged: "${truncated}"`
  }
  return `${labels.length} flagged tasks`
}
import { getPipelineStages } from '../services/pipelineService'
import { useDrawerStack } from '../components/DrawerSystem/DrawerStackContext'
// Kanban view pulls in @dnd-kit (~14KB gzip); list view is the default, so
// defer it until the user switches to the board.
const WidgetKanbanView = lazy(() =>
  import('../components/ApplicantsWidget/WidgetKanbanView').then((m) => ({
    default: m.WidgetKanbanView,
  }))
)
import styles from './AllApplicantsPage.module.css'

// Stage options populated dynamically from pipeline stages — see stageOptions state below.
// Keeping a static fallback for the "all" sentinel.
const ALL_STAGES_OPTION = { value: 'all', label: 'All stages' }

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

// ── Helpers ────────────────────────────────────────────────────────────────

function initFiltersFromParams(params: URLSearchParams): ApplicantFilters {
  const stageId = params.get('stage')
  const jobId = params.get('job')
  const regulix = FEATURES.regulix && params.get('regulix') === '1'
  const from = params.get('from')
  const to = params.get('to')
  const search = params.get('search') ?? ''
  const showArchived = params.get('archived') === '1'
  return {
    ...DEFAULT_FILTERS,
    search,
    stageId: stageId ?? 'all',
    jobId: jobId ?? 'all',
    regulixOnly: regulix,
    appliedFrom: from ?? null,
    appliedTo: to ?? null,
    showArchived,
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export const AllApplicantsPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [view, setView] = useState<'list' | 'kanban'>(() =>
    searchParams.get('view') === 'kanban' ? 'kanban' : 'list'
  )
  const [filters, setFilters] = useState<ApplicantFilters>(() =>
    initFiltersFromParams(searchParams)
  )
  const [sort, setSort] = useState<{ column: ApplicantSort; direction: 'asc' | 'desc' }>({
    column: 'applied',
    direction: 'desc',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [rows, setRows] = useState<CompanyApplicant[]>([])
  const [total, setTotal] = useState(0)
  const [jobOptions, setJobOptions] = useState<Array<{ id: string; title: string }>>([])
  const [stageOptions, setStageOptions] = useState<Array<{ id: string; name: string }>>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulkReject, setConfirmBulkReject] = useState(false)
  const { openDrawer, stack, closeAllDrawers } = useDrawerStack()

  const openApplicant = useCallback(
    (a: CompanyApplicant): void => {
      openDrawer({
        type: 'application',
        applicationId: a.id,
        preloadedApplicant: a,
        onWrite: () => load(),
      })
    },
    // load is recreated each render; we depend on the stable openDrawer ref and
    // resolve load at call time via closure to avoid a churn loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer]
  )

  // If a row mutation hits the application currently visible in a drawer,
  // close the drawer so the user isn't looking at stale state.
  const closeDrawerIfMatches = (id: string): void => {
    if (stack.some((e) => e.type === 'application' && e.applicationId === id)) {
      closeAllDrawers()
    }
  }

  // Sync filters + view to URL (replace so back button stays sensible)
  useEffect(() => {
    const params: Record<string, string> = {}
    if (view !== 'list') params.view = view
    if (filters.search) params.search = filters.search
    if (filters.stageId !== 'all') params.stage = filters.stageId
    if (filters.jobId !== 'all') params.job = filters.jobId
    if (filters.regulixOnly) params.regulix = '1'
    if (filters.appliedFrom) params.from = filters.appliedFrom
    if (filters.appliedTo) params.to = filters.appliedTo
    if (filters.showArchived) params.archived = '1'
    setSearchParams(params, { replace: true })
  }, [view, filters, setSearchParams])

  // Debounce the search term so the heavy applicants query fires once typing
  // pauses, not on every keystroke. The input itself stays on filters.search.
  const debouncedSearch = useDebounce(filters.search)
  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    // Keyed on each non-search field (not the filters object) so identity only
    // changes when a setting changes or the debounced search settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filters.stageId,
      filters.jobId,
      filters.regulixOnly,
      filters.appliedFrom,
      filters.appliedTo,
      filters.showArchived,
      debouncedSearch,
    ]
  )

  const load = useCallback(() => {
    if (!user?.id) return
    getAllApplicants(user.id, { filters: queryFilters, sort, page, pageSize }).then((res) => {
      const isDemo =
        typeof window !== 'undefined' && window.sessionStorage.getItem('kt:demoCard') === 'full'
      const data = res.data
      if (isDemo && data.length > 0) {
        data[0] = {
          ...data[0],
          isRegulixReady: true,
          isShortlisted: true,
          isBoosted: true,
          flagged: true,
          flaggedTaskLabels: ['Verify references'],
          slaState: 'breached',
          jobStatus: 'paused',
        }
      }
      setRows(data)
      setTotal(res.total)
    })
  }, [user?.id, queryFilters, sort, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user?.id) return
    getJobFilterOptions(user.id).then(({ data }) => setJobOptions(data))
    getPipelineStages(user.id).then(({ data }) => setStageOptions(data))
  }, [user?.id])

  // Clear selection when page/filters/sort change
  useEffect(() => {
    setSelected(new Set())
  }, [page, filters, sort, pageSize])

  const updateFilter = <K extends keyof ApplicantFilters>(key: K, value: ApplicantFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const handleSort = (column: ApplicantSort) => {
    setSort((s) => {
      if (s.column !== column) {
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
  const handleAdvance = async (id: string, currentStageId: string) => {
    await advanceApplicant(id, currentStageId)
    closeDrawerIfMatches(id)
    load()
  }
  const handleReject = async (id: string) => {
    await rejectApplicant(id)
    closeDrawerIfMatches(id)
    load()
  }
  const handleShortlist = async (id: string) => {
    await shortlistApplicant(id)
    load()
  }
  // Rows ARE applications, so Message deep-links straight into the thread —
  // MessagesPage handles never-messaged applications via getConversationStub.
  const handleMessage = (id: string) => {
    navigate(`/site/messages?application=${id}`)
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

  const doBulkShortlist = async () => {
    await shortlistApplicants(bulkIds)
    setSelected(new Set())
    load()
  }
  // Threads are per-application — open the thread when exactly one row is
  // selected, explain why otherwise.
  const doBulkMessage = () => {
    if (bulkIds.length === 1) {
      handleMessage(bulkIds[0])
      return
    }
    toast({
      variant: 'info',
      title: 'Select a single applicant',
      description:
        'Message threads are one-on-one — select one applicant to open their conversation.',
    })
  }
  const doBulkReject = async () => {
    await bulkReject(bulkIds)
    setSelected(new Set())
    setConfirmBulkReject(false)
    load()
  }

  // ── Filter chips ─────────────────────────────────────────────────────────
  const hasFilters =
    !!filters.search ||
    filters.stageId !== 'all' ||
    filters.jobId !== 'all' ||
    filters.regulixOnly ||
    !!filters.appliedFrom ||
    !!filters.appliedTo ||
    filters.showArchived

  const chips: Array<{ label: string; onRemove: () => void }> = []
  if (filters.search)
    chips.push({ label: `"${filters.search}"`, onRemove: () => updateFilter('search', '') })
  if (filters.stageId !== 'all') {
    const stageLabel = stageOptions.find((o) => o.id === filters.stageId)?.name ?? filters.stageId
    chips.push({ label: `Stage: ${stageLabel}`, onRemove: () => updateFilter('stageId', 'all') })
  }
  if (filters.jobId !== 'all') {
    const job = jobOptions.find((j) => j.id === filters.jobId)
    chips.push({
      label: `Job: ${job?.title ?? filters.jobId}`,
      onRemove: () => updateFilter('jobId', 'all'),
    })
  }
  if (FEATURES.regulix && filters.regulixOnly)
    chips.push({ label: 'Regulix Ready', onRemove: () => updateFilter('regulixOnly', false) })
  if (filters.appliedFrom)
    chips.push({
      label: `From: ${filters.appliedFrom}`,
      onRemove: () => updateFilter('appliedFrom', null),
    })
  if (filters.appliedTo)
    chips.push({
      label: `To: ${filters.appliedTo}`,
      onRemove: () => updateFilter('appliedTo', null),
    })

  // ── Kanban filters (subset of ApplicantFilters) ───────────────────────────
  const widgetFilters: WidgetFilters = {
    search: filters.search,
    jobId: filters.jobId,
    regulixOnly: filters.regulixOnly,
  }

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

  const subtitleText =
    view === 'kanban'
      ? `${total} applicant${total === 1 ? '' : 's'} across your pipeline`
      : total === 0
        ? 'No applicants'
        : `Showing ${pageStart}–${pageEnd} of ${total} applicant${total === 1 ? '' : 's'}`

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/site/dashboard/company" className={styles.breadcrumb}>
          ← Back to dashboard
        </Link>

        {/* Page header */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Applicants</h1>
            <p className={styles.subtitle}>{subtitleText}</p>
          </div>
          <div className={styles.viewToggle} role="group" aria-label="Applicants view">
            <button
              type="button"
              className={`${styles.toggleBtn} ${view === 'list' ? styles.toggleActive : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
            >
              List
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${view === 'kanban' ? styles.toggleActive : ''}`}
              onClick={() => setView('kanban')}
              aria-pressed={view === 'kanban'}
            >
              Kanban
            </button>
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
          {view === 'list' && (
            <select
              value={filters.stageId}
              onChange={(e) => updateFilter('stageId', e.target.value)}
              className={styles.select}
            >
              <option value={ALL_STAGES_OPTION.value}>{ALL_STAGES_OPTION.label}</option>
              {stageOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
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
          {FEATURES.regulix && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.regulixOnly}
                onChange={(e) => updateFilter('regulixOnly', e.target.checked)}
              />
              Regulix only
            </label>
          )}
          {view === 'list' && (
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
          )}
          <button
            type="button"
            className={[styles.archiveToggle, filters.showArchived ? styles.archiveToggleOn : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              updateFilter('showArchived', !filters.showArchived)
              updateFilter('stageId', 'all')
            }}
          >
            {filters.showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          {hasFilters && (
            <button type="button" className={styles.clearLink} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* Filter chips */}
        {hasFilters && chips.length > 0 && (
          <div className={styles.chips}>
            {chips.map((chip) => (
              <span key={chip.label} className={styles.chip}>
                {chip.label}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={chip.onRemove}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  <CloseIcon size={10} />
                </button>
              </span>
            ))}
            <button type="button" className={styles.clearAll} onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {/* Kanban view */}
        {view === 'kanban' && user?.id && (
          <div className={styles.kanbanWrapper}>
            <Suspense fallback={null}>
              <WidgetKanbanView
                companyId={user.id}
                filters={widgetFilters}
                onOpenApplicant={openApplicant}
                cardsPerCol={50}
                fillHeight
              />
            </Suspense>
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <>
            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className={styles.bulkBar}>
                <span className={styles.bulkCount}>{selected.size} selected</span>
                <div className={styles.bulkActions}>
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
                  className={styles.sortableHeader}
                  onClick={() => handleSort('applied')}
                >
                  Applied{' '}
                  <SortIndicator active={sort.column === 'applied'} direction={sort.direction} />
                </button>
                <div aria-hidden="true" />
                <div />
              </div>

              {rows.length === 0 ? (
                <div className={styles.emptyRow}>No applicants match the current filters.</div>
              ) : (
                rows.map((a) => {
                  const isSelected = selected.has(a.id)
                  const overflowItems: OverflowItem[] = [
                    { label: 'View profile', onClick: () => openApplicant(a) },
                  ]
                  if (a.status === 'active') {
                    overflowItems.push({
                      label: 'Advance stage',
                      onClick: () => handleAdvance(a.id, a.currentStageId),
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
                  if (a.status !== 'terminal_rejected') {
                    overflowItems.push({
                      label: 'Reject',
                      danger: true,
                      onClick: () => handleReject(a.id),
                    })
                  }

                  return (
                    <div
                      key={a.id}
                      className={[
                        styles.row,
                        isSelected ? styles.rowSelected : '',
                        a.isBoosted ? styles.rowBoosted : '',
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
                        <div className={styles.applicantText}>
                          <button
                            type="button"
                            className={styles.applicantName}
                            onClick={() => openApplicant(a)}
                          >
                            {a.workerFirstName} {a.workerLastInitial}.
                          </button>
                          {a.workerPrimaryTrade && (
                            <span className={styles.applicantTrade}>{a.workerPrimaryTrade}</span>
                          )}
                        </div>
                      </div>
                      <JobCell jobId={a.jobId} jobTitle={a.jobTitle} jobStatus={a.jobStatus} />
                      <StageCell stageName={a.currentStageName} status={a.status} />
                      <div className={styles.dateCell}>{formatShortDate(a.appliedAt)}</div>
                      <div className={styles.signalsCell}>
                        {a.isBoosted && (
                          <Tooltip content="Boosted application" position="top">
                            <span className={styles.signalBoosted} aria-label="Boosted">
                              <RocketIcon size={12} />
                            </span>
                          </Tooltip>
                        )}
                        {a.isRegulixReady && (
                          <Tooltip content="Regulix Ready — paperwork complete" position="top">
                            <span className={styles.signalRegulix} aria-label="Regulix Ready">
                              <RegulixMarkIcon size={12} />
                            </span>
                          </Tooltip>
                        )}
                        {a.isShortlisted && (
                          <Tooltip content="Shortlisted by your team" position="top">
                            <span className={styles.signalMuted} aria-label="Shortlisted">
                              <StarIcon size={11} />
                            </span>
                          </Tooltip>
                        )}
                        {a.flagged && (
                          <Tooltip content={flagTooltip(a.flaggedTaskLabels)} position="top">
                            <span className={styles.signalMuted} aria-label="Flagged">
                              <FlagFilledIcon size={11} />
                            </span>
                          </Tooltip>
                        )}
                        {a.slaState !== 'none' && (
                          <Tooltip
                            content={
                              a.slaState === 'breached'
                                ? 'Overdue — has been in this stage too long'
                                : 'Almost overdue — move soon to stay on track'
                            }
                            position="top"
                          >
                            <span
                              className={styles.signalMuted}
                              aria-label={
                                a.slaState === 'breached' ? 'SLA breached' : 'SLA approaching'
                              }
                            >
                              <HourglassFilledIcon size={11} />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.primaryAction}
                          onClick={() => openApplicant(a)}
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
          </>
        )}
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

// ── Sort arrow indicator ─────────────────────────────────────────────────────
const SortIndicator: React.FC<{ active: boolean; direction: 'asc' | 'desc' }> = ({
  active,
  direction,
}) => {
  if (!active) return <SortIcon size={10} color="var(--kt-text-placeholder)" />
  return <span className={styles.sortIndicator}>{direction === 'asc' ? '↑' : '↓'}</span>
}
