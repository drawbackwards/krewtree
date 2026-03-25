import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../../types'
import { LocationIcon, ClockIcon, ShieldCheckIcon, BriefcaseIcon } from '../../icons'
import styles from './JobCard.module.css'

const formatPay = (job: Job) => {
  if (job.payType === 'hour') {
    return `$${job.payMin}–$${job.payMax}/hr`
  }
  return `$${(job.payMin / 1000).toFixed(0)}k–$${(job.payMax / 1000).toFixed(0)}k/yr`
}

const postedLabel = (days: number) => {
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

interface JobCardProps {
  job: Job
  compact?: boolean
}

export const JobCard: React.FC<JobCardProps> = ({ job, compact = false }) => {
  const navigate = useNavigate()
  const companyInitials = job.company.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <LocationIcon size={13} />
          </span>
          {job.location}
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <ClockIcon size={13} />
          </span>
          {postedLabel(job.postedDaysAgo)}
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <BriefcaseIcon size={13} />
          </span>
          {job.type}
        </span>
      </div>

      {!compact && (
        <div className={styles.skills}>
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className={styles.skillTag}>
              {s}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.pay}>{formatPay(job)}</span>
      </div>
    </article>
  )
}
