import React, { useEffect, useState } from 'react'
import { Modal, Divider } from '../../../components'
import { LightningIcon } from '../../icons'

export type BoostStopMode = 'pause' | 'limit'

export interface BoostConfig {
  stopMode: BoostStopMode
  appLimit: number | null // null when stopMode === 'pause'
  urgentHiring: boolean
}

export interface BoostListingModalProps {
  open: boolean
  onClose: () => void
  jobTitle: string
  companyName: string
  onConfirm: (config: BoostConfig) => void | Promise<void>
}

const COST_PER_APP = 38

export const BoostListingModal: React.FC<BoostListingModalProps> = ({
  open,
  onClose,
  jobTitle,
  companyName,
  onConfirm,
}) => {
  const [stopMode, setStopMode] = useState<BoostStopMode>('pause')
  const [appLimit, setAppLimit] = useState<string>('25')
  const [urgentHiring, setUrgentHiring] = useState(false)

  useEffect(() => {
    if (open) {
      setStopMode('pause')
      setAppLimit('25')
      setUrgentHiring(false)
    }
  }, [open])

  const estimatedCost =
    stopMode === 'limit'
      ? `$${(Number(appLimit) * COST_PER_APP).toLocaleString()}`
      : 'pay-per-application'

  const handleConfirm = async () => {
    await onConfirm({
      stopMode,
      appLimit: stopMode === 'limit' ? Number(appLimit) : null,
      urgentHiring,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Sponsor this listing"
      description={`${jobTitle} · ${companyName}`}
    >
      {/* Pitch */}
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-text-muted)',
          lineHeight: 1.5,
          margin: '0 0 20px',
        }}
      >
        Pinned to the top of search results with a "Featured" banner. Only pay when someone applies.
        Sponsored jobs get <strong>5× more views</strong> on average.{' '}
        <strong style={{ color: 'var(--kt-text)' }}>${COST_PER_APP}.00 per application.</strong>
      </p>

      {/* Stop mode */}
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          fontWeight: 'var(--kt-weight-semibold)',
          color: 'var(--kt-text)',
          marginBottom: 10,
        }}
      >
        When should this sponsored listing stop?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="radio"
            name="stopMode"
            checked={stopMode === 'pause'}
            onChange={() => setStopMode('pause')}
            style={{ accentColor: 'var(--kt-primary)', flexShrink: 0 }}
          />
          <div>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                fontWeight:
                  stopMode === 'pause' ? 'var(--kt-weight-semibold)' : 'var(--kt-weight-normal)',
              }}
            >
              Pause or close listing
            </p>
            <p
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.5,
              }}
            >
              Keep running until you manually pause it or close the job.
            </p>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="radio"
            name="stopMode"
            checked={stopMode === 'limit'}
            onChange={() => setStopMode('limit')}
            style={{ accentColor: 'var(--kt-primary)', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text)',
                  fontWeight:
                    stopMode === 'limit' ? 'var(--kt-weight-semibold)' : 'var(--kt-weight-normal)',
                }}
              >
                Stop after
              </p>
              <input
                type="number"
                min="1"
                value={appLimit}
                onChange={(e) => setAppLimit(e.target.value)}
                onClick={() => setStopMode('limit')}
                style={{
                  width: 72,
                  padding: '4px 8px',
                  border: `1px solid ${stopMode === 'limit' ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                  borderRadius: 'var(--kt-radius-sm)',
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text)',
                  background: 'var(--kt-bg)',
                  fontFamily: 'var(--kt-font-sans)',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>applications</p>
            </div>
            {stopMode === 'limit' && (
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                Estimated budget: <strong>{estimatedCost}</strong> total
              </p>
            )}
          </div>
        </label>
      </div>

      <Divider />

      {/* Urgently hiring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '20px 0 24px' }}>
        <input
          type="checkbox"
          id="boostUrgentHiring"
          checked={urgentHiring}
          onChange={(e) => setUrgentHiring(e.target.checked)}
          style={{
            marginTop: 3,
            accentColor: 'var(--kt-primary)',
            width: 16,
            height: 16,
            cursor: 'pointer',
          }}
        />
        <label htmlFor="boostUrgentHiring" style={{ cursor: 'pointer', flex: 1 }}>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              marginBottom: 3,
            }}
          >
            Add "Urgently Hiring" label
          </p>
          <p
            style={{
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-text-muted)',
              lineHeight: 1.5,
            }}
          >
            Shows a badge on your listing to signal that you need to fill this role fast.
          </p>
          {urgentHiring && (
            <div
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                background: 'var(--kt-warning-subtle)',
                border: '1px solid var(--kt-warning)',
                borderRadius: 'var(--kt-radius-full)',
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-warning-text)',
              }}
            >
              <LightningIcon size={12} /> Urgently Hiring
            </div>
          )}
        </label>
      </div>

      <button
        onClick={handleConfirm}
        style={{
          width: '100%',
          padding: '10px 0',
          background: 'var(--kt-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--kt-radius-md)',
          fontSize: 'var(--kt-text-sm)',
          fontWeight: 'var(--kt-weight-semibold)',
          cursor: 'pointer',
          fontFamily: 'var(--kt-font-sans)',
          marginBottom: 10,
        }}
      >
        Confirm Boost
      </button>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--kt-font-sans)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
