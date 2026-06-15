import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon } from '../../icons'
import { supabase } from '@/lib/supabase'
import { getCompanyProfile } from '../../services/companyService'
import styles from './CompanyCompletenessWidget.module.css'

type ChecklistItem = {
  key: string
  label: string
  done: boolean
}

type Props = {
  companyId: string
}

// Mirrors the worker dashboard's "Complete your profile" card. Items track the
// inputs of computeProfileCompletePct; pct comes from the stored score.
export const CompanyCompletenessWidget: React.FC<Props> = ({ companyId }) => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [pct, setPct] = useState(0)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('kt_company_completeness_dismissed') === '1'
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getCompanyProfile(companyId),
      supabase
        .from('company_licenses')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('company_photos')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('company_benefits')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
    ]).then(([profileRes, licensesRes, photosRes, benefitsRes]) => {
      if (cancelled) return
      setLoading(false)
      const p = profileRes.data
      if (!p) return
      setPct(p.profile_complete_pct ?? 0)
      setItems(
        [
          {
            key: 'basics',
            label: 'Basic info',
            done: !!(p.name.trim() && p.industry.trim() && p.hq_city.trim() && p.phone.trim()),
          },
          { key: 'logo', label: 'Company logo', done: !!p.logo_url },
          { key: 'description', label: 'Description', done: p.description.trim().length >= 40 },
          { key: 'website', label: 'Website', done: !!p.website.trim() },
          { key: 'founded', label: 'Founded year', done: !!p.founded },
          { key: 'size', label: 'Company size', done: !!p.size.trim() },
          { key: 'licenses', label: 'Licenses', done: (licensesRes.count ?? 0) > 0 },
          { key: 'photos', label: 'Photos', done: (photosRes.count ?? 0) > 0 },
          { key: 'benefits', label: 'Benefits', done: (benefitsRes.count ?? 0) > 0 },
        ].sort((a, b) => Number(b.done) - Number(a.done))
      )
    })
    return () => {
      cancelled = true
    }
  }, [companyId])

  const handleDismiss = (): void => {
    localStorage.setItem('kt_company_completeness_dismissed', '1')
    setDismissed(true)
  }

  if (loading || dismissed || pct >= 100) return null

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
