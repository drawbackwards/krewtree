import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { CompanyApplicant, ApplicationStatus } from '../../types'
import { isTerminal, TERMINAL_LABEL } from '../../types'
import { CloseIcon, StarIcon, MessageIcon, ChevronDownIcon, DotsHorizontalIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { Modal, useToast } from '../../../components'
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
  shortlistApplicant,
  getApplicantDetail,
} from '../../services/applicantService'
import {
  addWorkerToKrew,
  getKrewRelationship,
  type WorkerRelationshipSummary,
} from '../../services/krewService'
import { useAuth } from '../../context/AuthContext'
import type { ApplicationDrawerEntry } from '../DrawerSystem/DrawerStackContext'
import { KrewBadge } from '../KrewBadge/KrewBadge'
import styles from './ApplicantSlideover.module.css'

type Tab = 'summary' | 'pipeline' | 'log'

// NOTE — this component is the ApplicationDrawer of the drawer-stack spec. The
// file is named ApplicantSlideover for historical reasons; rename is a follow-up.
// It renders content only: the surrounding scrim/panel/animation lives in
// DrawerShell, which DrawerSystem wraps around this output.

export interface ApplicantSlideoverProps {
  entry: ApplicationDrawerEntry
  /** Called when the user wants to close this drawer (close button click).
   *  Wired by DrawerSystem to popDrawer. */
  onClose: () => void
  /** When provided (drawer is the top of a stacked pair), renders a "Back to
   *  [label]" affordance in the hero action row. */
  onBack?: () => void
  backLabel?: string
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
  entry,
  onClose,
  onBack,
  backLabel,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const defaultTab: Tab = entry.defaultTab ?? 'summary'
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const [hireConfirm, setHireConfirm] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [stageOptions, setStageOptions] = useState<PipelineStage[]>([])
  const [requiredIncomplete, setRequiredIncomplete] = useState(0)
  // Bootstrap from the preload (zero-flicker open), then replace with the
  // hydrated detail (skills, certs, work history) once the fetch returns.
  const [applicant, setApplicant] = useState<CompanyApplicant | null>(
    entry.preloadedApplicant ?? null
  )
  const [relationship, setRelationship] = useState<WorkerRelationshipSummary | null>(null)

  // Fetch org-level pipeline stages once per company session.
  useEffect(() => {
    if (!user?.id) return
    getPipelineStages(user.id).then(({ data }) => {
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder)
      setStageOptions(sorted)
    })
  }, [user?.id])

  // Seed the required-task gate from the current stage.
  const currentStageId = applicant?.currentStageId
  useEffect(() => {
    if (!currentStageId) {
      setRequiredIncomplete(0)
      return
    }
    let cancelled = false
    getBlockingRequiredCount(entry.applicationId, currentStageId).then((n) => {
      if (!cancelled) setRequiredIncomplete(n)
    })
    return () => {
      cancelled = true
    }
  }, [entry.applicationId, currentStageId])

  // Hydrate the full record (skills / certs / work history) for the Summary tab.
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getApplicantDetail(entry.applicationId, user.id).then(({ data }) => {
      if (!cancelled && data) setApplicant(data)
    })
    return () => {
      cancelled = true
    }
  }, [entry.applicationId, user?.id])

  // Fetch the krew relationship summary for the strip at the top of the
  // Summary tab. Light query; runs once per worker.
  const workerId = applicant?.workerId
  useEffect(() => {
    if (!workerId) return
    let cancelled = false
    getKrewRelationship(workerId).then(({ data }) => {
      if (!cancelled) setRelationship(data)
    })
    return () => {
      cancelled = true
    }
  }, [workerId])

  // Deep-link case: no preload and no hydration yet. Render a minimal frame.
  if (!applicant) {
    return (
      <>
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
            <div className={styles.iconGroup} />
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <CloseIcon size={18} />
            </button>
          </div>
          <div className={styles.heroTop}>
            <div className={styles.identityText}>
              <h2 className={styles.fullName}>Loading applicant…</h2>
            </div>
          </div>
        </div>
      </>
    )
  }

  const handleMessage = (): void => {
    navigate(`/site/messages?application=${entry.applicationId}`)
    onClose()
  }

  const handleShortlist = async (): Promise<void> => {
    // Optimistic toggle on local state.
    const prev = applicant
    setApplicant({ ...applicant, isShortlisted: !applicant.isShortlisted })
    const { error } = await shortlistApplicant(applicant.id)
    if (error) {
      setApplicant(prev)
      return
    }
    entry.onWrite?.()
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
              aria-label="Message applicant"
            >
              <MessageIcon size={16} />
            </button>
            <button
              type="button"
              className={[styles.iconBtn, applicant.isShortlisted ? styles.iconBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => void handleShortlist()}
              aria-pressed={applicant.isShortlisted}
              aria-label={applicant.isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
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
                    navigate(`/site/profile/${applicant.workerId}`)
                    onClose()
                  },
                },
                {
                  label: 'Add to My Krew',
                  onClick: async () => {
                    const { error } = await addWorkerToKrew(applicant.workerId, {
                      source: 'inbound_application',
                    })
                    if (error) {
                      toast({
                        variant: 'danger',
                        title: 'Could not add to My Krew',
                        description: error,
                      })
                    } else {
                      toast({
                        variant: 'success',
                        title: 'Added to My Krew',
                        description: `${applicant.workerFullName} is now in your Krew.`,
                      })
                    }
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
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.heroTop}>
          <div className={styles.avatar}>
            {applicant.workerAvatar ? (
              <img src={applicant.workerAvatar} alt="" />
            ) : (
              applicant.workerInitials
            )}
          </div>
          <div className={styles.identityText}>
            <div className={styles.nameRow}>
              <h2 className={styles.fullName}>
                {applicant.workerFirstName}
                {applicant.workerLastInitial ? ` ${applicant.workerLastInitial}.` : ''}
              </h2>
              {applicant.isRegulixReady && <RegulixBadge size="sm" />}
              <KrewBadge inKrew={relationship?.inKrew} />
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
                  entry.onWrite?.()
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
            <ApplicantPreviewBody applicant={applicant} />
          </div>
        )}
        {activeTab === 'pipeline' && (
          <PipelineTab
            applicant={applicant}
            stages={stageOptions}
            onRequiredCountChange={setRequiredIncomplete}
            onChanged={entry.onWrite}
          />
        )}
        {activeTab === 'log' && <LogTab applicationId={applicant.id} stages={stageOptions} />}
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
                entry.onWrite?.()
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
                entry.onWrite?.()
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
                entry.onWrite?.()
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
    </>
  )
}

// ── StagePillControl ────────────────────────────────────────────────────────

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
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen((v) => !v)
  }

  function pick(stageId: string): void {
    setOpen(false)
    if (stageId !== applicant.currentStageId) onMoveTo(stageId)
  }

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

type OverflowItem = { label: string; danger?: boolean; onClick: () => void } | { divider: true }

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
