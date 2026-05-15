import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../../components'
import { BookmarkFilledIcon, DotsHorizontalIcon } from '../icons'
import { useAuth } from '../context/AuthContext'
import {
  getDashboardSavedJobs,
  removeSavedJob,
  type DashboardSavedJob,
} from '../services/workerService'
import { daysSince } from '../utils/date'
import styles from './SavedJobsPage.module.css'

type StalenessFilter = 'All' | DashboardSavedJob['staleness']

const FILTER_LABELS: Record<DashboardSavedJob['staleness'], string> = {
  open: 'Active',
  expiring_soon: 'Expiring soon',
  closed: 'Closed',
}

const FILTERS: StalenessFilter[] = ['All', 'open', 'expiring_soon', 'closed']

function fmtSaved(iso: string): string {
  const d = daysSince(iso)
  if (d === 0) return 'Today'
  return `${d}d ago`
}

function fmtPosted(iso: string | null): string {
  if (!iso) return '—'
  const d = daysSince(iso)
  if (d === 0) return 'Today'
  return `${d}d ago`
}

// ── Overflow menu ────────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export const SavedJobsPage: React.FC = () => {
  const { user } = useAuth()
  const [savedJobs, setSavedJobs] = useState<DashboardSavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<StalenessFilter>('All')

  useEffect(() => {
    if (!user) return
    getDashboardSavedJobs(user.id).then(({ data }) => {
      setSavedJobs(data)
      setLoading(false)
    })
  }, [user])

  const filtered =
    activeFilter === 'All' ? savedJobs : savedJobs.filter((s) => s.staleness === activeFilter)

  const handleRemove = async (id: string) => {
    setSavedJobs((prev) => prev.filter((s) => s.id !== id))
    await removeSavedJob(id)
  }

  const filterCounts = savedJobs.reduce<Partial<Record<StalenessFilter, number>>>(
    (acc, s) => ({ ...acc, [s.staleness]: (acc[s.staleness] ?? 0) + 1 }),
    {}
  )

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Saved jobs</h1>
            <p className={styles.subtitle}>
              {loading
                ? '—'
                : `${savedJobs.length} saved position${savedJobs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link to="/site/jobs">
            <Button variant="primary" size="sm">
              Browse more jobs
            </Button>
          </Link>
        </header>

        {/* Filter pills */}
        {!loading && savedJobs.length > 0 && (
          <div className={styles.statusTabs}>
            {FILTERS.map((f) => {
              const n = f === 'All' ? savedJobs.length : (filterCounts[f] ?? 0)
              const active = activeFilter === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={[styles.statusTab, active ? styles.statusTabActive : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {f === 'All' ? 'All' : FILTER_LABELS[f]}
                  <span className={styles.statusTabCount}>{n}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Table */}
        <div className={styles.tableCard}>
          {/* Header row */}
          {!loading && savedJobs.length > 0 && (
            <div className={[styles.row, styles.headerRow].join(' ')}>
              <div>Job</div>
              <div>Status</div>
              <div>Posted</div>
              <div>Saved</div>
              <div />
            </div>
          )}

          {/* Loading */}
          {loading && <div className={styles.emptyRow}>Loading…</div>}

          {/* Empty — no saved jobs at all */}
          {!loading && savedJobs.length === 0 && (
            <div className={styles.emptyRow}>
              <div style={{ marginBottom: 12, color: 'var(--kt-text-muted)' }}>
                <BookmarkFilledIcon size={36} />
              </div>
              No saved jobs yet.{' '}
              <Link to="/site/jobs" className={styles.emptyLink}>
                Browse jobs →
              </Link>
            </div>
          )}

          {/* Empty — filter has no matches */}
          {!loading && savedJobs.length > 0 && filtered.length === 0 && (
            <div className={styles.emptyRow}>
              No{' '}
              {activeFilter === 'All'
                ? ''
                : FILTER_LABELS[activeFilter as DashboardSavedJob['staleness']].toLowerCase() + ' '}
              saved jobs.{' '}
              <button
                type="button"
                className={styles.emptyLink}
                onClick={() => setActiveFilter('All')}
              >
                Show all →
              </button>
            </div>
          )}

          {/* Data rows */}
          {filtered.map((sj) => {
            const isClosed = sj.staleness === 'closed'
            const isExpiring = sj.staleness === 'expiring_soon'

            return (
              <div
                key={sj.id}
                className={[styles.row, isClosed ? styles.rowClosed : ''].filter(Boolean).join(' ')}
              >
                <div className={styles.jobTitleCell}>
                  {isClosed ? (
                    <span className={styles.jobTitleStruck}>{sj.jobTitle}</span>
                  ) : (
                    <Link to={`/site/jobs/${sj.jobId}`} className={styles.jobTitleLink}>
                      {sj.jobTitle}
                    </Link>
                  )}
                  <span className={styles.companyName}>{sj.companyName}</span>
                </div>

                <div>
                  {!isExpiring && !isClosed && (
                    <Badge variant="secondary" size="sm">
                      Active
                    </Badge>
                  )}
                  {isExpiring && (
                    <Badge variant="warning" size="sm">
                      Expiring soon
                    </Badge>
                  )}
                  {isClosed && (
                    <Badge variant="secondary" size="sm">
                      Closed
                    </Badge>
                  )}
                </div>

                <div className={styles.metaCell}>{fmtPosted(sj.jobPostedAt)}</div>

                <div className={styles.metaCell}>{fmtSaved(sj.savedAt)}</div>

                <div className={styles.actionsCell}>
                  {!isClosed && (
                    <Link to={`/site/jobs/${sj.jobId}`} className={styles.primaryAction}>
                      View job
                    </Link>
                  )}
                  <OverflowMenu
                    items={[
                      {
                        label: 'Remove bookmark',
                        danger: true,
                        onClick: () => handleRemove(sj.id),
                      },
                    ]}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
