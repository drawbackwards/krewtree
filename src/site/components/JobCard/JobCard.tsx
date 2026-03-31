import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../../types'
import { LocationIcon, ShieldCheckIcon, BriefcaseIcon, LightningIcon, StarIcon } from '../../icons'
import styles from './JobCard.module.css'

const formatPay = (job: Job): string | null => {
  if (!job.payMin || !job.payMax || (job.payMin === 0 && job.payMax === 0)) return null
  if (job.payType === 'hour') {
    return `$${job.payMin}–$${job.payMax}/hr`
  }
  return `$${(job.payMin / 1000).toFixed(0)}k–$${(job.payMax / 1000).toFixed(0)}k/yr`
}

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead / Expert',
}

interface JobCardProps {
  job: Job
  compact?: boolean
  onQuickApply?: () => void
}

export const JobCard: React.FC<JobCardProps> = ({ job, compact = false, onQuickApply }) => {
  const navigate = useNavigate()
  const companyInitials = job.company.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const payLabel = formatPay(job)

  return (
    <article
      className={[styles.card, job.isSponsored ? styles.sponsored : ''].filter(Boolean).join(' ')}
      onClick={() => navigate(`/site/jobs/${job.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/site/jobs/${job.id}`)}
      aria-label={`${job.title} at ${job.company.name}`}
    >
      {job.isSponsored && <span className={styles.sponsoredBanner}>{job.industry}</span>}

      <div className={styles.header}>
        <div className={styles.companyLogo}>{companyInitials}</div>
        <div className={styles.headerText}>
          <p className={styles.jobTitle}>{job.title}</p>
          <span className={styles.companyName}>
            {job.company.name}
            {job.company.isVerified && (
              <span className={styles.verifiedIcon} title="Verified Company">
                <ShieldCheckIcon size={13} color="var(--kt-navy-500)" />
              </span>
            )}
          </span>
        </div>
      </div>

      {!compact && job.skills.length > 0 && (
        <div className={styles.skills}>
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className={styles.skillTag}>
              {s}
            </span>
          ))}
        </div>
      )}

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <LocationIcon size={13} />
          </span>
          {job.location}
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <BriefcaseIcon size={13} />
          </span>
          {job.type}
        </span>
        {job.experienceLevel && EXPERIENCE_LABELS[job.experienceLevel] && (
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <StarIcon size={13} />
            </span>
            {EXPERIENCE_LABELS[job.experienceLevel]}
          </span>
        )}
      </div>

      <div className={styles.footer}>
        {payLabel ? <span className={styles.pay}>{payLabel}</span> : <span />}
        {onQuickApply && (
          <button
            className={styles.quickApplyBtn}
            onClick={(e) => {
              e.stopPropagation()
              onQuickApply()
            }}
          >
            <LightningIcon size={14} />
            Quick Apply
          </button>
        )}
      </div>
    </article>
  )
}
