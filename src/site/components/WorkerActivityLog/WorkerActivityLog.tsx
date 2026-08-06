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
import { userDisplayName } from '../../utils/userName'
import { PlusIcon, ChevronRightIcon } from '../../icons'
import { useDrawerStack } from '../DrawerSystem/DrawerStackContext'
import { FeedbackReviewCard } from '../FeedbackReviewCard/FeedbackReviewCard'
import { FeedbackFormModal } from '../FeedbackFormModal/FeedbackFormModal'
import { getWorkerFeedbackHistory, type FeedbackHistoryEntry } from '../../services/feedbackService'
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
  /** Fired after a company leaves/edits feedback from a hired job card, so the
   *  profile's Feedback aggregate can refresh. */
  onFeedbackSaved?: () => void
  /** Fired after a note is added, so a host (e.g. the Worker Drawer) can bump
   *  its own activity count without a refetch. */
  onNoteAdded?: () => void
  /** History cards supplied by a host (e.g. the Worker Drawer bootstrap). When
   *  provided, the initial fetch is skipped — the two callers share the same
   *  company-scoped query, so the data is identical. */
  preloadedCards?: WorkerHistoryCard[]
  /** Notes supplied by a host (drawer bootstrap). When provided, the initial
   *  listWorkerNotes() fetch is skipped. */
  preloadedNotes?: WorkerNote[]
  /** The "Activity" title. Hidden inside the Worker Drawer, where the tab strip
   *  already labels the panel. Defaults to shown (worker profile). */
  showHeading?: boolean
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

// Label + date-line verb come from the same state. This component is the single
// activity feed for both the worker profile's Activity tab and the My Krew
// worker drawer's Activity tab, so both cover the identical events.
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

// Open/closed applications that still have a pipeline record — these get the
// chevron that jumps to the application's Pipeline tab. (active/completed are
// engagements, terminated is closed; none of those route to a pipeline here.)
const APPLICATION_STATES: ReadonlySet<WorkerHistoryCardState> = new Set([
  'applied',
  'in_review',
  'rejected',
  'withdrawn',
  'archived',
])

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
  onFeedbackSaved,
  onNoteAdded,
  preloadedCards,
  preloadedNotes,
  showHeading = true,
}) => {
  const { user } = useAuth()
  const { openDrawer } = useDrawerStack()
  const [cards, setCards] = useState<WorkerHistoryCard[]>(preloadedCards ?? [])
  const [notes, setNotes] = useState<WorkerNote[]>(preloadedNotes ?? [])
  const [loading, setLoading] = useState(preloadedCards == null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ActivityFilter>('all')

  // Add-note composer state (lifted so the header "Add note" button can open it).
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Host supplied the history (drawer bootstrap) — use it and skip the fetch.
    if (preloadedCards != null) {
      setCards(preloadedCards)
      setLoading(false)
      return
    }
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
  }, [workerId, preloadedCards])

  useEffect(() => {
    if (!isCompanyViewer) {
      setNotes([])
      return
    }
    // Host supplied the notes (drawer bootstrap) — use them and skip the fetch.
    if (preloadedNotes != null) {
      setNotes(preloadedNotes)
      return
    }
    listWorkerNotes(workerId).then(({ data }) => setNotes(data))
  }, [workerId, isCompanyViewer, preloadedNotes])

  // The company's own feedback, keyed by application, so a hired card can render
  // its review (rating + pills + commentary) inline. Only own entries carry an
  // application_id + commentary from the RPC.
  const [feedbackByApp, setFeedbackByApp] = useState<Record<string, FeedbackHistoryEntry>>({})
  // Application whose feedback form is open (leave from a hired card, or edit
  // from a review card).
  const [formAppId, setFormAppId] = useState<string | null>(null)
  const loadFeedback = useCallback(() => {
    if (!isCompanyViewer) {
      setFeedbackByApp({})
      return
    }
    getWorkerFeedbackHistory(workerId).then(({ data }) => {
      const map: Record<string, FeedbackHistoryEntry> = {}
      for (const entry of data) if (entry.applicationId) map[entry.applicationId] = entry
      setFeedbackByApp(map)
    })
  }, [workerId, isCompanyViewer])

  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])

  const draftReady = draft.trim().length > 0

  const handleSaveNote = async (): Promise<void> => {
    if (!draftReady || saving) return
    setSaving(true)
    const { data } = await addWorkerNote(workerId, draft, userDisplayName(user))
    if (data) {
      setNotes((prev) => [data, ...prev])
      setDraft('')
      setAdding(false)
      // Make the new note visible if the user was filtered to jobs only.
      if (filter === 'jobs') setFilter('all')
      onNoteAdded?.()
    }
    setSaving(false)
  }

  const handleCancelNote = (): void => {
    setAdding(false)
    setDraft('')
  }

  // Jump to the application's Pipeline tab (stage + tasks) in a stacked
  // application drawer — the action the My Krew drawer history used to expose as
  // "See Status". onWrite bubbles so the host can refresh after any change.
  const openPipeline = (applicationId: string): void => {
    openDrawer({
      type: 'application',
      applicationId,
      defaultTab: 'pipeline',
      onWrite: onFeedbackSaved,
    })
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
      {/* Title — hidden in the drawer, where the tab strip already labels the
          panel. Company viewers get the "Add note" action on the filter row. */}
      {showHeading && (
        <div className={styles.header}>
          <h2 className={styles.heading}>Activity</h2>
        </div>
      )}

      {/* Jobs / notes filter + "Add note" — one row, filter chips left, action
          right. Only company viewers have notes to filter or add. */}
      {isCompanyViewer && (
        <div className={styles.filterRow}>
          <div className={styles.filterChips} role="tablist" aria-label="Activity filter">
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
          {!adding && (
            <button type="button" className={logStyles.addNoteBtn} onClick={() => setAdding(true)}>
              <PlusIcon size={12} />
              Add note
            </button>
          )}
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
                <HistoryCard
                  card={item.card}
                  canLeaveFeedback={isCompanyViewer}
                  feedback={feedbackByApp[item.card.applicationId]}
                  onOpenForm={setFormAppId}
                  onOpenPipeline={isCompanyViewer ? openPipeline : undefined}
                />
              </li>
            ) : (
              <li key={item.note.id}>
                <NoteCard note={item.note} />
              </li>
            )
          )}
        </ul>
      )}

      {formAppId && (
        <FeedbackFormModal
          open
          onClose={() => setFormAppId(null)}
          workerId={workerId}
          applicationId={formAppId}
          onSaved={() => {
            loadFeedback()
            onFeedbackSaved?.()
          }}
        />
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
        {note.authorName ? ` · ${note.authorName}` : ''}
      </time>
    </div>
  </div>
)

// ── Card ──────────────────────────────────────────────────────────────────
// Job/application card: treatments, badges, meta row and finished/standard
// layouts. The job title links to the public job (no "See Status" drawer
// action). Shared by the worker profile and the My Krew worker drawer.

const HistoryCard: React.FC<{
  card: WorkerHistoryCard
  /** Company viewers can leave feedback on hired (terminal_hired) cards. */
  canLeaveFeedback: boolean
  /** The company's own feedback for this application, if any. */
  feedback?: FeedbackHistoryEntry
  /** Opens the feedback form for an application (leave or edit). */
  onOpenForm: (applicationId: string) => void
  /** Company viewers get a chevron on application cards that jumps to the
   *  application's Pipeline tab. Undefined hides it (e.g. worker's own view). */
  onOpenPipeline?: (applicationId: string) => void
}> = ({ card, canLeaveFeedback, feedback, onOpenForm, onOpenPipeline }) => {
  // A hired job this company has reviewed → the exact feedback review card,
  // with a "Hired" label on the hire date. Edit/view opens the form.
  if (feedback) {
    return (
      <FeedbackReviewCard
        entry={feedback}
        date={card.primaryDate}
        dateLabel="Hired"
        onOpen={() => onOpenForm(card.applicationId)}
      />
    )
  }

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
  // Date leads the subtext, then location · type · pay.
  const metaItems = [dateLine, card.jobLocation, card.jobType, pay].filter(Boolean) as string[]
  const metaRow = (
    <div className={styles.metaRow}>
      {metaItems.map((item, i) => (
        <React.Fragment key={item}>
          {i > 0 && <span className={styles.middot}>·</span>}
          <span>{item}</span>
        </React.Fragment>
      ))}
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

  // Internal, company-only reason captured when the applicant was rejected.
  const rejectionNote =
    card.state === 'rejected' && card.rejectionReason ? (
      <div className={styles.internalNote}>
        <span className={styles.internalNoteLabel}>Internal note</span>
        <span className={styles.internalNoteText}>{card.rejectionReason}</span>
      </div>
    ) : null

  // Finished cards (Completed) keep the 2-col rating layout, with the job
  // meta row inserted between title and pills.
  if (hasRatingSlot) {
    return (
      <div className={[styles.card, treatment].join(' ')}>
        <div className={styles.finishedGrid}>
          <div className={styles.finishedLeft}>
            <span className={styles.date}>{dateLine}</span>
            <Link to={`/jobs/${card.jobId}`} className={styles.titleLink}>
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

  // Other states: title + (stage pill / "Leave feedback") on the right, date-led
  // meta row. A hired-but-unreviewed card offers Leave feedback.
  const canLeave = card.state === 'active' && canLeaveFeedback
  const canOpenPipeline = APPLICATION_STATES.has(card.state) && !!onOpenPipeline
  return (
    <article className={[styles.card, treatment].join(' ')}>
      <div className={styles.topRow}>
        <h4 className={styles.title}>
          <Link to={`/jobs/${card.jobId}`} className={styles.titleLink}>
            {card.jobTitle}
          </Link>
        </h4>
        <div className={styles.topRight}>
          {badge}
          {canLeave && (
            <button
              type="button"
              className={styles.leaveFeedbackBtn}
              onClick={() => onOpenForm(card.applicationId)}
            >
              Leave feedback
            </button>
          )}
          {canOpenPipeline && (
            <button
              type="button"
              className={styles.pipelineBtn}
              onClick={() => onOpenPipeline?.(card.applicationId)}
              aria-label="View application pipeline"
              title="View pipeline"
            >
              <ChevronRightIcon size={16} />
            </button>
          )}
        </div>
      </div>
      {metaRow}
      {pills}
      {rejectionNote}
    </article>
  )
}
