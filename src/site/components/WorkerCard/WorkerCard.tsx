import React from 'react'
import { Button } from '../../../components'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import type { Worker } from '../../types'
import styles from './WorkerCard.module.css'

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={styles.starIcon}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)
const LocationIcon = () => (
  <svg
    width="11"
    height="11"
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

interface WorkerCardProps {
  worker: Worker
  showActions?: boolean
  onViewProfile?: () => void
  onMessage?: () => void
  onFavorite?: () => void
  appliedJobTitle?: string
  appliedDaysAgo?: number
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  showActions = true,
  onViewProfile,
  onMessage,
  onFavorite,
  appliedJobTitle,
  appliedDaysAgo,
}) => {
  return (
    <div className={styles.card} onClick={onViewProfile}>
      <div className={styles.avatar}>
        {worker.initials}
        {worker.isPremium && <span className={styles.premiumRing} title="Premium Worker" />}
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{worker.name}</span>
          {worker.isRegulixReady && <RegulixBadge size="sm" />}
        </div>

        <p className={styles.headline}>{worker.headline}</p>

        {appliedJobTitle && (
          <p
            style={{
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-text-muted)',
              marginBottom: 8,
            }}
          >
            Applied for <strong>{appliedJobTitle}</strong>
            {appliedDaysAgo !== undefined &&
              ` · ${appliedDaysAgo === 0 ? 'today' : `${appliedDaysAgo}d ago`}`}
          </p>
        )}

        <div className={styles.skills}>
          {worker.skills.slice(0, 3).map((s) => (
            <span key={s.name} className={styles.skill}>
              {s.name}
            </span>
          ))}
        </div>

        <div className={styles.footer}>
          {worker.performanceScore !== null && (
            <span className={styles.score}>
              <StarIcon />
              {worker.performanceScore.toFixed(1)}
              <span className={styles.ratingCount}>({worker.ratingCount})</span>
            </span>
          )}
          <span className={styles.location}>
            <LocationIcon />
            {worker.location}
          </span>
        </div>
      </div>

      {showActions && (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="primary" onClick={onMessage}>
            Message
          </Button>
          <Button size="sm" variant="outline" onClick={onViewProfile}>
            View Profile
          </Button>
          {onFavorite && (
            <Button size="sm" variant="ghost" onClick={onFavorite} aria-label="Save to favorites">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
