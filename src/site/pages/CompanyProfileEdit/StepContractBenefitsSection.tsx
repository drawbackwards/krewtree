import React from 'react'
import { Checkbox } from '../../../components'
import type { StepContractBenefitsData } from './types'
import { BENEFIT_GROUPS, CONTRACT_TYPE_OPTIONS } from './types'
import styles from './CompanyProfileEdit.module.css'

export const StepContractBenefitsSection: React.FC<{
  data: StepContractBenefitsData
  onChange: (d: StepContractBenefitsData) => void
}> = ({ data, onChange }) => {
  const set = <K extends keyof StepContractBenefitsData>(
    key: K,
    val: StepContractBenefitsData[K]
  ) => onChange({ ...data, [key]: val })

  const toggleContractType = (value: string) => {
    const has = data.contractTypes.includes(value)
    set(
      'contractTypes',
      has ? data.contractTypes.filter((t) => t !== value) : [...data.contractTypes, value]
    )
  }

  const toggleBenefit = (value: string) => {
    const has = data.benefits.includes(value)
    set('benefits', has ? data.benefits.filter((b) => b !== value) : [...data.benefits, value])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Contract types */}
      <div>
        <h3
          style={{
            fontSize: 'var(--kt-text-md)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Typical contract types
        </h3>
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 12px',
          }}
        >
          Helps workers self-select for the kinds of arrangements you offer.
        </p>
        <div className={styles.checkboxGrid}>
          {CONTRACT_TYPE_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              checked={data.contractTypes.includes(opt.value)}
              onChange={() => toggleContractType(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h3
          style={{
            fontSize: 'var(--kt-text-md)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Benefits & perks
        </h3>
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 12px',
          }}
        >
          Select any that you offer. Groups are for organization — they all save as flat tags.
        </p>
        <div className={styles.benefitColumns}>
          {BENEFIT_GROUPS.map((group) => (
            <div key={group.label} className={styles.benefitGroup}>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: '0 0 8px',
                }}
              >
                {group.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.benefits.map((b) => (
                  <Checkbox
                    key={b.value}
                    label={b.label}
                    checked={data.benefits.includes(b.value)}
                    onChange={() => toggleBenefit(b.value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
