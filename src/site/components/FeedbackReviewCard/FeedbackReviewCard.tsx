import React from 'react'
import { CheckIcon, CloseIcon, EditIcon, EyeIcon } from '../../icons'
import type { FeedbackHistoryEntry, WouldHireAgain } from '../../services/feedbackService'
import styles from './FeedbackReviewCard.module.css'

type FeedbackReviewCardProps = {
  entry: FeedbackHistoryEntry
  /** ISO date to display; defaults to the feedback's created date. */
  date?: string
  /** Optional label shown before the date, e.g. "Hired". */
  dateLabel?: string
  /**
   * Shows the edit/view icon (by 24h window state) when the viewer authored the
   * entry. Omit to render a read-only card.
   */
  onOpen?: (entry: FeedbackHistoryEntry) => void
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// "Would hire again" reads as a status chip, mirroring the "In Krew" badge.
const WouldHireChip: React.FC<{ value: WouldHireAgain }> = ({ value }) => {
  if (value === 'yes') {
    return (
      <span className={`${styles.hireChip} ${styles.hireYes}`}>
        <CheckIcon size={12} />
        Would hire again
      </span>
    )
  }
  if (value === 'no') {
    return (
      <span className={`${styles.hireChip} ${styles.hireNo}`}>
        <CloseIcon size={12} />
        Would not hire again
      </span>
    )
  }
  return <span className={`${styles.hireChip} ${styles.hireUnsure}`}>Unsure about rehiring</span>
}

/**
 * A single feedback review card — the canonical presentation shared by the
 * feedback history modal and the worker-profile activity tab. Visibility is
 * already applied upstream by the history RPC (commentary/edit only on the
 * viewer's own entries). `dateLabel` lets callers prefix the date (e.g.
 * "Hired") and `date` overrides which date is shown.
 */
export const FeedbackReviewCard: React.FC<FeedbackReviewCardProps> = ({
  entry,
  date,
  dateLabel,
  onOpen,
}) => {
  // Card tone: a low score (≤2) or an explicit "would not hire again" reads as
  // negative and wins over a high score; a high score (≥3) or "would hire
  // again" reads as positive. Anything else stays the neutral gray default.
  const isNegative = entry.starRating <= 2 || entry.wouldHireAgain === 'no'
  const isPositive = entry.starRating >= 3 || entry.wouldHireAgain === 'yes'
  const toneClass = isNegative ? styles.entryNegative : isPositive ? styles.entryPositive : ''

  return (
    <div className={[styles.entry, toneClass].filter(Boolean).join(' ')}>
      <div className={styles.entryHead}>
        <div className={styles.titleBlock}>
          <span className={styles.jobTitle}>{entry.jobTitle ?? 'Untitled role'}</span>
          <span className={styles.date}>
            {dateLabel && <span className={styles.dateLabel}>{dateLabel} </span>}
            {formatDate(date ?? entry.createdAt)}
          </span>
        </div>
        <div className={styles.headRight}>
          <span className={styles.ratingNum}>
            {entry.starRating}
            <span className={styles.ratingMax}>/5</span>
          </span>
          {entry.isOwn && onOpen && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => onOpen(entry)}
              aria-label={entry.isEditable ? 'Edit feedback' : 'View feedback'}
              title={entry.isEditable ? 'Edit feedback' : 'View feedback'}
            >
              {entry.isEditable ? <EditIcon size={15} /> : <EyeIcon size={15} />}
            </button>
          )}
        </div>
      </div>

      {entry.commentary && <p className={styles.commentary}>{entry.commentary}</p>}

      <div className={styles.signals}>
        <WouldHireChip value={entry.wouldHireAgain} />
      </div>
    </div>
  )
}
