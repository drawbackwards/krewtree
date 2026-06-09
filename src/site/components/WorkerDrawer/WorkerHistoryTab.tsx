import React from 'react'
import {
  type WorkerDetail,
  type WorkerHistoryCard,
  type WorkerHistoryCardState,
} from '../../services/krewService'
import { useDrawerStack } from '../DrawerSystem/DrawerStackContext'
import styles from './WorkerHistoryTab.module.css'

export interface WorkerHistoryTabProps {
  cards: WorkerHistoryCard[]
  loading: boolean
  /** Passed to the stacked ApplicationDrawer as preloadedWorker so it can show
   *  the worker fields without a re-fetch. */
  worker: WorkerDetail | null
  /** Bubble writes back to whoever opened the WorkerDrawer. */
  onWrite?: () => void
}

// Per spec §4 — badge label + date-line verb come from the same state.
const BADGE_LABEL: Record<WorkerHistoryCardState, string> = {
  applied: 'Applied',
  in_review: 'In review',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
  active: 'Active',
  completed: 'Completed',
  terminated: 'Terminated',
}

const DATE_VERB: Record<WorkerHistoryCardState, string> = {
  applied: 'Applied',
  in_review: 'Applied',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  archived: 'Job closed',
  active: 'Hired',
  completed: 'Hired',
  terminated: 'Terminated',
}

const APPLICATION_STATES: ReadonlySet<WorkerHistoryCardState> = new Set([
  'applied',
  'in_review',
  'rejected',
  'withdrawn',
  'archived',
])

// Completed is the only state that owns a rating slot today (2-col finished
// layout). Terminated also closes an engagement but renders pills only and
// stays single-column — see spec §3 and the review-flow follow-up.
const RATED_STATES: ReadonlySet<WorkerHistoryCardState> = new Set(['completed'])

// Open applications keep the badge as a hard signal of an in-flight item.
// Rejected also surfaces a badge because its outlined treatment alone doesn't
// communicate the negative outcome. Everything else relies on date verb +
// treatment color (and stays calmer).
const BADGED_STATES: ReadonlySet<WorkerHistoryCardState> = new Set([
  'applied',
  'in_review',
  'rejected',
])

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRating(rating: number | null): string {
  return rating == null ? '—' : rating.toFixed(1)
}

function formatPay(card: WorkerHistoryCard): string | null {
  if (card.jobPayMin == null || card.jobPayMax == null) return null
  if (card.jobPayType === 'hour') return `$${card.jobPayMin}–${card.jobPayMax}/hr`
  return `$${(card.jobPayMin / 1000).toFixed(0)}k–${(card.jobPayMax / 1000).toFixed(0)}k/yr`
}

export const WorkerHistoryTab: React.FC<WorkerHistoryTabProps> = ({ cards, loading, onWrite }) => {
  const { openDrawer } = useDrawerStack()

  if (loading) {
    return (
      <div className={styles.root}>
        <p className={styles.loading}>Loading…</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>This worker hasn't applied to any of your jobs.</p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {cards.map((c) => (
          <li key={c.applicationId}>
            <HistoryCard
              card={c}
              onOpen={() => {
                if (!APPLICATION_STATES.has(c.state)) return
                // "See Status" jumps straight to the Pipeline tab — that's the
                // tab that shows the applicant's stage progress and task state,
                // which is what "status" refers to on the card.
                openDrawer({
                  type: 'application',
                  applicationId: c.applicationId,
                  defaultTab: 'pipeline',
                  onWrite,
                })
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Card ────────────────────────────────────────────────────────────────────

const HistoryCard: React.FC<{
  card: WorkerHistoryCard
  onOpen: () => void
}> = ({ card, onOpen }) => {
  const treatment = treatmentClass(card.state)
  const isApplicationCard = APPLICATION_STATES.has(card.state)
  const hasRatingSlot = RATED_STATES.has(card.state)

  const dateLine = `${DATE_VERB[card.state]} ${shortDate(card.primaryDate)}`
  const showBadge = BADGED_STATES.has(card.state)
  const badge = showBadge ? (
    <span className={[styles.badge, badgeClass(card.state)].join(' ')}>
      {BADGE_LABEL[card.state]}
    </span>
  ) : null

  const pay = formatPay(card)
  const hasMeta = !!(card.jobLocation || card.jobType || pay)
  const metaRow = hasMeta && (
    <div className={styles.metaRow}>
      {card.jobLocation && <span>{card.jobLocation}</span>}
      {card.jobLocation && (card.jobType || pay) && <span className={styles.middot}>·</span>}
      {card.jobType && <span>{card.jobType}</span>}
      {card.jobType && pay && <span className={styles.middot}>·</span>}
      {pay && <span>{pay}</span>}
    </div>
  )

  const pills = card.reviewTags.length > 0 && (
    <div className={styles.pillRow}>
      {card.reviewTags.map((tag) => (
        <span key={tag} className={styles.pill}>
          {tag}
        </span>
      ))}
    </div>
  )

  // Finished cards (Completed) keep the 2-col rating layout, with the job
  // meta row inserted between title and pills.
  if (hasRatingSlot) {
    return (
      <div className={[styles.card, treatment].join(' ')}>
        <div className={styles.finishedGrid}>
          <div className={styles.finishedLeft}>
            <span className={styles.date}>{dateLine}</span>
            <span className={styles.jobTitle}>{card.jobTitle}</span>
            {metaRow}
            {pills}
          </div>
          <div className={styles.ratingSlot}>
            <span
              className={[styles.rating, card.rating == null ? styles.ratingEmpty : '']
                .filter(Boolean)
                .join(' ')}
              aria-label={
                card.rating == null ? 'No rating yet' : `Rating ${card.rating.toFixed(1)}`
              }
            >
              {formatRating(card.rating)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // All other states (applications + active/terminated) mirror the matches
  // card: title, meta row (location · type · pay), pills, footer with the
  // date line + stage on the left and the state badge + See Status CTA on
  // the right. The CTA is only rendered for application states.
  const hasFooterRight = !!badge || isApplicationCard
  return (
    <article className={[styles.card, treatment].join(' ')}>
      <div className={styles.topRow}>
        <h4 className={styles.title}>{card.jobTitle}</h4>
      </div>
      {metaRow}
      {pills}
      <div className={styles.footer}>
        <div className={styles.context}>
          <span>{dateLine}</span>
        </div>
        {hasFooterRight && (
          <div className={styles.actionRow}>
            {badge}
            {isApplicationCard && (
              <button type="button" className={styles.seeStatusBtn} onClick={onOpen}>
                See Status
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function treatmentClass(state: WorkerHistoryCardState): string {
  if (state === 'active' || state === 'completed') return styles.treatmentGreen
  if (state === 'terminated') return styles.treatmentRed
  return styles.treatmentOutlined
}

function badgeClass(state: WorkerHistoryCardState): string {
  switch (state) {
    case 'in_review':
      return styles.badgeBlue
    case 'rejected':
    case 'terminated':
      return styles.badgeRed
    case 'active':
      return styles.badgeGreen
    case 'applied':
    case 'withdrawn':
    case 'archived':
    case 'completed':
    default:
      return styles.badgeGray
  }
}
