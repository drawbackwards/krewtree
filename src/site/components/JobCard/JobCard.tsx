import React, { useRef, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../../types'
import {
  LocationIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  LightningIcon,
  StarIcon,
  DollarIcon,
  CheckIcon,
} from '../../icons'
import styles from './JobCard.module.css'

const formatPay = (job: Job): string | null => {
  if (!job.payMin || !job.payMax || (job.payMin === 0 && job.payMax === 0)) return null
  if (job.payType === 'hour') {
    return `${job.payMin}–${job.payMax}/hr`
  }
  return `${(job.payMin / 1000).toFixed(0)}k–${(job.payMax / 1000).toFixed(0)}k/yr`
}

const postedLabel = (days: number) => {
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
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
  applied?: boolean
  onQuickApply?: () => void
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  compact = false,
  applied = false,
  onQuickApply,
}) => {
  const navigate = useNavigate()

  // Measure how many skill pills fit fully — never show a partially clipped pill
  const skillsRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = skillsRef.current
    if (!container || compact || job.skills.length === 0) {
      setVisibleCount(null)
      return
    }

    const containerWidth = container.clientWidth
    const BADGE_RESERVE = 42 // approx px width of "+N" badge

    // We always render all pills (with overflow:hidden) so we can measure their positions.
    // Force a measurement against all data-skill-tag nodes currently in the DOM.
    const tags = container.querySelectorAll<HTMLElement>('[data-skill-tag]')

    // First pass: check if any pill overflows at all
    let anyOverflow = false
    tags.forEach((tag) => {
      if (tag.offsetLeft + tag.offsetWidth > containerWidth) anyOverflow = true
    })

    if (!anyOverflow) {
      setVisibleCount(job.skills.length)
      return
    }

    // Second pass: count pills that fit completely once we reserve badge space
    let count = 0
    tags.forEach((tag) => {
      if (tag.offsetLeft + tag.offsetWidth <= containerWidth - BADGE_RESERVE) count++
    })
    setVisibleCount(count)
  }, [job.skills, compact])

  const companyInitials = job.company.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const payLabel = formatPay(job)
  const hasFooter = (!compact && job.skills.length > 0) || !!onQuickApply

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
            {payLabel && (
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>
                  <DollarIcon size={13} />
                </span>
                {payLabel}
              </span>
            )}
            {job.experienceLevel && EXPERIENCE_LABELS[job.experienceLevel] && (
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>
                  <StarIcon size={13} />
                </span>
                {EXPERIENCE_LABELS[job.experienceLevel]}
              </span>
            )}
          </div>
        </div>
        <span className={styles.postedDate}>{postedLabel(job.postedDaysAgo)}</span>
      </div>

      {job.description && <p className={styles.description}>{job.description}</p>}

      {hasFooter && (
        <div className={styles.footer}>
          {!compact && job.skills.length > 0 ? (
            <div ref={skillsRef} className={styles.skills}>
              {(visibleCount === null ? job.skills : job.skills.slice(0, visibleCount)).map((s) => (
                <span key={s} data-skill-tag="" className={styles.skillTag}>
                  {s}
                </span>
              ))}
              {visibleCount !== null && visibleCount < job.skills.length && (
                <span className={styles.skillMore}>+{job.skills.length - visibleCount}</span>
              )}
            </div>
          ) : (
            <span />
          )}
          {onQuickApply && (
            <button
              className={[styles.quickApplyBtn, applied ? styles.appliedBtn : '']
                .filter(Boolean)
                .join(' ')}
              disabled={applied}
              onClick={(e) => {
                e.stopPropagation()
                if (!applied) onQuickApply()
              }}
            >
              {applied ? (
                <>
                  <CheckIcon size={14} />
                  Applied!
                </>
              ) : (
                <>
                  <LightningIcon size={14} />
                  Quick Apply
                </>
              )}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
