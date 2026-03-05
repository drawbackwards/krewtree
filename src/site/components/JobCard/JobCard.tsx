import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components'
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
const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M12 1.5l9 3.375v7.5c0 5.25-3.75 10.125-9 11.625C6.75 22.5 3 17.625 3 12.375v-7.5L12 1.5zm4.28 7.72a.75.75 0 00-1.06-1.06L10.5 12.88 8.78 11.16a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z"
      clipRule="evenodd"
    />
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

const typeColorMap: Record<string, 'primary' | 'accent' | 'info' | 'neutral' | 'warning'> = {
  'Full-time': 'primary',
  'Part-time': 'info',
  Contract: 'warning',
  Temporary: 'neutral',
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
      {job.isSponsored && <span className={styles.sponsoredBanner}>Featured</span>}

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
        <Badge variant={typeColorMap[job.type] ?? 'neutral'} size="sm">
          {job.type}
        </Badge>
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
        <Badge variant="neutral" size="sm">
          {job.industry}
        </Badge>
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
        <span className={styles.pay}>
          {formatPay(job)}
          {job.payType === 'hour' && <span className={styles.payUnit}> / hr</span>}
        </span>
        <div className={styles.footerRight}>
          {job.regulixReadyApplicants > 0 && (
            <span className={styles.regulixCount}>
              <ShieldIcon />
              {job.regulixReadyApplicants} Regulix Ready
            </span>
          )}
          <span className={styles.applicants}>{job.totalApplicants} applicants</span>
        </div>
      </div>
    </article>
  )
}
