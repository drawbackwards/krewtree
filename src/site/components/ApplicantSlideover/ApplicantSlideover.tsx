import React, { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { CloseIcon, StarIcon, MessageIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { StagePicker } from '../StagePicker/StagePicker'
import { ApplicantPreviewBody } from '../ApplicantPreviewBody/ApplicantPreviewBody'
import styles from './ApplicantSlideover.module.css'

export interface ApplicantSlideoverProps {
  applicant: CompanyApplicant | null
  onClose: () => void
  onSetStage: (id: string, stage: KanbanStage) => void
  onMessage: (id: string) => void
  onShortlist: (id: string) => void
}

const IconButton: React.FC<{
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}> = ({ label, onClick, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={[styles.iconBtn, active ? styles.iconBtnActive : ''].filter(Boolean).join(' ')}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
)

export const ApplicantSlideover: React.FC<ApplicantSlideoverProps> = ({
  applicant,
  onClose,
  onSetStage,
  onMessage,
  onShortlist,
}) => {
  const open = applicant !== null

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  if (!open || !applicant) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.hero}>
          <div className={styles.actionRow}>
            <StagePicker
              stage={applicant.stage}
              onChange={(next) => onSetStage(applicant.id, next)}
            />
            <div className={styles.iconActions}>
              <IconButton label="Message" onClick={() => onMessage(applicant.id)}>
                <MessageIcon size={16} />
              </IconButton>
              <IconButton
                label={applicant.isShortlisted ? 'Remove from shortlist' : 'Shortlist'}
                onClick={() => onShortlist(applicant.id)}
                active={applicant.isShortlisted}
              >
                <StarIcon
                  size={16}
                  color={applicant.isShortlisted ? 'var(--kt-warning)' : undefined}
                />
              </IconButton>
              <IconButton label="Close" onClick={onClose}>
                <CloseIcon size={16} />
              </IconButton>
            </div>
          </div>

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
          </div>
        </div>

        <div className={styles.bodyWrap}>
          <ApplicantPreviewBody applicant={applicant} />
        </div>

        <div className={styles.footer}>
          <Link
            to={`/site/dashboard/applicants/worker/${applicant.workerId}`}
            className={styles.viewFullLink}
          >
            View full profile →
          </Link>
        </div>
      </aside>
    </div>,
    document.body
  )
}
