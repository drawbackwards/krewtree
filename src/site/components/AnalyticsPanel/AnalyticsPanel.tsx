import React from 'react'
import type { JobAnalytics } from '../../types'
import styles from './AnalyticsPanel.module.css'

interface AnalyticsPanelProps {
  analytics: JobAnalytics
  /** Hide the 4-KPI summary row (e.g. when the page already renders KPI cards). */
  showStats?: boolean
}

// M/D labels for the most-recent `count` days, oldest → newest (array order).
function dayLabels(count: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return out
}

const CHART_MAX_PX = 52

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics, showStats = true }) => {
  const views = analytics.viewsByDay
  const apps = analytics.applicationsByDay
  const n = Math.max(views.length, apps.length)
  const overallMax = Math.max(...views, ...apps, 1)
  const labels = dayLabels(n)

  const barHeight = (value: number): number =>
    value > 0 ? Math.max(Math.round((value / overallMax) * CHART_MAX_PX), 4) : 2

  return (
    <div className={styles.panel}>
      {showStats && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{analytics.viewsTotal.toLocaleString()}</div>
            <div className={styles.statLabel}>Total Views</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{analytics.applicationsTotal}</div>
            <div className={styles.statLabel}>Applications</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{analytics.conversionRate.toFixed(1)}%</div>
            <div className={styles.statLabel}>Conversion</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{analytics.avgTimeToApplyHours.toFixed(1)}h</div>
            <div className={styles.statLabel}>Avg. Time to Apply</div>
          </div>
        </div>
      )}

      {/* Bar chart — views + applications per day */}
      <div className={styles.chartSection}>
        <div className={styles.chartLabel}>Last {n} days</div>
        <div className={styles.chartBars}>
          {Array.from({ length: n }).map((_, i) => {
            const v = views[i] ?? 0
            const a = apps[i] ?? 0
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={i}
                className={styles.barWrap}
                title={`${labels[i]} — ${v} views · ${a} applies`}
              >
                <div className={styles.barGroup}>
                  <div
                    className={[styles.bar, styles.views].join(' ')}
                    style={{ height: `${barHeight(v)}px` }}
                  />
                  <div
                    className={[styles.bar, styles.applications].join(' ')}
                    style={{ height: `${barHeight(a)}px` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {/* Day labels — sparse when the range is long, to avoid clutter */}
        <div style={{ display: 'flex', gap: 'var(--kt-space-2)' }}>
          {labels.map((d, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className={styles.barDay} style={{ flex: 1, textAlign: 'center' }}>
              {n <= 7 || i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div className={[styles.legendDot, styles.views].join(' ')} />
            <span>Views</span>
          </div>
          <div className={styles.legendItem}>
            <div className={[styles.legendDot, styles.applications].join(' ')} />
            <span>Applications</span>
          </div>
        </div>
      </div>
    </div>
  )
}
