import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../../types'
import styles from './JobCard.module.css'

const LocationIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const ClockIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)
const VerifiedIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#1d5669" aria-label="Verified">
    <path
      fillRule="evenodd"
      d="M12 1.5l9 3.375v7.5c0 5.25-3.75 10.125-9 11.625C6.75 22.5 3 17.625 3 12.375v-7.5L12 1.5zm4.28 7.72a.75.75 0 00-1.06-1.06L10.5 12.88 8.78 11.16a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z"
      clipRule="evenodd"
    />
  </svg>
)
const BriefcaseIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
)

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
                <VerifiedIcon />
              </span>
            )}
          </span>
        </div>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <LocationIcon />
          </span>
          {job.location}
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <ClockIcon />
          </span>
          {postedLabel(job.postedDaysAgo)}
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <BriefcaseIcon />
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
