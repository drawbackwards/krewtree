import React, { useEffect, useState } from 'react'
import { Modal } from '../../../components'
import styles from './RejectConfirmModal.module.css'

export interface RejectTarget {
  id: string
  /** Display name, e.g. "Jordan M." */
  name: string
  /** Optional job title, shown in the bulk list. */
  jobTitle?: string
}

export interface RejectConfirmModalProps {
  open: boolean
  onClose: () => void
  /** One entry per applicant being rejected. length 1 → single copy; >1 → bulk copy + list. */
  applicants: RejectTarget[]
  /** Performs the actual reject(s). The modal shows a pending state until it resolves,
   *  then the parent is responsible for closing (usually inside onConfirm). */
  onConfirm: (opts: { reason: string; sendNotification: boolean }) => Promise<void>
}

const PREVIEW = 6

/**
 * The single reject-confirmation dialog used by every reject action (applicant
 * slide-over, list + kanban widgets, All Applicants row + bulk bar). Owns the
 * internal reason note and the opt-in "send rejection message" checkbox so the
 * experience is identical everywhere.
 */
export const RejectConfirmModal: React.FC<RejectConfirmModalProps> = ({
  open,
  onClose,
  applicants,
  onConfirm,
}) => {
  const [reason, setReason] = useState('')
  const [sendNotification, setSendNotification] = useState(false)
  const [pending, setPending] = useState(false)

  // Reset the fields each time the dialog opens.
  useEffect(() => {
    if (open) {
      setReason('')
      setSendNotification(false)
      setPending(false)
    }
  }, [open])

  const count = applicants.length
  const isBulk = count > 1

  async function confirm(): Promise<void> {
    if (pending) return
    setPending(true)
    try {
      await onConfirm({ reason: reason.trim(), sendNotification })
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => (pending ? undefined : onClose())}
      size="sm"
      title={isBulk ? `Reject ${count} applicants?` : 'Reject applicant'}
      footer={
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={() => void confirm()}
            disabled={pending}
          >
            {pending ? 'Rejecting…' : isBulk ? `Reject ${count}` : 'Reject'}
          </button>
        </div>
      }
    >
      <p className={styles.body}>
        {isBulk ? (
          <>
            This moves {count} applicants out of your active pipeline and can&rsquo;t be undone.
            Already-rejected applicants are skipped.
          </>
        ) : (
          <>
            This moves <strong>{applicants[0]?.name}</strong> out of your active pipeline and
            can&rsquo;t be undone.
          </>
        )}
      </p>

      {isBulk && (
        <ul className={styles.list}>
          {applicants.slice(0, PREVIEW).map((a) => (
            <li key={a.id}>
              {a.name}
              {a.jobTitle ? ` — ${a.jobTitle}` : ''}
            </li>
          ))}
          {count > PREVIEW && <li className={styles.more}>+{count - PREVIEW} more</li>}
        </ul>
      )}

      <label className={styles.reasonLabel} htmlFor="reject-reason">
        Reason for rejection
      </label>
      <p className={styles.reasonHint}>Internal note only. Not shared with applicant.</p>
      <textarea
        id="reject-reason"
        className={styles.reasonInput}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Strong résumé, but we moved forward with candidates who had more commercial HVAC experience."
        rows={3}
        maxLength={1000}
      />

      <label className={styles.sendRow}>
        <input
          type="checkbox"
          checked={sendNotification}
          onChange={(e) => setSendNotification(e.target.checked)}
        />
        <span className={styles.sendText}>
          <span className={styles.sendTitle}>
            Send a rejection message to {isBulk ? 'each applicant' : 'the applicant'}
          </span>
          <span className={styles.reasonHint}>This uses your Rejection Notification template.</span>
        </span>
      </label>
    </Modal>
  )
}
