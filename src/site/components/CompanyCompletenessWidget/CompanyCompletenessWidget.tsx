import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon } from '../../icons'
import type {
  CompanyCompleteness,
  CompletenessItemKey,
} from '../../services/companyDashboardService'
import styles from './CompanyCompletenessWidget.module.css'

type Props = {
  // null while the dashboard RPC is still loading — the card stays hidden.
  data: CompanyCompleteness | null
}

const ITEM_LABELS: Record<CompletenessItemKey, string> = {
  basics: 'Basic info',
  logo: 'Company logo',
  description: 'Description',
  website: 'Website',
  founded: 'Founded year',
  size: 'Company size',
  licenses: 'Licenses',
  photos: 'Photos',
  benefits: 'Benefits',
}

const ITEM_ORDER: CompletenessItemKey[] = [
  'basics',
  'logo',
  'description',
  'website',
  'founded',
  'size',
  'licenses',
  'photos',
  'benefits',
]

// Mirrors the worker dashboard's "Complete your profile" card. Both the score
// and the per-item booleans are computed server-side in the get_company_dashboard
// RPC and passed down — this component is purely presentational.
export const CompanyCompletenessWidget: React.FC<Props> = ({ data }) => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('kt_company_completeness_dismissed') === '1'
  )

  const handleDismiss = (): void => {
    localStorage.setItem('kt_company_completeness_dismissed', '1')
    setDismissed(true)
  }

  if (!data || dismissed || data.pct >= 100) return null

  const pct = data.pct
  const items = ITEM_ORDER.map((key) => ({
    key,
    label: ITEM_LABELS[key],
    done: data.items[key],
  })).sort((a, b) => Number(b.done) - Number(a.done))

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3 className={styles.title}>Complete your profile</h3>
        <span className={styles.pct}>{pct}%</span>
      </div>
      <p className={styles.copy}>
        A complete profile builds trust with workers. Your logo and description are the first things
        they see when deciding whether to apply.
      </p>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <div
        className={styles.grid}
        style={{ gridTemplateRows: `repeat(${Math.ceil(items.length / 2)}, auto)` }}
      >
        {items.map((item) => (
          <div key={item.key} className={styles.item}>
            {item.done ? (
              <span className={styles.checkDone}>
                <CheckIcon size={9} color="var(--kt-white)" />
              </span>
            ) : (
              <span className={styles.checkEmpty} />
            )}
            <span className={item.done ? styles.itemLabelDone : styles.itemLabel}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <button type="button" onClick={handleDismiss} className={styles.dismissBtn}>
          Dismiss
        </button>
        <Link to="/site/settings/profile" className={styles.editLink}>
          Edit profile →
        </Link>
      </div>
    </div>
  )
}
