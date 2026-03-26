import React from 'react'
import { Button, Input } from '../../../components'
import { PhoneIcon } from './icons'
import type { Step1Data } from './types'

export const Step1Section: React.FC<{ data: Step1Data; onChange: (d: Step1Data) => void }> = ({
  data,
  onChange,
}) => {
  const set = (field: keyof Step1Data, val: string) => onChange({ ...data, [field]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile photo */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-medium)',
            color: 'var(--kt-text)',
            marginBottom: 10,
          }}
        >
          Profile Photo
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--kt-primary)',
              color: 'var(--kt-primary-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
            }}
          >
            {data.fullName
              ? data.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'KT'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Button size="sm" variant="outline">
              Upload photo
            </Button>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
              JPG, PNG, or WebP · Max 5 MB
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Full name"
            value={data.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Your legal or professional name"
            required
          />
        </div>
        <Input
          label="City"
          value={data.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="e.g. Denver"
        />
        <Input
          label="State / Region"
          value={data.region}
          onChange={(e) => set('region', e.target.value)}
          placeholder="e.g. CO"
        />
        <div>
          <Input
            label="Phone number"
            type="tel"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. (555) 000-0000"
          />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-accent)',
              textDecoration: 'none',
              fontFamily: 'var(--kt-font-sans)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            <PhoneIcon /> Verify number →
          </a>
        </div>
      </div>
    </div>
  )
}
