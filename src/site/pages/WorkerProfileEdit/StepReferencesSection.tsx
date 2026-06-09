import React, { useState } from 'react'
import { Button, Input } from '../../../components'
import { PlusIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from './icons'
import type { ReferenceEntry, StepReferencesData } from './types'
import { MAX_REFERENCES } from './types'

// ── Collapsible reference card ────────────────────────────────────────────────

const ReferenceCard: React.FC<{
  entry: ReferenceEntry
  isExpanded: boolean
  isLocked: boolean
  onToggle: () => void
  onRemove: () => void
  onChange: (field: keyof ReferenceEntry, val: string) => void
}> = ({ entry, isExpanded, isLocked, onToggle, onRemove, onChange }) => {
  if (!isExpanded) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--kt-radius-md)',
          border: '1px solid var(--kt-border)',
          background: 'var(--kt-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          gap: 8,
        }}
        onClick={onToggle}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              color: 'var(--kt-text)',
            }}
          >
            {entry.name || 'Untitled reference'}
          </p>
          {entry.company && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
              }}
            >
              {entry.company}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            disabled={isLocked}
            style={{
              background: 'none',
              border: 'none',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: 'var(--kt-text-muted)',
              padding: 4,
              display: 'flex',
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <XIcon />
          </button>
          <ChevronDownIcon />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 'var(--kt-radius-md)',
        border: '1px solid var(--kt-border)',
        background: 'var(--kt-surface)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--kt-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-medium)',
            color: 'var(--kt-text)',
          }}
        >
          {entry.name || 'New reference'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            disabled={isLocked}
            style={{
              background: 'none',
              border: 'none',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: 'var(--kt-text-muted)',
              padding: 4,
              display: 'flex',
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <XIcon />
          </button>
          <ChevronUpIcon />
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <Input
            label="Name"
            value={entry.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Reference's full name"
            disabled={isLocked}
            maxLength={80}
          />
          <Input
            label="Company"
            value={entry.company}
            onChange={(e) => onChange('company', e.target.value)}
            placeholder="Where you worked together"
            disabled={isLocked}
            maxLength={80}
          />
          <Input
            label="Phone"
            type="tel"
            value={entry.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="(555) 555-0123"
            disabled={isLocked}
          />
          <Input
            label="Email"
            type="email"
            value={entry.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="name@example.com"
            disabled={isLocked}
          />
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
          }}
        >
          Provide at least a phone number or email.
        </p>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export const StepReferencesSection: React.FC<{
  data: StepReferencesData
  onChange: (d: StepReferencesData) => void
}> = ({ data, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isLocked = !data.consent
  const atCap = data.references.length >= MAX_REFERENCES

  const addEntry = () => {
    if (isLocked || atCap) return
    const newId = crypto.randomUUID()
    onChange({
      ...data,
      references: [...data.references, { id: newId, name: '', company: '', phone: '', email: '' }],
    })
    setExpandedId(newId)
  }

  const removeEntry = (id: string) => {
    if (isLocked) return
    onChange({ ...data, references: data.references.filter((r) => r.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  const updateEntry = (id: string, field: keyof ReferenceEntry, val: string) =>
    onChange({
      ...data,
      references: data.references.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-text-muted)',
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        Optional. References are hidden on your public profile. Any company you apply to will see
        them. Add up to {MAX_REFERENCES}.
      </p>

      {/* Consent banner when references exist but consent is off */}
      {!data.consent && data.references.length > 0 && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--kt-radius-md)',
            background: 'var(--kt-warning-subtle)',
            color: 'var(--kt-warning)',
            fontSize: 'var(--kt-text-sm)',
            lineHeight: 1.55,
          }}
        >
          Your references are saved but currently hidden from companies. Re-confirm consent in the
          footer to make them visible again.
        </div>
      )}

      {/* Reference list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.references.length === 0 && (
          <div
            style={{
              padding: 20,
              borderRadius: 'var(--kt-radius-md)',
              background: 'var(--kt-surface-raised)',
              border: '1px dashed var(--kt-border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
              No references added yet.
            </p>
            <Button size="sm" variant="outline" onClick={addEntry} disabled={isLocked}>
              <PlusIcon /> Add reference
            </Button>
          </div>
        )}

        {data.references.map((entry) => (
          <ReferenceCard
            key={entry.id}
            entry={entry}
            isExpanded={expandedId === entry.id}
            isLocked={isLocked}
            onToggle={() => setExpandedId((prev) => (prev === entry.id ? null : entry.id))}
            onRemove={() => removeEntry(entry.id)}
            onChange={(field, val) => updateEntry(entry.id, field, val)}
          />
        ))}

        {data.references.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <Button size="sm" variant="outline" onClick={addEntry} disabled={isLocked || atCap}>
              <PlusIcon /> Add reference
            </Button>
            {atCap && (
              <span
                style={{
                  marginLeft: 10,
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                }}
              >
                Maximum {MAX_REFERENCES} references.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
