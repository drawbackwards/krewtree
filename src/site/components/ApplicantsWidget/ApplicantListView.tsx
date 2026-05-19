import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../../../components'
import type { CompanyApplicant } from '../../types'
import {
  advanceApplicantStage,
  rejectApplicant,
  hireApplicant,
} from '../../services/applicantService'
import { DotsHorizontalIcon, RegulixMarkIcon } from '../../icons'
import styles from './ApplicantListView.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return diffMin <= 1 ? '1m ago' : `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD}d ago`
  const diffW = Math.floor(diffD / 7)
  if (diffW < 8) return `${diffW}w ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Types ─────────────────────────────────────────────────────────────────

type ConfirmModal = { type: 'reject' | 'hire'; applicant: CompanyApplicant }

type Props = {
  applicants: CompanyApplicant[]
  total: number
  loading: boolean
  hasJobs: boolean
  onOpenApplicant: (a: CompanyApplicant) => void
  onRefresh: () => void
}

// ── Avatar ─────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ url: string; initials: string }> = ({ url, initials }) => (
  <div className={styles.avatar}>
    {url ? <img src={url} alt="" className={styles.avatarImg} /> : initials.slice(0, 2)}
  </div>
)

// ── Overflow menu ──────────────────────────────────────────────────────────

type OverflowMenuProps = {
  open: boolean
  onToggle: () => void
  onAdvance: () => void
  onReject: () => void
  onHire: () => void
  onOpen: () => void
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({
  open,
  onToggle,
  onAdvance,
  onReject,
  onHire,
  onOpen,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onToggle])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={styles.overflowBtn}
        onClick={onToggle}
        aria-label="More actions"
      >
        <DotsHorizontalIcon size={14} />
      </button>
      {open && (
        <div className={styles.overflowDropdown}>
          <button type="button" className={styles.overflowItem} onClick={onAdvance}>
            Advance stage
          </button>
          <button type="button" className={styles.overflowItem} onClick={onOpen}>
            Open profile
          </button>
          <button
            type="button"
            className={`${styles.overflowItem} ${styles.danger}`}
            onClick={onReject}
          >
            Reject
          </button>
          <button
            type="button"
            className={`${styles.overflowItem} ${styles.danger}`}
            onClick={onHire}
          >
            Mark hired
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export const ApplicantListView: React.FC<Props> = ({
  applicants,
  total,
  loading,
  hasJobs,
  onOpenApplicant,
  onRefresh,
}) => {
  const [openOverflowId, setOpenOverflowId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null)
  const [actionPending, setActionPending] = useState(false)

  const closeOverflow = useCallback(() => setOpenOverflowId(null), [])

  const handleAdvance = useCallback(
    async (a: CompanyApplicant) => {
      closeOverflow()
      await advanceApplicantStage(a.id)
      onRefresh()
    },
    [closeOverflow, onRefresh]
  )

  const handleConfirmAction = useCallback(async () => {
    if (!confirm) return
    setActionPending(true)
    if (confirm.type === 'reject') {
      await rejectApplicant(confirm.applicant.id)
    } else {
      await hireApplicant(confirm.applicant.id)
    }
    setActionPending(false)
    setConfirm(null)
    onRefresh()
  }, [confirm, onRefresh])

  if (loading) {
    return <div className={styles.loadingRow}>Loading…</div>
  }

  if (applicants.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No applicants yet.</p>
        {hasJobs ? (
          <Link to="/site/jobs" className={styles.emptyLink}>
            Share your job posts →
          </Link>
        ) : (
          <Link to="/site/post-job" className={styles.emptyLink}>
            Post your first job →
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={styles.table} role="table">
        {/* Header */}
        <div className={styles.header} role="row">
          <span className={styles.headerCell}>Applicant</span>
          <span className={styles.headerCell}>Job</span>
          <span className={styles.headerCell}>Stage</span>
          <span className={`${styles.headerCell} ${styles.centerAlign}`}>Reg.</span>
          <span className={styles.headerCell}>Activity</span>
          <span className={`${styles.headerCell} ${styles.rightAlign}`}>
            {total > applicants.length ? `${applicants.length} of ${total}` : ''}
          </span>
        </div>

        {/* Rows */}
        {applicants.map((a) => (
          <div key={a.id} className={styles.row} role="row">
            {/* Applicant */}
            <div
              className={styles.applicantCell}
              role="button"
              tabIndex={0}
              onClick={() => onOpenApplicant(a)}
              onKeyDown={(e) => e.key === 'Enter' && onOpenApplicant(a)}
            >
              <Avatar url={a.workerAvatar} initials={a.workerInitials} />
              <span className={styles.applicantName}>
                {a.workerFirstName} {a.workerLastInitial}.
              </span>
            </div>

            {/* Job */}
            <div className={styles.jobCell}>
              <span className={styles.jobTitle}>{a.jobTitle}</span>
              {a.jobStatus === 'paused' && <span className={styles.pausedPill}>Paused</span>}
            </div>

            {/* Stage */}
            <div className={styles.stageCell}>{a.currentStageName}</div>

            {/* Regulix Ready */}
            <div className={styles.regulixCell}>
              {a.isRegulixReady && <RegulixMarkIcon size={16} />}
            </div>

            {/* Last activity */}
            <div className={styles.activityCell}>{relativeTime(a.stageEnteredAt)}</div>

            {/* Actions */}
            <div className={styles.actionsCell}>
              <button type="button" className={styles.viewBtn} onClick={() => onOpenApplicant(a)}>
                View
              </button>
              <OverflowMenu
                open={openOverflowId === a.id}
                onToggle={() => setOpenOverflowId((prev) => (prev === a.id ? null : a.id))}
                onAdvance={() => handleAdvance(a)}
                onReject={() => {
                  closeOverflow()
                  setConfirm({ type: 'reject', applicant: a })
                }}
                onHire={() => {
                  closeOverflow()
                  setConfirm({ type: 'hire', applicant: a })
                }}
                onOpen={() => {
                  closeOverflow()
                  onOpenApplicant(a)
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Confirm modals */}
      {confirm?.type === 'reject' && (
        <Modal open title="Reject applicant" onClose={() => setConfirm(null)}>
          <p className={styles.confirmBody}>
            Reject {confirm.applicant.workerFirstName} {confirm.applicant.workerLastInitial}. for{' '}
            <strong>{confirm.applicant.jobTitle}</strong>? This will remove them from your active
            pipeline.
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.confirmCancel} onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDanger}
              onClick={handleConfirmAction}
              disabled={actionPending}
            >
              {actionPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </Modal>
      )}
      {confirm?.type === 'hire' && (
        <Modal open title="Mark as hired" onClose={() => setConfirm(null)}>
          <p className={styles.confirmBody}>
            Mark {confirm.applicant.workerFirstName} {confirm.applicant.workerLastInitial}. as hired
            for <strong>{confirm.applicant.jobTitle}</strong>?
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.confirmCancel} onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDanger}
              onClick={handleConfirmAction}
              disabled={actionPending}
            >
              {actionPending ? 'Marking…' : 'Mark hired'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
