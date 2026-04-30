import React, { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import successAnimation from './success-animation.json'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../../components'
import type { Job } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { submitApplication } from '../../services/jobService'
import {
  HourglassIcon,
  RocketIcon,
  CelebrationIcon,
  LightningIcon,
  CheckSmallIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  BellIcon,
  MessageIcon,
  CheckCircleIcon,
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
  const navigate = useNavigate()
  const [coverNote, setCoverNote] = useState('')
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wantBoost, setWantBoost] = useState(false)
  const [submittedWithBoost, setSubmittedWithBoost] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendError, setResendError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    setQuestionAnswers(job?.preInterviewQuestions?.map(() => '') ?? [])
  }, [job?.id])

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

  const handleSubmit = async () => {
    if (!job || !user) return
    setLoading(true)
    setSubmitError('')
    setSubmittedWithBoost(wantBoost)
    const answers = (job.preInterviewQuestions ?? []).map((question, i) => ({
      question,
      answer: questionAnswers[i] ?? '',
    }))
    const { error } = await submitApplication(job.id, user.id, coverNote, wantBoost, answers)
    setLoading(false)
    if (error === 'already_applied') {
      setSubmittedWithBoost(false)
      setAlreadyApplied(true)
      setSubmitted(true)
      onApplied?.(job.id)
      return
    }
    if (error) {
      setSubmitError(error)
      setSubmittedWithBoost(false)
      return
    }
    setSubmitted(true)
    onApplied?.(job.id)
  }

  const handleClose = () => {
    onClose()
    // Reset after animation
    setTimeout(() => {
      setSubmitted(false)
      setAlreadyApplied(false)
      setCoverNote('')
      setQuestionAnswers(job?.preInterviewQuestions?.map(() => '') ?? [])
      setWantBoost(false)
      setSubmittedWithBoost(false)
      setSubmitError('')
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
      mobileDrawer
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
          <div className={styles.footerRow}>
            {!alreadyApplied && (
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  handleClose()
                  navigate('/site/jobs')
                }}
              >
                Browse Jobs
              </button>
            )}
            <button className={styles.submitBtn} onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <div className={styles.footerActions}>
            <div className={styles.footerRow}>
              <button className={styles.cancelBtn} onClick={handleClose}>
                Cancel
              </button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
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
        alreadyApplied ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CelebrationIcon size={48} />
            </div>
            <div className={styles.successTitle}>Already Applied</div>
            <p className={styles.successBody}>
              {`You've already applied for ${job.title} at ${job.company.name}. We'll notify you when they view your profile.`}
            </p>
          </div>
        ) : (
          <div className={styles.confirmState}>
            <div className={styles.confirmIconWrap}>
              {submittedWithBoost ? (
                <RocketIcon size={40} color="var(--kt-olive-700)" />
              ) : (
                <Lottie
                  animationData={successAnimation}
                  loop={false}
                  style={{ width: 80, height: 80 }}
                />
              )}
            </div>
            <div className={styles.confirmTitle}>
              {submittedWithBoost ? 'Application Sent + Boosted!' : 'Application Sent!'}
            </div>
            <p className={styles.confirmSubtitle}>
              {submittedWithBoost
                ? 'Your application has been moved to the top of the employer\u2019s list.'
                : 'Your application is on its way. Here\u2019s what to expect next.'}
            </p>
            <div className={styles.confirmJobCard}>
              <div className={styles.logoCircle}>{companyInitials}</div>
              <div className={styles.confirmJobInfo}>
                <div className={styles.jobTitle}>{job.title}</div>
                <div className={styles.jobMeta}>
                  {job.company.name} · {job.location}
                </div>
              </div>
              <CheckCircleIcon size={18} color="var(--kt-success, #2d7a4f)" />
            </div>
            <div className={styles.confirmSteps}>
              <div className={styles.sectionLabel}>What happens next</div>
              {[
                {
                  icon: <BriefcaseIcon size={16} />,
                  label: 'Employer reviews your profile',
                  body: 'Your full profile, work history, and Regulix verification are visible to the hiring manager.',
                },
                {
                  icon: <BellIcon size={16} />,
                  label: "You're notified when they view it",
                  body: "We'll send you a notification as soon as they open your application.",
                },
                {
                  icon: <MessageIcon size={16} />,
                  label: 'They reach out if interested',
                  body: 'If selected, the employer will message you through krewtree to set up next steps.',
                },
              ].map((step, i) => (
                <div key={i} className={styles.confirmStep}>
                  <div className={styles.confirmStepIcon}>{step.icon}</div>
                  <div>
                    <div className={styles.confirmStepLabel}>{step.label}</div>
                    <div className={styles.confirmStepBody}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <>
          {/* Job Header */}
          <div className={styles.jobHeaderWrap}>
            <div className={styles.sectionLabel}>You're applying for</div>
            <div className={styles.jobHeader}>
              <div className={styles.logoCircle}>{companyInitials}</div>
              <div>
                <div className={styles.jobTitle}>{job.title}</div>
                <div className={styles.jobMeta}>
                  {job.company.name} · {job.location} · {job.type}
                </div>
              </div>
            </div>
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
          </div>

          <div className={styles.tip} style={{ marginBottom: 'var(--kt-space-5)' }}>
            Your full profile, work history, and Regulix verification are included automatically.
          </div>

          {/* Pre-interview questions */}
          {job.preInterviewQuestions && job.preInterviewQuestions.length > 0 && (
            <div className={styles.questionsSection}>
              <div className={styles.sectionLabel}>Questions from the employer</div>
              {job.preInterviewQuestions.map((question, i) => (
                <div key={i} className={styles.questionItem}>
                  <label className={styles.questionLabel}>{question}</label>
                  <textarea
                    value={questionAnswers[i] ?? ''}
                    onChange={(e) => {
                      const next = [...questionAnswers]
                      next[i] = e.target.value
                      setQuestionAnswers(next)
                    }}
                    placeholder="Your answer"
                    rows={3}
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
                </div>
              ))}
            </div>
          )}

          {submitError && (
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-error, #c0392b)',
              }}
            >
              {submitError}
            </p>
          )}

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
                alignItems: 'flex-start',
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
