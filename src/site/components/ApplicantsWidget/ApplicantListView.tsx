import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Modal, Tooltip } from '../../../components'
import type { CompanyApplicant } from '../../types'
import { advanceApplicant, rejectApplicant, hireApplicant } from '../../services/applicantService'
import {
  DotsHorizontalIcon,
  FlagFilledIcon,
  HourglassFilledIcon,
  RegulixMarkIcon,
  RocketIcon,
  StarIcon,
} from '../../icons'
import { JobCell } from './cells/JobCell'
import { StageCell } from './cells/StageCell'
import styles from './ApplicantListView.module.css'

function flagTooltip(labels: string[]): string {
  if (labels.length === 0) return 'Flagged for follow-up'
  if (labels.length === 1) {
    const label = labels[0]
    const truncated = label.length > 50 ? `${label.slice(0, 50)}…` : label
    return `Flagged: "${truncated}"`
  }
  return `${labels.length} flagged tasks`
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatAppliedDate(iso: string): string {
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
  onShortlist: (a: CompanyApplicant) => void
  onRefresh: () => void
}

// ── Avatar ─────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ url: string; initials: string }> = ({ url, initials }) => (
  <div className={styles.avatar}>
    {url ? <img src={url} alt="" className={styles.avatarImg} /> : initials.slice(0, 2)}
  </div>
)

// ── Overflow menu ──────────────────────────────────────────────────────────

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
        type="button"
        className={styles.overflowBtn}
        onClick={handleToggle}
        aria-label="More actions"
      >
        <DotsHorizontalIcon size={14} />
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
                type="button"
                className={[styles.overflowItem, item.danger ? styles.danger : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
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

// ── Main component ─────────────────────────────────────────────────────────

export const ApplicantListView: React.FC<Props> = ({
  applicants,
  total,
  loading,
  hasJobs,
  onOpenApplicant,
  onShortlist,
  onRefresh,
}) => {
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null)
  const [actionPending, setActionPending] = useState(false)

  const handleAdvance = useCallback(
    async (a: CompanyApplicant) => {
      await advanceApplicant(a.id, a.currentStageId)
      onRefresh()
    },
    [onRefresh]
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
          <span className={styles.headerCell}>Applied</span>
          <span className={styles.headerCell} aria-hidden="true" />

          <span className={`${styles.headerCell} ${styles.rightAlign}`}>
            {total > applicants.length ? `${applicants.length} of ${total}` : ''}
          </span>
        </div>

        {/* Rows */}
        {applicants.map((a) => (
          <div
            key={a.id}
            className={`${styles.row} ${a.isBoosted ? styles.boosted : ''}`}
            role="row"
          >
            {/* Applicant */}
            <div
              className={styles.applicantCell}
              role="button"
              tabIndex={0}
              onClick={() => onOpenApplicant(a)}
              onKeyDown={(e) => e.key === 'Enter' && onOpenApplicant(a)}
            >
              <Avatar url={a.workerAvatar} initials={a.workerInitials} />
              <div className={styles.applicantText}>
                <span className={styles.applicantName}>
                  {a.workerFirstName} {a.workerLastInitial}.
                </span>
                {a.workerPrimaryTrade && (
                  <span className={styles.applicantTrade}>{a.workerPrimaryTrade}</span>
                )}
              </div>
            </div>

            {/* Job */}
            <JobCell jobId={a.jobId} jobTitle={a.jobTitle} jobStatus={a.jobStatus} />

            {/* Stage */}
            <StageCell stageName={a.currentStageName} status={a.status} />

            {/* Applied date */}
            <div className={styles.appliedCell}>{formatAppliedDate(a.appliedAt)}</div>

            {/* Signals */}
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
                    aria-label={a.slaState === 'breached' ? 'SLA breached' : 'SLA approaching'}
                  >
                    <HourglassFilledIcon size={11} />
                  </span>
                </Tooltip>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actionsCell}>
              <button type="button" className={styles.viewBtn} onClick={() => onOpenApplicant(a)}>
                View
              </button>
              <OverflowMenu
                items={[
                  { label: 'Open profile', onClick: () => onOpenApplicant(a) },
                  { label: 'Advance stage', onClick: () => handleAdvance(a) },
                  {
                    label: a.isShortlisted ? 'Unshortlist' : 'Shortlist',
                    onClick: () => onShortlist(a),
                  },
                  {
                    label: 'Reject',
                    danger: true,
                    onClick: () => setConfirm({ type: 'reject', applicant: a }),
                  },
                  {
                    label: 'Mark hired',
                    danger: true,
                    onClick: () => setConfirm({ type: 'hire', applicant: a }),
                  },
                ]}
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
