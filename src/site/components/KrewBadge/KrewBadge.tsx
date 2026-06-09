import React from 'react'
import { CheckIcon } from '../../icons'
import styles from './KrewBadge.module.css'

export interface KrewBadgeProps {
  /** When false (or undefined), the badge renders nothing — call sites can pass
   *  the boolean straight through without wrapping in a conditional. */
  inKrew: boolean | null | undefined
  className?: string
}

export const KrewBadge: React.FC<KrewBadgeProps> = ({ inKrew, className }) => {
  if (!inKrew) return null
  const cls = [styles.badge, className ?? ''].filter(Boolean).join(' ')
  return (
    <span className={cls}>
      <span className={styles.icon} aria-hidden="true">
        <CheckIcon size={12} />
      </span>
      In Krew
    </span>
  )
}
