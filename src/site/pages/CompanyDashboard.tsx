import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Modal } from '../../components'
import { StatCard } from '../components/StatCard/StatCard'
import { WorkerCard } from '../components/WorkerCard/WorkerCard'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { KanbanBoard } from '../components/KanbanBoard/KanbanBoard'
import { AnalyticsPanel } from '../components/AnalyticsPanel/AnalyticsPanel'
import {
  currentCompany,
  companyJobs,
  recentApplicants,
  workers,
  kanbanApplicants,
  jobAnalytics,
} from '../data/mock'

const _PlusIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

const UsersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
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

const VerifiedIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--kt-accent)" stroke="none">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

const totalApplicants = companyJobs.reduce((sum, j) => sum + j.totalApplicants, 0)
const totalRegulixApplicants = companyJobs.reduce((sum, j) => sum + j.regulixReadyApplicants, 0)

const boostTiers = [
  { days: 7, price: 35 },
  { days: 14, price: 65 },
  { days: 30, price: 120 },
] as const

export const CompanyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applicants' | 'pipeline' | 'saved'>('applicants')
  const [expandedAnalyticsId, setExpandedAnalyticsId] = useState<string | null>(null)
  const savedWorkers = workers.filter((w) => w.isRegulixReady).slice(0, 2)

  const [boostJobId, setBoostJobId] = useState<string | null>(null)
  const [boostDuration, setBoostDuration] = useState<7 | 14 | 30>(7)
  const [boostJobSuccess, setBoostJobSuccess] = useState(false)
  const [boostedJobIds, setBoostedJobIds] = useState<Set<string>>(new Set())

  const boostingJob = boostJobId ? companyJobs.find((j) => j.id === boostJobId) : null
  const boostPrice = boostTiers.find((t) => t.days === boostDuration)?.price ?? 35

  const handleBoostJobClick = (jobId: string) => {
    setBoostJobId(jobId)
    setBoostJobSuccess(false)
    setBoostDuration(7)
  }

  const handleBoostJobConfirm = () => {
    setBoostJobSuccess(true)
  }

  const handleBoostJobClose = () => {
    if (boostJobSuccess && boostJobId) {
      setBoostedJobIds((prev) => new Set([...prev, boostJobId]))
    }
    setBoostJobId(null)
    setBoostJobSuccess(false)
  }

  const stats = [
    {
      label: 'Active Postings',
      value: companyJobs.filter((j) => j.status === 'active').length,
      icon: <BriefcaseIcon />,
      color: 'primary' as const,
      trend: { direction: 'flat' as const, value: 'No change' },
    },
    {
      label: 'Total Applicants',
      value: totalApplicants,
      icon: <UsersIcon />,
      color: 'info' as const,
      trend: { direction: 'up' as const, value: '+5 this week' },
    },
    {
      label: 'Regulix Ready',
      value: totalRegulixApplicants,
      icon: <CheckCircleIcon />,
      color: 'accent' as const,
      trend: { direction: 'up' as const, value: 'Best pool yet' },
    },
    {
      label: 'Job Views',
      value: 284,
      icon: <EyeIcon />,
      color: 'success' as const,
      trend: { direction: 'up' as const, value: '+18% vs last week' },
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--kt-surface)',
          borderBottom: '1px solid var(--kt-border)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '28px var(--kt-space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'var(--kt-grey-100)',
                color: 'var(--kt-navy-900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-xl)',
                flexShrink: 0,
                border: '1px solid var(--kt-border)',
              }}
            >
              {currentCompany.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <h1
                  style={{
                    fontSize: 'var(--kt-text-xl)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    margin: 0,
                  }}
                >
                  {currentCompany.name}
                </h1>
                {currentCompany.isVerified && <VerifiedIcon />}
              </div>
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                {currentCompany.industry} · {currentCompany.location} · {currentCompany.size}{' '}
                employees
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1280,
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

          {/* Regulix Promo Banner */}
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
                  marginBottom: 3,
                }}
              >
                {totalRegulixApplicants} Regulix Ready Applicants In Your Pool
              </p>
              <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                These workers have completed W-4, I-9, direct deposit, and drug screening. Zero
                onboarding paperwork.
              </p>
            </div>
            <Button variant="accent" size="md">
              Filter by Regulix Ready
            </Button>
          </div>

          {/* Active Jobs Table */}
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
                Active Job Postings
              </h2>
              <Link
                to="/site/post-job"
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-accent)',
                  textDecoration: 'none',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                + Add New
              </Link>
            </div>

            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2.2fr 1fr 1fr 1fr 80px 80px',
                padding: '10px 24px',
                borderBottom: '1px solid var(--kt-border)',
                background: 'var(--kt-bg)',
              }}
            >
              {['Job Title', 'Type', 'Views', 'Applicants', 'Status', ''].map((h) => (
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

            {companyJobs.map((job, i) => {
              const isLast = i === companyJobs.length - 1
              const analytics = jobAnalytics.find((a) => a.jobId === job.id)
              const isExpanded = expandedAnalyticsId === job.id
              return (
                <React.Fragment key={job.id}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.2fr 1fr 1fr 1fr 80px 80px',
                      padding: '14px 24px',
                      alignItems: 'center',
                      borderBottom: !isExpanded && isLast ? 'none' : '1px solid var(--kt-border)',
                    }}
                  >
                    <div>
                      <Link to={`/site/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                        <p
                          style={{
                            fontSize: 'var(--kt-text-sm)',
                            fontWeight: 'var(--kt-weight-medium)',
                            color: 'var(--kt-text)',
                            marginBottom: 2,
                          }}
                        >
                          {job.title}
                        </p>
                      </Link>
                      <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                        {job.location} · ${job.payMin}–${job.payMax}/hr
                      </p>
                      {job.isSponsored && (
                        <Badge variant="accent" size="sm" style={{ marginTop: 4 }}>
                          Featured
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" size="sm">
                      {job.type}
                    </Badge>
                    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                      {analytics?.viewsTotal.toLocaleString() ?? '—'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {job.regulixReadyApplicants > 0 && <RegulixBadge size="sm" />}
                      <span
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          color:
                            job.regulixReadyApplicants > 0
                              ? 'var(--kt-olive-700)'
                              : 'var(--kt-text)',
                          fontWeight: 'var(--kt-weight-medium)',
                        }}
                      >
                        {job.totalApplicants}
                      </span>
                    </div>
                    <Badge
                      variant={job.status === 'active' ? 'success' : 'secondary'}
                      size="sm"
                      dot
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {!job.isSponsored && !boostedJobIds.has(job.id) && (
                        <button
                          onClick={() => handleBoostJobClick(job.id)}
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-olive-700)',
                            background: 'transparent',
                            border: '1px solid var(--kt-olive-300)',
                            borderRadius: 'var(--kt-radius-sm)',
                            padding: '3px 7px',
                            cursor: 'pointer',
                            fontFamily: 'var(--kt-font-sans)',
                            fontWeight: 'var(--kt-weight-medium)',
                          }}
                          title="Boost this job"
                        >
                          🚀
                        </button>
                      )}
                      {(job.isSponsored || boostedJobIds.has(job.id)) && (
                        <span
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-olive-700)',
                            fontWeight: 'var(--kt-weight-medium)',
                          }}
                        >
                          🚀
                        </span>
                      )}
                      {analytics && (
                        <button
                          onClick={() => setExpandedAnalyticsId(isExpanded ? null : job.id)}
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                            background: 'transparent',
                            border: '1px solid var(--kt-border)',
                            borderRadius: 'var(--kt-radius-sm)',
                            padding: '3px 7px',
                            cursor: 'pointer',
                            fontFamily: 'var(--kt-font-sans)',
                          }}
                          title="View analytics"
                        >
                          {isExpanded ? '▲' : '📊'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && analytics && <AnalyticsPanel analytics={analytics} />}
                </React.Fragment>
              )
            })}
          </div>

          {/* Applicants / Saved Tabs */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--kt-border)',
                padding: '0 24px',
              }}
            >
              {(['applicants', 'pipeline', 'saved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '14px 16px',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight:
                      activeTab === tab ? 'var(--kt-weight-semibold)' : 'var(--kt-weight-normal)',
                    color: activeTab === tab ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: `2px solid ${activeTab === tab ? 'var(--kt-primary)' : 'transparent'}`,
                    fontFamily: 'var(--kt-font-sans)',
                    transition: 'all var(--kt-duration-fast)',
                    marginBottom: -1,
                  }}
                >
                  {tab === 'applicants'
                    ? 'Recent Applicants'
                    : tab === 'pipeline'
                      ? '🗂 Pipeline'
                      : 'Saved Workers'}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {activeTab === 'applicants' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {recentApplicants.map((worker, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        background: 'var(--kt-bg)',
                        borderRadius: 'var(--kt-radius-md)',
                        border: '1px solid var(--kt-border)',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'var(--kt-navy-800)',
                          color: 'var(--kt-sand-300)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--kt-weight-bold)',
                          fontSize: 'var(--kt-text-sm)',
                          flexShrink: 0,
                          border: worker.isPremium
                            ? '2px solid var(--kt-olive-400)'
                            : '1px solid var(--kt-border)',
                        }}
                      >
                        {worker.initials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Link
                            to={`/site/profile/${worker.id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <span
                              style={{
                                fontSize: 'var(--kt-text-sm)',
                                fontWeight: 'var(--kt-weight-semibold)',
                                color: 'var(--kt-text)',
                              }}
                            >
                              {worker.name}
                            </span>
                          </Link>
                          {worker.isRegulixReady && <RegulixBadge size="sm" />}
                        </div>
                        <p
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                            marginTop: 2,
                          }}
                        >
                          Applied for{' '}
                          <strong>
                            {
                              (worker as typeof worker & { appliedJobTitle: string })
                                .appliedJobTitle
                            }
                          </strong>{' '}
                          · {(worker as typeof worker & { appliedDaysAgo: number }).appliedDaysAgo}d
                          ago
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Link to={`/profile/${worker.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        <Button variant="primary" size="sm">
                          Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'pipeline' && <KanbanBoard initialApplicants={kanbanApplicants} />}

              {activeTab === 'saved' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {savedWorkers.map((w) => (
                    <WorkerCard
                      key={w.id}
                      worker={w}
                      onViewProfile={() => {
                        window.location.href = `/site/profile/${w.id}`
                      }}
                    />
                  ))}
                  {savedWorkers.length === 0 && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px 0',
                        color: 'var(--kt-text-muted)',
                      }}
                    >
                      <p style={{ fontSize: 36, marginBottom: 8 }}>⭐</p>
                      <p>No saved workers yet. Browse profiles to save candidates.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Sidebar ---- */}
        <div
          style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Company Info */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
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
              Company
            </h3>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              {currentCompany.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Location', value: currentCompany.location },
                { label: 'Size', value: `${currentCompany.size} employees` },
                { label: 'Website', value: currentCompany.website },
              ].map((row) => (
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
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
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

          {/* Regulix tip */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--kt-olive-50), #e8eedb)',
              border: '1px solid var(--kt-olive-200)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <RegulixBadge size="sm" />
              <span
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-olive-800)',
                }}
              >
                Regulix Tip
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.6,
              }}
            >
              Jobs marked as "Regulix Preferred" get 2× more Regulix Ready applicants on average.
            </p>
          </div>
        </div>
      </div>

      {/* ── Boost Job Modal ──────────────────────────────────────────── */}
      <Modal
        open={boostJobId !== null}
        onClose={handleBoostJobClose}
        size="sm"
        title={boostJobSuccess ? undefined : '🚀 Boost Job Posting'}
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
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
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
                {boostingJob?.title}
              </p>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                {boostingJob?.location} · ${boostingJob?.payMin}–${boostingJob?.payMax}/hr
              </p>
            </div>

            {/* Duration picker */}
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

            {/* What you get */}
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

            {/* Payment summary */}
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
                    fontSize: 'var(--kt-text-xl)',
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
