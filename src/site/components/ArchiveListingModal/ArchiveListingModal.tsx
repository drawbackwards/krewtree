import React from 'react'
import { Modal } from '../../../components'

export interface ArchiveListingModalProps {
  open: boolean
  onClose: () => void
  jobTitle: string
  companyName: string
  onConfirm: () => void | Promise<void>
}

export const ArchiveListingModal: React.FC<ArchiveListingModalProps> = ({
  open,
  onClose,
  jobTitle,
  companyName,
  onConfirm,
}) => {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Archive listing"
      description={`${jobTitle} · ${companyName}`}
    >
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-text)',
            marginBottom: 4,
          }}
        >
          Listing will be archived
        </p>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            lineHeight: 1.5,
          }}
        >
          Archiving removes this job from search results but keeps it on record. You can find and
          restore it anytime from your dashboard under <strong>Archived</strong>.
        </p>
      </div>
      <button
        onClick={handleConfirm}
        style={{
          width: '100%',
          padding: '10px 0',
          background: 'var(--kt-navy-900)',
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
        Archive listing
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
