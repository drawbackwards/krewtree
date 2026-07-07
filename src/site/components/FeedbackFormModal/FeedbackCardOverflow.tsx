import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DotsHorizontalIcon } from '../../icons'
import { getFeedbackStatusForApplications } from '../../services/feedbackService'
import { FeedbackFormModal } from './FeedbackFormModal'
import styles from './FeedbackCardOverflow.module.css'

type FeedbackCardOverflowProps = {
  workerId: string
  /** A terminal_hired application at the viewing company. */
  applicationId: string
  /** Fired after a create/edit — e.g. to refresh a profile aggregate. */
  onSaved?: () => void
  /** Show the existing review rating inline next to the ⋯ (default true).
   *  Set false where the card renders the full review itself. */
  showRating?: boolean
}

type Status = 'loading' | 'none' | { isEditable: boolean; starRating: number }

/**
 * The ⋯ feedback overflow shown on a hired job card. Self-contained: fetches its
 * own feedback status for the application (to label Leave / Edit / View), opens
 * the feedback form, and re-checks status after a save. Used by the worker-drawer
 * history and the worker-profile activity log (spec §5.2).
 */
export const FeedbackCardOverflow: React.FC<FeedbackCardOverflowProps> = ({
  workerId,
  applicationId,
  onSaved,
  showRating = true,
}) => {
  const [status, setStatus] = useState<Status>('loading')
  const [menuOpen, setMenuOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadStatus = useCallback(() => {
    getFeedbackStatusForApplications([applicationId]).then(({ data }) => {
      const s = data[applicationId]
      setStatus(s ? { isEditable: s.isEditable, starRating: s.starRating } : 'none')
    })
  }, [applicationId])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent): void => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const label =
    status === 'loading'
      ? 'Feedback'
      : status === 'none'
        ? 'Leave feedback'
        : status.isEditable
          ? 'Edit feedback'
          : 'View feedback'

  const toggle = (): void => {
    if (!menuOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setMenuOpen((v) => !v)
  }

  const feedback = typeof status === 'object' ? status : null

  return (
    <span className={styles.wrap}>
      {/* Existing review shown inline with the job. */}
      {showRating && feedback && (
        <span className={styles.rating}>
          {feedback.starRating}
          <span className={styles.ratingMax}>/5</span>
        </span>
      )}
      <button
        ref={btnRef}
        type="button"
        className={styles.iconBtn}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Feedback actions"
      >
        <DotsHorizontalIcon size={16} />
      </button>
      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            role="menu"
            style={{ top: pos.top, right: pos.right }}
          >
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setMenuOpen(false)
                setFormOpen(true)
              }}
            >
              {label}
            </button>
          </div>,
          document.body
        )}
      {formOpen && (
        <FeedbackFormModal
          open
          onClose={() => setFormOpen(false)}
          workerId={workerId}
          applicationId={applicationId}
          onSaved={() => {
            loadStatus()
            onSaved?.()
          }}
        />
      )}
    </span>
  )
}
