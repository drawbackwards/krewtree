import React from 'react'
import { Tooltip } from '../../../components'
import { ShieldCheckIcon } from '../../icons'
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

const TOOLTIP_CONTENT = (
  <span>
    <strong>Regulix Ready</strong> — This worker has completed all hiring paperwork (W-4, I-9,
    direct deposit) and can start work immediately.
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
