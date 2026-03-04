import React from 'react'
import styles from './Progress.module.css'

export type ProgressSize = 'sm' | 'md' | 'lg'
export type ProgressColor = 'accent' | 'primary' | 'success' | 'warning' | 'danger'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  size?: ProgressSize
  color?: ProgressColor
  label?: string
  showValue?: boolean
  indeterminate?: boolean
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'accent',
  label,
  showValue = false,
  indeterminate = false,
  className,
  ...props
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const cls = [
    styles.wrapper,
    styles[size],
    styles[color],
    indeterminate ? styles.indeterminate : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} {...props}>
      {(label || showValue) && (
        <div className={styles.labelRow}>
          {label && <span>{label}</span>}
          {showValue && !indeterminate && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={styles.bar}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
