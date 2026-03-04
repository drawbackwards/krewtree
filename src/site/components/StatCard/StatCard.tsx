import React from 'react'
import styles from './StatCard.module.css'

export type StatCardColor = 'accent' | 'primary' | 'success' | 'warning' | 'info'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: StatCardColor
  trend?: { value: string; direction: 'up' | 'down' | 'flat' }
  subtext?: string
}

const ArrowUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const ArrowDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
)

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'accent',
  trend,
  subtext,
}) => {
  return (
    <div className={[styles.card, styles[color]].join(' ')}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <div className={[styles.iconWrap, styles[color]].join(' ')}>
            {icon}
          </div>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div className={[
          styles.trend,
          trend.direction === 'up' ? styles.trendUp :
          trend.direction === 'down' ? styles.trendDown :
          styles.trendFlat
        ].join(' ')}>
          {trend.direction === 'up' && <ArrowUp />}
          {trend.direction === 'down' && <ArrowDown />}
          {trend.value}
        </div>
      )}
      {subtext && (
        <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
          {subtext}
        </span>
      )}
    </div>
  )
}
