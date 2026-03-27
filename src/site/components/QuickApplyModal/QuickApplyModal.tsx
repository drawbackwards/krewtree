import React, { useState } from 'react'
import { Modal } from '../../../components'
import type { Job } from '../../types'
import { useAuth } from '../../context/AuthContext'
import {
  HourglassIcon,
  RocketIcon,
  CelebrationIcon,
  LightningIcon,
  CheckSmallIcon,
  EnvelopeIcon,
} from '../../icons'
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
  const { user, isEmailVerified, resendVerificationEmail } = useAuth()
  const firstName: string = user?.user_metadata?.first_name ?? ''
  const lastName: string = user?.user_metadata?.last_name ?? ''
  const workerName = firstName ? `${firstName} ${lastName}`.trim() : ''
  const workerInitials = firstName ? `${firstName[0]}${lastName[0] ?? ''}`.toUpperCase() : ''
  const [coverNote, setCoverNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wantBoost, setWantBoost] = useState(false)
  const [submittedWithBoost, setSubmittedWithBoost] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendError, setResendError] = useState('')

  const handleResend = async () => {
    setResendLoading(true)
    setResendError('')
    const { error } = await resendVerificationEmail()
    setResendLoading(false)
    if (error) {
      setResendError(error)
    } else {
      setResendSent(true)
    }
  }

  const handleSubmit = () => {
    setLoading(true)
    setSubmittedWithBoost(wantBoost)
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
      setWantBoost(false)
      setSubmittedWithBoost(false)
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
      title={!isEmailVerified ? 'Verify your email' : submitted ? undefined : 'Quick Apply'}
      showClose={!submitted}
      footer={
        !isEmailVerified ? (
          <button
            onClick={handleClose}
            style={{
              width: '100%',
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
            Close
          </button>
        ) : submitted ? (
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
              {loading ? (
                <>
                  <HourglassIcon size={14} /> Submitting...
                </>
              ) : wantBoost ? (
                <>
                  <RocketIcon size={14} /> Apply + Boost — $9.99
                </>
              ) : (
                <>
                  <LightningIcon size={14} /> Submit Application
                </>
              )}
            </button>
          </div>
        )
      }
    >
      {!isEmailVerified ? (
        <div className={styles.successState}>
          <div className={styles.successIcon}>
            <EnvelopeIcon size={48} />
          </div>
          <div className={styles.successTitle}>Check your inbox</div>
          <p className={styles.successBody}>
            You need to verify your email address before applying to jobs. We sent a link to{' '}
            <strong>{user?.email ?? 'your email'}</strong>.
          </p>
          {resendSent ? (
            <p
              style={{
                marginTop: 12,
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-success, #2d7a4f)',
                fontWeight: 'var(--kt-weight-medium)',
              }}
            >
              Verification email resent. Check your inbox!
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                background: 'var(--kt-primary)',
                color: 'var(--kt-text-on-primary)',
                border: 'none',
                borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                opacity: resendLoading ? 0.6 : 1,
              }}
            >
              {resendLoading ? 'Sending…' : 'Resend verification email'}
            </button>
          )}
          {resendError && (
            <p
              style={{
                marginTop: 8,
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-error, #c0392b)',
              }}
            >
              {resendError}
            </p>
          )}
        </div>
      ) : submitted ? (
        <div className={styles.successState}>
          <div className={styles.successIcon}>
            {submittedWithBoost ? <RocketIcon size={48} /> : <CelebrationIcon size={48} />}
          </div>
          <div className={styles.successTitle}>
            {submittedWithBoost ? 'Application Sent + Boosted!' : 'Application Sent!'}
          </div>
          <p className={styles.successBody}>
            Your application for <strong>{job.title}</strong> at <strong>{job.company.name}</strong>{' '}
            has been submitted. You'll be notified when they view your profile.
          </p>
          {submittedWithBoost && (
            <p
              style={{
                marginTop: 10,
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-olive-700)',
                fontWeight: 'var(--kt-weight-medium)',
                lineHeight: 1.5,
              }}
            >
              <RocketIcon size={14} /> Your application has been moved to the top of the employer's
              applicant list.
            </p>
          )}
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
            <div className={styles.workerAvatar}>{workerInitials}</div>
            <div className={styles.workerInfo}>
              <div className={styles.workerName}>{workerName}</div>
            </div>
            {/* Regulix Ready badge — not yet built */}
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

          {/* Boost toggle */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setWantBoost((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setWantBoost((prev) => !prev)
            }}
            style={{
              border: `1px solid ${wantBoost ? 'var(--kt-olive-300)' : 'var(--kt-border)'}`,
              borderRadius: 'var(--kt-radius-md)',
              padding: '14px 16px',
              background: wantBoost
                ? 'color-mix(in srgb, var(--kt-accent) 6%, var(--kt-surface))'
                : 'var(--kt-bg)',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <RocketIcon size={20} />
                <div>
                  <p
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      marginBottom: 3,
                    }}
                  >
                    Boost this application{' '}
                    <span style={{ color: 'var(--kt-olive-700)' }}>— $9.99</span>
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    Jump to the top of the employer's applicant list. One-time fee, billed at
                    submit.
                  </p>
                </div>
              </div>
              {/* Custom checkbox */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  flexShrink: 0,
                  border: `2px solid ${wantBoost ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                  background: wantBoost ? 'var(--kt-accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {wantBoost && <CheckSmallIcon size={11} color="white" />}
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
