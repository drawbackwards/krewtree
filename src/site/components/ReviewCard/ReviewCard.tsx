import React from 'react'
import type { CompanyReview } from '../../types'
import styles from './ReviewCard.module.css'

interface ReviewCardProps {
  review: CompanyReview
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className={styles.starRow} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={[styles.star, i <= rating ? styles.filled : ''].join(' ')}>
          ★
        </span>
      ))}
    </div>
  )
}

function monthsLabel(months: number): string {
  if (months === 0) return 'This month'
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  const yrs = Math.round(months / 12)
  return yrs === 1 ? '1 year ago' : `${yrs} years ago`
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.reviewer}>
          <div className={styles.avatar}>{review.workerInitials}</div>
          <div className={styles.reviewerInfo}>
            <div className={styles.reviewerName}>
              {review.workerName}
              {review.isVerified && <span className={styles.verifiedBadge}>✓ Verified Worker</span>}
            </div>
            <div className={styles.reviewDate}>{monthsLabel(review.datedMonthsAgo)}</div>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>

      <div className={styles.title}>{review.title}</div>
      <div className={styles.body}>{review.body}</div>

      <div className={styles.prosConsRow}>
        <div className={styles.prosBox}>
          <div className={styles.prosLabel}>👍 Pros</div>
          <div className={styles.prosText}>{review.pros}</div>
        </div>
        <div className={styles.consBox}>
          <div className={styles.consLabel}>👎 Cons</div>
          <div className={styles.consText}>{review.cons}</div>
        </div>
      </div>

      <div className={styles.footer}>
        <span
          className={[styles.recommendBadge, review.recommend ? styles.yes : styles.no].join(' ')}
        >
          {review.recommend ? '✓ Recommends' : "✗ Doesn't recommend"}
        </span>
        <span>this employer</span>
      </div>
    </div>
  )
}
