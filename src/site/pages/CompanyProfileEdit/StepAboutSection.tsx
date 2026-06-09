import React from 'react'
import { Input, Select, Textarea } from '../../../components'
import type { StepAboutData } from './types'
import { COMPANY_SIZE_OPTIONS } from './types'
import styles from './CompanyProfileEdit.module.css'

const CURRENT_YEAR = 2026 // pinned to project's "current date" constant; updates manually

export const StepAboutSection: React.FC<{
  data: StepAboutData
  onChange: (d: StepAboutData) => void
}> = ({ data, onChange }) => {
  const yearsInBusiness =
    data.founded && data.founded >= 1800 && data.founded <= CURRENT_YEAR
      ? CURRENT_YEAR - data.founded
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label className={styles.fieldLabel}>About the company</label>
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            margin: '-6px 0 10px',
          }}
        >
          A few paragraphs about what you do, who you hire, and what makes you different.
        </p>
        <Textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Tell workers about your company…"
          rows={8}
        />
      </div>

      <div className={styles.formGrid}>
        <Select
          label="Company size"
          placeholder="Select size"
          options={COMPANY_SIZE_OPTIONS}
          value={data.size}
          onChange={(e) => onChange({ ...data, size: e.target.value })}
        />
        <div>
          <Input
            label="Founded"
            type="number"
            value={data.founded ? String(data.founded) : ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              onChange({ ...data, founded: Number.isFinite(n) ? n : null })
            }}
            placeholder="e.g. 2008"
            min={1800}
            max={CURRENT_YEAR}
          />
          {yearsInBusiness !== null && (
            <p
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                margin: '6px 0 0',
              }}
            >
              In business {yearsInBusiness} {yearsInBusiness === 1 ? 'year' : 'years'}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
