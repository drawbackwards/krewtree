import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '../../icons'
import styles from './StatCard.module.css'

export type StatCardColor =
  | 'accent'
  | 'primary'
  | 'success'
  | 'warning'
  | 'info'
  | 'navy'
  | 'olive'
  | 'blue'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: StatCardColor
  trend?: { value: string; direction: 'up' | 'down' | 'flat' }
  subtext?: string
  subtextNode?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'accent',
  trend,
  subtext,
  subtextNode,
}) => {
  const isBold = color === 'navy' || color === 'olive' || color === 'blue'

  return (
    <div className={[styles.card, styles[color]].join(' ')}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && <div className={[styles.iconWrap, styles[color]].join(' ')}>{icon}</div>}
      </div>
      <div className={styles.value}>{value}</div>
      {(trend || subtext || subtextNode) && (
        <div className={styles.secondary}>
          {trend && (
            <span
              className={[
                styles.trend,
                isBold
                  ? styles.trendBold
                  : trend.direction === 'up'
                    ? styles.trendUp
                    : trend.direction === 'down'
                      ? styles.trendDown
                      : styles.trendFlat,
              ].join(' ')}
            >
              {trend.direction === 'up' && <ArrowUpIcon size={12} />}
              {trend.direction === 'down' && <ArrowDownIcon size={12} />}
              {trend.value}
            </span>
          )}
          {subtextNode
            ? subtextNode
            : subtext && (
                <span className={isBold ? styles.subtextBold : styles.subtext}>{subtext}</span>
              )}
        </div>
      )}
    </div>
  )
}
