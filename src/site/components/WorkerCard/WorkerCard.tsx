import React from 'react'
import { Button } from '../../../components'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import type { Worker } from '../../types'
import { StarIcon, LocationIcon, HeartIcon } from '../../icons'
import styles from './WorkerCard.module.css'

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
              <StarIcon size={13} />
              {worker.performanceScore.toFixed(1)}
              <span className={styles.ratingCount}>({worker.ratingCount})</span>
            </span>
          )}
          <span className={styles.location}>
            <LocationIcon size={11} />
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
              <HeartIcon size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
