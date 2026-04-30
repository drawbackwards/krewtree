import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Badge, Modal, Button } from '../../components'
import { DotsHorizontalIcon, RocketIcon } from '../icons'
import { useAuth } from '../context/AuthContext'
import {
  getDashboardApplications,
  withdrawApplication,
  type DashboardApplication,
} from '../services/workerService'
import { daysSince } from '../utils/date'
import styles from './ApplicationsPage.module.css'

type Stage = DashboardApplication['stage'] | 'All'

type StageCfg = { variant: 'secondary' | 'info' | 'warning' | 'success'; label: string }

const STAGE_CFG: Record<DashboardApplication['stage'], StageCfg> = {
  Applied: { variant: 'secondary', label: 'Applied' },
  Reviewed: { variant: 'info', label: 'Reviewed' },
  Interview: { variant: 'warning', label: 'Interview' },
  Offer: { variant: 'success', label: 'Offer' },
  Closed: { variant: 'secondary', label: 'Closed' },
}

const STAGE_FILTERS: Stage[] = ['All', 'Applied', 'Reviewed', 'Interview', 'Offer', 'Closed']

const WITHDRAW_REASONS = [
  'Accepted another offer',
  'Applied by mistake',
  'Position no longer a good fit',
  'Not available for the dates/schedule',
  'Other',
]

function fmtApplied(iso: string): string {
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

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<DashboardApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<Stage>('All')

  // Boost modal
  const [boostAppId, setBoostAppId] = useState<string | null>(null)
  const [boostSuccess, setBoostSuccess] = useState(false)
  const [boostedAppIds, setBoostedAppIds] = useState<Set<string>>(new Set())

  // Withdraw modal
  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [withdrawMessage, setWithdrawMessage] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (!user) return
    getDashboardApplications(user.id, 100).then(({ data }) => {
      setApplications(data)
      setLoading(false)
    })
  }, [user])

  const filtered =
    activeFilter === 'All' ? applications : applications.filter((a) => a.stage === activeFilter)

  const handleBoostClose = () => {
    if (boostSuccess && boostAppId) {
      setBoostedAppIds((prev) => new Set([...prev, boostAppId]))
    }
    setBoostAppId(null)
    setBoostSuccess(false)
  }

  const handleWithdrawOpen = (appId: string) => {
    setWithdrawAppId(appId)
    setWithdrawReason('')
    setWithdrawMessage('')
  }

  const handleWithdrawConfirm = async () => {
    if (!withdrawAppId || !withdrawReason) return
    setWithdrawing(true)
    const { error } = await withdrawApplication(withdrawAppId, withdrawReason, withdrawMessage)
    setWithdrawing(false)
    if (!error) {
      setApplications((prev) => prev.filter((a) => a.id !== withdrawAppId))
      setWithdrawAppId(null)
    }
  }

  const boostingApp = boostAppId ? applications.find((a) => a.id === boostAppId) : null

  // Stage counts for filter pills
  const stageCounts = applications.reduce<Partial<Record<Stage, number>>>(
    (acc, a) => ({ ...acc, [a.stage]: (acc[a.stage] ?? 0) + 1 }),
    {}
  )

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>My applications</h1>
        </header>

        {/* Stage filter pills */}
        <div className={styles.statusTabs}>
          {STAGE_FILTERS.map((stage) => {
            const n = stage === 'All' ? applications.length : (stageCounts[stage] ?? 0)
            const active = activeFilter === stage
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveFilter(stage)}
                className={[styles.statusTab, active ? styles.statusTabActive : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {stage}
                <span className={styles.statusTabCount}>{n}</span>
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          {/* Header row */}
          <div className={[styles.row, styles.headerRow].join(' ')}>
            <div>Job title</div>
            <div>Stage</div>
            <div>Location</div>
            <div>Applied</div>
            <div className={styles.alignCenter}>Boost</div>
            <div />
          </div>

          {/* Loading / empty */}
          {loading && <div className={styles.emptyRow}>Loading…</div>}

          {!loading && filtered.length === 0 && (
            <div className={styles.emptyRow}>
              {applications.length === 0 ? (
                <>
                  No applications yet.{' '}
                  <Link to="/site/jobs" className={styles.emptyLink}>
                    Browse jobs →
                  </Link>
                </>
              ) : (
                <>
                  No {activeFilter.toLowerCase()} applications.{' '}
                  <button
                    type="button"
                    className={styles.emptyLink}
                    onClick={() => setActiveFilter('All')}
                  >
                    Show all →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Data rows */}
          {filtered.map((app) => {
            const cfg = STAGE_CFG[app.stage]
            const isBoosted = app.isBoosted || boostedAppIds.has(app.id)
            const canAction = app.stage !== 'Offer' && app.stage !== 'Closed'

            const overflowItems: OverflowItem[] = []
            if (canAction) {
              if (!isBoosted) {
                overflowItems.push({
                  label: 'Boost — $9.99',
                  onClick: () => {
                    setBoostAppId(app.id)
                    setBoostSuccess(false)
                  },
                })
              }
              overflowItems.push({
                label: 'Withdraw',
                danger: true,
                onClick: () => handleWithdrawOpen(app.id),
              })
            }

            return (
              <div
                key={app.id}
                className={[styles.row, app.stage === 'Closed' ? styles.rowClosed : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.jobTitleCell}>
                  <Link to={`/site/jobs/${app.jobId}`} className={styles.jobTitleLink}>
                    {app.jobTitle}
                  </Link>
                  <span className={styles.companyName}>{app.companyName}</span>
                </div>

                <div>
                  <Badge variant={cfg.variant} size="sm">
                    {cfg.label}
                  </Badge>
                </div>

                <div className={styles.locationCell}>{app.companyLocation || '—'}</div>

                <div className={styles.appliedCell}>{fmtApplied(app.appliedAt)}</div>

                <div className={styles.alignCenter}>
                  {isBoosted ? <RocketIcon size={13} color="var(--kt-olive-600)" /> : null}
                </div>

                <div className={styles.actionsCell}>
                  <Link to={`/site/jobs/${app.jobId}`} className={styles.primaryAction}>
                    View job
                  </Link>
                  {overflowItems.length > 0 && <OverflowMenu items={overflowItems} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Boost modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!boostAppId}
        onClose={handleBoostClose}
        title={boostSuccess ? 'Application boosted!' : 'Boost your application'}
      >
        {boostSuccess ? (
          <div style={{ padding: '8px 0 16px' }}>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                marginBottom: 20,
              }}
            >
              Your application for <strong>{boostingApp?.jobTitle}</strong> has been moved to the
              top of the applicant list.
            </p>
            <Button variant="primary" size="sm" onClick={handleBoostClose}>
              Done
            </Button>
          </div>
        ) : (
          <div style={{ padding: '8px 0 16px' }}>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Boost your application for <strong>{boostingApp?.jobTitle}</strong> to the top of the
              applicant list for <strong>$9.99</strong>. Your application will be highlighted and
              reviewed first.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={() => setBoostSuccess(true)}>
                Boost — $9.99
              </Button>
              <Button variant="outline" size="sm" onClick={handleBoostClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Withdraw modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!withdrawAppId}
        onClose={() => setWithdrawAppId(null)}
        title="Withdraw application"
      >
        <div style={{ padding: '8px 0 16px' }}>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              marginBottom: 16,
            }}
          >
            Why are you withdrawing?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {WITHDRAW_REASONS.map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="withdraw-reason"
                  value={r}
                  checked={withdrawReason === r}
                  onChange={() => setWithdrawReason(r)}
                />
                {r}
              </label>
            ))}
          </div>
          {withdrawReason === 'Other' && (
            <textarea
              placeholder="Optional note"
              value={withdrawMessage}
              onChange={(e) => setWithdrawMessage(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                fontFamily: 'var(--kt-font-sans)',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                background: 'var(--kt-bg)',
                resize: 'vertical',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button
              variant="danger"
              size="sm"
              disabled={!withdrawReason || withdrawing}
              onClick={handleWithdrawConfirm}
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWithdrawAppId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
