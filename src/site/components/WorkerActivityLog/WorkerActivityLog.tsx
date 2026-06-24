import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getWorkerActivityLog,
  listWorkerNotes,
  addWorkerNote,
  type WorkerHistoryCard,
  type WorkerHistoryCardState,
  type WorkerNote,
} from '../../services/krewService'
import { useAuth } from '../../context/AuthContext'
import { PlusIcon } from '../../icons'
import styles from './WorkerActivityLog.module.css'
// Reuse the canonical notes UI (note card + composer) from the Worker Drawer's
// Notes tab — same designed styles, single source of truth.
import logStyles from '../ApplicantSlideover/LogTab.module.css'

export interface WorkerActivityLogProps {
  workerId: string
  /** Tailors the empty-state copy ("You haven't…" vs "This worker hasn't…"). */
  isOwnProfile: boolean
  /** Company viewers also get worker notes + the jobs/notes filter. Notes are
   *  company-scoped (per company × worker), so they never apply to the worker's
   *  own view or the public view. */
  isCompanyViewer: boolean
}

type ActivityFilter = 'all' | 'jobs' | 'notes'

// A unified feed item so the "All" view can interleave jobs and notes by date.
type FeedItem =
  | { kind: 'job'; date: string; card: WorkerHistoryCard }
  | { kind: 'note'; date: string; note: WorkerNote }

// Mirrors the Worker Drawer Notes tab timestamp format.
function formatLogTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

// Label + date-line verb come from the same state — duplicated from the My Krew
// drawer history (WorkerHistoryTab) so both logs cover the identical events.
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

// Completed is the only state that owns a rating slot today (2-col finished
// layout). Terminated also closes an engagement but renders pills only and
// stays single-column.
const RATED_STATES: ReadonlySet<WorkerHistoryCardState> = new Set(['completed'])

// Open applications keep the badge as a hard signal of an in-flight item.
// Rejected also surfaces a badge because its outlined treatment alone doesn't
// communicate the negative outcome. Everything else relies on date verb +
// treatment color.
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

export const WorkerActivityLog: React.FC<WorkerActivityLogProps> = ({
  workerId,
  isOwnProfile,
  isCompanyViewer,
}) => {
  const { user } = useAuth()
  const [cards, setCards] = useState<WorkerHistoryCard[]>([])
  const [notes, setNotes] = useState<WorkerNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ActivityFilter>('all')

  // Add-note composer state (lifted so the header "Add note" button can open it).
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getWorkerActivityLog(workerId).then(({ data, error }) => {
      if (!active) return
      if (error) setError(error)
      else setCards(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [workerId])

  const loadNotes = useCallback(() => {
    if (!isCompanyViewer) {
      setNotes([])
      return
    }
    listWorkerNotes(workerId).then(({ data }) => setNotes(data))
  }, [workerId, isCompanyViewer])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const draftReady = draft.trim().length > 0

  const handleSaveNote = async (): Promise<void> => {
    if (!draftReady || saving) return
    setSaving(true)
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
    const authorName =
      (meta.company_name as string) || (meta.first_name as string) || user?.email || 'You'
    const { data } = await addWorkerNote(workerId, draft, authorName)
    if (data) {
      setNotes((prev) => [data, ...prev])
      setDraft('')
      setAdding(false)
      // Make the new note visible if the user was filtered to jobs only.
      if (filter === 'jobs') setFilter('all')
    }
    setSaving(false)
  }

  const handleCancelNote = (): void => {
    setAdding(false)
    setDraft('')
  }

  // Build the feed for the active filter. Jobs sort by their primaryDate, notes
  // by createdAt; "All" interleaves both newest-first.
  const jobItems: FeedItem[] = cards.map((c) => ({ kind: 'job', date: c.primaryDate, card: c }))
  const noteItems: FeedItem[] = notes.map((n) => ({ kind: 'note', date: n.createdAt, note: n }))
  const feed: FeedItem[] =
    filter === 'jobs'
      ? jobItems
      : filter === 'notes'
        ? noteItems
        : [...jobItems, ...noteItems].sort((a, b) => (a.date < b.date ? 1 : -1))

  const emptyCopy =
    filter === 'notes'
      ? 'No notes yet.'
      : isOwnProfile
        ? "You haven't applied to any jobs yet."
        : filter === 'jobs'
          ? 'No job activity to show yet.'
          : 'No activity to show yet.'

  return (
    <div className={styles.root}>
      {/* Header — title + "Add note" (top right, company viewers). */}
      <div className={styles.header}>
        <h2 className={styles.heading}>Activity</h2>
        {isCompanyViewer && !adding && (
          <button type="button" className={logStyles.addNoteBtn} onClick={() => setAdding(true)}>
            <PlusIcon size={12} />
            Add note
          </button>
        )}
      </div>

      {/* Jobs / notes filter — only company viewers have notes to filter. */}
      {isCompanyViewer && (
        <div className={styles.filterRow} role="tablist" aria-label="Activity filter">
          {(['all', 'jobs', 'notes'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={[styles.filterChip, filter === f ? styles.filterChipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'jobs' ? 'Jobs' : 'Notes'}
            </button>
          ))}
        </div>
      )}

      {/* Add-note composer — reuses the Worker Drawer Notes tab field + buttons. */}
      {isCompanyViewer && adding && (
        <div className={styles.composer}>
          <textarea
            className={logStyles.noteTextarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note about this worker..."
            rows={3}
            autoFocus
          />
          <div className={logStyles.noteActions}>
            <button
              type="button"
              className={logStyles.noteCancelBtn}
              onClick={handleCancelNote}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={logStyles.noteSaveBtn}
              onClick={() => void handleSaveNote()}
              disabled={!draftReady || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading activity…</p>
      ) : error ? (
        <p className={styles.empty}>Could not load activity.</p>
      ) : feed.length === 0 ? (
        <p className={styles.empty}>{emptyCopy}</p>
      ) : (
        <ul className={styles.list}>
          {feed.map((item) =>
            item.kind === 'job' ? (
              <li key={item.card.applicationId}>
                <HistoryCard card={item.card} />
              </li>
            ) : (
              <li key={item.note.id}>
                <NoteCard note={item.note} />
              </li>
            )
          )}
        </ul>
      )}
    </div>
  )
}

// ── Note card — reuses the Worker Drawer Notes tab markup (LogTab styles) ─────

const NoteCard: React.FC<{ note: WorkerNote }> = ({ note }) => (
  <div className={logStyles.item}>
    <div className={logStyles.noteBox}>
      <span className={logStyles.noteLabel}>Note:</span> {note.text}
      <time
        className={logStyles.noteBoxTime}
        dateTime={note.createdAt}
        title={formatLogTimestamp(note.createdAt)}
      >
        {formatLogTimestamp(note.createdAt)}
      </time>
    </div>
  </div>
)

// ── Card ──────────────────────────────────────────────────────────────────
// Read-only mirror of the drawer's HistoryCard: same treatments, badges, meta
// row and finished/standard layouts, but no "See Status" drawer action — the
// job title links to the public job instead.

const HistoryCard: React.FC<{ card: WorkerHistoryCard }> = ({ card }) => {
  const treatment = treatmentClass(card.state)
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
            <Link to={`/site/jobs/${card.jobId}`} className={styles.titleLink}>
              <span className={styles.jobTitle}>{card.jobTitle}</span>
            </Link>
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

  // All other states mirror the matches card: title, meta row, pills, footer
  // with the date line on the left and the state badge on the right.
  return (
    <article className={[styles.card, treatment].join(' ')}>
      <div className={styles.topRow}>
        <h4 className={styles.title}>
          <Link to={`/site/jobs/${card.jobId}`} className={styles.titleLink}>
            {card.jobTitle}
          </Link>
        </h4>
      </div>
      {metaRow}
      {pills}
      <div className={styles.footer}>
        <div className={styles.context}>
          <span>{dateLine}</span>
        </div>
        {badge && <div className={styles.actionRow}>{badge}</div>}
      </div>
    </article>
  )
}
