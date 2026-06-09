import React, { useState } from 'react'
import { Button, Input, Select, Modal, Badge } from '../../../components'
import { US_STATE_OPTIONS } from '../../data/usStates'
import { getLicenseTypesByIndustries } from '../../data/licenseTypes'
import type { LicenseEntry, StepLicensesData } from './types'
import styles from './CompanyProfileEdit.module.css'

const newEntry = (): LicenseEntry => ({
  id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
  licenseType: '',
  jurisdiction: '',
  licenseNumber: '',
  expirationDate: '',
  verificationStatus: 'unverified',
})

// "Today" for the expired check. Hardcoded to the project's `currentDate`
// constant (kept simple — full timezone correctness lives in a Phase 4 utility).
const TODAY = '2026-06-09'

const statusBadge = (s: LicenseEntry['verificationStatus'], expirationDate: string) => {
  if (expirationDate && expirationDate < TODAY) {
    return <Badge variant="warning">Expired</Badge>
  }
  if (s === 'verified') return <Badge variant="success">Verified</Badge>
  if (s === 'pending') return <Badge variant="warning">Verifying…</Badge>
  if (s === 'failed') return <Badge variant="danger">Could not verify</Badge>
  return null
}

export const StepLicensesSection: React.FC<{
  data: StepLicensesData
  industryIds: string[]
  onChange: (d: StepLicensesData) => void
}> = ({ data, industryIds, onChange }) => {
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyJurisdiction, setVerifyJurisdiction] = useState('')

  const licenseTypes = getLicenseTypesByIndustries(industryIds)
  const licenseTypeOptions = licenseTypes.map((lt) => ({ value: lt.id, label: lt.label }))

  const update = (id: string, patch: Partial<LicenseEntry>) =>
    onChange({
      ...data,
      licenses: data.licenses.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })

  const remove = (id: string) =>
    onChange({ ...data, licenses: data.licenses.filter((l) => l.id !== id) })

  const add = () => onChange({ ...data, licenses: [...data.licenses, newEntry()] })

  const handleVerifyClick = (jurisdiction: string) => {
    setVerifyJurisdiction(jurisdiction)
    setVerifyOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
        Add licenses you hold. Workers see these on your public profile as a trust signal.
      </p>

      {data.licenses.length === 0 && (
        <div className={styles.placeholderBody} style={{ padding: '20px 0' }}>
          No licenses added yet.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.licenses.map((lic) => (
          <div
            key={lic.id}
            style={{
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {statusBadge(lic.verificationStatus, lic.expirationDate)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerifyClick(lic.jurisdiction)}
                >
                  Verify
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(lic.id)}>
                  Remove
                </Button>
              </div>
            </div>

            <div className={styles.formGrid}>
              <Select
                label="License type"
                placeholder="Select type"
                options={licenseTypeOptions}
                value={lic.licenseType}
                onChange={(e) => update(lic.id, { licenseType: e.target.value })}
                required
              />
              <Select
                label="Jurisdiction"
                placeholder="Select state"
                options={US_STATE_OPTIONS}
                value={lic.jurisdiction}
                onChange={(e) => update(lic.id, { jurisdiction: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGrid}>
              <Input
                label="License number"
                value={lic.licenseNumber}
                onChange={(e) => update(lic.id, { licenseNumber: e.target.value })}
                required
              />
              <Input
                label="Expiration date"
                type="date"
                value={lic.expirationDate}
                onChange={(e) => update(lic.id, { expirationDate: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button size="sm" variant="outline" onClick={add}>
          + Add license
        </Button>
      </div>

      <Modal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        size="sm"
        title="License verification coming soon"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setVerifyOpen(false)}>
              Got it
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
          License verification is rolling out in a future update. When it ships we'll verify against
          the{' '}
          {verifyJurisdiction ? (
            <strong>{verifyJurisdiction} public license database</strong>
          ) : (
            <strong>state public license database</strong>
          )}{' '}
          and show a verified badge on your public profile.
        </p>
      </Modal>
    </div>
  )
}
