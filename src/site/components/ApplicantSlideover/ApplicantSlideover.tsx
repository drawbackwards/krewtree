import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { CompanyApplicant, ApplicationStatus } from '../../types'
import { isTerminal, TERMINAL_LABEL } from '../../types'
import { CloseIcon, StarIcon, MessageIcon, ChevronDownIcon, DotsHorizontalIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { Modal } from '../../../components'
import { ApplicantPreviewBody } from '../ApplicantPreviewBody/ApplicantPreviewBody'
import { PipelineTab } from './PipelineTab'
import { LogTab } from './LogTab'
import {
  getPipelineStages,
  getBlockingRequiredCount,
  type PipelineStage,
} from '../../services/pipelineService'
import {
  setApplicantStage,
  rejectApplicant,
  hireApplicant,
  archiveApplicant,
  getApplicantDetail,
} from '../../services/applicantService'
import { useAuth } from '../../context/AuthContext'
import styles from './ApplicantSlideover.module.css'

type Tab = 'summary' | 'pipeline' | 'log'

export interface ApplicantSlideoverProps {
  applicant: CompanyApplicant | null
  onClose: () => void
  onMessage: (id: string) => void
  onShortlist: (id: string) => void
  onReject?: (applicant: CompanyApplicant) => void
  onHire?: (applicant: CompanyApplicant) => void
  onChanged?: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatAppliedShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimeInStage(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return ''
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${Math.max(mins, 1)}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  const remDays = days % 7
  return remDays > 0 ? `${weeks}w ${remDays}d` : `${weeks}w`
}

export const ApplicantSlideover: React.FC<ApplicantSlideoverProps> = ({
  applicant,
  onClose,
  onMessage,
  onShortlist,
  onReject,
  onHire,
  onChanged,
}) => {
  const open = applicant !== null
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const [hireConfirm, setHireConfirm] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [stageOptions, setStageOptions] = useState<PipelineStage[]>([])
  // Count of incomplete required tasks in the applicant's current stage. Gates
  // forward stage moves in the StagePillControl. Seeded from a fetch on open,
  // then kept live by PipelineTab as the user completes/skips tasks.
  const [requiredIncomplete, setRequiredIncomplete] = useState(0)
  // The list/kanban widgets load a lightweight applicant (no skills, certs, or
  // work history). Fetch the full record on open so the summary tab can render
  // those sections; falls back to the lightweight prop until it arrives.
  const [detail, setDetail] = useState<CompanyApplicant | null>(null)

  // Fetch org-level pipeline stages once per company session.
  useEffect(() => {
    if (!user?.id) return
    getPipelineStages(user.id).then(({ data }) => {
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder)
      setStageOptions(sorted)
    })
  }, [user?.id])

  // Seed the required-task gate whenever a different applicant or stage opens.
  const applicantId = applicant?.id
  const currentStageId = applicant?.currentStageId
  useEffect(() => {
    if (!applicantId || !currentStageId) {
      setRequiredIncomplete(0)
      return
    }
    let cancelled = false
    getBlockingRequiredCount(applicantId, currentStageId).then((n) => {
      if (!cancelled) setRequiredIncomplete(n)
    })
    return () => {
      cancelled = true
    }
  }, [applicantId, currentStageId])

  // Hydrate the full applicant (skills, certs, work history) for the summary tab.
  useEffect(() => {
    if (!applicantId || !user?.id) {
      setDetail(null)
      return
    }
    let cancelled = false
    getApplicantDetail(applicantId, user.id).then(({ data }) => {
      if (!cancelled) setDetail(data)
    })
    return () => {
      cancelled = true
    }
  }, [applicantId, user?.id])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) {
      setActiveTab('summary')
      return
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  if (!open || !applicant) return null

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
        <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
          {/* ── Identity header ──────────────────────────────────────────── */}
          <div className={styles.hero}>
            <div className={styles.heroActions}>
              <div className={styles.iconGroup}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onMessage(applicant.id)}
                  aria-label="Message applicant"
                >
                  <MessageIcon size={16} />
                </button>
                <button
                  type="button"
                  className={[styles.iconBtn, applicant.isShortlisted ? styles.iconBtnActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onShortlist(applicant.id)}
                  aria-pressed={applicant.isShortlisted}
                  aria-label={
                    applicant.isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'
                  }
                >
                  <StarIcon
                    size={16}
                    color={applicant.isShortlisted ? 'var(--kt-warning)' : undefined}
                  />
                </button>
                <OverflowMenu
                  items={[
                    {
                      label: 'Open full profile',
                      onClick: () => {
                        navigate(`/site/dashboard/applicants/worker/${applicant.workerId}`)
                        onClose()
                      },
                    },
                    ...(isTerminal(applicant.status)
                      ? []
                      : [{ label: 'Mark hired', onClick: () => setHireConfirm(true) }]),
                    {
                      label: 'Archive',
                      onClick: () => setArchiveConfirm(true),
                    },
                    { divider: true },
                    ...(isTerminal(applicant.status)
                      ? []
                      : [
                          {
                            label: 'Reject',
                            danger: true,
                            onClick: () => setRejectConfirm(true),
                          },
                        ]),
                  ]}
                />
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className={styles.heroTop}>
              <div className={styles.avatar}>{applicant.workerInitials}</div>
              <div className={styles.identityText}>
                <div className={styles.nameRow}>
                  <h2 className={styles.fullName}>{applicant.workerFullName}</h2>
                  {applicant.isRegulixReady && <RegulixBadge size="sm" />}
                </div>
                <p className={styles.jobRef}>
                  Applied for <strong>{applicant.jobTitle}</strong>
                  {' · '}
                  {formatAppliedShort(applicant.appliedAt)}
                </p>
                <div className={styles.stageRow}>
                  <span className={styles.stageRowLabel}>Stage</span>
                  <StagePillControl
                    applicant={applicant}
                    stages={stageOptions}
                    requiredIncomplete={requiredIncomplete}
                    onMoveTo={async (stageId) => {
                      await setApplicantStage(applicant.id, stageId)
                      onChanged?.()
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Tab strip ────────────────────────────────────────────────── */}
          <div className={styles.tabStrip} role="tablist">
            {(['summary', 'pipeline', 'log'] as Tab[]).map((tab) => (
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
              </button>
            ))}
          </div>

          {/* ── Tab content ──────────────────────────────────────────────── */}
          <div className={styles.tabContent}>
            {activeTab === 'summary' && (
              <div className={styles.summaryScroll}>
                <ApplicantPreviewBody
                  applicant={detail && detail.id === applicant.id ? detail : applicant}
                />
              </div>
            )}
            {activeTab === 'pipeline' && (
              <PipelineTab
                applicant={applicant}
                stages={stageOptions}
                onRequiredCountChange={setRequiredIncomplete}
                onChanged={onChanged}
              />
            )}
            {activeTab === 'log' && <LogTab applicationId={applicant.id} stages={stageOptions} />}
          </div>
        </aside>
      </div>

      {/* Reject confirmation */}
      <Modal
        open={rejectConfirm}
        onClose={() => setRejectConfirm(false)}
        size="sm"
        title="Reject applicant"
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              className={styles.modalBtnSecondary}
              onClick={() => setRejectConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.modalBtnDanger}
              onClick={async () => {
                setRejectConfirm(false)
                await rejectApplicant(applicant.id)
                onReject?.(applicant)
                onChanged?.()
                onClose()
              }}
            >
              Reject
            </button>
          </div>
        }
      >
        <p className={styles.modalBody}>
          This will send{' '}
          <strong>
            {applicant.workerFirstName} {applicant.workerLastInitial}.
          </strong>{' '}
          a rejection notification. This can't be undone. Proceed?
        </p>
      </Modal>

      {/* Mark hired confirmation */}
      <Modal
        open={hireConfirm}
        onClose={() => setHireConfirm(false)}
        size="sm"
        title="Mark as hired"
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              className={styles.modalBtnSecondary}
              onClick={() => setHireConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.modalBtnPrimary}
              onClick={async () => {
                setHireConfirm(false)
                await hireApplicant(applicant.id)
                onHire?.(applicant)
                onChanged?.()
                onClose()
              }}
            >
              Confirm hire
            </button>
          </div>
        }
      >
        <p className={styles.modalBody}>
          This will notify{' '}
          <strong>
            {applicant.workerFirstName} {applicant.workerLastInitial}.
          </strong>{' '}
          they've been hired and archive this applicant from the active board. Proceed?
        </p>
      </Modal>

      <Modal
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        title="Archive this applicant?"
        footer={
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalBtnSecondary}
              onClick={() => setArchiveConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.modalBtnPrimary}
              onClick={async () => {
                setArchiveConfirm(false)
                await archiveApplicant(applicant.id)
                onChanged?.()
                onClose()
              }}
            >
              Archive
            </button>
          </div>
        }
      >
        <p className={styles.modalBody}>
          Archiving moves this applicant off the active board. You can find them again with the
          Archived filter. Proceed?
        </p>
      </Modal>
    </>,
    document.body
  )
}

// ── StagePillControl ────────────────────────────────────────────────────────
//
// The application-control surface: shows current stage + time-in-stage, and
// opens a dropdown of pipeline stages plus terminal actions (Reject / Mark
// hired). This is the *only* stage-advancement control in the drawer.

interface StagePillControlProps {
  applicant: CompanyApplicant
  stages: PipelineStage[]
  requiredIncomplete: number
  onMoveTo: (stageId: string) => void
}

const StagePillControl: React.FC<StagePillControlProps> = ({
  applicant,
  stages,
  requiredIncomplete,
  onMoveTo,
}) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen((v) => !v)
  }

  function pick(stageId: string) {
    setOpen(false)
    if (stageId !== applicant.currentStageId) onMoveTo(stageId)
  }

  // Forward stages are locked while the current stage has incomplete required
  // tasks. Backward moves stay open so a mis-step can always be corrected.
  const currentStage = stages.find((s) => s.id === applicant.currentStageId)
  const gateForward = requiredIncomplete > 0

  const statusIsTerminal = isTerminal(applicant.status)
  const currentLabel = statusIsTerminal
    ? TERMINAL_LABEL[applicant.status as ApplicationStatus]
    : applicant.currentStageName
  const variantClass = !statusIsTerminal
    ? ''
    : applicant.status === 'terminal_hired'
      ? styles.stagePillHired
      : styles.stagePillNeutral
  const timeInStage = statusIsTerminal ? '' : formatTimeInStage(applicant.stageEnteredAt)

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={[styles.stagePill, variantClass].filter(Boolean).join(' ')}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>{currentLabel}</span>
        {timeInStage && <span className={styles.stageTime}>· {timeInStage}</span>}
        <ChevronDownIcon size={12} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.stageMenu}
            role="menu"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          >
            <div className={styles.stageMenuSection}>Move to stage</div>
            {stages.map((s) => {
              const isCurrent = s.id === applicant.currentStageId
              const isForward = currentStage ? s.sortOrder > currentStage.sortOrder : false
              const locked = isForward && gateForward
              return (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  className={[styles.stageMenuItem, locked ? styles.stageMenuItemLocked : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => !locked && pick(s.id)}
                  disabled={locked}
                  aria-current={isCurrent || undefined}
                  title={locked ? 'Complete required tasks in the current stage first' : undefined}
                >
                  <span
                    className={[
                      styles.menuStageDot,
                      isCurrent ? styles.menuStageDotFilled : styles.menuStageDotOutline,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                  <span>{s.name}</span>
                </button>
              )
            })}

            {gateForward && (
              <p className={styles.stageMenuHint}>
                Complete required tasks to unlock later stages.
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  )
}

// ── OverflowMenu ───────────────────────────────────────────────────────────
//
// Auxiliary actions only. Stage-change actions live in the StagePillControl.

type OverflowItem = { label: string; danger?: boolean; onClick: () => void } | { divider: true }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  function toggle() {
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
            {items.map((item, i) => {
              if ('divider' in item) {
                return <div key={`d-${i}`} className={styles.overflowDivider} />
              }
              return (
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
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
