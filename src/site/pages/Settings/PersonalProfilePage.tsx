import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
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
 * Personal (per-seat) account settings: the user's own name, sign-in email, and
 * password. Distinct from the company's Organization settings — every seat has
 * their own. The name is what teammates and workers see on messages, notes, and
 * pipeline moves, so it is stored on the auth user (user_metadata).
 */
export const PersonalProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateEmail } = useAuth()
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>

  const [firstName, setFirstName] = useState((meta.first_name as string) ?? '')
  const [lastName, setLastName] = useState((meta.last_name as string) ?? '')
  const nameChanged =
    firstName.trim() !== ((meta.first_name as string) ?? '') ||
    lastName.trim() !== ((meta.last_name as string) ?? '')
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [nameError, setNameError] = useState('')

  const [emailInput, setEmailInput] = useState(user?.email ?? '')
  const emailChanged = emailInput.trim() !== (user?.email ?? '')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')

  const handleSaveName = async () => {
    if (!nameChanged) return
    setNameStatus('saving')
    setNameError('')
    // Writes to auth user_metadata; the USER_UPDATED event refreshes useAuth().
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim() },
    })
    if (error) {
      setNameStatus('error')
      setNameError(error.message)
      return
    }
    setNameStatus('saved')
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SettingsPageHeader
        title="My profile"
        description="Your name, sign-in email, and password. These are personal to your login."
      />
      <SectionCard
        title="Your name"
        description="Shown to teammates and workers on your messages, notes, and pipeline activity."
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setNameStatus('idle')
              }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setNameStatus('idle')
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="outline"
            onClick={handleSaveName}
            disabled={!nameChanged || nameStatus === 'saving'}
          >
            {nameStatus === 'saving' ? 'Saving…' : 'Save name'}
          </Button>
          {nameStatus === 'saved' && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-success)' }}>
              Saved.
            </span>
          )}
          {nameStatus === 'error' && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
              {nameError}
            </span>
          )}
        </div>
      </SectionCard>

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
        title="Password"
        description="To change your password, sign out and use the password reset flow from the sign-in page."
      >
        <div>
          <Button variant="outline" onClick={() => navigate('/site/login')}>
            Go to sign-in
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

export default PersonalProfilePage
