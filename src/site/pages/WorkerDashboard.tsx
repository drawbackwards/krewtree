import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Modal, Progress, Divider } from '../../components'
import { StatCard } from '../components/StatCard/StatCard'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { currentWorker, myApplications, applicationEvents, jobs, savedJobs } from '../data/mock'

const statusConfig: Record<
  string,
  { variant: 'success' | 'info' | 'warning' | 'danger' | 'secondary'; label: string }
> = {
  Applied: { variant: 'secondary', label: 'Applied' },
  Viewed: { variant: 'info', label: 'Viewed' },
  Interviewing: { variant: 'warning', label: 'Interviewing' },
  Offer: { variant: 'success', label: 'Offer' },
  Rejected: { variant: 'danger', label: 'Rejected' },
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill={filled ? 'var(--kt-warning)' : 'none'}
    stroke={filled ? 'var(--kt-warning)' : 'var(--kt-border-strong)'}
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
)

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const RocketIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)

const profileChecklist = [
  { label: 'Basic Info', done: true },
  { label: 'Work Experience', done: true },
  { label: 'Skills', done: true },
  { label: 'Regulix Verified', done: currentWorker.isRegulixReady },
  { label: 'Profile Photo', done: false },
]

const timelineStatusIcon: Record<string, string> = {
  Applied: '📋',
  Viewed: '👁️',
  Interviewing: '🗓️',
  Offer: '🎉',
  Rejected: '❌',
}

// Recommended: jobs matching worker's industries, not already applied
const appliedJobIds = new Set(myApplications.map((a) => a.jobId))
const recommendedJobs = jobs
  .filter((j) => currentWorker.industries.includes(j.industry) && !appliedJobIds.has(j.id))
  .slice(0, 3)

export const WorkerDashboard: React.FC = () => {
  const [selectedBoostId, setSelectedBoostId] = useState<string | null>(null)
  const [boostPayMethod, setBoostPayMethod] = useState<'apple' | 'zelle'>('apple')
  const [boostSuccess, setBoostSuccess] = useState(false)
  const [boostedAppIds, setBoostedAppIds] = useState<Set<string>>(new Set())
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null)

  const boostingApp = selectedBoostId ? myApplications.find((a) => a.id === selectedBoostId) : null

  const handleBoostClick = (appId: string) => {
    setSelectedBoostId(appId)
    setBoostSuccess(false)
    setBoostPayMethod('apple')
  }

  const handleBoostConfirm = () => {
    setBoostSuccess(true)
  }

  const handleBoostClose = () => {
    if (boostSuccess && selectedBoostId) {
      setBoostedAppIds((prev) => new Set([...prev, selectedBoostId]))
    }
    setSelectedBoostId(null)
    setBoostSuccess(false)
  }

  const stats = [
    {
      label: 'Applications',
      value: myApplications.length,
      icon: <BriefcaseIcon />,
      color: 'primary' as const,
      trend: { direction: 'up' as const, value: '+2 this week' },
    },
    {
      label: 'Profile Views',
      value: 47,
      icon: <EyeIcon />,
      color: 'accent' as const,
      trend: { direction: 'up' as const, value: '+12 vs last week' },
    },
    {
      label: 'Interviews',
      value: myApplications.filter((a) => a.status === 'Interviewing').length,
      icon: <TrendingUpIcon />,
      color: 'info' as const,
      trend: { direction: 'flat' as const, value: 'No change' },
    },
    {
      label: 'Offers',
      value: myApplications.filter((a) => a.status === 'Offer').length,
      icon: <CheckCircleIcon />,
      color: 'success' as const,
      trend: { direction: 'up' as const, value: 'New offer!' },
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Page header */}
      <div
        style={{
          background: 'var(--kt-surface)',
          padding: '28px var(--kt-space-6)',
          borderBottom: '1px solid var(--kt-border)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--kt-primary)',
                color: 'var(--kt-primary-fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-xl)',
                border: '2px solid var(--kt-border)',
              }}
            >
              {currentWorker.initials}
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
                  Welcome back, {currentWorker.name.split(' ')[0]}
                </h1>
                {currentWorker.isRegulixReady && <RegulixBadge size="sm" />}
              </div>
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                {currentWorker.headline} · {currentWorker.location}
              </p>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link to="/site/profile/edit">
              <Button variant="outline" size="sm">
                Edit profile
              </Button>
            </Link>
            <Link to={`/site/profile/${currentWorker.id}`}>
              <Button variant="ghost" size="sm">
                View profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '28px var(--kt-space-6)',
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
        }}
      >
        {/* ---- Main ---- */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Regulix CTA — only if not ready */}
          {!currentWorker.isRegulixReady && (
            <div
              style={{
                background: 'color-mix(in srgb, var(--kt-accent) 6%, var(--kt-surface))',
                border: '1px solid color-mix(in srgb, var(--kt-accent) 20%, var(--kt-border))',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <RegulixBadge size="lg" pulse />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    fontSize: 'var(--kt-text-md)',
                    marginBottom: 4,
                  }}
                >
                  Get Regulix Ready — Stand out to employers
                </p>
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  Complete your W-4, I-9, direct deposit, and background check. Become Day-1
                  hire-ready.
                </p>
              </div>
              <Button variant="accent" size="md">
                Start Regulix →
              </Button>
            </div>
          )}

          {/* Applications Table */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
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
                }}
              >
                My Applications
              </h2>
              <Link
                to="/site/jobs"
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-accent)',
                  textDecoration: 'none',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                Browse More Jobs →
              </Link>
            </div>

            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '10px 24px',
                borderBottom: '1px solid var(--kt-border)',
                background: 'var(--kt-bg)',
              }}
            >
              {['Job', 'Status', 'Applied', 'Actions'].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {myApplications.map((app, i) => {
              const cfg = statusConfig[app.status]
              const isLast = i === myApplications.length - 1
              const isExpanded = expandedAppId === app.id
              const events = applicationEvents.filter((e) => e.applicationId === app.id)
              return (
                <React.Fragment key={app.id}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      padding: '14px 24px',
                      alignItems: 'center',
                      borderBottom: !isExpanded && isLast ? 'none' : '1px solid var(--kt-border)',
                      background:
                        app.status === 'Offer'
                          ? 'color-mix(in srgb, var(--kt-success) 5%, transparent)'
                          : 'transparent',
                    }}
                  >
                    {/* Job info */}
                    <div>
                      <Link to={`/site/jobs/${app.jobId}`} style={{ textDecoration: 'none' }}>
                        <p
                          style={{
                            fontSize: 'var(--kt-text-sm)',
                            fontWeight: 'var(--kt-weight-medium)',
                            color: 'var(--kt-text)',
                            marginBottom: 2,
                          }}
                        >
                          {app.job.title}
                        </p>
                      </Link>
                      <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                        {app.job.company.name} · {app.job.location}
                      </p>
                      {(app.isBoosted || boostedAppIds.has(app.id)) && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 4,
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-olive-700)',
                            fontWeight: 'var(--kt-weight-medium)',
                          }}
                        >
                          <RocketIcon /> Boosted
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <Badge variant={cfg.variant} size="sm" dot>
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Applied */}
                    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                      {app.appliedDaysAgo === 0 ? 'Today' : `${app.appliedDaysAgo}d ago`}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {app.status === 'Offer' && (
                        <Button variant="accent" size="sm" onClick={() => {}}>
                          View Offer
                        </Button>
                      )}
                      {!app.isBoosted &&
                        !boostedAppIds.has(app.id) &&
                        app.status !== 'Rejected' &&
                        app.status !== 'Offer' && (
                          <button
                            onClick={() => handleBoostClick(app.id)}
                            style={{
                              fontSize: 'var(--kt-text-xs)',
                              color: 'var(--kt-olive-700)',
                              background: 'transparent',
                              border: '1px solid var(--kt-olive-300)',
                              borderRadius: 'var(--kt-radius-sm)',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontFamily: 'var(--kt-font-sans)',
                              fontWeight: 'var(--kt-weight-medium)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <RocketIcon /> Boost
                          </button>
                        )}
                      <button
                        onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          background: 'transparent',
                          border: '1px solid var(--kt-border)',
                          borderRadius: 'var(--kt-radius-sm)',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontFamily: 'var(--kt-font-sans)',
                        }}
                        title="View timeline"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '12px 24px 16px',
                        background: 'var(--kt-bg)',
                        borderBottom: isLast ? 'none' : '1px solid var(--kt-border)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          color: 'var(--kt-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: 12,
                        }}
                      >
                        Application Timeline
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {events.map((ev, ei) => (
                          <div
                            key={ev.id}
                            style={{ display: 'flex', gap: 12, position: 'relative' }}
                          >
                            {/* Connector line */}
                            {ei < events.length - 1 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 12,
                                  top: 24,
                                  bottom: 0,
                                  width: 2,
                                  background: 'var(--kt-border)',
                                }}
                              />
                            )}
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'var(--kt-surface)',
                                border: '2px solid var(--kt-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                flexShrink: 0,
                                zIndex: 1,
                              }}
                            >
                              {timelineStatusIcon[ev.status]}
                            </div>
                            <div style={{ paddingBottom: 14 }}>
                              <p
                                style={{
                                  fontSize: 'var(--kt-text-xs)',
                                  fontWeight: 'var(--kt-weight-semibold)',
                                  color: 'var(--kt-text)',
                                  marginBottom: 1,
                                }}
                              >
                                {ev.status}
                              </p>
                              <p
                                style={{
                                  fontSize: 'var(--kt-text-xs)',
                                  color: 'var(--kt-text-muted)',
                                }}
                              >
                                {ev.note} ·{' '}
                                {ev.occurredDaysAgo === 0 ? 'Today' : `${ev.occurredDaysAgo}d ago`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Recommended Jobs */}
          {recommendedJobs.length > 0 && (
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '18px 24px',
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
                  }}
                >
                  ✨ Recommended for You
                </h2>
                <Link
                  to="/site/jobs"
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-accent)',
                    textDecoration: 'none',
                    fontWeight: 'var(--kt-weight-medium)',
                  }}
                >
                  See all →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recommendedJobs.map((job, i) => (
                  <Link
                    key={job.id}
                    to={`/site/jobs/${job.id}`}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 24px',
                      borderBottom:
                        i < recommendedJobs.length - 1 ? '1px solid var(--kt-border)' : 'none',
                      background: 'transparent',
                      transition: 'background var(--kt-duration-fast)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--kt-surface-raised)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'var(--kt-navy-900)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--kt-sand-300)',
                        fontWeight: 'var(--kt-weight-bold)',
                        fontSize: 'var(--kt-text-md)',
                        flexShrink: 0,
                      }}
                    >
                      {job.company.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          color: 'var(--kt-text)',
                          marginBottom: 2,
                        }}
                      >
                        {job.title}
                      </p>
                      <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                        {job.company.name} · {job.location} · ${job.payMin}–${job.payMax}/hr
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Badge variant="secondary" size="sm">
                        {job.type}
                      </Badge>
                      {job.isSponsored && (
                        <Badge variant="accent" size="sm">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Performance */}
          {currentWorker.performanceScore && (
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  fontSize: 'var(--kt-text-md)',
                  marginBottom: 16,
                }}
              >
                Performance Score
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: '3px solid var(--kt-olive-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--kt-text-xl)',
                      fontWeight: 'var(--kt-weight-bold)',
                      color: 'var(--kt-olive-700)',
                    }}
                  >
                    {currentWorker.performanceScore}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <StarIcon key={n} filled={n <= Math.round(currentWorker.performanceScore!)} />
                    ))}
                  </div>
                  <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                    Based on {currentWorker.ratingCount} employer ratings
                    {currentWorker.totalHoursWorked &&
                      ` · ${currentWorker.totalHoursWorked.toLocaleString()} hours worked`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        <div
          style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Profile Completion */}
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
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                }}
              >
                Profile Strength
              </h3>
              <span
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-olive-700)',
                }}
              >
                {currentWorker.profileCompletePct}%
              </span>
            </div>
            <Progress
              value={currentWorker.profileCompletePct}
              color={
                currentWorker.profileCompletePct >= 90
                  ? 'success'
                  : currentWorker.profileCompletePct >= 60
                    ? 'warning'
                    : 'danger'
              }
              size="sm"
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profileChecklist.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: item.done ? 'var(--kt-success)' : 'var(--kt-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.done && (
                      <svg
                        width="9"
                        height="7"
                        viewBox="0 0 9 7"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M1 3.5l2.5 2.5 5-5" />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: item.done ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                      textDecoration: item.done ? 'none' : 'none',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Divider style={{ margin: '14px 0' }} />
            <Link
              to={`/site/profile/${currentWorker.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <Button variant="outline" size="sm" style={{ width: '100%' }}>
                View My Profile
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 12,
              }}
            >
              Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: `🔍 Browse Jobs`, to: '/site/jobs' },
                { label: `🔖 Saved Jobs (${savedJobs.length})`, to: '/site/saved-jobs' },
                { label: '💬 Messages', to: '/site/messages' },
                { label: '👤 Edit Profile', to: `/site/profile/${currentWorker.id}` },
                { label: '🎁 Referrals', to: '/site/referrals' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)',
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    textDecoration: 'none',
                    fontWeight: 'var(--kt-weight-medium)',
                    background: 'var(--kt-bg)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 12,
              }}
            >
              My Top Skills
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentWorker.skills.map((skill) => (
                <div key={skill.name}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        fontWeight: 'var(--kt-weight-medium)',
                        color: 'var(--kt-text)',
                      }}
                    >
                      {skill.name}
                    </span>
                    <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      {skill.level}
                    </span>
                  </div>
                  <Progress
                    value={skill.level === 'Expert' ? 95 : skill.level === 'Intermediate' ? 65 : 35}
                    color={skill.level === 'Expert' ? 'success' : 'primary'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Boost Modal ─────────────────────────────────────────────── */}
      <Modal
        open={selectedBoostId !== null}
        onClose={handleBoostClose}
        size="sm"
        title={boostSuccess ? undefined : '🚀 Boost Your Application'}
        showClose={!boostSuccess}
        footer={
          boostSuccess ? (
            <button
              onClick={handleBoostClose}
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
                onClick={handleBoostClose}
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
                onClick={handleBoostConfirm}
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
                Pay $9.99 via {boostPayMethod === 'apple' ? 'Apple Pay' : 'Zelle'}
              </button>
            </div>
          )
        }
      >
        {boostSuccess ? (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                marginBottom: 8,
              }}
            >
              Application Boosted!
            </p>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.6,
              }}
            >
              Your application for <strong>{boostingApp?.job.title}</strong> at{' '}
              <strong>{boostingApp?.job.company.name}</strong> has been moved to the top of the
              list.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Job summary */}
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
                {boostingApp?.job.title}
              </p>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                {boostingApp?.job.company.name} · {boostingApp?.job.location}
              </p>
            </div>

            {/* Price */}
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
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  marginTop: 4,
                }}
              >
                One-time boost fee
              </p>
            </div>

            {/* What you get */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                "Move to the top of the employer's applicant list",
                'Stay pinned for 7 days',
                'Boost badge shown on your application',
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
                    ✓
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

            {/* Payment method picker */}
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
                Pay with
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['apple', 'zelle'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setBoostPayMethod(method)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: `2px solid ${boostPayMethod === method ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                      borderRadius: 'var(--kt-radius-md)',
                      background:
                        boostPayMethod === method ? 'var(--kt-primary-subtle)' : 'transparent',
                      color: boostPayMethod === method ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-medium)',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {method === 'apple' ? '🍎 Apple Pay' : '💸 Zelle'}
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  marginTop: 10,
                  lineHeight: 1.5,
                }}
              >
                No card on file.{' '}
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--kt-accent)',
                    fontSize: 'inherit',
                    padding: 0,
                    textDecoration: 'underline',
                    fontFamily: 'var(--kt-font-sans)',
                  }}
                >
                  Add a card
                </button>{' '}
                to pay by credit or debit.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
