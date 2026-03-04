import React from 'react'
import styles from './Spinner.module.css'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerColor = 'accent' | 'primary' | 'secondary' | 'white' | 'current'

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize
  color?: SpinnerColor
  label?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'accent',
  label,
  className,
  ...props
}) => {
  const spinnerCls = [styles.spinner, styles[size], styles[color], className ?? '']
    .filter(Boolean)
    .join(' ')

  if (label) {
    return (
      <span className={styles.wrap} role="status" {...props}>
        <span className={spinnerCls} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
      </span>
    )
  }

  return (
    <span
      className={spinnerCls}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}
