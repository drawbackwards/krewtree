import React from 'react'
import { FEATURES } from '../../config/features'
import { RegulixLogo } from './RegulixLogo'
import styles from './RegulixPreferredPill.module.css'

/**
 * The "regulix preferred" pill — full Regulix wordmark followed by a lowercase
 * "preferred" label on a soft-red surface. Shown on job cards and the job
 * detail page when a listing is marked Regulix Preferred.
 */
export const RegulixPreferredPill: React.FC = () => {
  // Regulix is gated behind a launch flag — hide the pill entirely when off.
  if (!FEATURES.regulix) return null
  return (
    <span className={styles.pill} title="Regulix Preferred">
      <RegulixLogo height={13} textColor="var(--kt-navy-900)" />
      preferred
    </span>
  )
}
