import React from 'react'
import { Tooltip } from '../../../components'
import { ShieldCheckIcon } from '../../icons'
import { RegulixMark } from '../RegulixLogo/RegulixMark'
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

// Mark heights chosen to roughly match the pill's prior visual weight.
const MARK_SIZE_PX: Record<RegulixBadgeSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
}

export const RegulixBadge: React.FC<RegulixBadgeProps> = ({
  size = 'md',
  variant = 'filled',
  pulse = false,
  showTooltip = true,
  className,
}) => {
  // Pending = "Not Connected" — a distinct status, keep the legacy pill so
  // worker / company UIs can still surface the gap. Only the affirmative
  // Regulix Ready states swap to the R mark.
  if (variant === 'pending') {
    const cls = [
      styles.badge,
      styles[size],
      styles[variant],
      pulse ? styles.pulse : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <span className={cls}>
        <span className={styles.icon}>
          <ShieldCheckIcon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />
        </span>
        Not Connected
      </span>
    )
  }

  const cls = [styles.mark, pulse ? styles.pulse : '', className ?? ''].filter(Boolean).join(' ')

  const mark = (
    <span className={cls} aria-label="Regulix Ready">
      <RegulixMark size={MARK_SIZE_PX[size]} />
    </span>
  )

  if (!showTooltip) return mark
  return (
    <Tooltip content={TOOLTIP_CONTENT} position="top">
      {mark}
    </Tooltip>
  )
}
