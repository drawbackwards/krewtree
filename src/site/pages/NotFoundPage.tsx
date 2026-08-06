import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components'
import { KrewtreeBgMark } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

/**
 * 404 page. Rendered by the router's `*` catch-all inside AppLayout (so the
 * navbar stays), replacing the previous silent redirect to /site. Sends the
 * visitor somewhere useful: their dashboard when signed in, otherwise home.
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoggedIn, persona } = useAuth()

  const home =
    isLoggedIn && persona === 'company'
      ? '/dashboard/company'
      : isLoggedIn && persona === 'worker'
        ? '/dashboard/worker'
        : '/'

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        overflow: 'hidden',
      }}
    >
      <KrewtreeBgMark style={{ color: 'var(--kt-grey-900)', opacity: 0.045 }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
        <div
          style={{
            fontSize: 'clamp(56px, 10vw, 88px)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-navy-500)',
            lineHeight: 1,
            letterSpacing: '-2px',
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: 'var(--kt-text-2xl)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: '16px 0 8px',
            letterSpacing: '-0.3px',
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: 'var(--kt-text-md)',
            color: 'var(--kt-text-muted)',
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate(home)}>
          {isLoggedIn ? 'Back to dashboard' : 'Back to home'}
        </Button>
      </div>
    </div>
  )
}
