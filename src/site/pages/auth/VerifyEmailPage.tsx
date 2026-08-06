import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Spinner } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { AuthCardShell, AuthCardHeader } from './AuthCardShell'

/**
 * Email verification landing. This is where the Supabase "Confirm signup" link
 * lands: the token in the URL is consumed by the client (detectSessionInUrl),
 * which sets email_confirmed_at, so once auth finishes loading isEmailVerified
 * reflects the result. Covers all four outcomes: still loading, verified,
 * logged-in-but-not-yet-verified (offer resend), and an invalid/expired link.
 */
export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoading, isLoggedIn, isEmailVerified, persona, resendVerificationEmail } = useAuth()
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    setResending(true)
    await resendVerificationEmail()
    setResending(false)
    setResent(true)
  }

  const dashboard =
    persona === 'company'
      ? '/site/dashboard/company'
      : persona === 'worker'
        ? '/site/dashboard/worker'
        : '/site'

  if (isLoading) {
    return (
      <AuthCardShell>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <Spinner size="lg" />
        </div>
      </AuthCardShell>
    )
  }

  if (isEmailVerified) {
    return (
      <AuthCardShell>
        <AuthCardHeader
          title="Email verified"
          subtitle="Your email is confirmed and your account is ready to go."
        />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(dashboard)}>
          Continue
        </Button>
      </AuthCardShell>
    )
  }

  // Logged in but the address still isn't confirmed — let them resend.
  if (isLoggedIn) {
    return (
      <AuthCardShell>
        <AuthCardHeader
          title="Verify your email"
          subtitle={
            resent
              ? 'A fresh verification link is on its way. Check your inbox.'
              : "This link didn't complete verification, or it has expired. Send yourself a new one."
          }
        />
        {!resent && (
          <Button variant="primary" size="lg" fullWidth disabled={resending} onClick={handleResend}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </Button>
        )}
      </AuthCardShell>
    )
  }

  // Not logged in and not verified → the link was invalid or expired.
  return (
    <AuthCardShell>
      <AuthCardHeader
        title="This link has expired"
        subtitle="Email verification links expire after a while. Sign in to request a new one."
      />
      <Link to="/site/login" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="lg" fullWidth>
          Go to sign in
        </Button>
      </Link>
    </AuthCardShell>
  )
}
