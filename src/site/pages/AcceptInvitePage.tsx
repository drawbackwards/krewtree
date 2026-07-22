import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Spinner } from '../../components'
import { ACTIVE_COMPANY_KEY } from '../../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { acceptInvite } from '../services/teamService'

/**
 * Landing page for a company invite link (/site/join?token=…). The invitee must
 * be signed in to accept (acceptance binds the seat to their auth user). If they
 * are not, we send them to sign up / log in and keep the token in the URL so
 * they land back here afterward.
 */
export const AcceptInvitePage: React.FC = () => {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { isLoggedIn, isLoading, refreshMemberships } = useAuth()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'error'>('idle')
  const [error, setError] = useState('')
  const attempted = useRef(false)

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
      // Land the user in the company they just joined.
      try {
        localStorage.setItem(ACTIVE_COMPANY_KEY, data.companyId)
      } catch {
        // ignore persistence failure
      }
      await refreshMemberships()
      navigate('/site/dashboard/company', { replace: true })
    })
  }, [isLoading, token, isLoggedIn, refreshMemberships, navigate])

  const returnTo = token ? `/site/join?token=${encodeURIComponent(token)}` : '/site/join'

  const shell = (children: React.ReactNode): React.ReactElement => (
    <div
      style={{
        maxWidth: 460,
        margin: '80px auto',
        padding: 24,
        textAlign: 'center',
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
    return shell(<p style={{ color: 'var(--kt-text)' }}>This invite link is missing its token.</p>)
  }

  if (isLoading) return shell(<Spinner />)

  if (!isLoggedIn) {
    return shell(
      <>
        <h1 style={{ fontSize: 'var(--kt-text-xl)', margin: 0, color: 'var(--kt-text)' }}>
          You've been invited to a company on krewtree
        </h1>
        <p style={{ color: 'var(--kt-text-muted)', margin: 0 }}>
          Sign up or log in to accept the invitation. Use this same link again after signing in if
          you aren't returned automatically.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="primary"
            onClick={() =>
              navigate(`/site/signup/company?redirect=${encodeURIComponent(returnTo)}`)
            }
          >
            Sign up
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/site/login?redirect=${encodeURIComponent(returnTo)}`)}
          >
            Log in
          </Button>
        </div>
      </>
    )
  }

  if (status === 'error') {
    return shell(
      <>
        <h1 style={{ fontSize: 'var(--kt-text-xl)', margin: 0, color: 'var(--kt-text)' }}>
          Invitation problem
        </h1>
        <p style={{ color: 'var(--kt-danger)', margin: 0 }}>{error}</p>
        <Button variant="outline" onClick={() => navigate('/site')}>
          Go home
        </Button>
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
