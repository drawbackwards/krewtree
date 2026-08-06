import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Spinner } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { AuthCardShell, AuthCardHeader } from './AuthCardShell'

/**
 * Set a new password. This is where the Supabase recovery link lands: the token
 * in the URL is consumed by the client (detectSessionInUrl), establishing a
 * temporary session, so by the time auth finishes loading we either have a
 * session (valid link → show the form) or none (missing/expired link → prompt to
 * request a fresh one). A normal logged-in user hitting this page can also just
 * change their password.
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const { session, isLoading, persona, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const { error: updErr } = await updatePassword(password)
    setSubmitting(false)
    if (updErr) {
      setError('This reset link has expired or already been used. Request a new one.')
      return
    }
    setDone(true)
  }

  // Auth still resolving the recovery token from the URL.
  if (isLoading) {
    return (
      <AuthCardShell>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <Spinner size="lg" />
        </div>
      </AuthCardShell>
    )
  }

  // No session → the link was missing, invalid, or expired.
  if (!session && !done) {
    return (
      <AuthCardShell>
        <AuthCardHeader
          title="This link has expired"
          subtitle="Password reset links can only be used once and expire after an hour. Request a fresh one to continue."
        />
        <Link to="/site/forgot-password" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="lg" fullWidth>
            Request a new link
          </Button>
        </Link>
      </AuthCardShell>
    )
  }

  if (done) {
    return (
      <AuthCardShell>
        <AuthCardHeader
          title="Password updated"
          subtitle="Your password has been changed. You're all set."
        />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() =>
            navigate(
              persona === 'company'
                ? '/site/dashboard/company'
                : persona === 'worker'
                  ? '/site/dashboard/worker'
                  : '/site/login'
            )
          }
        >
          Continue
        </Button>
      </AuthCardShell>
    )
  }

  return (
    <AuthCardShell>
      <AuthCardHeader
        title="Set a new password"
        subtitle="Choose a new password for your account."
      />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && (
          <p
            style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-error, #c0392b)', margin: 0 }}
          >
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthCardShell>
  )
}
