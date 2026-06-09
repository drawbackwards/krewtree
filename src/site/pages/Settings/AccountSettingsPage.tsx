import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { deleteCompany, getCompanyProfile, updateCompanyPhone } from '../../services/companyService'

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

export const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateEmail, logout } = useAuth()

  const [emailInput, setEmailInput] = useState(user?.email ?? '')
  const emailChanged = emailInput.trim() !== (user?.email ?? '')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')

  const [phoneInput, setPhoneInput] = useState('')
  const [phoneOriginal, setPhoneOriginal] = useState('')
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [phoneError, setPhoneError] = useState('')
  const phoneChanged = phoneInput.trim() !== phoneOriginal

  useEffect(() => {
    if (!user) return
    getCompanyProfile(user.id).then(({ data }) => {
      if (data) {
        setPhoneInput(data.phone ?? '')
        setPhoneOriginal(data.phone ?? '')
      }
    })
  }, [user?.id])

  const handleUpdatePhone = async () => {
    if (!user || !phoneChanged) return
    setPhoneStatus('saving')
    setPhoneError('')
    const { error } = await updateCompanyPhone(user.id, phoneInput.trim())
    if (error) {
      setPhoneStatus('error')
      setPhoneError(error)
      return
    }
    setPhoneOriginal(phoneInput.trim())
    setPhoneStatus('saved')
  }

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleUpdateEmail = async () => {
    if (!emailInput.trim() || !emailChanged) return
    setEmailStatus('sending')
    setEmailError('')
    const { error } = await updateEmail(emailInput.trim())
    if (error) {
      setEmailStatus('error')
      setEmailError(error)
      return
    }
    setEmailStatus('sent')
  }

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
    // Sign out and route to the landing page. The user's posts have closed and
    // applicants archived; restoration is via support during the 30-day grace.
    await logout()
    setIsDeleting(false)
    setDeleteOpen(false)
    navigate('/site')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard
        title="Email"
        description="Used to sign in. Changing it sends a confirmation link to the new address; the old address is also notified."
      >
        <Input
          label="Email address"
          type="email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value)
            setEmailStatus('idle')
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="outline"
            onClick={handleUpdateEmail}
            disabled={!emailChanged || emailStatus === 'sending'}
          >
            {emailStatus === 'sending' ? 'Sending…' : 'Update email'}
          </Button>
          {emailStatus === 'sent' && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-success)' }}>
              Check your new email to confirm.
            </span>
          )}
          {emailStatus === 'error' && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
              {emailError}
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Phone"
        description="Used for account recovery and (later) for SMS verification. Phone verification is coming in a future update."
      >
        <Input
          label="Phone number"
          type="tel"
          value={phoneInput}
          onChange={(e) => {
            setPhoneInput(e.target.value)
            setPhoneStatus('idle')
          }}
          placeholder="(555) 123-4567"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="outline"
            onClick={handleUpdatePhone}
            disabled={!phoneChanged || phoneStatus === 'saving'}
          >
            {phoneStatus === 'saving' ? 'Saving…' : 'Update phone'}
          </Button>
          {phoneStatus === 'saved' && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-success)' }}>
              Saved.
            </span>
          )}
          {phoneStatus === 'error' && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
              {phoneError}
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Password"
        description="To change your password, sign out and use the password reset flow from the sign-in page."
      >
        <div>
          <Button variant="outline" onClick={() => navigate('/site/login?type=company')}>
            Go to sign-in
          </Button>
        </div>
      </SectionCard>

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
