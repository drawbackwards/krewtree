import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { CompanyApplicant, ApplicationStatus } from '../../types'
import { isTerminal, TERMINAL_LABEL } from '../../types'
import { CloseIcon, StarIcon, MessageIcon, ChevronDownIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { Modal } from '../../../components'
import { ApplicantPreviewBody } from '../ApplicantPreviewBody/ApplicantPreviewBody'
import { PipelineTab } from './PipelineTab'
import { LogTab } from './LogTab'
import { getPipelineStages, type PipelineStage } from '../../services/pipelineService'
import {
  setApplicantStage,
  rejectApplicant,
  hireApplicant,
  archiveApplicant,
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
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const [hireConfirm, setHireConfirm] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [stageOptions, setStageOptions] = useState<PipelineStage[]>([])

  // Fetch org-level pipeline stages once per company session.
  useEffect(() => {
    if (!user?.id) return
    getPipelineStages(user.id).then(({ data }) => {
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder)
      setStageOptions(sorted)
    })
  }, [user?.id])

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

  const handleAdvance = async (nextStageId: string) => {
    await setApplicantStage(applicant.id, nextStageId)
    onChanged?.()
  }

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
        <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
          {/* ── Identity header ──────────────────────────────────────────── */}
          <div className={styles.hero}>
            <div className={styles.heroTop}>
              <div className={styles.avatar}>{applicant.workerInitials}</div>
              <div className={styles.identityText}>
                <div className={styles.nameRow}>
                  <h2 className={styles.fullName}>{applicant.workerFullName}</h2>
                  {applicant.isRegulixReady && <RegulixBadge size="sm" />}
                </div>
                {applicant.workerPrimaryTrade && (
                  <p className={styles.trade}>{applicant.workerPrimaryTrade}</p>
                )}
                <p className={styles.jobRef}>
                  Applied for <strong>{applicant.jobTitle}</strong>
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>

          {/* ── Persistent action bar ────────────────────────────────────── */}
          <div className={styles.actionBar}>
            <StageActionMenu
              applicant={applicant}
              stages={stageOptions}
              onMoveTo={async (stageId) => {
                await setApplicantStage(applicant.id, stageId)
                onChanged?.()
              }}
              onHire={onHire ? () => setHireConfirm(true) : undefined}
              onReject={onReject ? () => setRejectConfirm(true) : undefined}
              onArchive={() => setArchiveConfirm(true)}
            />
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => onMessage(applicant.id)}
            >
              <MessageIcon size={14} />
              Message
            </button>
            <button
              type="button"
              className={[styles.actionBtn, applicant.isShortlisted ? styles.actionBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onShortlist(applicant.id)}
              aria-pressed={applicant.isShortlisted}
            >
              <StarIcon
                size={14}
                color={applicant.isShortlisted ? 'var(--kt-warning)' : undefined}
              />
              {applicant.isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </button>
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
                <div className={styles.summaryFooter}>
                  <Link
                    to={`/site/dashboard/applicants/worker/${applicant.workerId}`}
                    className={styles.viewFullLink}
                  >
                    View full profile →
                  </Link>
                </div>
              </div>
            )}
            {activeTab === 'pipeline' && (
              <PipelineTab applicant={applicant} stages={stageOptions} onAdvance={handleAdvance} />
            )}
            {activeTab === 'log' && <LogTab applicationId={applicant.id} />}
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

// ── StageActionMenu ──────────────────────────────────────────────────────────

interface StageActionMenuProps {
  applicant: CompanyApplicant
  stages: PipelineStage[]
  onMoveTo: (stageId: string) => void
  onHire?: () => void
  onReject?: () => void
  onArchive: () => void
}

const StageActionMenu: React.FC<StageActionMenuProps> = ({
  applicant,
  stages,
  onMoveTo,
  onHire,
  onReject,
  onArchive,
}) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
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
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen((v) => !v)
  }

  function pick(stageId: string) {
    setOpen(false)
    if (stageId !== applicant.currentStageId) onMoveTo(stageId)
  }

  const statusIsTerminal = isTerminal(applicant.status)
  const currentLabel = statusIsTerminal
    ? TERMINAL_LABEL[applicant.status as ApplicationStatus]
    : applicant.currentStageName

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.actionBtnPrimary}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>{currentLabel}</span>
        <ChevronDownIcon size={12} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.stageMenu}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className={styles.stageMenuSection}>Move to</div>
            {stages.map((s) => {
              const isCurrent = s.id === applicant.currentStageId
              return (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  disabled={isCurrent}
                  className={[styles.stageMenuItem, isCurrent ? styles.stageMenuItemCurrent : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pick(s.id)}
                >
                  <span>{s.name}</span>
                  {isCurrent && <span className={styles.stageMenuCurrentLabel}>Current</span>}
                </button>
              )
            })}

            {!statusIsTerminal && (onHire || onReject) && (
              <>
                <div className={styles.stageMenuDivider} />
                <div className={styles.stageMenuSection}>Close out</div>
                {onHire && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.stageMenuItem}
                    onClick={() => {
                      setOpen(false)
                      onHire()
                    }}
                  >
                    Mark hired
                  </button>
                )}
                {onReject && (
                  <button
                    type="button"
                    role="menuitem"
                    className={[styles.stageMenuItem, styles.stageMenuItemDanger].join(' ')}
                    onClick={() => {
                      setOpen(false)
                      onReject()
                    }}
                  >
                    Reject
                  </button>
                )}
              </>
            )}

            <div className={styles.stageMenuDivider} />
            <button
              type="button"
              role="menuitem"
              className={styles.stageMenuItem}
              onClick={() => {
                setOpen(false)
                onArchive()
              }}
            >
              Archive
            </button>
          </div>,
          document.body
        )}
    </>
  )
}
