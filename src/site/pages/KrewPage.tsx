import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Button, Modal, Tooltip } from '../../components'
import { useToast } from '../../components/Toast/Toast'
import {
  ChevronDownIcon,
  DotsHorizontalIcon,
  FolderIcon,
  PlusIcon,
  RegulixMarkIcon,
  SearchIcon,
  SortIcon,
  SparkleIcon,
  UsersIcon,
} from '../icons'
import {
  addWorkerToList,
  createKrewList,
  deleteKrewList,
  getKrew,
  getKrewLists,
  getRegulixReadyCount,
  removeWorkerFromKrew,
  removeWorkerFromList,
  renameKrewList,
  type KrewList,
  type KrewWorker,
} from '../services/krewService'
import { useChatPane } from '../components/ChatPane/ChatPaneContext'
import { useDebounce } from '../hooks/useDebounce'
import { useDrawerStack } from '../components/DrawerSystem/DrawerStackContext'
import styles from './KrewPage.module.css'

// Sidebar sentinels — distinct from any real list UUID. Each represents a
// "virtual list" the sidebar selects mutually exclusively with real lists.
const ALL_KREW_SENTINEL = 'all'
const REGULIX_READY_SENTINEL = 'regulix-ready'

// Menu item shape shared by the row overflow + the per-list overflow.
type MenuItem = { label: string; danger?: boolean; onClick?: () => void }

// Overflow menu (popover portaled to body so it can escape the table's overflow-x clip
// and any other ancestor that might clip a child). Reused for row overflows + the
// per-list overflow in the sidebar; pass buttonClassName to tweak the trigger size.
const OverflowMenu: React.FC<{
  items: MenuItem[]
  buttonClassName?: string
  ariaLabel?: string
}> = ({ items, buttonClassName, ariaLabel = 'More actions' }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
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
        type="button"
        className={[styles.overflowBtn, buttonClassName ?? ''].filter(Boolean).join(' ')}
        onClick={handleToggle}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DotsHorizontalIcon size={13} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            style={{ top: pos.top, right: pos.right }}
            role="menu"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={[styles.overflowItem, item.danger ? styles.overflowItemDanger : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  item.onClick?.()
                }}
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

// ── Sort (state-only — backend sort wires up in a later chunk) ────────────
type KrewSortColumn = 'worker' | 'trade' | 'lastInteraction' | 'matches'
type KrewSortDir = 'asc' | 'desc'

// Text columns default to asc; date / numeric columns default to desc.
const DEFAULT_SORT_DIR: Record<KrewSortColumn, KrewSortDir> = {
  worker: 'asc',
  trade: 'asc',
  lastInteraction: 'desc',
  matches: 'desc',
}

const SortIndicator: React.FC<{ active: boolean; direction: KrewSortDir }> = ({
  active,
  direction,
}) => {
  if (!active) return <SortIcon size={10} color="var(--kt-text-placeholder)" />
  return <span className={styles.sortIndicator}>{direction === 'asc' ? '↑' : '↓'}</span>
}

// ── Filter bar (Chunk 4: visual only — selections don't filter the table) ──
const SOURCE_OPTIONS = ['Past hire', 'Inbound application', 'Manual add']
const SKILL_OPTIONS = [
  'Electrical',
  'Drywall',
  'HVAC',
  'Plumbing',
  'Carpentry',
  'Painting',
  'General',
]

type FilterDropdownProps = {
  label: string
  options: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (opt: string): void => {
    const next = new Set(selected)
    if (next.has(opt)) next.delete(opt)
    else next.add(opt)
    onChange(next)
  }

  const count = selected.size
  const triggerClass = [styles.filterTrigger, count > 0 ? styles.filterTriggerActive : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={styles.filterDropdownWrap}>
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
        {count > 0 && <span className={styles.filterTriggerCount}>{count}</span>}
        <ChevronDownIcon size={12} />
      </button>
      {open && (
        <div className={styles.filterPopover} role="listbox">
          {options.map((opt) => (
            <label key={opt} className={styles.filterOption}>
              <input type="checkbox" checked={selected.has(opt)} onChange={() => toggle(opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Skeleton row (loading state) ───────────────────────────────────────────
const SKELETON_ROW_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

const SkeletonRow: React.FC = () => (
  <div className={styles.row} aria-hidden="true">
    <div className={styles.checkCell}>
      <span className={styles.skeletonBar} style={{ width: 14, height: 14 }} />
    </div>
    <div className={styles.workerCell}>
      <span className={styles.skeletonBar} style={{ width: 28, height: 28, borderRadius: '50%' }} />
      <span className={styles.skeletonBar} style={{ width: 80, height: 12 }} />
    </div>
    <span className={styles.skeletonBar} style={{ width: 110, height: 11 }} />
    <div className={styles.regulixCell}>
      <span className={styles.skeletonBar} style={{ width: 14, height: 14, borderRadius: '50%' }} />
    </div>
    <span className={styles.skeletonBar} style={{ width: 30, height: 16 }} />
    <span className={styles.skeletonBar} style={{ width: 72, height: 11 }} />
    <div className={styles.overflowCell}>
      <span className={styles.skeletonBar} style={{ width: 16, height: 16 }} />
    </div>
  </div>
)

const PAGE_SIZES = [25, 50, 100] as const

// Relative-time formatter — "today" / "yesterday" / "3d ago" / "2w ago" / "1mo ago" / "1y ago".
// Returns an em-dash placeholder when the timestamp is missing.
function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const days = Math.round((Date.now() - t) / (1000 * 60 * 60 * 24))
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}
const DEFAULT_PAGE_SIZE = 25
const DEFAULT_SORT_COLUMN: KrewSortColumn = 'lastInteraction'
const FALLBACK_SORT_DIR: KrewSortDir = 'desc'

// URL params (URL is the source of truth — back/forward + refresh just work)
const PARAM_LIST = 'list'
const PARAM_SEARCH = 'q'
const PARAM_SOURCE = 'source'
const PARAM_SKILLS = 'skills'
const PARAM_SORT = 'sort'
const PARAM_DIR = 'dir'
const PARAM_PAGE = 'page'
const PARAM_SIZE = 'size'
const PARAM_WORKER = 'worker'

const VALID_SORT_COLUMNS: readonly KrewSortColumn[] = [
  'worker',
  'trade',
  'lastInteraction',
  'matches',
]

function parseStringSet(p: URLSearchParams, key: string): Set<string> {
  const v = p.get(key)
  if (!v) return new Set()
  return new Set(v.split(',').filter(Boolean))
}

function parseSort(p: URLSearchParams): { column: KrewSortColumn; direction: KrewSortDir } {
  const colRaw = p.get(PARAM_SORT)
  const dirRaw = p.get(PARAM_DIR)
  const column: KrewSortColumn = VALID_SORT_COLUMNS.includes(colRaw as KrewSortColumn)
    ? (colRaw as KrewSortColumn)
    : DEFAULT_SORT_COLUMN
  const direction: KrewSortDir = dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : FALLBACK_SORT_DIR
  return { column, direction }
}

function parsePage(p: URLSearchParams): number {
  const n = Number(p.get(PARAM_PAGE))
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

function parsePageSize(p: URLSearchParams): number {
  const n = Number(p.get(PARAM_SIZE))
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE
}

export const KrewPage: React.FC = () => {
  // ─── URL is the source of truth — everything derives from searchParams ───
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { openChat } = useChatPane()

  const activeListId = searchParams.get(PARAM_LIST) ?? ALL_KREW_SENTINEL
  const isRegulixView = activeListId === REGULIX_READY_SENTINEL
  const search = searchParams.get(PARAM_SEARCH) ?? ''
  // The input renders `search` live; the table query waits for typing to pause.
  const debouncedSearch = useDebounce(search)
  const sources = useMemo(() => parseStringSet(searchParams, PARAM_SOURCE), [searchParams])
  const skills = useMemo(() => parseStringSet(searchParams, PARAM_SKILLS), [searchParams])
  const sort = useMemo(() => parseSort(searchParams), [searchParams])
  const page = parsePage(searchParams)
  const pageSize = parsePageSize(searchParams)

  const hasActiveFilters = search.length > 0 || sources.size > 0 || skills.size > 0

  // Mutate URL params. `resetPage` clears ?page when a filter-ish thing changes.
  // `replace` collapses incremental updates (search keystrokes) into a single
  // history entry; default `push` so Back walks through major state changes.
  const updateParams = (
    mutator: (next: URLSearchParams) => void,
    opts: { resetPage?: boolean; replace?: boolean } = {}
  ): void => {
    const { resetPage = true, replace = false } = opts
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        mutator(next)
        if (resetPage) next.delete(PARAM_PAGE)
        return next
      },
      { replace }
    )
  }

  const selectList = (id: string): void =>
    updateParams((p) => {
      if (id === ALL_KREW_SENTINEL) p.delete(PARAM_LIST)
      else p.set(PARAM_LIST, id)
    })

  const setSearch = (val: string): void =>
    // Replace so a typed string doesn't create one history entry per keystroke.
    updateParams(
      (p) => {
        if (val) p.set(PARAM_SEARCH, val)
        else p.delete(PARAM_SEARCH)
      },
      { replace: true }
    )

  const setSources = (next: Set<string>): void =>
    updateParams((p) => {
      if (next.size > 0) p.set(PARAM_SOURCE, Array.from(next).join(','))
      else p.delete(PARAM_SOURCE)
    })

  const setSkills = (next: Set<string>): void =>
    updateParams((p) => {
      if (next.size > 0) p.set(PARAM_SKILLS, Array.from(next).join(','))
      else p.delete(PARAM_SKILLS)
    })

  const handleSort = (column: KrewSortColumn): void =>
    updateParams((p) => {
      const isSameColumn = sort.column === column
      const newDir: KrewSortDir = isSameColumn
        ? sort.direction === 'asc'
          ? 'desc'
          : 'asc'
        : DEFAULT_SORT_DIR[column]
      // Omit from URL when it matches the default — keeps URLs tidy
      if (column === DEFAULT_SORT_COLUMN && newDir === FALLBACK_SORT_DIR) {
        p.delete(PARAM_SORT)
        p.delete(PARAM_DIR)
      } else {
        p.set(PARAM_SORT, column)
        p.set(PARAM_DIR, newDir)
      }
    })

  const setPage = (n: number): void =>
    updateParams(
      (p) => {
        if (n <= 1) p.delete(PARAM_PAGE)
        else p.set(PARAM_PAGE, String(n))
      },
      { resetPage: false } // page changes shouldn't reset themselves
    )

  const setPageSize = (n: number): void =>
    updateParams((p) => {
      if (n === DEFAULT_PAGE_SIZE) p.delete(PARAM_SIZE)
      else p.set(PARAM_SIZE, String(n))
    }) // resets page=1 by default — desired when row count per page changes

  const clearFilters = (): void =>
    updateParams((p) => {
      p.delete(PARAM_SEARCH)
      p.delete(PARAM_SOURCE)
      p.delete(PARAM_SKILLS)
    })

  // ─── Worker drawer ───────────────────────────────────────────────────────
  // URL (`?worker=[id]`) is the user-facing source of truth so refresh and
  // back/forward keep the drawer in sync. The global drawer stack is the
  // runtime source of truth; two effects below keep them aligned.
  const selectedWorkerId = searchParams.get(PARAM_WORKER)

  const openWorker = (id: string): void =>
    updateParams(
      (p) => {
        p.set(PARAM_WORKER, id)
      },
      { resetPage: false }
    )

  // ─── Data fetched from backend ───────────────────────────────────────────
  const [krewLists, setKrewLists] = useState<KrewList[]>([])
  const [loadingLists, setLoadingLists] = useState<boolean>(true)
  // Cached unfiltered krew total — drives the header subtitle and the "All Krew"
  // sidebar count. Only updates when a fetch with no row-affecting filter returns.
  const [krewTotalCount, setKrewTotalCount] = useState<number | null>(null)
  const [workers, setWorkers] = useState<KrewWorker[]>([])
  const [pageTotal, setPageTotal] = useState<number>(0)
  const [loadingTable, setLoadingTable] = useState<boolean>(true)
  // Cached count of regulix-ready workers — drives the Regulix Ready sidebar item's
  // count badge. Fetched alongside lists and after mutations.
  const [regulixReadyCount, setRegulixReadyCount] = useState<number | null>(null)

  // Fetch lists once on mount
  useEffect(() => {
    let cancelled = false
    setLoadingLists(true)
    getKrewLists().then(({ data }) => {
      if (cancelled) return
      setKrewLists(data)
      setLoadingLists(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // ─── List CRUD (Chunk 10) ────────────────────────────────────────────────
  const [creatingList, setCreatingList] = useState<boolean>(false)
  const [newListName, setNewListName] = useState<string>('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false)

  const [renamingListId, setRenamingListId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')
  const [submittingRename, setSubmittingRename] = useState<boolean>(false)

  const [confirmDeleteList, setConfirmDeleteList] = useState<KrewList | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false)

  const refetchLists = async (): Promise<void> => {
    const { data } = await getKrewLists()
    setKrewLists(data)
  }

  // Create
  const handleStartCreate = (): void => {
    setCreatingList(true)
    setNewListName('')
    setCreateError(null)
  }
  const handleCancelCreate = (): void => {
    setCreatingList(false)
    setNewListName('')
    setCreateError(null)
  }
  const handleSubmitCreate = async (): Promise<void> => {
    const trimmed = newListName.trim()
    if (!trimmed) return
    setSubmittingCreate(true)
    setCreateError(null)
    const { error } = await createKrewList(trimmed)
    setSubmittingCreate(false)
    if (error) {
      setCreateError(error)
      return
    }
    setCreatingList(false)
    setNewListName('')
    await refetchLists()
  }

  // Rename
  const handleStartRename = (list: KrewList): void => {
    setRenamingListId(list.id)
    setRenameValue(list.name)
  }
  const handleCancelRename = (): void => {
    setRenamingListId(null)
    setRenameValue('')
  }
  const handleSubmitRename = async (id: string): Promise<void> => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    setSubmittingRename(true)
    const { error } = await renameKrewList(id, trimmed)
    setSubmittingRename(false)
    if (error) return
    setRenamingListId(null)
    setRenameValue('')
    await refetchLists()
  }

  // Delete
  const handleDelete = async (id: string): Promise<void> => {
    setSubmittingDelete(true)
    const { error } = await deleteKrewList(id)
    setSubmittingDelete(false)
    if (error) return
    setConfirmDeleteList(null)
    // If the deleted list was the active list, fall back to All Krew
    if (activeListId === id) {
      selectList(ALL_KREW_SENTINEL)
    }
    await refetchLists()
  }

  // ─── Row actions (Chunk 11): Add-to-list picker + Remove-from-krew confirm ──
  // Bumping this version forces the table-fetch effect to re-run after a mutation
  // without changing the URL.
  const [refetchVersion, setRefetchVersion] = useState<number>(0)
  const refetchWorkers = (): void => setRefetchVersion((v) => v + 1)

  // Add-to-list picker
  const [addToListWorkerIds, setAddToListWorkerIds] = useState<string[] | null>(null)
  const [pickedListIds, setPickedListIds] = useState<Set<string>>(new Set())
  const [pickerNewListName, setPickerNewListName] = useState<string>('')
  const [submittingPicker, setSubmittingPicker] = useState<boolean>(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  const openAddToList = (workerIds: string[]): void => {
    if (workerIds.length === 0) return
    setAddToListWorkerIds(workerIds)
    setPickedListIds(new Set())
    setPickerNewListName('')
    setPickerError(null)
  }
  const closeAddToList = (): void => {
    setAddToListWorkerIds(null)
    setPickedListIds(new Set())
    setPickerNewListName('')
    setPickerError(null)
    setSubmittingPicker(false)
  }
  const togglePickedList = (id: string): void => {
    setPickedListIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const submitAddToList = async (): Promise<void> => {
    if (!addToListWorkerIds) return
    const newName = pickerNewListName.trim()
    if (pickedListIds.size === 0 && !newName) return

    setSubmittingPicker(true)
    setPickerError(null)
    const listIds = Array.from(pickedListIds)

    // If user typed a new-list name, create it first then add it to the targets.
    if (newName) {
      const { data: newList, error } = await createKrewList(newName)
      if (error || !newList) {
        setPickerError(error ?? 'Could not create list')
        setSubmittingPicker(false)
        return
      }
      listIds.push(newList.id)
    }

    const ops: Promise<unknown>[] = []
    for (const workerId of addToListWorkerIds) {
      for (const listId of listIds) {
        ops.push(addWorkerToList(workerId, listId))
      }
    }
    await Promise.all(ops)

    setSubmittingPicker(false)
    closeAddToList()
    setSelected(new Set())
    await refetchLists()
    refetchWorkers()
  }

  // Remove from a specific list (contextual — fires when a list is active)
  const handleRemoveFromList = async (workerIds: string[], listId: string): Promise<void> => {
    if (workerIds.length === 0) return
    const ops = workerIds.map((id) => removeWorkerFromList(id, listId))
    await Promise.all(ops)
    setSelected(new Set())
    await refetchLists()
    refetchWorkers()
  }

  // Remove from krew (per-row or bulk) — always confirmed
  const [confirmRemove, setConfirmRemove] = useState<{
    workerIds: string[]
    label: string
  } | null>(null)
  const [submittingRemove, setSubmittingRemove] = useState<boolean>(false)

  const openConfirmRemove = (workerIds: string[], label: string): void => {
    if (workerIds.length === 0) return
    setConfirmRemove({ workerIds, label })
  }
  const submitConfirmRemove = async (): Promise<void> => {
    if (!confirmRemove) return
    setSubmittingRemove(true)
    const ops = confirmRemove.workerIds.map((id) => removeWorkerFromKrew(id))
    await Promise.all(ops)
    setSubmittingRemove(false)
    setConfirmRemove(null)
    setSelected(new Set())
    await refetchLists()
    refetchWorkers()
  }

  // Direct messages don't require an application — open the docked chat
  // pane for this worker (LinkedIn-style) without leaving the page.
  const handleSendMessage = (worker: KrewWorker): void => {
    openChat({
      workerId: worker.id,
      name: `${worker.firstName} ${worker.lastName}`.trim(),
      avatarUrl: worker.avatarUrl,
    })
  }

  // Bulk bar variant: chats are one-on-one — open the pane when exactly one
  // worker is selected, explain why otherwise.
  const handleBulkSendMessage = (): void => {
    const ids = Array.from(selected)
    if (ids.length === 1) {
      const w = workers.find((row) => row.id === ids[0])
      if (w) handleSendMessage(w)
      return
    }
    toast({
      variant: 'info',
      title: 'Select a single worker',
      description: 'Chats are one-on-one — select one worker to open their conversation.',
    })
  }

  // Build the row overflow menu — items depend on whether a list is currently selected.
  const getRowOverflowItems = (worker: KrewWorker): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'View profile', onClick: () => openWorker(worker.id) },
      { label: 'Send message', onClick: () => handleSendMessage(worker) },
      { label: 'Add to list', onClick: () => openAddToList([worker.id]) },
    ]
    if (activeListId !== ALL_KREW_SENTINEL) {
      items.push({
        label: 'Remove from list',
        onClick: () => {
          void handleRemoveFromList([worker.id], activeListId)
        },
      })
    }
    const initial = worker.lastName ? `${worker.lastName[0]}.` : ''
    items.push({
      label: 'Remove from My Krew',
      danger: true,
      onClick: () =>
        openConfirmRemove([worker.id], `${worker.firstName}${initial ? ' ' + initial : ''}`),
    })
    return items
  }

  // Refetch the table whenever any *table-affecting* URL param changes. We
  // exclude PARAM_WORKER so opening / closing the drawer (which mutates the URL)
  // doesn't trigger a skeleton-flashing refetch.
  const tableParamsKey = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(PARAM_WORKER)
    // Search is tracked separately via debouncedSearch so each keystroke
    // doesn't refetch — the URL updates live, the table query trails it.
    next.delete(PARAM_SEARCH)
    return next.toString()
  }, [searchParams])
  useEffect(() => {
    let cancelled = false
    setLoadingTable(true)
    const isAll = activeListId === ALL_KREW_SENTINEL
    const isRegulix = activeListId === REGULIX_READY_SENTINEL
    const listId = isAll || isRegulix ? undefined : activeListId
    getKrew({
      listId,
      search: debouncedSearch || undefined,
      sources: sources.size > 0 ? Array.from(sources) : undefined,
      skills: skills.size > 0 ? Array.from(skills) : undefined,
      regulixReadyOnly: isRegulix || undefined,
      sort,
      page,
      pageSize,
    }).then(({ data }) => {
      if (cancelled) return
      setWorkers(data.workers)
      setPageTotal(data.total)
      // Header / "All Krew" count caches the unfiltered total — only update when
      // every row-affecting filter is off.
      const isUnfilteredAll = isAll && debouncedSearch.length === 0 && sources.size === 0
      if (isUnfilteredAll) {
        setKrewTotalCount(data.total)
      }
      // Regulix Ready count caches when on that view with no other row-affecting filter.
      const isUnfilteredRegulix = isRegulix && debouncedSearch.length === 0 && sources.size === 0
      if (isUnfilteredRegulix) {
        setRegulixReadyCount(data.total)
      }
      setLoadingTable(false)
    })
    return () => {
      cancelled = true
    }
    // tableParamsKey covers every table-affecting URL value (excludes
    // PARAM_WORKER so drawer open/close doesn't refetch). refetchVersion bumps
    // after mutations to force a refetch without changing the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParamsKey, debouncedSearch, refetchVersion])

  // Independently fetch the regulix-ready count for the sidebar badge. Runs on
  // mount and after mutations so the badge stays accurate even when the user is
  // viewing a different list. Uses a head:true count query so PostgREST skips
  // row hydration entirely — far cheaper than the embedded-join `getKrew` call
  // when all we need is a single integer.
  useEffect(() => {
    let cancelled = false
    getRegulixReadyCount().then(({ data }) => {
      if (cancelled) return
      setRegulixReadyCount(data)
    })
    return () => {
      cancelled = true
    }
  }, [refetchVersion])

  // ─── Selection state ─────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const headerCheckRef = useRef<HTMLInputElement>(null)

  const allVisibleSelected = workers.length > 0 && workers.every((w) => selected.has(w.id))
  const partiallySelected = selected.size > 0 && !allVisibleSelected

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = partiallySelected
    }
  }, [partiallySelected])

  const toggleRow = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = (): void => {
    setSelected(allVisibleSelected ? new Set() : new Set(workers.map((w) => w.id)))
  }

  const deselectAll = (): void => setSelected(new Set())

  // ─── Pagination derived values ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(pageTotal / pageSize))
  const pageStart = pageTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const pageEnd = Math.min(page * pageSize, pageTotal)

  // Keep `page` in bounds when pageSize changes or the filtered total shrinks
  // (e.g. a shared URL with ?page=5 lands against a filter that only has 2 pages).
  // setPage is recreated each render, so we depend on the primitive values it captures.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages])

  // Truncated page button list — first, last, current ± 1, with ellipses (mirrors AllApplicantsPage)
  const pageButtons = useMemo<Array<number | '…'>>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b)
    const result: Array<number | '…'> = []
    let prev = 0
    for (const p of sorted) {
      if (p - prev > 1) result.push('…')
      result.push(p)
      prev = p
    }
    return result
  }, [page, totalPages])

  // ─── Display helpers ─────────────────────────────────────────────────────
  const headerCount = krewTotalCount ?? 0
  const allKrewCount = krewTotalCount ?? 0
  // Empty-state messaging differs between "krew is genuinely empty" and
  // "filter narrowed to nothing." Sidebar list selection counts as a filter.
  const hasRowFilter = activeListId !== ALL_KREW_SENTINEL
  const emptyMessage = hasRowFilter ? 'No workers match the current filters' : 'Your Krew is empty'

  // ─── Drawer ↔ URL sync ───────────────────────────────────────────────────
  // Bidirectional bind between the URL param and the global drawer stack. Each
  // effect only acts when the two are out of sync, so they converge in one
  // step rather than ping-ponging.
  const { openDrawer, stack, closeAllDrawers, updateBasePreload } = useDrawerStack()
  const baseWorkerId = stack[0]?.type === 'worker' ? stack[0].workerId : null

  // URL → stack: row click sets the URL param, this effect picks it up and
  // opens the drawer with the row's data as preload (zero-flicker open).
  useEffect(() => {
    if (selectedWorkerId) {
      if (baseWorkerId !== selectedWorkerId) {
        const preloaded = workers.find((w) => w.id === selectedWorkerId)
        openDrawer({
          type: 'worker',
          workerId: selectedWorkerId,
          preloadedWorker: preloaded,
          onWrite: refetchWorkers,
        })
      }
    } else if (baseWorkerId) {
      // URL cleared (back button etc.) — clear the stack.
      closeAllDrawers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkerId])

  // Deep-link preload backfill: on `?worker=X` refresh, the URL→stack effect
  // above runs before the workers list has loaded, so the drawer opens without
  // a preload and the hero shows a generic placeholder until detail arrives.
  // Once workers populates, attach the matching row to the base entry so the
  // hero re-renders with the rich preload. updateBasePreload is a no-op when
  // a preload is already present, so row clicks don't trigger churn here.
  useEffect(() => {
    if (!selectedWorkerId || baseWorkerId !== selectedWorkerId) return
    const found = workers.find((w) => w.id === selectedWorkerId)
    if (found) updateBasePreload(selectedWorkerId, found)
  }, [workers, selectedWorkerId, baseWorkerId, updateBasePreload])

  // Stack → URL: when the user closes the drawer via Esc / scrim / close
  // button, popDrawer clears the stack and this effect clears the URL.
  // The param is only DELETED on an open→closed transition (prev base id was
  // non-null): on a `?worker=X` deep-link mount the stack is still empty here
  // (the URL→stack effect's openDrawer state hasn't landed yet), and clearing
  // on "empty stack vs set param" would strip the param and kill the deep
  // link. A mount-skip flag isn't enough — StrictMode replays the effect with
  // the same stale closure after the flag is already set.
  const prevBaseWorkerIdRef = useRef<string | null>(null)
  useEffect(() => {
    const prevBaseWorkerId = prevBaseWorkerIdRef.current
    prevBaseWorkerIdRef.current = baseWorkerId
    const urlWorkerId = searchParams.get(PARAM_WORKER)
    if (baseWorkerId === urlWorkerId) return
    if (baseWorkerId) {
      updateParams((p) => p.set(PARAM_WORKER, baseWorkerId), { resetPage: false })
    } else if (prevBaseWorkerId) {
      updateParams((p) => p.delete(PARAM_WORKER), { resetPage: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseWorkerId])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>My Krew</h1>
            <p className={styles.subtitle}>
              {headerCount} worker{headerCount === 1 ? '' : 's'}
            </p>
          </div>
        </header>

        {/* Mobile list selector — shown when the sidebar collapses */}
        <div className={styles.mobileListBar}>
          <select
            className={styles.listDropdown}
            value={activeListId}
            onChange={(e) => selectList(e.target.value)}
            aria-label="Select a list"
            disabled={loadingLists}
          >
            <option value={ALL_KREW_SENTINEL}>All Krew ({allKrewCount})</option>
            <option value={REGULIX_READY_SENTINEL}>Regulix Ready ({regulixReadyCount ?? 0})</option>
            {krewLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.count})
              </option>
            ))}
          </select>
          <button type="button" className={styles.mobileNewListBtn} aria-label="New list">
            <PlusIcon size={15} />
          </button>
        </div>

        {/* Two-column layout */}
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav className={styles.listCard} aria-label="Krew lists">
              {/* All Krew sentinel always lives at the top */}
              <button
                type="button"
                className={[
                  styles.listItem,
                  activeListId === ALL_KREW_SENTINEL ? styles.listItemActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={activeListId === ALL_KREW_SENTINEL ? 'true' : undefined}
                onClick={() => selectList(ALL_KREW_SENTINEL)}
              >
                <span className={styles.listItemLabel}>
                  <UsersIcon size={15} />
                  All Krew
                </span>
                <span className={styles.listItemCount}>{allKrewCount}</span>
                {/* Spacer keeps the count aligned with rows that have an overflow menu */}
                <span className={styles.listOverflowSpacer} aria-hidden="true" />
              </button>
              {/* Regulix Ready virtual list — filters to regulix-ready workers */}
              <button
                type="button"
                className={[styles.listItem, isRegulixView ? styles.listItemActive : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isRegulixView ? 'true' : undefined}
                onClick={() => selectList(REGULIX_READY_SENTINEL)}
              >
                <span className={styles.listItemLabel}>
                  <span className={styles.regulixListIcon} aria-hidden="true">
                    <RegulixMarkIcon size={13} />
                  </span>
                  Regulix Ready
                </span>
                <span className={styles.listItemCount}>{regulixReadyCount ?? 0}</span>
                <span className={styles.listOverflowSpacer} aria-hidden="true" />
              </button>
              {krewLists.map((list) => {
                const isActive = list.id === activeListId
                const isRenaming = renamingListId === list.id

                if (isRenaming) {
                  return (
                    <div key={list.id} className={styles.listInlineRow}>
                      <FolderIcon size={15} />
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleSubmitRename(list.id)
                          } else if (e.key === 'Escape') {
                            handleCancelRename()
                          }
                        }}
                        className={styles.listInlineInput}
                        placeholder="List name"
                        disabled={submittingRename}
                        aria-label="Rename list"
                      />
                      <span className={styles.listInlineHint}>Enter ↵ · Esc</span>
                    </div>
                  )
                }

                return (
                  <div
                    key={list.id}
                    className={[styles.listItem, isActive ? styles.listItemActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => selectList(list.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectList(list.id)
                      }
                    }}
                  >
                    <span className={styles.listItemLabel}>
                      <FolderIcon size={15} />
                      {list.name}
                    </span>
                    <span className={styles.listItemCount}>{list.count}</span>
                    <OverflowMenu
                      buttonClassName={styles.listOverflowBtn}
                      ariaLabel={`More actions for ${list.name}`}
                      items={[
                        { label: 'Rename', onClick: () => handleStartRename(list) },
                        {
                          label: 'Delete',
                          danger: true,
                          onClick: () => setConfirmDeleteList(list),
                        },
                      ]}
                    />
                  </div>
                )
              })}
              <div className={styles.divider} />
              {creatingList ? (
                <>
                  <div className={styles.listInlineRow}>
                    <PlusIcon size={14} />
                    <input
                      autoFocus
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleSubmitCreate()
                        } else if (e.key === 'Escape') {
                          handleCancelCreate()
                        }
                      }}
                      className={styles.listInlineInput}
                      placeholder="List name"
                      disabled={submittingCreate}
                      aria-label="New list name"
                    />
                    <span className={styles.listInlineHint}>Enter ↵ · Esc</span>
                  </div>
                  {createError && <div className={styles.listInlineError}>{createError}</div>}
                </>
              ) : (
                <button type="button" className={styles.newListBtn} onClick={handleStartCreate}>
                  <PlusIcon size={14} />
                  New list
                </button>
              )}
            </nav>
          </aside>

          <main className={styles.main}>
            {/* Filter bar — always visible (matches the applicants list view) */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>
                  <SearchIcon size={14} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workers"
                  className={styles.searchInput}
                  aria-label="Search workers"
                />
              </div>
              <FilterDropdown
                label="Source"
                options={SOURCE_OPTIONS}
                selected={sources}
                onChange={setSources}
              />
              <FilterDropdown
                label="Skills"
                options={SKILL_OPTIONS}
                selected={skills}
                onChange={setSkills}
              />
              {hasActiveFilters && (
                <button type="button" className={styles.clearLink} onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Bulk action bar — sits below the filter bar when rows are selected */}
            {selected.size > 0 && (
              <div className={styles.bulkBar}>
                <span className={styles.bulkCount}>{selected.size} selected</span>
                <div className={styles.bulkActions}>
                  <button type="button" className={styles.bulkBtn}>
                    Invite to apply
                  </button>
                  <button
                    type="button"
                    className={styles.bulkBtn}
                    onClick={() => openAddToList(Array.from(selected))}
                  >
                    Add to list
                  </button>
                  {activeListId !== ALL_KREW_SENTINEL && (
                    <button
                      type="button"
                      className={styles.bulkBtn}
                      onClick={() => void handleRemoveFromList(Array.from(selected), activeListId)}
                    >
                      Remove from list
                    </button>
                  )}
                  <button type="button" className={styles.bulkBtn} onClick={handleBulkSendMessage}>
                    Send message
                  </button>
                  <button
                    type="button"
                    className={[styles.bulkBtn, styles.bulkBtnDanger].join(' ')}
                    onClick={() =>
                      openConfirmRemove(
                        Array.from(selected),
                        `${selected.size} worker${selected.size === 1 ? '' : 's'}`
                      )
                    }
                  >
                    Remove from My Krew
                  </button>
                  <button type="button" className={styles.bulkDeselect} onClick={deselectAll}>
                    Deselect all
                  </button>
                </div>
              </div>
            )}

            <div className={styles.tableCard}>
              <div className={[styles.row, styles.headerRow].join(' ')}>
                <div className={styles.checkCell}>
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all workers"
                    disabled={loadingTable || workers.length === 0}
                  />
                </div>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('worker')}
                >
                  Worker{' '}
                  <SortIndicator active={sort.column === 'worker'} direction={sort.direction} />
                </button>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('trade')}
                >
                  Trade{' '}
                  <SortIndicator active={sort.column === 'trade'} direction={sort.direction} />
                </button>
                <div className={styles.regulixHeader}>Regulix</div>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('matches')}
                >
                  Matches{' '}
                  <SortIndicator active={sort.column === 'matches'} direction={sort.direction} />
                </button>
                <button
                  type="button"
                  className={styles.sortableHeader}
                  onClick={() => handleSort('lastInteraction')}
                >
                  Last interaction{' '}
                  <SortIndicator
                    active={sort.column === 'lastInteraction'}
                    direction={sort.direction}
                  />
                </button>
                <div aria-hidden="true" />
              </div>
              {loadingTable ? (
                SKELETON_ROW_KEYS.map((k) => <SkeletonRow key={k} />)
              ) : workers.length === 0 ? (
                <div className={styles.emptyRow}>{emptyMessage}</div>
              ) : (
                workers.map((w) => {
                  const initials = `${w.firstName[0] ?? ''}${w.lastName[0] ?? ''}`.toUpperCase()
                  const lastInitial = w.lastName ? `${w.lastName[0]}.` : ''
                  const isSelected = selected.has(w.id)
                  return (
                    <div
                      key={w.id}
                      className={[styles.row, isSelected ? styles.rowSelected : '']
                        .filter(Boolean)
                        .join(' ')}
                      role="button"
                      tabIndex={0}
                      onClick={() => openWorker(w.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openWorker(w.id)
                        }
                      }}
                    >
                      <div className={styles.checkCell} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(w.id)}
                          aria-label={`Select ${w.firstName} ${lastInitial}`}
                        />
                      </div>
                      <div className={styles.workerCell}>
                        <div className={styles.avatar}>
                          {w.avatarUrl ? (
                            <img
                              src={w.avatarUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className={styles.workerText}>
                          <span className={styles.workerName}>
                            {w.firstName} {lastInitial}
                          </span>
                        </div>
                      </div>
                      <div className={styles.tradeCell}>
                        {w.trade ?? <span className={styles.dashCell}>—</span>}
                      </div>
                      <div className={styles.regulixCell}>
                        {w.isRegulixReady && (
                          <Tooltip content="Regulix Ready" position="top">
                            <span aria-label="Regulix Ready">
                              <RegulixMarkIcon size={14} />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <div>
                        {w.matchesCount > 0 ? (
                          <span className={styles.matchesBadge}>
                            <SparkleIcon size={11} />
                            {w.matchesCount}
                          </span>
                        ) : (
                          <span className={styles.dashCell}>—</span>
                        )}
                      </div>
                      <div className={styles.dateCell}>
                        {w.lastInteraction ? (
                          formatRelativeTime(w.lastInteraction)
                        ) : (
                          <span className={styles.dashCell}>—</span>
                        )}
                      </div>
                      <div className={styles.overflowCell}>
                        <OverflowMenu items={getRowOverflowItems(w)} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination footer */}
            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                {pageTotal === 0 ? '0 workers' : `${pageStart}–${pageEnd} of ${pageTotal} workers`}
              </div>
              <div className={styles.paginationRight}>
                <label className={styles.pageSizeLabel}>
                  Rows per page
                  <select
                    className={styles.pageSizeSelect}
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
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
                    onClick={() => setPage(Math.max(1, page - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {pageButtons.map((b, i) => {
                    if (b === '…') {
                      const prev = pageButtons[i - 1]
                      return (
                        <span key={`dots-after-${prev}`} className={styles.pagerEllipsis}>
                          …
                        </span>
                      )
                    }
                    return (
                      <button
                        key={b}
                        type="button"
                        className={[styles.pagerBtn, b === page ? styles.pagerBtnActive : '']
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setPage(b)}
                        aria-current={b === page ? 'page' : undefined}
                      >
                        {b}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={styles.pagerBtn}
                    disabled={page >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Delete-list confirmation */}
      <Modal
        open={confirmDeleteList !== null}
        onClose={() => setConfirmDeleteList(null)}
        size="sm"
        title={confirmDeleteList ? `Delete "${confirmDeleteList.name}"?` : 'Delete list?'}
        footer={
          <div
            style={{
              display: 'flex',
              gap: 'var(--kt-space-3)',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outline"
              size="md"
              onClick={() => setConfirmDeleteList(null)}
              disabled={submittingDelete}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={submittingDelete}
              onClick={() => {
                if (confirmDeleteList) void handleDelete(confirmDeleteList.id)
              }}
            >
              Delete list
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
          Workers in this list will stay in your Krew. This only removes the list and its grouping.
        </p>
      </Modal>

      {/* Add-to-list picker */}
      <Modal
        open={addToListWorkerIds !== null}
        onClose={closeAddToList}
        size="md"
        title={
          addToListWorkerIds
            ? `Add ${addToListWorkerIds.length} worker${addToListWorkerIds.length === 1 ? '' : 's'} to lists`
            : 'Add to lists'
        }
        footer={
          <div
            style={{
              display: 'flex',
              gap: 'var(--kt-space-3)',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outline"
              size="md"
              onClick={closeAddToList}
              disabled={submittingPicker}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submittingPicker}
              disabled={pickedListIds.size === 0 && pickerNewListName.trim().length === 0}
              onClick={() => void submitAddToList()}
            >
              Add
            </Button>
          </div>
        }
      >
        {krewLists.length === 0 ? (
          <p className={styles.pickerHelpText}>
            You don&apos;t have any lists yet. Type a name below to create one.
          </p>
        ) : (
          <p className={styles.pickerHelpText}>
            Pick one or more lists, or create a new one below.
          </p>
        )}
        {krewLists.length > 0 && (
          <div className={styles.pickerListContainer}>
            {krewLists.map((list) => (
              <label key={list.id} className={styles.pickerListOption}>
                <input
                  type="checkbox"
                  checked={pickedListIds.has(list.id)}
                  onChange={() => togglePickedList(list.id)}
                />
                <span className={styles.pickerListOptionLabel}>
                  <FolderIcon size={14} />
                  {list.name}
                </span>
                <span className={styles.pickerListOptionCount}>{list.count}</span>
              </label>
            ))}
          </div>
        )}
        <div className={styles.pickerNewListRow}>
          <PlusIcon size={14} />
          <input
            value={pickerNewListName}
            onChange={(e) => setPickerNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submitAddToList()
              }
            }}
            placeholder="Or create a new list"
            className={styles.pickerNewListInput}
            disabled={submittingPicker}
            aria-label="Create a new list"
          />
        </div>
        {pickerError && <p className={styles.pickerError}>{pickerError}</p>}
      </Modal>

      {/* Remove-from-Krew confirmation */}
      <Modal
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        size="sm"
        title={
          confirmRemove ? `Remove ${confirmRemove.label} from My Krew?` : 'Remove from My Krew?'
        }
        footer={
          <div
            style={{
              display: 'flex',
              gap: 'var(--kt-space-3)',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outline"
              size="md"
              onClick={() => setConfirmRemove(null)}
              disabled={submittingRemove}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={submittingRemove}
              onClick={() => void submitConfirmRemove()}
            >
              Remove
            </Button>
          </div>
        }
      >
        <p className={styles.confirmRemoveBody}>
          {confirmRemove && confirmRemove.workerIds.length > 1
            ? 'These workers will leave your Krew. They’ll stay in the system — you can add them back from Discover.'
            : 'This worker will leave your Krew. They’ll stay in the system — you can add them back from Discover.'}
        </p>
      </Modal>
    </div>
  )
}
