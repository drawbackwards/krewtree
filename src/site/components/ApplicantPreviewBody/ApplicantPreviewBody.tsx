import React from 'react'
import type { CompanyApplicant } from '../../types'
import { InfoCircleIcon, RegulixMarkIcon } from '../../icons'
import { FEATURES } from '../../config/features'
import { Tooltip } from '../../../components'
import { KrewtreeMark } from '../Logo'
import styles from './ApplicantPreviewBody.module.css'

export interface ApplicantPreviewBodyProps {
  applicant: CompanyApplicant
}

export const ApplicantPreviewBody: React.FC<ApplicantPreviewBodyProps> = ({ applicant }) => {
  const hasRatings =
    applicant.workerRating !== null || (FEATURES.regulix && applicant.workerRegulixRating !== null)

  return (
    <div className={styles.body}>
      {/* Match score */}
      <section className={styles.section}>
        <div className={styles.matchRow}>
          <h3 className={styles.sectionHeading}>Match score</h3>
          <div className={styles.matchValue}>
            <span className={styles.matchPct}>{applicant.matchScore}%</span>
            <Tooltip
              position="bottom-end"
              content={
                <span className={styles.matchTooltip}>
                  <span className={styles.matchTooltipRow}>
                    <span>Skills</span>
                    <span>{applicant.matchBreakdown.skills}%</span>
                  </span>
                  <span className={styles.matchTooltipRow}>
                    <span>Location</span>
                    <span>{applicant.matchBreakdown.location}%</span>
                  </span>
                  <span className={styles.matchTooltipRow}>
                    <span>Availability</span>
                    <span>{applicant.matchBreakdown.availability}%</span>
                  </span>
                </span>
              }
            >
              <button
                type="button"
                className={styles.matchInfoBtn}
                aria-label="Match score breakdown"
              >
                <InfoCircleIcon size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Top skills */}
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

      {/* Pre-apply answers — application questions the company asked */}
      {applicant.preInterviewAnswers && applicant.preInterviewAnswers.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>Pre-apply answers</h3>
          <ul className={styles.qaList}>
            {applicant.preInterviewAnswers.map((qa, i) => (
              <li key={i} className={styles.qaItem}>
                <p className={styles.qaQuestion}>{qa.question}</p>
                <p
                  className={[styles.qaAnswer, qa.answer.trim() ? '' : styles.qaAnswerEmpty]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {qa.answer.trim() || 'No answer'}
                </p>
              </li>
            ))}
          </ul>
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
                    {job.isCurrent && <p className={styles.currentRoleLabel}>Currently at</p>}
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

      {/* References */}
      {applicant.workerReferences.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>References</h3>
          <ul className={styles.certList}>
            {applicant.workerReferences.map((r) => (
              <li key={r.id} className={styles.certItem}>
                <div className={styles.certText}>
                  <p className={styles.certName}>{r.name}</p>
                  <p className={styles.certIssuer}>{r.company}</p>
                </div>
                {(r.phone || r.email) && (
                  <span className={styles.certMeta}>{r.phone ?? r.email}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ratings */}
      {hasRatings && (
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
            {FEATURES.regulix && (
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
            )}
          </div>
        </section>
      )}
    </div>
  )
}
