import React from 'react'
import { Link } from 'react-router-dom'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { StarIcon, MessageIcon, PersonIcon } from '../../icons'
import { StagePicker } from '../StagePicker/StagePicker'
import { ApplicantPreviewBody } from '../ApplicantPreviewBody/ApplicantPreviewBody'
import styles from './ApplicantDetailPane.module.css'

export interface ApplicantDetailPaneProps {
  applicant: CompanyApplicant | null
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

export const ApplicantDetailPane: React.FC<ApplicantDetailPaneProps> = ({
  applicant,
  onSetStage,
  onMessage,
  onShortlist,
}) => {
  if (!applicant) {
    return (
      <aside className={styles.pane}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <PersonIcon size={32} />
          </div>
          <p className={styles.emptyTitle}>No applicant selected</p>
          <p className={styles.emptyBody}>
            Select an applicant from the list to see their profile, match score, and history.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className={styles.pane}>
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
          </div>
        </div>

        <div className={styles.heroTop}>
          <div className={styles.avatar}>{applicant.workerInitials}</div>
          <div className={styles.identityText}>
            <h2 className={styles.fullName}>{applicant.workerFullName}</h2>
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
  )
}
