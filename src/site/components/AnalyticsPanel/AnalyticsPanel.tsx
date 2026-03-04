import React from 'react'
import { JobAnalytics } from '../../data/mock'
import styles from './AnalyticsPanel.module.css'

interface AnalyticsPanelProps {
  analytics: JobAnalytics
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics }) => {
  const maxViews = Math.max(...analytics.viewsByDay, 1)
  const maxApps = Math.max(...analytics.applicationsByDay, 1)
  const overallMax = Math.max(maxViews, maxApps * 10, 1)

  return (
    <div className={styles.panel}>
      {/* Stats Row */}
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

      {/* Bar Chart — Views (7-day) */}
      <div className={styles.chartSection}>
        <div className={styles.chartLabel}>Last 7 Days</div>
        <div className={styles.chartBars}>
          {analytics.viewsByDay.map((views, i) => {
            const viewHeight = Math.round((views / overallMax) * 52)
            return (
              <div key={i} className={styles.barWrap}>
                <div
                  className={[styles.bar, styles.views].join(' ')}
                  style={{ height: `${Math.max(viewHeight, 4)}px` }}
                  title={`${views} views`}
                />
              </div>
            )
          })}
        </div>
        {/* Day labels */}
        <div style={{ display: 'flex', gap: 'var(--kt-space-2)' }}>
          {DAYS.map(d => (
            <div key={d} className={styles.barDay} style={{ flex: 1, textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div className={[styles.legendDot, styles.views].join(' ')} />
            <span>Views</span>
          </div>
        </div>
      </div>
    </div>
  )
}
