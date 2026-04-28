import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Badge, Modal } from '../../components'
import { Progress } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import type { Job } from '../types'
import { useAuth } from '../context/AuthContext'
import { daysSince } from '../utils/date'
import { getJobById } from '../services/jobService'
import {
  getWorkerProfile,
  getDashboardApplications,
  getDashboardSavedJobs,
  getNewJobsForYou,
  getWorkerCompleteness,
  getRegulixNudgeData,
  dismissRegulixNudge,
  withdrawApplication,
  removeSavedJob,
  type WorkerProfileRow,
  type DashboardApplication,
  type DashboardSavedJob,
  type JobForYou,
  type WorkerCompleteness,
  type RegulixNudgeData,
} from '../services/workerService'
import {
  RocketIcon,
  CheckIcon,
  CloseIcon,
  SparkleIcon,
  BriefcaseIcon,
  BookmarkFilledIcon,
  PersonIcon,
  DotsHorizontalIcon,
} from '../icons'
import styles from './WorkerDashboard.module.css'

// ── Stage config ───────────────────────────────────────────────────────────────

type StageCfg = {
  variant: 'secondary' | 'info' | 'warning' | 'success'
  label: string
}

const STAGE_CFG: Record<DashboardApplication['stage'], StageCfg> = {
  Applied: { variant: 'secondary', label: 'Applied' },
  Reviewed: { variant: 'info', label: 'Reviewed' },
  Interview: { variant: 'warning', label: 'Interview' },
  Offer: { variant: 'success', label: 'Offer' },
  Closed: { variant: 'secondary', label: 'Closed' },
}

const WITHDRAW_REASONS = [
  'Accepted another offer',
  'Applied by mistake',
  'Position no longer a good fit',
  'Not available for the dates/schedule',
  'Other',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtApplied(iso: string): string {
  const d = daysSince(iso)
  if (d === 0) return 'Today'
  return `${d}d ago`
}

function fmtSaved(iso: string): string {
  const d = daysSince(iso)
  if (d === 0) return 'Saved today'
  return `Saved ${d}d ago`
}

// ── OverflowMenu (matches company table pattern) ───────────────────────────────

type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={styles.overflowBtn}
        title="More actions"
        type="button"
      >
        <DotsHorizontalIcon size={12} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className={[styles.overflowItem, item.danger ? styles.overflowItemDanger : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export const WorkerDashboard: React.FC = () => {
  const { user, isEmailVerified } = useAuth()

  // ── Data state ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<WorkerProfileRow | null>(null)
  const [completeness, setCompleteness] = useState<WorkerCompleteness | null>(null)
  const [applications, setApplications] = useState<DashboardApplication[]>([])
  const [savedJobs, setSavedJobs] = useState<DashboardSavedJob[]>([])
  const [newJobs, setNewJobs] = useState<JobForYou[]>([])
  const [newJobsIsFallback, setNewJobsIsFallback] = useState(false)
  const [nudgeData, setNudgeData] = useState<RegulixNudgeData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [nudgeDismissedLocally, setNudgeDismissedLocally] = useState(false)
  const [boostedAppIds, setBoostedAppIds] = useState<Set<string>>(new Set())

  // Boost modal
  const [boostAppId, setBoostAppId] = useState<string | null>(null)
  const [boostSuccess, setBoostSuccess] = useState(false)

  // Withdraw modal
  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [withdrawMessage, setWithdrawMessage] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  // Quick Apply (saved jobs)
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null)
  const [quickApplyOpen, setQuickApplyOpen] = useState(false)
  const [appliedFromDashboard, setAppliedFromDashboard] = useState<Set<string>>(new Set())

  // ── Data loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    Promise.all([
      getWorkerProfile(user.id),
      getDashboardApplications(user.id),
      getDashboardSavedJobs(user.id),
      getNewJobsForYou(user.id),
      getWorkerCompleteness(user.id),
      getRegulixNudgeData(user.id),
    ]).then(([profileRes, appsRes, savedRes, newJobsRes, completenessRes, nudgeRes]) => {
      if (profileRes.data) setProfile(profileRes.data)
      if (appsRes.error) setDataError(appsRes.error)
      setApplications(appsRes.data)
      setSavedJobs(savedRes.data)
      setNewJobs(newJobsRes.data)
      setNewJobsIsFallback(newJobsRes.isFallback)
      if (completenessRes.data) {
        setCompleteness({
          ...completenessRes.data,
          hasPhoto: !!profileRes.data?.avatar_url,
        })
      }
      if (nudgeRes.data) setNudgeData(nudgeRes.data)
    })
  }, [user])

  // ── Derived values ─────────────────────────────────────────────────────────
  const workerName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
    : ''
  const workerInitials = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : ''

  const incompleteItems = completeness
    ? [
        !completeness.hasSkills && {
          key: 'skills',
          prompt: 'Add your skills so employers can find you.',
          href: '/site/profile/edit',
        },
        !completeness.hasPhoto && {
          key: 'photo',
          prompt: 'Add a profile photo to stand out to employers.',
          href: '/site/profile/edit',
        },
        !completeness.hasWorkHistory && {
          key: 'work_history',
          prompt: 'Add past work experience to build employer trust.',
          href: '/site/profile/edit',
        },
        !completeness.hasCerts && {
          key: 'certifications',
          prompt: 'Add certifications to strengthen your profile.',
          href: '/site/profile/edit',
        },
      ].filter(Boolean)
    : []

  const showCompletenessModule = incompleteItems.length >= 2

  const showRegulixNudge =
    nudgeData !== null &&
    nudgeData.subState !== 'complete' &&
    !nudgeDismissedLocally &&
    (nudgeData.dismissedAt === null || daysSince(nudgeData.dismissedAt) >= 14)

  const profileCompletePct = profile?.profile_complete_pct ?? 0

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDismissNudge = useCallback(async () => {
    setNudgeDismissedLocally(true)
    if (user) await dismissRegulixNudge(user.id)
  }, [user])

  const handleBoostConfirm = () => setBoostSuccess(true)

  const handleBoostClose = () => {
    if (boostSuccess && boostAppId) {
      setBoostedAppIds((prev) => new Set([...prev, boostAppId]))
    }
    setBoostAppId(null)
    setBoostSuccess(false)
  }

  const handleWithdrawOpen = (appId: string) => {
    setWithdrawAppId(appId)
    setWithdrawReason('')
    setWithdrawMessage('')
  }

  const handleWithdrawConfirm = async () => {
    if (!withdrawAppId || !withdrawReason) return
    setWithdrawing(true)
    const { error } = await withdrawApplication(withdrawAppId, withdrawReason, withdrawMessage)
    setWithdrawing(false)
    if (!error) {
      setApplications((prev) => prev.filter((a) => a.id !== withdrawAppId))
      setWithdrawAppId(null)
    }
  }

  const handleQuickApply = useCallback(async (jobId: string) => {
    const { data } = await getJobById(jobId)
    if (data) {
      setQuickApplyJob(data)
      setQuickApplyOpen(true)
    }
  }, [])

  const handleQuickApplyDone = useCallback((jobId: string) => {
    setAppliedFromDashboard((prev) => new Set([...prev, jobId]))
    setQuickApplyOpen(false)
    setQuickApplyJob(null)
  }, [])

  const handleRemoveSaved = useCallback(async (savedJobId: string) => {
    setSavedJobs((prev) => prev.filter((s) => s.id !== savedJobId))
    await removeSavedJob(savedJobId)
  }, [])

  const boostingApp = boostAppId ? applications.find((a) => a.id === boostAppId) : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Email verification banner */}
      {!isEmailVerified && (
        <div
          style={{
            background: 'var(--kt-amber-subtle, #fffbeb)',
            borderBottom: '1px solid var(--kt-amber-border, #fde68a)',
            padding: '10px var(--kt-space-6)',
            fontSize: 12,
            color: 'var(--kt-amber-text, #92400e)',
            textAlign: 'center',
          }}
        >
          Please verify your email to unlock job applications. <strong>{user?.email}</strong>
        </div>
      )}

      {dataError && (
        <div
          style={{
            background: 'var(--kt-danger-subtle)',
            color: 'var(--kt-danger)',
            padding: '10px var(--kt-space-6)',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          {dataError}
        </div>
      )}

      {/* Page header */}
      <div
        style={{
          background: 'var(--kt-surface)',
          padding: '28px 0',
          borderBottom: '1px solid var(--kt-border)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--kt-layout-max-width)',
            margin: '0 auto',
            padding: '0 var(--kt-space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : 'var(--kt-primary)',
              color: 'var(--kt-primary-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'var(--kt-weight-bold)',
              fontSize: 'var(--kt-text-xl)',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={workerName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              workerInitials
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: 'var(--kt-text-xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  margin: 0,
                }}
              >
                Welcome back{workerName ? `, ${workerName.split(' ')[0]}` : ''}
              </h1>
              {profile?.is_regulix_ready && <RegulixBadge size="sm" />}
            </div>
            <p style={{ fontSize: 12, color: 'var(--kt-text-muted)', margin: 0 }}>
              {[
                profile?.primary_trade,
                profile?.city && profile?.region
                  ? `${profile.city}, ${profile.region}`
                  : profile?.city || profile?.region || null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link to="/site/profile/edit">
              <button type="button" className={styles.primaryAction}>
                Edit profile
              </button>
            </Link>
            <Link to={`/site/profile/${user?.id}`} style={{ textDecoration: 'none' }}>
              <button type="button" className={styles.primaryAction}>
                View profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          maxWidth: 'var(--kt-layout-max-width)',
          margin: '0 auto',
          padding: '28px var(--kt-space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ── Two-column section ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '65fr 35fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* ── My Applications ─────────────────────────────────────────── */}
          <div className={styles.tableCard}>
            {/* Header */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--kt-border)',
              }}
            >
              <h2
                style={{
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  fontSize: 13,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <BriefcaseIcon size={14} />
                My applications
              </h2>
              <Link
                to="/site/applications"
                style={{
                  fontSize: 12,
                  color: 'var(--kt-primary)',
                  textDecoration: 'none',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                View all →
              </Link>
            </div>

            {/* Column headers */}
            {applications.length > 0 && (
              <div className={`${styles.row} ${styles.headerRow} ${styles.appsRow}`}>
                <div>Job</div>
                <div>Stage</div>
                <div>Applied</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>
            )}

            {/* Empty state */}
            {applications.length === 0 && (
              <div className={styles.emptyRow}>
                No applications yet.{' '}
                <Link to="/site/jobs" style={{ color: 'var(--kt-primary)' }}>
                  Browse jobs →
                </Link>
              </div>
            )}

            {/* Rows */}
            {applications.map((app) => {
              const cfg = STAGE_CFG[app.stage]
              const isBoosted = app.isBoosted || boostedAppIds.has(app.id)
              const canAction = app.stage !== 'Offer' && app.stage !== 'Closed'

              const overflowItems: OverflowItem[] = []
              if (canAction) {
                if (!isBoosted) {
                  overflowItems.push({
                    label: 'Boost — $9.99',
                    onClick: () => {
                      setBoostAppId(app.id)
                      setBoostSuccess(false)
                    },
                  })
                }
                overflowItems.push({
                  label: 'Withdraw',
                  danger: true,
                  onClick: () => handleWithdrawOpen(app.id),
                })
              }

              return (
                <div
                  key={app.id}
                  className={`${styles.row} ${styles.appsRow} ${app.stage === 'Closed' ? styles.rowClosed : ''}`}
                >
                  <div className={styles.titleCell}>
                    <Link to={`/site/jobs/${app.jobId}`} className={styles.titleLink}>
                      {app.jobTitle}
                    </Link>
                    <div className={styles.subtitleText}>{app.companyName}</div>
                    {isBoosted && (
                      <div className={styles.boostedIndicator}>
                        <RocketIcon size={11} /> Boosted
                      </div>
                    )}
                  </div>

                  <div>
                    <Badge variant={cfg.variant} size="sm">
                      {cfg.label}
                    </Badge>
                  </div>

                  <div className={styles.metaText}>{fmtApplied(app.appliedAt)}</div>

                  <div className={styles.actionsCell}>
                    <Link to={`/site/jobs/${app.jobId}`} style={{ textDecoration: 'none' }}>
                      <button type="button" className={styles.primaryAction}>
                        View job
                      </button>
                    </Link>
                    {overflowItems.length > 0 && <OverflowMenu items={overflowItems} />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Right sidebar ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile Completeness */}
            {showCompletenessModule && (
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      margin: 0,
                    }}
                  >
                    Complete your profile
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 'var(--kt-weight-bold)',
                      color: 'var(--kt-olive-700)',
                    }}
                  >
                    {profileCompletePct}%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--kt-text-muted)', marginBottom: 12 }}>
                  Your profile is {profileCompletePct}% complete.
                </p>
                <Progress
                  value={profileCompletePct}
                  color={
                    profileCompletePct >= 90
                      ? 'success'
                      : profileCompletePct >= 60
                        ? 'warning'
                        : 'danger'
                  }
                  size="sm"
                  style={{ marginBottom: 16 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(incompleteItems as Array<{ key: string; prompt: string; href: string }>)
                    .slice(0, 3)
                    .map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        style={{
                          fontSize: 12,
                          color: 'var(--kt-primary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        <span
                          style={{
                            marginTop: 1,
                            width: 13,
                            height: 13,
                            borderRadius: '50%',
                            border: '1.5px solid var(--kt-border-strong)',
                            flexShrink: 0,
                            display: 'inline-block',
                          }}
                        />
                        {item.prompt}
                      </Link>
                    ))}
                </div>
                <div
                  style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--kt-border)' }}
                >
                  <Link
                    to={`/site/profile/${user?.id}`}
                    style={{
                      fontSize: 12,
                      color: 'var(--kt-text-muted)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <PersonIcon size={13} />
                    View full profile →
                  </Link>
                </div>
              </div>
            )}

            {/* Regulix Nudge */}
            {showRegulixNudge && nudgeData && (
              <div
                style={{
                  background: 'color-mix(in srgb, var(--kt-accent) 5%, var(--kt-surface))',
                  border: '1px solid color-mix(in srgb, var(--kt-accent) 18%, var(--kt-border))',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 20,
                  position: 'relative',
                }}
              >
                <button
                  onClick={handleDismissNudge}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--kt-text-muted)',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Dismiss"
                >
                  <CloseIcon size={14} />
                </button>
                <RegulixBadge size="sm" />
                {nudgeData.subState === 'connect' ? (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-text)',
                        marginTop: 12,
                        marginBottom: 6,
                      }}
                    >
                      Connect your Regulix account
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--kt-text-muted)',
                        marginBottom: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      Become Day-1 hire-ready. Complete your W-4, I-9, direct deposit, and
                      background check.
                    </p>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      style={{
                        width: '100%',
                        height: 30,
                        fontSize: 12,
                        background: 'var(--kt-accent)',
                        color: 'white',
                        border: 'none',
                      }}
                    >
                      Connect Regulix
                    </button>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-text)',
                        marginTop: 12,
                        marginBottom: 6,
                      }}
                    >
                      Import your Regulix reviews
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--kt-text-muted)',
                        marginBottom: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      Bring your employer ratings into krewtree to stand out to new employers.
                    </p>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      style={{
                        width: '100%',
                        height: 30,
                        fontSize: 12,
                        background: 'var(--kt-accent)',
                        color: 'white',
                        border: 'none',
                      }}
                    >
                      Import reviews
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Saved Jobs ──────────────────────────────────────────────────── */}
        <div className={styles.tableCard}>
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--kt-border)',
            }}
          >
            <h2
              style={{
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                fontSize: 13,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <BookmarkFilledIcon size={14} />
              Saved jobs
            </h2>
            <Link
              to="/site/saved-jobs"
              style={{
                fontSize: 12,
                color: 'var(--kt-primary)',
                textDecoration: 'none',
                fontWeight: 'var(--kt-weight-medium)',
              }}
            >
              View all →
            </Link>
          </div>

          {savedJobs.length === 0 && (
            <div className={styles.emptyRow}>
              No saved jobs yet.{' '}
              <Link to="/site/jobs" style={{ color: 'var(--kt-primary)' }}>
                Browse jobs →
              </Link>
            </div>
          )}

          {savedJobs.length > 0 && (
            <>
              <div className={`${styles.row} ${styles.headerRow} ${styles.savedRow}`}>
                <div>Job</div>
                <div>Status</div>
                <div>Saved</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>

              {savedJobs.map((sj) => {
                const isClosed = sj.staleness === 'closed'
                const isExpiring = sj.staleness === 'expiring_soon'
                const hasApplied = sj.hasApplied || appliedFromDashboard.has(sj.jobId)

                return (
                  <div
                    key={sj.id}
                    className={`${styles.row} ${styles.savedRow} ${isClosed ? styles.rowClosed : ''}`}
                  >
                    <div className={styles.titleCell}>
                      {isClosed ? (
                        <span className={styles.titleStruck}>{sj.jobTitle}</span>
                      ) : (
                        <Link to={`/site/jobs/${sj.jobId}`} className={styles.titleLink}>
                          {sj.jobTitle}
                        </Link>
                      )}
                      <div className={styles.subtitleText}>{sj.companyName}</div>
                    </div>

                    <div>
                      {isExpiring && (
                        <Badge variant="warning" size="sm">
                          Expiring soon
                        </Badge>
                      )}
                      {isClosed && (
                        <Badge variant="secondary" size="sm">
                          Closed
                        </Badge>
                      )}
                    </div>

                    <div className={styles.metaText}>{fmtSaved(sj.savedAt)}</div>

                    <div className={styles.actionsCell}>
                      {!isClosed &&
                        (hasApplied ? (
                          <span className={styles.appliedState}>
                            <CheckIcon size={12} /> Applied
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.primaryAction}
                            onClick={() => handleQuickApply(sj.jobId)}
                            style={
                              isExpiring
                                ? {
                                    background: 'var(--kt-primary)',
                                    color: 'var(--kt-primary-fg)',
                                    border: 'none',
                                  }
                                : undefined
                            }
                          >
                            Quick Apply
                          </button>
                        ))}
                      <OverflowMenu
                        items={[
                          {
                            label: 'Remove bookmark',
                            onClick: () => handleRemoveSaved(sj.id),
                          },
                        ]}
                      />
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* ── New Jobs For You ─────────────────────────────────────────────── */}
        <div className={styles.tableCard}>
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--kt-border)',
            }}
          >
            <h2
              style={{
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                fontSize: 13,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <SparkleIcon size={14} />
              New jobs for you
            </h2>
            <Link
              to="/site/jobs"
              style={{
                fontSize: 12,
                color: 'var(--kt-primary)',
                textDecoration: 'none',
                fontWeight: 'var(--kt-weight-medium)',
              }}
            >
              Browse all jobs →
            </Link>
          </div>

          {completeness && !completeness.hasSkills && (
            <div className={styles.emptyRow}>
              Add your skills to your profile to get personalised job recommendations.{' '}
              <Link to="/site/profile/edit" style={{ color: 'var(--kt-primary)' }}>
                Add skills →
              </Link>
            </div>
          )}

          {(!completeness || completeness.hasSkills) && (
            <>
              {newJobsIsFallback && newJobs.length > 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--kt-text-muted)',
                    padding: '10px 20px 0',
                    margin: 0,
                  }}
                >
                  We couldn't find any direct matches, but you might be interested in:
                </p>
              )}
              {newJobs.length === 0 && (
                <div className={styles.emptyRow}>
                  No new jobs available right now.{' '}
                  <Link to="/site/jobs" style={{ color: 'var(--kt-primary)' }}>
                    Browse all →
                  </Link>
                </div>
              )}
              {newJobs.map((job, i) => (
                <Link
                  key={job.jobId}
                  to={`/site/jobs/${job.jobId}`}
                  style={{
                    textDecoration: 'none',
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: i < newJobs.length - 1 ? '1px solid var(--kt-border)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--kt-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--kt-navy-900)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--kt-sand-300)',
                      fontWeight: 'var(--kt-weight-bold)',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {job.companyName.charAt(0)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--kt-weight-bold)',
                        color: 'var(--kt-primary)',
                        marginBottom: 1,
                      }}
                    >
                      {job.jobTitle}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--kt-text-muted)' }}>
                      {job.companyName} · {job.location}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--kt-text-muted)' }}>→</span>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Boost Modal ──────────────────────────────────────────────────────── */}
      <Modal
        open={boostAppId !== null}
        onClose={handleBoostClose}
        size="sm"
        title={
          boostSuccess ? undefined : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RocketIcon size={16} /> Boost your application
            </span>
          )
        }
        showClose={!boostSuccess}
        footer={
          boostSuccess ? (
            <button onClick={handleBoostClose} style={modalPrimaryBtnStyle}>
              Done
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
              <button onClick={handleBoostClose} style={modalSecondaryBtnStyle}>
                Cancel
              </button>
              <button onClick={handleBoostConfirm} style={modalPrimaryBtnStyle}>
                Pay $9.99
              </button>
            </div>
          )
        }
      >
        {boostSuccess ? (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ marginBottom: 12 }}>
              <RocketIcon size={48} />
            </div>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                marginBottom: 8,
              }}
            >
              Application boosted!
            </p>
            <p style={{ fontSize: 13, color: 'var(--kt-text-muted)', lineHeight: 1.6 }}>
              Your application for <strong>{boostingApp?.jobTitle}</strong> at{' '}
              <strong>{boostingApp?.companyName}</strong> has been moved to the top of the list.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--kt-bg)',
                borderRadius: 'var(--kt-radius-md)',
                border: '0.5px solid var(--kt-border)',
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  marginBottom: 3,
                }}
              >
                {boostingApp?.jobTitle}
              </p>
              <p style={{ fontSize: 12, color: 'var(--kt-text-muted)' }}>
                {boostingApp?.companyName}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 'var(--kt-text-3xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  lineHeight: 1,
                }}
              >
                $9.99
              </p>
              <p style={{ fontSize: 12, color: 'var(--kt-text-muted)', marginTop: 4 }}>
                One-time boost fee
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                "Move to the top of the employer's applicant list",
                'Stay pinned for 7 days',
                'Boost badge visible on your application',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span
                    style={{
                      color: 'var(--kt-primary)',
                      fontSize: 14,
                      marginTop: 1,
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon size={14} />
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--kt-text)', lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Withdraw Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={withdrawAppId !== null}
        onClose={() => setWithdrawAppId(null)}
        size="sm"
        title="Withdraw application"
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button onClick={() => setWithdrawAppId(null)} style={modalSecondaryBtnStyle}>
              Cancel
            </button>
            <button
              onClick={handleWithdrawConfirm}
              disabled={!withdrawReason || withdrawing}
              style={{
                ...modalPrimaryBtnStyle,
                background: 'var(--kt-danger)',
                opacity: !withdrawReason || withdrawing ? 0.5 : 1,
                cursor: !withdrawReason || withdrawing ? 'not-allowed' : 'pointer',
              }}
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 'var(--kt-weight-medium)',
                color: 'var(--kt-text)',
                marginBottom: 8,
              }}
            >
              Reason <span style={{ color: 'var(--kt-danger)' }}>*</span>
            </label>
            <select
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                background: 'var(--kt-surface)',
                color: 'var(--kt-text)',
                fontSize: 13,
                fontFamily: 'var(--kt-font-sans)',
                outline: 'none',
              }}
            >
              <option value="">Select a reason</option>
              {WITHDRAW_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 'var(--kt-weight-medium)',
                color: 'var(--kt-text)',
                marginBottom: 8,
              }}
            >
              Message to company{' '}
              <span style={{ color: 'var(--kt-text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={withdrawMessage}
              onChange={(e) => setWithdrawMessage(e.target.value)}
              placeholder="Let the company know why you're withdrawing…"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                background: 'var(--kt-surface)',
                color: 'var(--kt-text)',
                fontSize: 13,
                fontFamily: 'var(--kt-font-sans)',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Quick Apply Modal ────────────────────────────────────────────────── */}
      <QuickApplyModal
        job={quickApplyJob}
        open={quickApplyOpen}
        onClose={() => {
          setQuickApplyOpen(false)
          setQuickApplyJob(null)
        }}
        onApplied={handleQuickApplyDone}
      />
    </div>
  )
}

// ── Modal button styles ────────────────────────────────────────────────────────

const modalPrimaryBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: 'var(--kt-space-3)',
  background: 'var(--kt-primary)',
  color: 'var(--kt-text-on-primary)',
  border: 'none',
  borderRadius: 'var(--kt-radius-md)',
  fontSize: 13,
  fontWeight: 'var(--kt-weight-semibold)',
  cursor: 'pointer',
  fontFamily: 'var(--kt-font-sans)',
}

const modalSecondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: 'var(--kt-space-3)',
  background: 'transparent',
  color: 'var(--kt-text)',
  border: '0.5px solid var(--kt-border)',
  borderRadius: 'var(--kt-radius-md)',
  fontSize: 13,
  fontWeight: 'var(--kt-weight-medium)',
  cursor: 'pointer',
  fontFamily: 'var(--kt-font-sans)',
}
