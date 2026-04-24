import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Modal } from '../../components'
import { StatCard } from '../components/StatCard/StatCard'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { RecentApplicantsWidget } from '../components/RecentApplicantsWidget/RecentApplicantsWidget'
import { PipelineKanban } from '../components/PipelineKanban'
import { RegulixLogo } from '../components/RegulixLogo/RegulixLogo'
import {
  BriefcaseIcon,
  UsersIcon,
  PersonIcon,
  RocketIcon,
  CheckIcon,
  DotsHorizontalIcon,
  RegulixMarkIcon,
} from '../icons'
import { useAuth } from '../context/AuthContext'
import { getCompanyJobs, updateJob } from '../services/jobService'
import { getCompanyDashboardStats } from '../services/companyDashboardService'
import type { DashboardStat } from '../services/companyDashboardService'
import type { StatCardColor } from '../components/StatCard/StatCard'
import type { Job } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusLabel(status: Job['status']): string {
  if (status === 'active') return 'Open'
  if (status === 'paused') return 'Paused'
  return 'Closed'
}

function statusVariant(status: Job['status']): 'success' | 'warning' | 'secondary' {
  if (status === 'active') return 'success'
  if (status === 'paused') return 'warning'
  return 'secondary'
}

// ── Stat card config ─────────────────────────────────────────────────────────

const STAT_META: Record<
  DashboardStat['key'],
  { label: string; icon: React.ReactNode; color: StatCardColor }
> = {
  new_applicants_today: { label: 'New Applicants', icon: <PersonIcon />, color: 'navy' },
  screening: { label: 'Screening', icon: <CheckIcon />, color: 'navy' },
  pending_interviews: { label: 'Pending Interviews', icon: <UsersIcon />, color: 'navy' },
  final_round: { label: 'Final Round', icon: <BriefcaseIcon />, color: 'navy' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

const BoostIndicator: React.FC<{ boosted: boolean }> = ({ boosted }) => {
  if (!boosted) return null
  return <RocketIcon size={13} color="var(--kt-olive-600)" />
}

const ApplicantCount: React.FC<{ total: number; regulixReady: number }> = ({
  total,
  regulixReady,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 14, color: 'var(--kt-text)' }}>{total}</span>
    {regulixReady > 0 && (
      <>
        <span style={{ color: 'var(--kt-text-muted)', fontSize: 12 }}>·</span>
        <span style={{ fontSize: 14, color: 'var(--kt-text)' }}>{regulixReady}</span>
        <RegulixMarkIcon size={14} />
      </>
    )}
  </span>
)

type OverflowItem = {
  label: string
  danger?: boolean
  onClick: () => void
}

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
        style={{
          height: 27,
          width: 27,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: 'var(--kt-radius-md)',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--kt-text-muted)',
          fontFamily: 'var(--kt-font-sans)',
          flexShrink: 0,
        }}
        title="More actions"
      >
        <DotsHorizontalIcon size={13} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuPos.top,
              right: menuPos.right,
              background: 'var(--kt-surface)',
              border: '0.5px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              boxShadow: 'var(--kt-shadow-sm)',
              minWidth: 140,
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'var(--kt-font-sans)',
                  color: item.danger ? 'var(--kt-danger)' : 'var(--kt-text)',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
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

// ── Boost modal data ──────────────────────────────────────────────────────────

const boostTiers = [
  { days: 7, price: 35 },
  { days: 14, price: 65 },
  { days: 30, price: 120 },
] as const

// ── Main component ────────────────────────────────────────────────────────────

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const companyName: string = user?.user_metadata?.company_name ?? ''
  const companyIndustry: string = user?.user_metadata?.industry ?? ''
  const companySize: string = user?.user_metadata?.company_size ?? ''

  const [companyJobs, setCompanyJobs] = useState<Job[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStat[]>([])

  const [boostJobId, setBoostJobId] = useState<string | null>(null)
  const [boostDuration, setBoostDuration] = useState<7 | 14 | 30>(7)
  const [boostJobSuccess, setBoostJobSuccess] = useState(false)
  const [boostedJobIds, setBoostedJobIds] = useState<Set<string>>(new Set())

  const totalRegulixApplicants = companyJobs.reduce((s, j) => s + j.regulixReadyApplicants, 0)

  useEffect(() => {
    if (!user?.id) return
    getCompanyJobs(user.id).then(({ data }) => {
      if (data) setCompanyJobs(data)
    })
    getCompanyDashboardStats(user.id).then(({ data }) => {
      if (data) setDashboardStats(data)
    })
  }, [user?.id])

  const boostingJob = boostJobId ? companyJobs.find((j) => j.id === boostJobId) : null
  const boostPrice = boostTiers.find((t) => t.days === boostDuration)?.price ?? 35

  const handleBoostJobClick = (jobId: string) => {
    setBoostJobId(jobId)
    setBoostJobSuccess(false)
    setBoostDuration(7)
  }

  const handleBoostJobConfirm = () => setBoostJobSuccess(true)

  const handleBoostJobClose = () => {
    if (boostJobSuccess && boostJobId) {
      setBoostedJobIds((prev) => new Set([...prev, boostJobId]))
    }
    setBoostJobId(null)
    setBoostJobSuccess(false)
  }

  const handleStatusChange = async (jobId: string, status: Job['status']) => {
    const { error } = await updateJob(jobId, { status })
    if (!error) {
      setCompanyJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)))
    }
  }

  const stats = dashboardStats.map((s) => {
    const meta = STAT_META[s.key]
    return {
      label: meta.label,
      value: s.value,
      icon: meta.icon,
      color: meta.color,
      trend: undefined,
      subtext: undefined,
      subtextNode:
        s.key === 'new_applicants_today' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-white)' }}>
              {s.subtext?.split(' ')[0]}
            </span>
            <RegulixLogo height={14} />
          </span>
        ) : undefined,
    }
  })

  // Dashboard module: open + paused only, max 5, newest first
  const activeJobRows = companyJobs
    .filter((j) => j.status === 'active' || j.status === 'paused')
    .slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <div
        style={{
          maxWidth: 'var(--kt-layout-max-width)',
          margin: '0 auto',
          padding: '28px var(--kt-space-6)',
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
        }}
      >
        {/* ---- Main ---- */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Pipeline kanban — cross-job, active stages only */}
          {user?.id && <PipelineKanban companyId={user.id} />}

          {/* Recent applicants — cross-job widget, active stages only */}
          {user?.id && (
            <RecentApplicantsWidget
              companyId={user.id}
              lastSignInAt={user.last_sign_in_at ?? null}
            />
          )}

          {/* ── Active jobs module ─────────────────────────────────────── */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Module header */}
            <div
              style={{
                padding: '16px 24px',
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
                  fontSize: 'var(--kt-text-md)',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <BriefcaseIcon size={16} color="var(--kt-olive-700)" />
                Active jobs
              </h2>
              <Link
                to="/site/dashboard/jobs"
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-primary)',
                  textDecoration: 'none',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                View all jobs →
              </Link>
            </div>

            {/* ── Per-row grid (matches Recent Applicants widget) ────── */}
            {(() => {
              const COLS = '26% 90px 64px 56px 80px 48px minmax(150px, 1fr)'

              const rowBase: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: COLS,
                alignItems: 'center',
                columnGap: 10,
                padding: '10px 24px',
              }

              const thStyle: React.CSSProperties = {
                fontSize: 11,
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }

              const actionBtn = (label: string, onClick: () => void) => (
                <button
                  onClick={onClick}
                  style={{
                    height: 27,
                    padding: '0 10px',
                    border: '0.5px solid var(--kt-border)',
                    borderRadius: 'var(--kt-radius-md)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: 'var(--kt-font-sans)',
                    fontWeight: 'var(--kt-weight-medium)',
                    color: 'var(--kt-text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              )

              return (
                <div>
                  {/* Header row */}
                  <div
                    style={{
                      ...rowBase,
                      background: 'var(--kt-grey-100)',
                      borderBottom: '1px solid var(--kt-border)',
                      padding: '8px 24px',
                    }}
                  >
                    <span style={thStyle}>Job title</span>
                    <span style={thStyle}>Status</span>
                    <span style={thStyle}>Posted</span>
                    <span style={{ ...thStyle, justifySelf: 'center' }}>Views</span>
                    <span style={{ ...thStyle, justifySelf: 'center' }}>Applicants</span>
                    <span style={{ ...thStyle, justifySelf: 'center' }}>Boost</span>
                    <span />
                  </div>

                  {/* Empty state */}
                  {activeJobRows.length === 0 && (
                    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          color: 'var(--kt-text-muted)',
                          marginBottom: 12,
                        }}
                      >
                        No active job postings yet.
                      </p>
                      <Link to="/site/post-job" style={{ textDecoration: 'none' }}>
                        <Button variant="accent" size="sm">
                          Post your first job
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Data rows */}
                  {activeJobRows.map((job, i) => {
                    const isLast = i === activeJobRows.length - 1
                    const isBoosted = job.isSponsored || boostedJobIds.has(job.id)

                    const primaryAction =
                      job.status === 'active'
                        ? actionBtn('View applicants', () => navigate('/site/dashboard/jobs'))
                        : actionBtn('Resume', () => handleStatusChange(job.id, 'active'))

                    const overflowItems: OverflowItem[] =
                      job.status === 'active'
                        ? [
                            { label: 'Edit', onClick: () => navigate(`/site/post-job/${job.id}`) },
                            { label: 'Pause', onClick: () => handleStatusChange(job.id, 'paused') },
                            { label: 'Duplicate', onClick: () => {} },
                            { label: 'Boost', onClick: () => handleBoostJobClick(job.id) },
                            {
                              label: 'Close',
                              danger: true,
                              onClick: () => handleStatusChange(job.id, 'closed'),
                            },
                          ]
                        : [
                            { label: 'Edit', onClick: () => navigate(`/site/post-job/${job.id}`) },
                            { label: 'Duplicate', onClick: () => {} },
                            {
                              label: 'Close',
                              danger: true,
                              onClick: () => handleStatusChange(job.id, 'closed'),
                            },
                          ]

                    return (
                      <div
                        key={job.id}
                        style={{
                          ...rowBase,
                          borderBottom: isLast ? 'none' : '1px solid var(--kt-border)',
                        }}
                      >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <Link
                            to={`/site/dashboard/jobs/${job.id}`}
                            style={{ textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 'var(--kt-weight-bold)',
                                color: 'var(--kt-primary)',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {job.title}
                            </span>
                          </Link>
                        </div>
                        <div>
                          <Badge variant={statusVariant(job.status)} size="sm">
                            {statusLabel(job.status)}
                          </Badge>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, color: 'var(--kt-text-muted)' }}>
                            {formatShortDate(job.createdAt)}
                          </span>
                        </div>
                        <div style={{ justifySelf: 'center' }}>
                          <span style={{ fontSize: 14, color: 'var(--kt-text-muted)' }}>
                            {job.viewCount.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ justifySelf: 'center' }}>
                          <ApplicantCount
                            total={job.totalApplicants}
                            regulixReady={job.regulixReadyApplicants}
                          />
                        </div>
                        <div style={{ justifySelf: 'center' }}>
                          <BoostIndicator boosted={isBoosted} />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 6,
                          }}
                        >
                          {primaryAction}
                          <OverflowMenu items={overflowItems} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>

        {/* ---- Sidebar ---- */}
        <div
          style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Company Info */}
          <div
            style={{
              background: 'var(--kt-grey-50)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--kt-surface)',
                  color: 'var(--kt-navy-900)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--kt-weight-bold)',
                  fontSize: 'var(--kt-text-lg)',
                  flexShrink: 0,
                  border: '1px solid var(--kt-border)',
                }}
              >
                {companyName.charAt(0)}
              </div>
              <h2
                style={{
                  fontSize: 'var(--kt-text-md)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  margin: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {companyName}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Industry', value: companyIndustry },
                { label: 'Size', value: companySize ? `${companySize} employees` : '' },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--kt-text-xs)',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: 'var(--kt-text-muted)' }}>{row.label}</span>
                    <span
                      style={{
                        color: 'var(--kt-text)',
                        fontWeight: 'var(--kt-weight-medium)',
                        textAlign: 'right',
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              background: 'var(--kt-grey-50)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 12,
              }}
            >
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/site/post-job" style={{ textDecoration: 'none' }}>
                <Button variant="accent" size="sm" style={{ width: '100%' }}>
                  + Post a Job
                </Button>
              </Link>
              <Link to="/site/jobs" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%' }}>
                  Browse Worker Profiles
                </Button>
              </Link>
            </div>
          </div>

          {/* Regulix Ready Applicants */}
          <div
            style={{
              background: 'color-mix(in srgb, var(--kt-accent) 6%, var(--kt-surface))',
              borderRadius: 'var(--kt-radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <RegulixBadge size="lg" pulse />
            <div>
              <p
                style={{
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  fontSize: 'var(--kt-text-md)',
                  marginBottom: 6,
                }}
              >
                {totalRegulixApplicants} Regulix Ready Applicants In Your Pool
              </p>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  lineHeight: 1.5,
                }}
              >
                These workers have completed W-4, I-9, direct deposit, and drug screening. Zero
                onboarding paperwork.
              </p>
            </div>
            <Button variant="accent" size="md" style={{ width: '100%' }}>
              Filter by Regulix Ready
            </Button>
          </div>
        </div>
      </div>

      {/* ── Boost Job Modal ──────────────────────────────────────────── */}
      <Modal
        open={boostJobId !== null}
        onClose={handleBoostJobClose}
        size="sm"
        title={
          boostJobSuccess ? undefined : (
            <>
              <RocketIcon size={16} /> Boost Job Posting
            </>
          )
        }
        showClose={!boostJobSuccess}
        footer={
          boostJobSuccess ? (
            <button
              onClick={handleBoostJobClose}
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
                onClick={handleBoostJobClose}
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
                onClick={handleBoostJobConfirm}
                style={{
                  flex: 2,
                  padding: 'var(--kt-space-3)',
                  background: 'var(--kt-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--kt-radius-md)',
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                }}
              >
                Pay ${boostPrice} · Visa ****1234
              </button>
            </div>
          )
        }
      >
        {boostJobSuccess ? (
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
              Job Boosted!
            </p>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.6,
              }}
            >
              <strong>{boostingJob?.title}</strong> is now pinned to the top of search results for{' '}
              {boostDuration} days.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--kt-bg)',
                borderRadius: 'var(--kt-radius-md)',
                border: '1px solid var(--kt-border)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  marginBottom: 3,
                }}
              >
                {boostingJob?.title}
              </p>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                {boostingJob?.location} · ${boostingJob?.payMin}–${boostingJob?.payMax}/hr
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 10,
                }}
              >
                Boost duration
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {boostTiers.map((tier) => (
                  <button
                    key={tier.days}
                    onClick={() => setBoostDuration(tier.days)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      border: `2px solid ${boostDuration === tier.days ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                      borderRadius: 'var(--kt-radius-md)',
                      background:
                        boostDuration === tier.days ? 'var(--kt-primary-subtle)' : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--kt-text-md)',
                        fontWeight: 'var(--kt-weight-bold)',
                        color: 'var(--kt-text)',
                        marginBottom: 2,
                      }}
                    >
                      {tier.days}d
                    </p>
                    <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      ${tier.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                `Pinned to top of search results for ${boostDuration} days`,
                'Featured badge on your listing',
                'Priority placement in Regulix Ready worker feeds',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span
                    style={{
                      color: 'var(--kt-accent)',
                      fontWeight: 700,
                      fontSize: 14,
                      marginTop: 1,
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon size={14} />
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text)',
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'var(--kt-bg)',
                borderRadius: 'var(--kt-radius-md)',
                border: '1px solid var(--kt-border)',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    marginBottom: 2,
                  }}
                >
                  Charged to
                </p>
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  Visa ****1234
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    marginBottom: 2,
                  }}
                >
                  Total
                </p>
                <p
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  ${boostPrice}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
