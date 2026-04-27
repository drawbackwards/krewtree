import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from '../../icons'
import { getNeedsAttentionAlerts, type AttentionAlert } from '../../services/needsAttentionService'
import styles from './NeedsAttentionWidget.module.css'

const MAX_VISIBLE = 5

const DOT_COLORS: Record<AttentionAlert['type'], string> = {
  zero_applicants: 'var(--kt-danger)',
  boost_expiring: 'var(--kt-warning)',
  unanswered_messages: 'var(--kt-info)',
}

type Props = {
  companyId: string
}

export const NeedsAttentionWidget: React.FC<Props> = ({ companyId }) => {
  const [alerts, setAlerts] = useState<AttentionAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getNeedsAttentionAlerts(companyId).then(({ data }) => {
      if (!cancelled) {
        setAlerts(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [companyId])

  const visible = alerts.slice(0, MAX_VISIBLE)

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <BellIcon size={16} color="var(--kt-olive-700)" />
          Needs attention{alerts.length > 0 && ` (${alerts.length})`}
        </h2>
        <Link to="/site/dashboard/applicants" className={styles.viewAll}>
          View all →
        </Link>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.empty}>
          <p>Nothing needs your attention</p>
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map((alert) => (
            <div key={alert.id} className={styles.alertRow}>
              <span
                className={styles.dot}
                style={{ background: DOT_COLORS[alert.type] }}
                aria-hidden="true"
              />
              <div className={styles.alertBody}>
                <span className={styles.primary}>{alert.primaryText}</span>
                <span className={styles.meta}>{alert.metaText}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
