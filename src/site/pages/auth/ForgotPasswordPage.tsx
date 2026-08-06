import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { AuthCardShell, AuthCardHeader } from './AuthCardShell'

/**
 * Request a password reset. Collects an email and triggers the Supabase recovery
 * email (which links back to /reset-password). Always shows the same
 * "check your inbox" confirmation regardless of whether the address exists, so
 * the form can't be used to enumerate accounts.
 */
export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: reqError } = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (reqError) {
      setError('Something went wrong sending the reset email. Try again in a moment.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthCardShell>
        <AuthCardHeader
          title="Check your inbox"
          subtitle={
            <>
              If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a link to reset
              your password. It expires in one hour.
            </>
          }
        />
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 24px',
          }}
        >
          Didn&rsquo;t get it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-navy-500)',
            }}
          >
            try a different email
          </button>
          .
        </p>
        <Link
          to="/login"
          style={{
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-navy-500)',
            textDecoration: 'none',
          }}
        >
          ← Back to sign in
        </Link>
      </AuthCardShell>
    )
  }

  return (
    <AuthCardShell>
      <AuthCardHeader
        title="Reset your password"
        subtitle="Enter the email for your account and we'll send you a link to set a new password."
      />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCardShell>
  )
}
