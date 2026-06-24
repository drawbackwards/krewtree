import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { WorkerDrawerEntry } from '../DrawerSystem/DrawerStackContext'
import { CloseIcon, MessageIcon, DotsHorizontalIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { KrewBadge } from '../KrewBadge/KrewBadge'
import {
  getWorkerDrawerBootstrap,
  type WorkerDrawerBootstrap,
  type WorkerHistoryCard,
  type WorkerJobMatch,
  type WorkerNote,
} from '../../services/krewService'
import { useChatPane } from '../ChatPane/ChatPaneContext'
import { WorkerSummaryTab } from './WorkerSummaryTab'
import { WorkerMatchesTab } from './WorkerMatchesTab'
import { WorkerHistoryTab } from './WorkerHistoryTab'
import { WorkerNotesTab } from './WorkerNotesTab'
import styles from './WorkerDrawer.module.css'

type Tab = 'summary' | 'matches' | 'history' | 'notes'

export interface WorkerDrawerProps {
  entry: WorkerDrawerEntry
  onClose: () => void
  onBack?: () => void
  backLabel?: string
}

export const WorkerDrawer: React.FC<WorkerDrawerProps> = ({
  entry,
  onClose,
  onBack,
  backLabel,
}) => {
  const navigate = useNavigate()
  const { openChat } = useChatPane()
  const defaultTab: Tab = entry.defaultTab ?? 'summary'
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [bootstrap, setBootstrap] = useState<WorkerDrawerBootstrap | null>(null)

  // Single round-trip fans out detail + matches + history + notes in parallel.
  // Tabs render from this state — none of them refetch on activation.
  useEffect(() => {
    let cancelled = false
    setBootstrap(null)
    getWorkerDrawerBootstrap(entry.workerId).then(({ data }) => {
      if (!cancelled) setBootstrap(data)
    })
    return () => {
      cancelled = true
    }
  }, [entry.workerId])

  const detail = bootstrap?.detail ?? null
  const matches: WorkerJobMatch[] = bootstrap?.matches ?? []
  const history: WorkerHistoryCard[] = bootstrap?.history ?? []
  const initialNotes: WorkerNote[] = bootstrap?.notes ?? []

  // Notes count is owned locally so adding a note can bump it without forcing a
  // refetch through bootstrap. Initialized to null until bootstrap returns, then
  // mirrored from `notes.length` and incremented on writes.
  const [notesCount, setNotesCount] = useState<number | null>(null)
  useEffect(() => {
    if (bootstrap) setNotesCount(bootstrap.notes.length)
  }, [bootstrap])

  const matchesCount: number | null = bootstrap ? matches.length : null
  const historyCount: number | null = bootstrap ? history.length : null

  // Bootstrap display fields from the preload so the hero renders immediately;
  // hydrate from `detail` once it arrives.
  const preload = entry.preloadedWorker
  const firstName = detail?.firstName ?? preload?.firstName ?? ''
  const lastName = detail?.lastName ?? preload?.lastName ?? ''
  const trade = detail?.primaryTrade ?? preload?.trade ?? ''
  const avatarUrl = detail?.avatarUrl ?? preload?.avatarUrl ?? null
  const isRegulixReady = detail?.isRegulixReady ?? preload?.isRegulixReady ?? false
  const inKrew = detail?.relationship?.inKrew ?? preload?.inKrew ?? false

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const lastInitial = lastName ? `${lastName[0]}.` : ''
  const namePart = `${firstName}${lastInitial ? ' ' + lastInitial : ''}`.trim()
  const displayName = namePart || trade || 'Worker'

  // Direct messages don't require an application — open the docked chat
  // pane for this worker. Close the drawer so the pane isn't buried under
  // it; no navigation happens, so onClose() can't race the URL sync here.
  const handleMessage = (): void => {
    if (!bootstrap) return
    openChat({
      workerId: entry.workerId,
      name: `${firstName} ${lastName}`.trim() || displayName,
      avatarUrl,
    })
    onClose()
  }

  return (
    <>
      {/* ── Identity header ──────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroActions}>
          {onBack && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBack}
              aria-label={backLabel ? `Back to ${backLabel}` : 'Back'}
            >
              <span className={styles.backArrow} aria-hidden="true">
                ←
              </span>
              <span className={styles.backLabel}>
                {backLabel ? `Back to ${backLabel}` : 'Back'}
              </span>
            </button>
          )}
          <div className={styles.iconGroup}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleMessage}
              disabled={!bootstrap}
              aria-label="Message worker"
            >
              <MessageIcon size={16} />
            </button>
            <OverflowMenu
              items={[
                {
                  label: 'Open full profile',
                  onClick: () => {
                    // Same as handleMessage: route change closes the drawer.
                    navigate(`/site/profile/${entry.workerId}`)
                  },
                },
              ]}
            />
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close worker drawer"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.heroTop}>
          <div className={styles.avatar}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials || '?'}
          </div>
          <div className={styles.identityText}>
            <div className={styles.nameRow}>
              <h2 className={styles.fullName}>{displayName}</h2>
              {isRegulixReady && <RegulixBadge size="sm" />}
              <KrewBadge inKrew={inKrew} />
            </div>
            {trade && (
              <p className={styles.subLine}>
                <strong>{trade}</strong>
                {detail?.location ? ` · ${detail.location}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab strip ────────────────────────────────────────────────── */}
      <div className={styles.tabStrip} role="tablist">
        {(['summary', 'matches', 'history', 'notes'] as Tab[]).map((tab) => {
          const count =
            tab === 'matches'
              ? matchesCount
              : tab === 'history'
                ? historyCount
                : tab === 'notes'
                  ? notesCount
                  : null
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={[styles.tab, activeTab === tab ? styles.tabActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {count !== null && <span className={styles.tabBadge}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <div className={styles.tabContent}>
        {activeTab === 'summary' && (
          <div className={styles.tabScroll}>
            {detail ? (
              <WorkerSummaryTab worker={detail} />
            ) : (
              <p className={styles.placeholder}>Loading…</p>
            )}
          </div>
        )}
        {activeTab === 'matches' && <WorkerMatchesTab matches={matches} loading={!bootstrap} />}
        {activeTab === 'history' && (
          <WorkerHistoryTab
            cards={history}
            loading={!bootstrap}
            worker={detail}
            onWrite={entry.onWrite}
          />
        )}
        {activeTab === 'notes' && (
          <WorkerNotesTab
            workerId={entry.workerId}
            initialNotes={initialNotes}
            loading={!bootstrap}
            onWrite={() => {
              entry.onWrite?.()
              setNotesCount((c) => (c == null ? c : c + 1))
            }}
          />
        )}
      </div>
    </>
  )
}

// ── OverflowMenu (mirrors ApplicantSlideover's overflow visually) ──────────

type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent): void => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  function toggle(): void {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.iconBtn}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
      >
        <DotsHorizontalIcon size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            role="menu"
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={[styles.overflowItem, item.danger ? styles.overflowItemDanger : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
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
