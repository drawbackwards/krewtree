import React, { useState } from 'react'
import { Modal } from '../../../components'
import type { Job } from '../../data/mock'
import { currentWorker } from '../../data/mock'
import styles from './QuickApplyModal.module.css'

interface QuickApplyModalProps {
  job: Job | null
  open: boolean
  onClose: () => void
  onApplied?: (jobId: string) => void
}

export const QuickApplyModal: React.FC<QuickApplyModalProps> = ({
  job,
  open,
  onClose,
  onApplied,
}) => {
  const [coverNote, setCoverNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      onApplied?.(job?.id ?? '')
    }, 900)
  }

  const handleClose = () => {
    onClose()
    // Reset after animation
    setTimeout(() => {
      setSubmitted(false)
      setCoverNote('')
    }, 300)
  }

  if (!job) return null

  const companyInitials = job.company.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      title={submitted ? undefined : 'Quick Apply'}
      showClose={!submitted}
      footer={
        submitted ? (
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: 'var(--kt-space-3)',
              background: 'var(--kt-primary)',
              color: 'var(--kt-text-on-primary)',
              border: 'none',
              borderRadius: 'var(--kt-radius-md)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
            }}
          >
            Done
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: 'var(--kt-space-3)',
                background: 'transparent',
                color: 'var(--kt-text)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-medium)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 2,
                padding: 'var(--kt-space-3)',
                background: loading ? 'var(--kt-border)' : 'var(--kt-primary)',
                color: 'var(--kt-text-on-primary)',
                border: 'none',
                borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--kt-space-2)',
              }}
            >
              {loading ? '⏳ Submitting...' : '⚡ Submit Application'}
            </button>
          </div>
        )
      }
    >
      {submitted ? (
        <div className={styles.successState}>
          <div className={styles.successIcon}>🎉</div>
          <div className={styles.successTitle}>Application Sent!</div>
          <p className={styles.successBody}>
            Your application for <strong>{job.title}</strong> at <strong>{job.company.name}</strong>{' '}
            has been submitted. You'll be notified when they view your profile.
          </p>
        </div>
      ) : (
        <>
          {/* Job Header */}
          <div className={styles.jobHeader}>
            <div className={styles.logoCircle}>{companyInitials}</div>
            <div>
              <div className={styles.jobTitle}>{job.title}</div>
              <div className={styles.jobMeta}>
                {job.company.name} · {job.location} · {job.type}
              </div>
            </div>
          </div>

          {/* Worker Info */}
          <div className={styles.workerRow}>
            <div className={styles.workerAvatar}>{currentWorker.initials}</div>
            <div className={styles.workerInfo}>
              <div className={styles.workerName}>{currentWorker.name}</div>
              <div className={styles.workerHeadline}>{currentWorker.headline}</div>
            </div>
            {currentWorker.isRegulixReady && (
              <span className={styles.readyBadge}>✓ Regulix Ready</span>
            )}
          </div>

          {/* Cover Note */}
          <div className={styles.coverNote}>
            <label className={styles.coverLabel}>
              Cover Note{' '}
              <span style={{ color: 'var(--kt-text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Add a short note to stand out (e.g. why you're a great fit, availability, questions)"
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--kt-space-3)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                background: 'var(--kt-bg)',
                fontFamily: 'var(--kt-font-sans)',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 'var(--kt-leading-normal)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--kt-primary)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--kt-border)'
              }}
            />
            <div className={styles.tip}>
              Your full profile, work history, and Regulix verification are included automatically.
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
