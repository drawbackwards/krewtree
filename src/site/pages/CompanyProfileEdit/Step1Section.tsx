import React, { useRef, useState } from 'react'
import { Button, Input, Select, MultiSelect, Checkbox } from '../../../components'
import { INDUSTRIES } from '../../data/industries'
import { US_STATE_OPTIONS } from '../../data/usStates'
import { useAuth } from '../../context/AuthContext'
import { uploadCompanyLogo, updateCompanyLogoUrl } from '../../services/companyService'
import type { Step1Data } from './types'
import styles from './CompanyProfileEdit.module.css'

const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({ value: i.slug, label: i.name }))

export const Step1Section: React.FC<{
  data: Step1Data
  onChange: (d: Step1Data) => void
}> = ({ data, onChange }) => {
  const { user } = useAuth()
  const set = <K extends keyof Step1Data>(key: K, val: Step1Data[K]) =>
    onChange({ ...data, [key]: val })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadError('')
    setIsUploading(true)
    const { url, error } = await uploadCompanyLogo(user.id, file)
    if (error || !url) {
      setUploadError(error ?? 'Upload failed')
      setIsUploading(false)
      return
    }
    const { error: dbError } = await updateCompanyLogoUrl(user.id, url)
    setIsUploading(false)
    if (dbError) {
      setUploadError(dbError)
      return
    }
    set('logoUrl', url)
    e.target.value = ''
  }

  const initials = data.name ? data.name.slice(0, 2).toUpperCase() : '?'

  // Additional industries can't include whatever is picked as primary.
  const additionalIndustryOptions = INDUSTRY_OPTIONS.filter((o) => o.value !== data.industry)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Logo */}
      <div>
        <label className={styles.fieldLabel}>Company logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              background: 'var(--kt-primary)',
              color: 'var(--kt-primary-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Upload logo'}
            </Button>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
              JPG, PNG, or WebP · Square crop · Max 5 MB
            </p>
            {uploadError && (
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-danger)', margin: 0 }}>
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      <Input
        label="Company name"
        value={data.name}
        onChange={(e) => set('name', e.target.value)}
        required
      />

      <Input
        label="Tagline"
        value={data.tagline}
        onChange={(e) => set('tagline', e.target.value)}
        placeholder="One line that sums up your company"
        maxLength={80}
      />

      {/* Contact pair */}
      <div className={styles.formGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input
            label="Phone number"
            type="tel"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
          <Checkbox
            label="Show on profile"
            checked={data.phonePublic}
            onChange={(e) => set('phonePublic', e.target.checked)}
          />
        </div>
        <Input
          label="Website"
          type="url"
          value={data.website}
          onChange={(e) => set('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {/* HQ city + state */}
      <div className={styles.formGrid}>
        <Input
          label="HQ city"
          value={data.hqCity}
          onChange={(e) => set('hqCity', e.target.value)}
          required
        />
        <Select
          label="State"
          placeholder="Select state"
          options={US_STATE_OPTIONS}
          value={data.hqState}
          onChange={(e) => set('hqState', e.target.value)}
          required
        />
      </div>

      {/* Industries */}
      <div className={styles.formGrid}>
        <Select
          label="Primary industry"
          placeholder="Select industry"
          options={INDUSTRY_OPTIONS}
          value={data.industry}
          onChange={(e) => set('industry', e.target.value)}
          required
        />

        <MultiSelect
          label="Additional industries"
          placeholder="Select any other industries you operate in"
          options={additionalIndustryOptions}
          value={data.additionalIndustries}
          onChange={(next) => set('additionalIndustries', next)}
        />
      </div>
    </div>
  )
}
