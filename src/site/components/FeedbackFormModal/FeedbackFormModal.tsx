import React, { useEffect, useState } from 'react'
import { Modal, Button, Textarea, Spinner, RadioGroup } from '../../../components'
import { StarIcon } from '../../icons'
import {
  getFeedbackForApplication,
  submitFeedback,
  updateFeedback,
  type WouldHireAgain,
} from '../../services/feedbackService'
import styles from './FeedbackFormModal.module.css'

type FeedbackFormModalProps = {
  open: boolean
  onClose: () => void
  workerId: string
  applicationId: string
  /** Called after a successful create/edit so callers can refresh. */
  onSaved?: () => void
}

type Mode = 'create' | 'edit' | 'view'

const HIRE_OPTIONS: Array<{ value: WouldHireAgain; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'unsure', label: 'Unsure' },
  { value: 'no', label: 'No' },
]

const TITLE: Record<Mode, string> = {
  create: 'Leave feedback',
  edit: 'Edit feedback',
  view: 'Feedback',
}

const MAX_COMMENTARY = 1000

// Half-star rating input. Each star has a left (·.5) and right (·.0) hit zone;
// hovering previews the value and shows the numeric readout beside the stars.
const StarRatingInput: React.FC<{
  value: number
  onChange: (v: number) => void
  readOnly?: boolean
}> = ({ value, onChange, readOnly = false }) => {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value
  const fillPct = (i: number): number => (display >= i ? 100 : display >= i - 0.5 ? 50 : 0)
  const shown = hover ?? (value > 0 ? value : null)

  return (
    <div className={styles.rating}>
      <div
        className={styles.stars}
        role="slider"
        aria-label="Overall rating"
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={value || undefined}
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={styles.star}>
            <StarIcon size={28} color="var(--kt-border-strong)" />
            <span
              className={styles.starFill}
              style={{ clipPath: `inset(0 ${100 - fillPct(i)}% 0 0)` }}
            >
              <StarIcon size={28} color="var(--kt-warning)" />
            </span>
            {!readOnly && (
              <>
                <button
                  type="button"
                  className={`${styles.hit} ${styles.hitLeft}`}
                  aria-label={`${i - 0.5} stars`}
                  onMouseEnter={() => setHover(i - 0.5)}
                  onClick={() => onChange(i - 0.5)}
                />
                <button
                  type="button"
                  className={`${styles.hit} ${styles.hitRight}`}
                  aria-label={`${i} stars`}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => onChange(i)}
                />
              </>
            )}
          </span>
        ))}
      </div>
      {shown !== null && <span className={styles.ratingValue}>{shown.toFixed(1)}</span>}
    </div>
  )
}

/**
 * Post-hire feedback form. Opens from the worker-history job-card overflow (and,
 * later, the job-detail hired table). Loads any existing feedback for the
 * application to decide its mode: none → create, within 24h → edit, else a
 * read-only view. The 24-hour window is enforced server-side; this just mirrors
 * it as a UX affordance.
 */
export const FeedbackFormModal: React.FC<FeedbackFormModalProps> = ({
  open,
  onClose,
  workerId,
  applicationId,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('create')
  const [feedbackId, setFeedbackId] = useState<string | null>(null)

  const [rating, setRating] = useState(0)
  const [wouldHire, setWouldHire] = useState<WouldHireAgain | null>(null)
  const [commentary, setCommentary] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getFeedbackForApplication(applicationId).then((recordRes) => {
      if (cancelled) return
      const record = recordRes.data
      if (record) {
        setMode(record.isEditable ? 'edit' : 'view')
        setFeedbackId(record.id)
        setRating(record.starRating)
        setWouldHire(record.wouldHireAgain)
        setCommentary(record.commentary ?? '')
      } else {
        setMode('create')
        setFeedbackId(null)
        setRating(0)
        setWouldHire(null)
        setCommentary('')
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, applicationId])

  const readOnly = mode === 'view'
  const canSave = rating >= 0.5 && wouldHire !== null && !saving

  const handleSave = async (): Promise<void> => {
    if (!canSave || wouldHire === null) return
    setSaving(true)
    setError(null)
    const trimmed = commentary.trim()
    // Attribute pills are no longer collected; clear any that a prior version
    // may have stored by passing an empty list.
    const result =
      mode === 'edit' && feedbackId
        ? await updateFeedback(feedbackId, {
            starRating: rating,
            wouldHireAgain: wouldHire,
            commentary: trimmed || null,
            pillIds: [],
          })
        : await submitFeedback({
            workerId,
            applicationId,
            starRating: rating,
            wouldHireAgain: wouldHire,
            commentary: trimmed || null,
            pillIds: [],
          })
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onSaved?.()
    onClose()
  }

  const footer = readOnly ? (
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  ) : (
    <div className={styles.footer}>
      {error && <span className={styles.error}>{error}</span>}
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={!canSave} loading={saving}>
        {mode === 'edit' ? 'Save changes' : 'Submit feedback'}
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={TITLE[mode]}
      size="md"
      mobileDrawer
      footer={loading ? undefined : footer}
    >
      {loading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : (
        <div className={styles.form}>
          {readOnly && (
            <p className={styles.lockedNote}>
              The 24-hour edit window has closed, so this feedback is locked.
            </p>
          )}

          <div className={styles.field}>
            <span className={styles.label}>Overall rating *</span>
            <StarRatingInput value={rating} onChange={setRating} readOnly={readOnly} />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Would you hire this worker again? *</span>
            <RadioGroup
              className={styles.hireRadios}
              name="wouldHireAgain"
              orientation="vertical"
              value={wouldHire ?? ''}
              onChange={(v) => !readOnly && setWouldHire(v as WouldHireAgain)}
              options={HIRE_OPTIONS.map((opt) => ({
                label: opt.label,
                value: opt.value,
                disabled: readOnly,
              }))}
            />
          </div>

          <Textarea
            label="Private notes (optional)"
            helperText="Only your company can see this. Never shown to the worker."
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            maxChars={MAX_COMMENTARY}
            rows={4}
            disabled={readOnly}
            placeholder="Anything worth remembering about working with this person…"
          />
        </div>
      )}
    </Modal>
  )
}
