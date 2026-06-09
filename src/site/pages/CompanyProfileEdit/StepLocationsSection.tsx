import React from 'react'
import { Button, Input, Select } from '../../../components'
import { US_STATE_OPTIONS } from '../../data/usStates'
import type { AdditionalLocation, StepLocationsData } from './types'
import { MAX_ADDITIONAL_LOCATIONS } from './types'
import styles from './CompanyProfileEdit.module.css'

const newLocation = (): AdditionalLocation => ({
  id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
  name: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  radius: null,
})

export const StepLocationsSection: React.FC<{
  data: StepLocationsData
  hqCity: string
  hqState: string
  onChange: (d: StepLocationsData) => void
}> = ({ data, hqCity, hqState, onChange }) => {
  const set = <K extends keyof StepLocationsData>(key: K, val: StepLocationsData[K]) =>
    onChange({ ...data, [key]: val })

  const updateLocation = (id: string, patch: Partial<AdditionalLocation>) =>
    onChange({
      ...data,
      additionalLocations: data.additionalLocations.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    })

  const removeLocation = (id: string) =>
    onChange({
      ...data,
      additionalLocations: data.additionalLocations.filter((l) => l.id !== id),
    })

  const addLocation = () => {
    if (data.additionalLocations.length >= MAX_ADDITIONAL_LOCATIONS) return
    onChange({ ...data, additionalLocations: [...data.additionalLocations, newLocation()] })
  }

  const canAdd = data.additionalLocations.length < MAX_ADDITIONAL_LOCATIONS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* HQ address — full */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Headquarters
          </h3>
          <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
            City and state come from your basics. Add street and postal code here. Full address is
            only shown publicly if the toggle in Identity is on.
          </p>
        </div>

        <Input
          label="Street"
          value={data.hqStreet}
          onChange={(e) => set('hqStreet', e.target.value)}
          placeholder="123 Main St"
        />

        <div className={styles.formGrid}>
          <Input label="City" value={hqCity} disabled />
          <Input label="State" value={hqState} disabled />
        </div>

        <div className={styles.formGrid}>
          <Input
            label="Postal code"
            value={data.hqPostalCode}
            onChange={(e) => set('hqPostalCode', e.target.value)}
            placeholder="85004"
          />
          <div />
        </div>
      </div>

      {/* Service area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Service area
          </h3>
          <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
            Default is 25 miles from your HQ. Use the override field for non-radius cases.
          </p>
        </div>

        <div className={styles.formGrid}>
          <Input
            label="Radius (miles)"
            type="number"
            min={0}
            value={String(data.serviceAreaRadius)}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              set('serviceAreaRadius', Number.isFinite(n) ? n : 0)
            }}
          />
          <div />
        </div>

        <Input
          label="Service area description (optional)"
          value={data.serviceAreaOverride}
          onChange={(e) => set('serviceAreaOverride', e.target.value)}
          placeholder="e.g. Statewide, or anywhere in the Southwest"
        />
      </div>

      {/* Additional locations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Additional locations
          </h3>
          <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
            Up to {MAX_ADDITIONAL_LOCATIONS}. Useful for branch offices and field operations.
          </p>
        </div>

        {data.additionalLocations.map((loc) => (
          <div
            key={loc.id}
            style={{
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="sm" variant="ghost" onClick={() => removeLocation(loc.id)}>
                Remove
              </Button>
            </div>
            <Input
              label="Location name (optional)"
              value={loc.name}
              onChange={(e) => updateLocation(loc.id, { name: e.target.value })}
              placeholder="e.g. Tucson office"
            />
            <Input
              label="Street"
              value={loc.street}
              onChange={(e) => updateLocation(loc.id, { street: e.target.value })}
            />
            <div className={styles.formGrid}>
              <Input
                label="City"
                value={loc.city}
                onChange={(e) => updateLocation(loc.id, { city: e.target.value })}
              />
              <Select
                label="State"
                placeholder="Select state"
                options={US_STATE_OPTIONS}
                value={loc.state}
                onChange={(e) => updateLocation(loc.id, { state: e.target.value })}
              />
            </div>
            <div className={styles.formGrid}>
              <Input
                label="Postal code"
                value={loc.postalCode}
                onChange={(e) => updateLocation(loc.id, { postalCode: e.target.value })}
              />
              <Input
                label="Radius (miles, optional)"
                type="number"
                min={0}
                value={loc.radius !== null ? String(loc.radius) : ''}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  updateLocation(loc.id, { radius: Number.isFinite(n) ? n : null })
                }}
              />
            </div>
          </div>
        ))}

        <div>
          <Button size="sm" variant="outline" onClick={addLocation} disabled={!canAdd}>
            + Add location
          </Button>
          {!canAdd && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
              }}
            >
              Maximum of {MAX_ADDITIONAL_LOCATIONS} reached.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
