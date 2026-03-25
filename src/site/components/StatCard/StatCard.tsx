import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '../../icons'
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
        {icon && <div className={[styles.iconWrap, styles[color]].join(' ')}>{icon}</div>}
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div
          className={[
            styles.trend,
            trend.direction === 'up'
              ? styles.trendUp
              : trend.direction === 'down'
                ? styles.trendDown
                : styles.trendFlat,
          ].join(' ')}
        >
          {trend.direction === 'up' && <ArrowUpIcon size={12} />}
          {trend.direction === 'down' && <ArrowDownIcon size={12} />}
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
