import React from 'react'
import type { WorkerReference } from '../../services/workerService'
import { PhoneIcon, EnvelopeIcon } from '../../icons'

export type WorkerReferencesSectionVariant = 'card' | 'slim'

export interface WorkerReferencesSectionProps {
  references: WorkerReference[]
  /** 'card' for full profile pages, 'slim' for tighter slideover/drawer surfaces. */
  variant?: WorkerReferencesSectionVariant
}

/**
 * Renders self-reported worker references for a company viewer. Caller is
 * responsible for fetching the list (RLS handles access). When the array is
 * empty (no access, no consent, or no references), the section renders null.
 */
export const WorkerReferencesSection: React.FC<WorkerReferencesSectionProps> = ({
  references,
  variant = 'card',
}) => {
  if (references.length === 0) return null

  const isCard = variant === 'card'

  return (
    <div
      style={
        isCard
          ? {
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 24,
            }
          : { display: 'flex', flexDirection: 'column', gap: 10 }
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: isCard ? 16 : 8,
        }}
      >
        <h3
          style={{
            fontSize: isCard ? 'var(--kt-text-lg)' : 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-navy-900)',
            margin: 0,
          }}
        >
          References
        </h3>
        <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
          Self-reported by the worker
        </span>
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {references.map((r) => (
          <li
            key={r.id}
            style={{
              padding: '12px 14px',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              background: 'var(--kt-bg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                }}
              >
                {r.name}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                }}
              >
                {r.company}
              </p>
            </div>
            {(r.phone || r.email) && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 14,
                  marginTop: 2,
                }}
              >
                {r.phone && (
                  <a
                    href={`tel:${r.phone.replace(/\s+/g, '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-navy-500)',
                      fontWeight: 'var(--kt-weight-bold)',
                      textDecoration: 'none',
                    }}
                  >
                    <PhoneIcon size={13} />
                    {r.phone}
                  </a>
                )}
                {r.email && (
                  <a
                    href={`mailto:${r.email}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-navy-500)',
                      fontWeight: 'var(--kt-weight-bold)',
                      textDecoration: 'none',
                    }}
                  >
                    <EnvelopeIcon size={13} />
                    {r.email}
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
