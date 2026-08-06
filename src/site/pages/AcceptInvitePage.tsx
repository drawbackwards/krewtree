import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Spinner } from '../../components'
import { ACTIVE_COMPANY_KEY } from '../../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { acceptInvite, getInviteEmail } from '../services/teamService'

/**
 * Landing page for a company invite link (/join?token=…). The invitee must
 * be signed in to accept (acceptance binds the seat to their auth user).
 *
 * If they are logged out we let them create an account or log in RIGHT HERE.
 * Crucially, a new invitee signs up with signUpInvite() — NOT the company
 * signup — so they join the existing company instead of spinning up a phantom
 * company of their own. No company name / industry / HQ is asked: the company
 * comes from the invite. Once authenticated, accept_company_invite() attaches
 * the seat and the effect below routes them into the company dashboard.
 */
export const AcceptInvitePage: React.FC = () => {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { isLoggedIn, isLoading, refreshMemberships, signUpInvite, setPersona } = useAuth()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'error'>('idle')
  const [error, setError] = useState('')
  const attempted = useRef(false)

  // Join form (shown only when logged out).
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [emailLocked, setEmailLocked] = useState(false)
  const [lookingUp, setLookingUp] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Prefill + lock the email a logged-out invite was addressed to. The token is
  // hashed in the DB and the invite row is RLS-protected, so this goes through a
  // SECURITY DEFINER RPC. A null result means the token is invalid/expired; an
  // error (e.g. the RPC isn't deployed) degrades to an editable field.
  useEffect(() => {
    if (isLoading || !token || isLoggedIn) return
    let cancelled = false
    getInviteEmail(token).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setLookingUp(false)
        return
      }
      if (!data) {
        setStatus('error')
        setError('This invite link is invalid or has expired.')
        setLookingUp(false)
        return
      }
      setEmail(data)
      setEmailLocked(true)
      setLookingUp(false)
    })
    return () => {
      cancelled = true
    }
  }, [isLoading, token, isLoggedIn])

  useEffect(() => {
    if (isLoading || !token || !isLoggedIn || attempted.current) return
    attempted.current = true
    setStatus('accepting')
    acceptInvite(token).then(async ({ data, error }) => {
      if (error || !data) {
        setStatus('error')
        setError(error ?? 'Could not accept this invite.')
        return
      }
      // The invitee is now a company user; reflect that in session state so
      // routing/guards resolve without waiting on a user_roles round trip.
      setPersona('company')
      // Land the user in the company they just joined.
      try {
        localStorage.setItem(ACTIVE_COMPANY_KEY, data.companyId)
      } catch {
        // ignore persistence failure
      }
      await refreshMemberships()
      navigate('/dashboard/company', { replace: true })
    })
  }, [isLoading, token, isLoggedIn, refreshMemberships, navigate, setPersona])

  const returnTo = token ? `/join?token=${encodeURIComponent(token)}` : '/join'

  const handleJoin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError('')
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setPasswordError('')
    setSubmitting(true)
    const { error } = await signUpInvite(email, password, firstName.trim(), lastName.trim())
    if (error) {
      setSubmitting(false)
      // Most common case: the email already has an account — nudge to log in.
      setFormError(
        /already registered|already exists/i.test(error)
          ? 'An account with this email already exists. Log in to accept the invite.'
          : error
      )
      return
    }
    // Success: auth state flips to logged-in and the effect above auto-accepts.
    // Keep `submitting` true so the joining spinner shows through the handoff.
  }

  const shell = (children: React.ReactNode): React.ReactElement => (
    <div
      style={{
        maxWidth: 460,
        margin: '80px auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  )

  if (!token) {
    return shell(
      <p style={{ color: 'var(--kt-text)', textAlign: 'center' }}>
        This invite link is missing its token.
      </p>
    )
  }

  if (isLoading) return shell(<Spinner />)

  // Signing up / accepting — keep a single joining state across the auth handoff.
  if (submitting || status === 'accepting') {
    return shell(
      <>
        <Spinner />
        <p style={{ color: 'var(--kt-text-muted)', margin: 0 }}>Joining the company…</p>
      </>
    )
  }

  // An invalid/expired token (found during accept OR the prefill lookup) shows
  // its own screen regardless of auth state.
  if (status === 'error') {
    return shell(
      <>
        <h1 style={{ fontSize: 'var(--kt-text-xl)', margin: 0, color: 'var(--kt-text)' }}>
          Invitation problem
        </h1>
        <p style={{ color: 'var(--kt-danger)', margin: 0, textAlign: 'center' }}>{error}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Go home
        </Button>
      </>
    )
  }

  if (!isLoggedIn) {
    if (lookingUp) return shell(<Spinner />)
    return shell(
      <>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--kt-text-xl)', margin: '0 0 6px', color: 'var(--kt-text)' }}>
            You've been invited to join a company
          </h1>
          <p style={{ color: 'var(--kt-text-muted)', margin: 0, fontSize: 'var(--kt-text-sm)' }}>
            Create your account to accept the invitation.
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="First name"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last name"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Work email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={emailLocked}
            helperText={emailLocked ? 'The email this invite was sent to.' : undefined}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setPasswordError('')
            }}
            error={passwordError}
            required
          />

          {formError && (
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)', margin: 0 }}>
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
            Create account & join →
          </Button>
        </form>

        <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(returnTo)}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-navy-500)',
              fontWeight: 'var(--kt-weight-bold)',
              fontFamily: 'var(--kt-font-sans)',
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            Log in
          </button>
        </p>
      </>
    )
  }

  return shell(
    <>
      <Spinner />
      <p style={{ color: 'var(--kt-text-muted)', margin: 0 }}>Joining the company…</p>
    </>
  )
}

export default AcceptInvitePage
