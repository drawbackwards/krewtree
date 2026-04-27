import React, { useEffect, useState } from 'react'
import { Modal } from '../../../components'

export type PauseDuration = '7d' | '30d' | 'indefinite'

export interface ManageListingModalProps {
  open: boolean
  onClose: () => void
  jobTitle: string
  companyName: string
  onPauseConfirm: (duration: PauseDuration) => void | Promise<void>
}

const PAUSE_OPTIONS: { value: PauseDuration; label: string; hint: string }[] = [
  { value: '7d', label: '7 days', hint: 'Auto-resumes after one week' },
  { value: '30d', label: '30 days', hint: 'Auto-resumes after one month' },
  {
    value: 'indefinite',
    label: 'Indefinitely',
    hint: 'Stays paused until you reactivate it',
  },
]

export const ManageListingModal: React.FC<ManageListingModalProps> = ({
  open,
  onClose,
  jobTitle,
  companyName,
  onPauseConfirm,
}) => {
  const [duration, setDuration] = useState<PauseDuration>('7d')

  useEffect(() => {
    if (open) setDuration('7d')
  }, [open])

  const handleConfirm = async () => {
    await onPauseConfirm(duration)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Pause listing"
      description={`${jobTitle} · ${companyName}`}
    >
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-text-muted)',
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        Pausing hides this job from search results. You can reactivate it at any time from your
        dashboard.
      </p>
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          fontWeight: 'var(--kt-weight-semibold)',
          color: 'var(--kt-text)',
          marginBottom: 10,
        }}
      >
        Pause duration
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {PAUSE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            onClick={() => setDuration(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--kt-radius-md)',
              border: `1px solid ${duration === opt.value ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
              background: duration === opt.value ? 'var(--kt-primary-subtle)' : 'var(--kt-surface)',
              cursor: 'pointer',
              transition: 'all var(--kt-duration-fast)',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                border: `2px solid ${duration === opt.value ? 'var(--kt-primary)' : 'var(--kt-border-strong)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {duration === opt.value && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--kt-primary)',
                  }}
                />
              )}
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-medium)',
                  color: 'var(--kt-text)',
                  marginBottom: 1,
                }}
              >
                {opt.label}
              </p>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                {opt.hint}
              </p>
            </div>
          </label>
        ))}
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
        Confirm Pause
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
