import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { deleteCompany } from '../../services/companyService'
import { SettingsPageHeader } from './SettingsPageHeader'

const SectionCard: React.FC<{
  title: string
  description?: string
  children: React.ReactNode
}> = ({ title, description, children }) => (
  <section
    style={{
      background: 'var(--kt-surface)',
      border: '1px solid var(--kt-border)',
      borderRadius: 'var(--kt-radius-lg)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}
  >
    <div>
      <h2
        style={{
          fontSize: 'var(--kt-text-lg)',
          fontWeight: 'var(--kt-weight-bold)',
          color: 'var(--kt-text)',
          margin: '0 0 4px',
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
          {description}
        </p>
      )}
    </div>
    {children}
  </section>
)

/**
 * Organization-level account settings (owner/admin only — the whole section is
 * hidden from members by SettingsLayout). Personal sign-in details (name, email,
 * password) live on the Personal → My profile page; the company phone lives on
 * the Company Profile page.
 */
export const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { companyRole, logout } = useAuth()
  const isOwner = companyRole === 'owner'

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleConfirmDelete = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') return
    setIsDeleting(true)
    setDeleteError('')
    const { error } = await deleteCompany()
    if (error) {
      setIsDeleting(false)
      setDeleteError(error)
      return
    }
    await logout()
    setIsDeleting(false)
    setDeleteOpen(false)
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SettingsPageHeader
        title="Account & billing"
        description="Billing and account-level actions for this company."
      />
      <SectionCard
        title="Billing"
        description="Krewtree is free while in preview. Paid plans and per-seat billing are coming soon."
      >
        <div>
          <Button variant="outline" disabled>
            Manage billing
          </Button>
        </div>
      </SectionCard>

      {isOwner && (
        <SectionCard
          title="Delete account"
          description="Closes all of your job posts, archives every active applicant, and removes your company profile from public view. You have 30 days to recover via support before everything is permanently deleted."
        >
          <div>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              Delete company account…
            </Button>
          </div>
        </SectionCard>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => (isDeleting ? undefined : setDeleteOpen(false))}
        size="md"
        title="Delete this company account?"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              disabled={isDeleting || deleteConfirm.trim().toUpperCase() !== 'DELETE'}
            >
              {isDeleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
            When you confirm:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text)',
              lineHeight: 1.6,
            }}
          >
            <li>All of your open and paused job posts will close.</li>
            <li>All active applicants will be archived; workers will see them as archived.</li>
            <li>Your public company profile will no longer appear in search.</li>
            <li>
              Your account is recoverable for 30 days through support. After that, it is permanently
              deleted. Worker history keeps your company name as a static record.
            </li>
          </ul>
          <Input
            label="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          {deleteError && (
            <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
              {deleteError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
