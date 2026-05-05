import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Modal } from '../../components'
import { StatCard } from '../components/StatCard/StatCard'
import { PipelineKanban } from '../components/PipelineKanban'
import { RecentApplicantsWidget } from '../components/RecentApplicantsWidget/RecentApplicantsWidget'
import { NeedsAttentionWidget } from '../components/NeedsAttentionWidget/NeedsAttentionWidget'
import { WeekCalendarWidget } from '../components/WeekCalendarWidget/WeekCalendarWidget'
import { RegulixLogo } from '../components/RegulixLogo/RegulixLogo'
import { BriefcaseIcon, UsersIcon, PersonIcon, RocketIcon, CheckIcon, CloseIcon } from '../icons'
import { useAuth } from '../context/AuthContext'
import { getCompanyJobs } from '../services/jobService'
import { getCompanyDashboardStats } from '../services/companyDashboardService'
import type { DashboardStat } from '../services/companyDashboardService'
import type { StatCardColor } from '../components/StatCard/StatCard'
import type { Job } from '../types'
import dashStyles from './CompanyDashboard.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusLabel(status: Job['status']): string {
  if (status === 'active') return 'Open'
  if (status === 'paused') return 'Paused'
  return 'Archived'
}

function statusVariant(status: Job['status']): 'success' | 'warning' | 'secondary' {
  if (status === 'active') return 'success'
  if (status === 'paused') return 'warning'
  return 'secondary'
}

function timeGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ── Stat card config ─────────────────────────────────────────────────────────

const STAT_META: Record<
  DashboardStat['key'],
  { label: string; icon: React.ReactNode; color: StatCardColor }
> = {
  new_applicants: { label: 'New applicants', icon: <PersonIcon />, color: 'navy' },
  interviews_this_week: { label: 'Interviews this week', icon: <UsersIcon />, color: 'navy' },
  open_posts: { label: 'Open posts', icon: <BriefcaseIcon />, color: 'navy' },
  time_to_fill: { label: 'Time to fill', icon: <CheckIcon />, color: 'navy' },
}

// ── Boost modal ───────────────────────────────────────────────────────────────

const boostTiers = [
  { days: 7, price: 35 },
  { days: 14, price: 65 },
  { days: 30, price: 120 },
] as const

// ── Module toggle row ─────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  label: string
  on: boolean
  locked?: boolean
  onChange: (v: boolean) => void
}> = ({ label, on, locked, onChange }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--kt-border)',
    }}
  >
    <div>
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          fontWeight: 'var(--kt-weight-medium)',
          color: locked ? 'var(--kt-text-muted)' : 'var(--kt-text)',
          margin: 0,
        }}
      >
        {label}
      </p>
      {locked && (
        <p style={{ fontSize: 11, color: 'var(--kt-text-muted)', margin: 0 }}>Always on</p>
      )}
    </div>
    <button
      type="button"
      disabled={locked}
      onClick={() => !locked && onChange(!on)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: on ? 'var(--kt-primary)' : 'var(--kt-border)',
        cursor: locked ? 'default' : 'pointer',
        position: 'relative',
        transition: 'background 150ms ease',
        opacity: locked ? 0.5 : 1,
        flexShrink: 0,
      }}
      aria-label={`${label} ${on ? 'on' : 'off'}`}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 150ms ease',
        }}
      />
    </button>
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth()

  const firstName: string =
    (user?.user_metadata?.first_name as string) ||
    (user?.user_metadata?.company_name as string) ||
    ''

  const [companyJobs, setCompanyJobs] = useState<Job[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStat[]>([])
  const [regulixBannerDismissed, setRegulixBannerDismissed] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  type ModuleConfig = {
    calendar: boolean
    needsAttention: boolean
    pipeline: boolean
    recentApplicants: boolean
    activeJobs: boolean
  }
  const DEFAULT_MODULE_CONFIG: ModuleConfig = {
    calendar: true,
    needsAttention: true,
    pipeline: true,
    recentApplicants: true,
    activeJobs: true,
  }
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(() => {
    try {
      const raw = localStorage.getItem('kt_company_modules_v1')
      if (!raw) return DEFAULT_MODULE_CONFIG
      const parsed = JSON.parse(raw) as Partial<ModuleConfig>
      return { ...DEFAULT_MODULE_CONFIG, ...parsed }
    } catch {
      return DEFAULT_MODULE_CONFIG
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('kt_company_modules_v1', JSON.stringify(moduleConfig))
    } catch {
      /* ignore quota errors */
    }
  }, [moduleConfig])

  // Boost modal state
  const [boostJobId, setBoostJobId] = useState<string | null>(null)
  const [boostDuration, setBoostDuration] = useState<7 | 14 | 30>(7)
  const [boostJobSuccess, setBoostJobSuccess] = useState(false)

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

  const handleBoostJobConfirm = () => setBoostJobSuccess(true)

  const handleBoostJobClose = () => {
    setBoostJobId(null)
    setBoostJobSuccess(false)
  }

  const stats = dashboardStats.map((s) => {
    const meta = STAT_META[s.key]
    return {
      label: meta.label,
      value: s.value,
      icon: meta.icon,
      color: meta.color,
      subtext: String(s.subtext ?? ''),
    }
  })

  const activeJobRows = companyJobs
    .filter((j) => j.status === 'active' || j.status === 'paused')
    .slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <div className={dashStyles.layout}>
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className={dashStyles.pageHeader}>
          <h1 className={dashStyles.pageHeaderTitle}>
            {timeGreeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className={dashStyles.customizeBtn}
          >
            Customize
          </button>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <div className={dashStyles.stats}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* ── Regulix promo banner ─────────────────────────────────────── */}
        {!regulixBannerDismissed && (
          <div className={dashStyles.banner}>
            <RegulixLogo height={22} textColor="var(--kt-navy-700)" />
            <p className={dashStyles.bannerText}>
              {totalRegulixApplicants > 0
                ? `${totalRegulixApplicants} applicant${totalRegulixApplicants === 1 ? '' : 's'} in your pool have completed all hiring paperwork and can start immediately.`
                : 'Connect Regulix to instantly verify applicant compliance before day one.'}
            </p>
            <button type="button" className={dashStyles.bannerLink}>
              Learn more
            </button>
            <button
              type="button"
              onClick={() => setRegulixBannerDismissed(true)}
              className={dashStyles.bannerClose}
              aria-label="Dismiss"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        )}

        {/* ── Two-column module grid ───────────────────────────────────── */}

        {/* Row 1: Week calendar 2/3 + Needs attention 1/3, stacks on mobile */}
        {(moduleConfig.calendar || moduleConfig.needsAttention) && user?.id && (
          <div className={dashStyles.row1}>
            {moduleConfig.calendar ? <WeekCalendarWidget companyId={user.id} /> : <div />}
            {moduleConfig.needsAttention ? <NeedsAttentionWidget companyId={user.id} /> : <div />}
          </div>
        )}

        {/* Row 2: Pipeline kanban — full width */}
        {moduleConfig.pipeline && user?.id && <PipelineKanban companyId={user.id} />}

        {/* Row 3: Recent applicants + Active jobs — 1:1, stacks on mobile */}
        {(moduleConfig.recentApplicants || moduleConfig.activeJobs) && (
          <div className={dashStyles.row3}>
            {moduleConfig.recentApplicants && user?.id && (
              <RecentApplicantsWidget
                companyId={user.id}
                lastSignInAt={user.last_sign_in_at ?? null}
              />
            )}

            {moduleConfig.activeJobs && <ActiveJobsModule rows={activeJobRows} />}
          </div>
        )}
      </div>

      {/* ── Customize panel ─────────────────────────────────────────────── */}
      <Modal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        size="sm"
        title="Customize dashboard"
        footer={
          <button
            onClick={() => setCustomizeOpen(false)}
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
        }
      >
        <div style={{ paddingTop: 4 }}>
          <ToggleRow label="Stat cards" on locked onChange={() => {}} />
          <ToggleRow
            label="Week calendar"
            on={moduleConfig.calendar}
            onChange={(v) => setModuleConfig((c) => ({ ...c, calendar: v }))}
          />
          <ToggleRow
            label="Needs attention"
            on={moduleConfig.needsAttention}
            onChange={(v) => setModuleConfig((c) => ({ ...c, needsAttention: v }))}
          />
          <ToggleRow
            label="Pipeline"
            on={moduleConfig.pipeline}
            onChange={(v) => setModuleConfig((c) => ({ ...c, pipeline: v }))}
          />
          <ToggleRow
            label="Recent applicants"
            on={moduleConfig.recentApplicants}
            onChange={(v) => setModuleConfig((c) => ({ ...c, recentApplicants: v }))}
          />
          <ToggleRow
            label="Active jobs"
            on={moduleConfig.activeJobs}
            onChange={(v) => setModuleConfig((c) => ({ ...c, activeJobs: v }))}
          />
        </div>
      </Modal>

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

// ── Active Jobs sub-component ─────────────────────────────────────────────────

type ActiveJobsModuleProps = {
  rows: Job[]
}

const ActiveJobsModule: React.FC<ActiveJobsModuleProps> = ({ rows }) => {
  const navigate = useNavigate()

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--kt-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  return (
    <div className={dashStyles.jobsWidget}>
      {/* Header */}
      <div className={dashStyles.jobsWidgetHeader}>
        <h2 className={dashStyles.jobsWidgetTitle}>
          <BriefcaseIcon size={16} color="var(--kt-olive-700)" />
          Active jobs
        </h2>
        <Link to="/site/dashboard/jobs" className={dashStyles.jobsWidgetLink}>
          View all jobs →
        </Link>
      </div>

      {/* Table */}
      <div>
        {/* Header row */}
        <div className={`${dashStyles.jobsRow} ${dashStyles.jobsHeader}`}>
          <span style={thStyle}>Job title</span>
          <span style={thStyle}>Status</span>
          <span style={thStyle}>Posted</span>
          <span style={{ ...thStyle, justifySelf: 'center' }}>Views</span>
          <span style={{ ...thStyle, justifySelf: 'center' }}>Applicants</span>
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
        {rows.map((job) => (
          <div
            key={job.id}
            className={dashStyles.jobsRow}
            style={{ borderBottom: '1px solid var(--kt-border)' }}
          >
            <div style={{ minWidth: 0 }}>
              <button
                type="button"
                onClick={() => navigate(`/site/jobs/${job.id}`)}
                className={dashStyles.jobTitleBtn}
              >
                {job.title}
              </button>
            </div>
            <div>
              <Badge variant={statusVariant(job.status)} size="sm">
                {statusLabel(job.status)}
              </Badge>
            </div>
            <div>
              <span className={dashStyles.jobsRowCell}>{formatShortDate(job.createdAt)}</span>
            </div>
            <div style={{ justifySelf: 'center' }}>
              <span className={dashStyles.jobsRowCell}>{job.viewCount.toLocaleString()}</span>
            </div>
            <div style={{ justifySelf: 'center' }}>
              <span className={dashStyles.jobsRowApplicants}>{job.totalApplicants}</span>
            </div>
          </div>
        ))}

        {/* Filler rows so the table reserves space for 5 rows */}
        {rows.length > 0 &&
          Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, i) => {
            const isLast = i === Math.max(0, 5 - rows.length) - 1
            return (
              <div
                key={`filler-${i}`}
                aria-hidden="true"
                className={`${dashStyles.jobsRow} ${dashStyles.jobsRowFiller}`}
                style={{ borderBottom: isLast ? 'none' : '1px solid var(--kt-border)' }}
              />
            )
          })}
      </div>
    </div>
  )
}
