import React, { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { CompanyApplicant } from '../../types'
import { CloseIcon, StarIcon, CheckCircleIcon, ClockIcon, MessageIcon } from '../../icons'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { StagePill } from '../StagePill/StagePill'
import styles from './ApplicantSlideover.module.css'

export interface ApplicantSlideoverProps {
  applicant: CompanyApplicant | null
  onClose: () => void
  onAdvance: (id: string) => void
  onReject: (id: string) => void
  onMessage: (id: string) => void
  onShortlist: (id: string) => void
}

const AVAILABILITY_LABEL: Record<CompanyApplicant['workerAvailability'], string> = {
  available: 'Available',
  limited: 'Limited availability',
  unavailable: 'Not available',
}

const AVAILABILITY_CLASS: Record<CompanyApplicant['workerAvailability'], string> = {
  available: styles.availAvailable,
  limited: styles.availLimited,
  unavailable: styles.availUnavailable,
}

export const ApplicantSlideover: React.FC<ApplicantSlideoverProps> = ({
  applicant,
  onClose,
  onAdvance,
  onReject,
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

  const canAdvance = applicant.stage !== 'hired' && applicant.stage !== 'rejected'
  const canReject = applicant.stage !== 'rejected'

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <StagePill stage={applicant.stage} />
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close applicant details"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Identity */}
        <div className={styles.identity}>
          <div className={styles.avatar}>{applicant.workerInitials}</div>
          <div className={styles.identityText}>
            <div className={styles.nameRow}>
              <h2 className={styles.fullName}>{applicant.workerFullName}</h2>
              {applicant.isRegulixReady && <RegulixBadge size="sm" />}
            </div>
            <p className={styles.trade}>{applicant.workerPrimaryTrade}</p>
            <p className={styles.jobRef}>
              Applied for <strong>{applicant.jobTitle}</strong>
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className={styles.quickActions}>
          {canAdvance && (
            <button
              type="button"
              className={[styles.actionBtn, styles.primary].join(' ')}
              onClick={() => onAdvance(applicant.id)}
            >
              <CheckCircleIcon size={14} /> Advance stage
            </button>
          )}
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onMessage(applicant.id)}
          >
            <MessageIcon size={14} /> Message
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onShortlist(applicant.id)}
          >
            <StarIcon size={14} /> {applicant.isShortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
          {canReject && (
            <button
              type="button"
              className={[styles.actionBtn, styles.danger].join(' ')}
              onClick={() => onReject(applicant.id)}
            >
              Reject
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className={styles.body}>
          {/* Match score */}
          <section className={styles.section}>
            <div className={styles.matchRow}>
              <span className={styles.sectionLabel}>Match score</span>
              <span className={styles.matchPct}>{applicant.matchScore}%</span>
            </div>
            <div className={styles.breakdown}>
              <div className={styles.breakdownRow}>
                <span>Skills</span>
                <span>{applicant.matchBreakdown.skills}%</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Location</span>
                <span>{applicant.matchBreakdown.location}%</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Availability</span>
                <span>{applicant.matchBreakdown.availability}%</span>
              </div>
            </div>
          </section>

          {/* Availability */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>Availability</span>
            <div
              className={[
                styles.availability,
                AVAILABILITY_CLASS[applicant.workerAvailability],
              ].join(' ')}
            >
              <ClockIcon size={12} /> {AVAILABILITY_LABEL[applicant.workerAvailability]}
            </div>
          </section>

          {/* Top skills */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>Top skills</span>
            <div className={styles.skillTags}>
              {applicant.workerTopSkills.map((skill) => (
                <span key={skill} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Certifications */}
          {applicant.workerCertifications.length > 0 && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Certifications</span>
              <ul className={styles.list}>
                {applicant.workerCertifications.map((c) => (
                  <li key={c.name} className={styles.listItem}>
                    <strong>{c.name}</strong>
                    <span className={styles.listMeta}>
                      {c.issuer}
                      {c.expiresOn ? ` · expires ${c.expiresOn}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Work history */}
          {applicant.workerJobHistory.length > 0 && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Recent work history</span>
              <ul className={styles.list}>
                {applicant.workerJobHistory.slice(0, 3).map((j, i) => (
                  <li key={`${j.employer}-${i}`} className={styles.listItem}>
                    <strong>{j.title}</strong>
                    <span className={styles.listMeta}>
                      {j.employer} · {j.duration}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Ratings */}
          {applicant.workerRating !== null && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Ratings</span>
              <div className={styles.ratingRow}>
                <StarIcon size={14} color="var(--kt-rating)" />
                <span className={styles.ratingValue}>{applicant.workerRating.toFixed(1)}</span>
                <span className={styles.ratingMeta}>
                  across {applicant.workerRatingCount} jobs on Krewtree
                </span>
              </div>
            </section>
          )}

          {/* Notes */}
          {applicant.notes.length > 0 && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Notes</span>
              <ul className={styles.list}>
                {applicant.notes.map((n, i) => (
                  <li key={i} className={styles.note}>
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer link */}
        <div className={styles.footer}>
          <Link
            to={`/site/profile/${applicant.workerId}`}
            target="_blank"
            rel="noreferrer"
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
