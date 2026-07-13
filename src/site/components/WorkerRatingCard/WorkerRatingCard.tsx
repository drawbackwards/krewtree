import React from 'react'
import { KrewtreeLogo } from '../Logo'
import { RegulixLogo } from '../RegulixLogo/RegulixLogo'
import type { TopPills } from '../../services/feedbackService'
import styles from './WorkerRatingCard.module.css'

type WorkerRatingCardProps = {
  averageRating: number | null
  reviewCount: number
  /** Top pills by sentiment — company viewers only (spec §6.1). */
  topPills?: TopPills
  /** Opens the full history view — company viewers only. */
  onViewHistory?: () => void
  /** FEATURES.regulix — the Regulix source card only renders when true. */
  showRegulix?: boolean
  /** profile.isRegulixReady — connected → reviews shell; not → onboarding state. */
  regulixConnected?: boolean
  /**
   * How the source cards flow. 'column' (default) for the narrow profile
   * sidebar; 'row' for wider surfaces like the applicant drawer.
   */
  sourcesLayout?: 'column' | 'row'
}

const pluralReviews = (n: number): string => `${n} review${n === 1 ? '' : 's'}`

/**
 * "Feedback" sidebar card. Follows the Applications-card pattern: a subtle
 * container with a heading and bordered inner source cards — one krewtree
 * (aggregate rating + pills), one Regulix (flag-gated). The worker's own view
 * passes only aggregate + count; a company viewer also passes topPills and
 * onViewHistory. The Regulix card shows the onboarding empty state until the
 * worker is Regulix-connected, then a reviews shell.
 */
export const WorkerRatingCard: React.FC<WorkerRatingCardProps> = ({
  averageRating,
  reviewCount,
  topPills,
  onViewHistory,
  showRegulix = false,
  regulixConnected = false,
  sourcesLayout = 'column',
}) => {
  const hasFeedback = reviewCount > 0
  const hasPills = !!topPills && (topPills.positive.length > 0 || topPills.negative.length > 0)

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Feedback</h3>
      <div className={`${styles.sources} ${sourcesLayout === 'row' ? styles.sourcesRow : ''}`}>
        {/* krewtree-sourced feedback */}
        <div className={styles.source}>
          <KrewtreeLogo height={20} onDark={false} />
          {!hasFeedback ? (
            <p className={styles.empty}>No feedback yet</p>
          ) : (
            <>
              <span className={styles.score}>{averageRating?.toFixed(1)}</span>
              <span className={styles.count}>{pluralReviews(reviewCount)}</span>
              {hasPills && topPills && (
                <div className={styles.pillRow}>
                  {topPills.positive.map((pill) => (
                    <span key={pill.id} className={`${styles.pill} ${styles.pillPositive}`}>
                      {pill.label}
                    </span>
                  ))}
                  {topPills.negative.map((pill) => (
                    <span key={pill.id} className={`${styles.pill} ${styles.pillNegative}`}>
                      {pill.label}
                    </span>
                  ))}
                </div>
              )}
              {onViewHistory && (
                <button type="button" className={styles.historyLink} onClick={onViewHistory}>
                  View history →
                </button>
              )}
            </>
          )}
        </div>

        {/* Regulix-sourced — flag-gated. Not connected → the onboarding empty
          state (moved here from the old standalone card); connected → reviews. */}
        {showRegulix && (
          <div className={styles.source}>
            <RegulixLogo
              height={20}
              textColor={regulixConnected ? 'var(--kt-navy-700)' : 'var(--kt-text-muted)'}
              opacity={regulixConnected ? 1 : 0.5}
            />
            {regulixConnected ? (
              <p className={styles.empty}>No reviews yet</p>
            ) : (
              <>
                <p className={styles.regulixTitle}>Not Yet Regulix Ready</p>
                <p className={styles.regulixSub}>Complete onboarding to become hire-ready.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
