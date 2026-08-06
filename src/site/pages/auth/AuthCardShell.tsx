import React from 'react'
import { Link } from 'react-router-dom'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { FEATURES } from '../../config/features'

/**
 * Shared chrome for standalone auth utility pages (forgot / reset password,
 * verify email). Mirrors LoginPage's look — grey canvas, top bar with the logo,
 * a centered white card, brand bg mark, bottom wordmark — without the two-column
 * marketing panel. These pages render OUTSIDE AppLayout, so there is no navbar.
 */
export const AuthCardShell: React.FC<{
  children: React.ReactNode
  /** Right-hand top-bar slot. Defaults to a link back to sign in. */
  topRight?: React.ReactNode
}> = ({ children, topRight }) => (
  <div
    style={{
      minHeight: '100vh',
      background: 'var(--kt-grey-50)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--kt-font-sans)',
    }}
  >
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 32px',
      }}
    >
      <Link to="/" style={{ display: 'inline-flex', lineHeight: 0 }} aria-label="krewtree home">
        <KrewtreeLogo height={30} onDark={false} />
      </Link>
      {topRight ?? (
        <Link
          to="/login"
          style={{
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-navy-500)',
            textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
      )}
    </div>

    <div
      style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px 64px',
        overflow: 'hidden',
      }}
    >
      <KrewtreeBgMark style={{ color: 'var(--kt-grey-900)', opacity: 0.045 }} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          background: 'var(--kt-white)',
          borderRadius: 16,
          padding: '44px 48px',
          border: '1px solid var(--kt-border)',
          boxShadow: 'var(--kt-shadow-md)',
        }}
      >
        {children}
      </div>
    </div>

    <p
      style={{
        textAlign: 'center',
        padding: '0 0 24px',
        fontSize: 'var(--kt-text-xs)',
        color: 'var(--kt-grey-300)',
        letterSpacing: '0.02em',
      }}
    >
      {FEATURES.regulix ? 'A Regulix Partner Platform · © 2026 krewtree' : '© 2026 krewtree'}
    </p>
  </div>
)

/** Shared card heading + subtitle used by the auth utility pages. */
export const AuthCardHeader: React.FC<{ title: string; subtitle?: React.ReactNode }> = ({
  title,
  subtitle,
}) => (
  <>
    <h1
      style={{
        fontSize: 'var(--kt-text-2xl)',
        fontWeight: 'var(--kt-weight-bold)',
        color: 'var(--kt-text)',
        margin: '0 0 4px',
        letterSpacing: '-0.3px',
      }}
    >
      {title}
    </h1>
    {subtitle && (
      <p
        style={{
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-text-muted)',
          margin: '0 0 28px',
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    )}
  </>
)
