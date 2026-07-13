import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { EmptyState, Modal, Spinner } from '../../components'
import { StatCard } from '../components/StatCard/StatCard'
import { StagePill } from '../components/StagePill/StagePill'
import { AnalyticsPanel } from '../components/AnalyticsPanel/AnalyticsPanel'
import { useDrawerStack } from '../components/DrawerSystem/DrawerStackContext'
import { DEFAULT_WIDGET_FILTERS } from '../services/applicantService'
import type { CompanyApplicant } from '../types'
import { EyeIcon, UsersIcon, TrendingUpIcon, HourglassIcon } from '../icons'
import { getJobAnalytics } from '../services/jobService'
import type { JobAnalytics } from '../types'
import styles from './JobAnalyticsTab.module.css'

// Reuse the existing pipeline board (dnd-kit) — self-fetches its stages +
// applicants, so it's lazy-loaded like on the other pages that mount it.
const WidgetKanbanView = lazy(() =>
  import('../components/ApplicantsWidget/WidgetKanbanView').then((m) => ({
    default: m.WidgetKanbanView,
  }))
)

const SOURCE_LABELS: Record<string, string> = {
  search: 'Job search',
  browse: 'Browse jobs',
  company_profile: 'Company profile',
  landing: 'Landing page',
  similar: 'Similar jobs',
  search_engine: 'Search engine',
  referral: 'Other site',
  direct: 'Direct / link',
}

interface JobAnalyticsTabProps {
  jobId: string
  companyId: string
}

const PREVIEW_LIMIT = 5

export const JobAnalyticsTab: React.FC<JobAnalyticsTabProps> = ({ jobId, companyId }) => {
  const { openDrawer } = useDrawerStack()
  const [analytics, setAnalytics] = useState<JobAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeAll, setSeeAll] = useState<'sources' | 'keywords' | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getJobAnalytics(jobId).then(({ data }) => {
      if (cancelled) return
      setAnalytics(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [jobId])

  const openApplicant = useCallback(
    (a: CompanyApplicant): void => {
      openDrawer({ type: 'application', applicationId: a.id, preloadedApplicant: a })
    },
    [openDrawer]
  )

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!analytics) {
    return <EmptyState message="Analytics aren't available for this job." />
  }

  const sourceMax = Math.max(...analytics.sources.map((s) => s.count), 1)
  const hasApplicants = analytics.applicationsTotal > 0
  const { hired, rejected } = analytics.outcomes

  const renderSourceRow = (s: JobAnalytics['sources'][number]): React.ReactNode => (
    <div key={s.source} className={styles.sourceRow}>
      <span className={styles.sourceLabel}>{SOURCE_LABELS[s.source] ?? s.source}</span>
      <div className={styles.sourceTrack}>
        <div className={styles.sourceFill} style={{ width: `${(s.count / sourceMax) * 100}%` }} />
      </div>
      <span className={styles.sourceCount}>{s.count}</span>
    </div>
  )

  const renderKeywordRow = (k: JobAnalytics['keywords'][number]): React.ReactNode => (
    <div key={k.keyword} className={styles.keywordRow}>
      <span className={styles.keywordText}>{k.keyword}</span>
      <span className={styles.keywordCount}>
        {k.count} {k.count === 1 ? 'search' : 'searches'}
      </span>
    </div>
  )

  return (
    <div className={styles.layout}>
      {/* KPI row */}
      <div className={styles.kpis}>
        <StatCard
          label="Total Views"
          value={analytics.viewsTotal.toLocaleString()}
          color="navy"
          icon={<EyeIcon size={18} />}
        />
        <StatCard
          label="Applicants"
          value={analytics.applicationsTotal.toLocaleString()}
          color="navy"
          icon={<UsersIcon size={18} />}
        />
        <StatCard
          label="Conversion"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          color="navy"
          icon={<TrendingUpIcon size={18} />}
          subtext="Applies / views"
        />
        <StatCard
          label="Avg. Time to Apply"
          value={`${analytics.avgTimeToApplyHours.toFixed(1)}h`}
          color="navy"
          icon={<HourglassIcon size={18} />}
          subtext="From posting"
        />
      </div>

      {/* Applicant funnel — the live pipeline board, scoped to this job */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Applicant pipeline</h2>
            <div className={styles.cardSubtitle}>Applicants by stage — drag to move</div>
          </div>
          {(hired > 0 || rejected > 0) && (
            <div className={styles.outcomes}>
              {hired > 0 && (
                <StagePill label={`Hired ${hired}`} status="terminal_hired" size="sm" />
              )}
              {rejected > 0 && (
                <StagePill label={`Rejected ${rejected}`} status="terminal_rejected" size="sm" />
              )}
            </div>
          )}
        </div>
        <div className={styles.pipelineBody}>
          {hasApplicants ? (
            <Suspense fallback={<Spinner size="md" />}>
              <WidgetKanbanView
                companyId={companyId}
                filters={{ ...DEFAULT_WIDGET_FILTERS, jobId }}
                onOpenApplicant={openApplicant}
              />
            </Suspense>
          ) : (
            <EmptyState message="No applicants yet for this job." />
          )}
        </div>
      </section>

      {/* Sources + keywords */}
      <div className={styles.twoUp}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Traffic sources</h2>
              <div className={styles.cardSubtitle}>Where views came from</div>
            </div>
          </div>
          <div className={styles.cardBody}>
            {analytics.sources.length === 0 ? (
              <EmptyState message="No views recorded yet." />
            ) : (
              <>
                {analytics.sources.slice(0, PREVIEW_LIMIT).map(renderSourceRow)}
                {analytics.sources.length > PREVIEW_LIMIT && (
                  <button
                    type="button"
                    className={styles.seeAll}
                    onClick={() => setSeeAll('sources')}
                  >
                    See all {analytics.sources.length} →
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Top search keywords</h2>
              <div className={styles.cardSubtitle}>Job searches that led here</div>
            </div>
          </div>
          <div className={styles.cardBody}>
            {analytics.keywords.length === 0 ? (
              <EmptyState message="No search keywords recorded yet." />
            ) : (
              <>
                {analytics.keywords.slice(0, PREVIEW_LIMIT).map(renderKeywordRow)}
                {analytics.keywords.length > PREVIEW_LIMIT && (
                  <button
                    type="button"
                    className={styles.seeAll}
                    onClick={() => setSeeAll('keywords')}
                  >
                    See all {analytics.keywords.length} →
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Views & applications over time — moved to the bottom */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Views & applications over time</h2>
          </div>
        </div>
        <AnalyticsPanel analytics={analytics} showStats={false} />
      </section>

      <Modal
        open={seeAll === 'sources'}
        onClose={() => setSeeAll(null)}
        title="Traffic sources"
        size="sm"
      >
        {analytics.sources.map(renderSourceRow)}
      </Modal>

      <Modal
        open={seeAll === 'keywords'}
        onClose={() => setSeeAll(null)}
        title="Top search keywords"
        size="sm"
      >
        {analytics.keywords.map(renderKeywordRow)}
      </Modal>
    </div>
  )
}
