import React from 'react'
import { Link } from 'react-router-dom'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { StarIcon, MessageIcon, PersonIcon, RegulixMarkIcon } from '../../icons'
import { KrewtreeMark } from '../Logo'
import { StagePicker } from '../StagePicker/StagePicker'
import styles from './ApplicantDetailPane.module.css'

export interface ApplicantDetailPaneProps {
  applicant: CompanyApplicant | null
  onSetStage: (id: string, stage: KanbanStage) => void
  onMessage: (id: string) => void
  onShortlist: (id: string) => void
}

function formatNoteTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Icon button ───────────────────────────────────────────────────────────────

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

// ── Detail pane ───────────────────────────────────────────────────────────────

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
      {/* Hero — actions top-right, identity below */}
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

      {/* Scrolling body — flat sections, no card chrome */}
      <div className={styles.body}>
        {/* Match score */}
        <section className={styles.section}>
          <div className={styles.matchRow}>
            <h3 className={styles.sectionHeading}>Match score</h3>
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
          </div>
        </section>

        {/* Skills strip — mirrors profile page */}
        {applicant.workerTopSkills.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Top skills</h3>
            <div className={styles.skillsStrip}>
              {applicant.workerTopSkills.map((skill) => (
                <span key={skill} className={styles.skillPill}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Work experience */}
        {applicant.workerJobHistory.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Work experience</h3>
            <div className={styles.timeline}>
              {applicant.workerJobHistory.slice(0, 3).map((job, i, arr) => {
                const isLast = i === arr.length - 1
                return (
                  <div key={`${job.employer}-${i}`} className={styles.timelineRow}>
                    <div className={styles.timelineMarker}>
                      <div className={styles.timelineDot} />
                      {!isLast && <div className={styles.timelineLine} />}
                    </div>
                    <div className={styles.timelineContent}>
                      <p className={styles.jobTitle}>{job.title}</p>
                      <p className={styles.jobMeta}>
                        {job.employer} · {job.duration}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Certifications */}
        {applicant.workerCertifications.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Certifications</h3>
            <ul className={styles.certList}>
              {applicant.workerCertifications.map((c) => (
                <li key={c.name} className={styles.certItem}>
                  <div className={styles.certText}>
                    <p className={styles.certName}>{c.name}</p>
                    <p className={styles.certIssuer}>{c.issuer}</p>
                  </div>
                  {c.expiresOn && <span className={styles.certMeta}>Expires {c.expiresOn}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Ratings — krewtree + Regulix side by side */}
        {(applicant.workerRating !== null || applicant.workerRegulixRating !== null) && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Ratings</h3>
            <div className={styles.ratingsGrid}>
              <div className={styles.ratingCell}>
                <div className={styles.ratingLabel}>
                  <KrewtreeMark size={14} />
                  <span>krewtree</span>
                </div>
                <span className={styles.ratingValue}>
                  {applicant.workerRating !== null ? applicant.workerRating.toFixed(1) : '—'}
                </span>
                <span className={styles.ratingMeta}>
                  {applicant.workerRatingCount} job{applicant.workerRatingCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className={styles.ratingCell}>
                <div className={styles.ratingLabel}>
                  <RegulixMarkIcon size={12} />
                  <span>Regulix</span>
                </div>
                <span className={styles.ratingValue}>
                  {applicant.workerRegulixRating !== null
                    ? applicant.workerRegulixRating.toFixed(1)
                    : '—'}
                </span>
                <span className={styles.ratingMeta}>
                  {applicant.workerRegulixRatingCount} job
                  {applicant.workerRegulixRatingCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Pre-apply answers */}
        {applicant.preInterviewAnswers && applicant.preInterviewAnswers.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Pre-apply answers</h3>
            <ul className={styles.qaList}>
              {applicant.preInterviewAnswers.map((qa, i) => (
                <li key={i} className={styles.qaItem}>
                  <p className={styles.qaQuestion}>{qa.question}</p>
                  <p className={styles.qaAnswer}>{qa.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notes */}
        {applicant.notes.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>Notes</h3>
            <ul className={styles.notesList}>
              {applicant.notes.map((n, i) => (
                <li key={i} className={styles.note}>
                  <p className={styles.noteText}>{n.text}</p>
                  <p className={styles.noteCaption}>
                    {n.authorName} · {formatNoteTime(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Footer link */}
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
