import React, { useEffect, useState } from 'react'
import { Modal } from '../../../components'
import { Spinner } from '../../../components'
import { getWorkerFeedbackHistory, type FeedbackHistoryEntry } from '../../services/feedbackService'
import { FeedbackReviewCard } from '../FeedbackReviewCard/FeedbackReviewCard'
import styles from './WorkerFeedbackHistory.module.css'

type WorkerFeedbackHistoryProps = {
  open: boolean
  onClose: () => void
  workerId: string
  /**
   * Opens a feedback entry the viewer authored (edit if within the 24h window,
   * else read-only view). Omitted until the feedback form is wired (Chunk 5);
   * when absent, the per-entry action is not rendered.
   */
  onOpenEntry?: (entry: FeedbackHistoryEntry) => void
}

type FilterKey = 'all' | 'mine' | 'others'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'My company' },
  { key: 'others', label: 'Other companies' },
]

/**
 * Full feedback history for a worker, opened from the Rating card's "View
 * history" link. The list is visibility-scoped by the RPC: every company sees
 * job title, rating, pills, would-hire-again and date; the authoring company
 * additionally sees its own commentary and an edit/view action (spec §6.2-6.3).
 */
export const WorkerFeedbackHistory: React.FC<WorkerFeedbackHistoryProps> = ({
  open,
  onClose,
  workerId,
  onOpenEntry,
}) => {
  const [entries, setEntries] = useState<FeedbackHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setFilter('all')
    getWorkerFeedbackHistory(workerId).then(({ data, error: err }) => {
      if (err) setError(err)
      else setEntries(data)
      setLoading(false)
    })
  }, [open, workerId])

  const filtered = entries.filter((e) =>
    filter === 'all' ? true : filter === 'mine' ? e.isOwn : !e.isOwn
  )

  return (
    <Modal open={open} onClose={onClose} title="Feedback history" size="lg" mobileDrawer>
      {loading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : error ? (
        <p className={styles.message}>Could not load feedback history.</p>
      ) : entries.length === 0 ? (
        <p className={styles.message}>No feedback yet.</p>
      ) : (
        <>
          <div className={styles.filters} role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className={styles.message}>
              {filter === 'mine'
                ? 'Your company hasn’t left feedback for this worker.'
                : 'No feedback from other companies.'}
            </p>
          ) : (
            <ul className={styles.list}>
              {filtered.map((entry) => (
                <li key={entry.id}>
                  <FeedbackReviewCard entry={entry} dateLabel="Hired" onOpen={onOpenEntry} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  )
}
