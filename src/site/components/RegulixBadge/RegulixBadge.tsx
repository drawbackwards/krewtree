import React from 'react'
import { Tooltip } from '../../../components'
import styles from './RegulixBadge.module.css'

export type RegulixBadgeVariant = 'filled' | 'outline' | 'onDark' | 'pending'
export type RegulixBadgeSize = 'sm' | 'md' | 'lg'

export interface RegulixBadgeProps {
  size?: RegulixBadgeSize
  variant?: RegulixBadgeVariant
  pulse?: boolean
  showTooltip?: boolean
  className?: string
}

const ShieldCheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12 1.5l9 3.375v7.5c0 5.25-3.75 10.125-9 11.625C6.75 22.5 3 17.625 3 12.375v-7.5L12 1.5zm4.28 7.72a.75.75 0 00-1.06-1.06L10.5 12.88 8.78 11.16a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z"
      clipRule="evenodd"
    />
  </svg>
)

const TOOLTIP_CONTENT = (
  <span>
    <strong>Regulix Ready</strong> — This worker has completed all hiring paperwork
    (W-4, I-9, direct deposit) and can start work immediately.
  </span>
)

export const RegulixBadge: React.FC<RegulixBadgeProps> = ({
  size = 'md',
  variant = 'filled',
  pulse = false,
  showTooltip = true,
  className,
}) => {
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14

  const cls = [
    styles.badge,
    styles[size],
    styles[variant],
    pulse ? styles.pulse : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const badge = (
    <span className={cls}>
      <span className={styles.icon}>
        <ShieldCheckIcon size={iconSize} />
      </span>
      {variant === 'pending' ? 'Not Connected' : 'Regulix Ready'}
    </span>
  )

  if (!showTooltip || variant === 'pending') return badge

  return (
    <Tooltip content={TOOLTIP_CONTENT} position="top">
      {badge}
    </Tooltip>
  )
}
