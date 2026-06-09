import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from '../../icons'
import { supabase } from '@/lib/supabase'
import { getCompanyProfile } from '../../services/companyService'
import styles from './CompanyProfileNudge.module.css'

type NudgeItem = {
  key: string
  label: string
  hint: string
}

// Priority order from spec §5.1.
const buildNudges = (input: {
  logoUrl: string | null
  description: string
  website: string
  licenseCount: number
  photoCount: number
}): NudgeItem[] => {
  const items: NudgeItem[] = []
  if (!input.logoUrl) {
    items.push({
      key: 'logo',
      label: 'Add a company logo',
      hint: 'Workers see it on every card and search result.',
    })
  }
  if (!input.description || input.description.trim().length < 40) {
    items.push({
      key: 'description',
      label: 'Add a description',
      hint: "Tell workers what you do and what it's like to work with you.",
    })
  }
  if (!input.website.trim()) {
    items.push({
      key: 'website',
      label: 'Add your website',
      hint: 'A real site is a trust signal.',
    })
  }
  if (input.licenseCount === 0) {
    items.push({
      key: 'license',
      label: 'Add a license',
      hint: 'Show your credentials.',
    })
  }
  if (input.photoCount === 0) {
    items.push({
      key: 'photos',
      label: 'Add photos',
      hint: 'Real work, real crew, real equipment.',
    })
  }
  return items
}

type Props = {
  companyId: string
}

export const CompanyProfileNudge: React.FC<Props> = ({ companyId }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [nudges, setNudges] = useState<NudgeItem[]>([])
  const [pct, setPct] = useState(0)

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
    ]).then(([profileRes, licensesRes, photosRes]) => {
      if (cancelled) return
      setLoading(false)
      const data = profileRes.data
      if (!data) {
        setNudges([])
        return
      }
      setPct(data.profile_complete_pct ?? 0)
      setNudges(
        buildNudges({
          logoUrl: data.logo_url,
          description: data.description,
          website: data.website,
          licenseCount: licensesRes.count ?? 0,
          photoCount: photosRes.count ?? 0,
        })
      )
    })
    return () => {
      cancelled = true
    }
  }, [companyId])

  // Spec: hide when fewer than 2 priority items are incomplete.
  if (loading || nudges.length < 2) return null

  const visible = nudges.slice(0, 3)

  return (
    <div className={styles.widget}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Finish your company profile</h2>
          <p className={styles.subtitle}>
            {pct}% complete · {nudges.length} item{nudges.length === 1 ? '' : 's'} left to stand out
            to workers
          </p>
        </div>
        <button
          type="button"
          className={styles.editLink}
          onClick={() => navigate('/site/company/edit')}
        >
          Edit profile →
        </button>
      </div>
      <div className={styles.list}>
        {visible.map((item) => (
          <button
            key={item.key}
            type="button"
            className={styles.row}
            onClick={() => navigate('/site/company/edit')}
          >
            <div className={styles.rowContent}>
              <span className={styles.rowLabel}>{item.label}</span>
              <span className={styles.rowHint}>{item.hint}</span>
            </div>
            <span className={styles.chevron}>
              <ChevronRightIcon size={16} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
