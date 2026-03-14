import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

// ── SVG stat icons ─────────────────────────────────────────────────────────────
const StatIcon = ({ icon }: { icon: string }) => {
  const p = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: 17,
    height: 17,
  }
  switch (icon) {
    case 'hardhat':
      return (
        <svg {...p}>
          <path d="M2 20h20" />
          <path d="M6 20v-5a6 6 0 0112 0v5" />
          <path d="M2 15h20" />
          <path d="M12 3v4M9.5 5.5l2.5 1.5 2.5-1.5" />
        </svg>
      )
    case 'building':
      return (
        <svg {...p}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      )
    case 'zap':
      return (
        <svg {...p}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    default:
      return null
  }
}

const STATS = [
  { icon: 'hardhat', label: '54,000+ active workers across 8 industries' },
  { icon: 'building', label: '620+ verified companies actively hiring' },
  { icon: 'zap', label: 'Same-day hiring with Regulix Ready workers' },
]

// ── Page ───────────────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // For mock demo routing only — not shown in UI
  const isCompanyDemo = searchParams.get('type') === 'company'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPassword('')
    login(isCompanyDemo ? 'company' : 'worker')
    navigate(isCompanyDemo ? '/site/dashboard/company' : '/site/dashboard/worker')
  }

  return (
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
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 52px',
        }}
      >
        <Link
          to="/site"
          style={{ display: 'inline-flex', lineHeight: 0 }}
          aria-label="krewtree home"
        >
          <KrewtreeLogo height={34} onDark={false} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            New to krewtree?
          </span>
          <Link
            to="/site/signup"
            style={{
              background: 'var(--kt-navy-900)',
              color: 'white',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              textDecoration: 'none',
              transition: 'opacity 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Create account
          </Link>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px 64px',
          overflow: 'hidden',
        }}
      >
        <KrewtreeBgMark style={{ color: 'var(--kt-grey-900)', opacity: 0.045 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 72,
            width: '100%',
            maxWidth: 960,
          }}
        >
          {/* Left — brand text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 3vw, 46px)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-grey-900)',
                lineHeight: 1.1,
                marginBottom: 16,
                letterSpacing: '-0.8px',
              }}
            >
              Welcome back.
            </h1>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.7,
                marginBottom: 48,
                maxWidth: 340,
              }}
            >
              Your next opportunity is one sign-in away.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {STATS.map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: 'var(--kt-white)',
                      border: '1px solid var(--kt-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--kt-text-muted)',
                    }}
                  >
                    <StatIcon icon={icon} />
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-text)',
                      lineHeight: 1.55,
                      paddingTop: 6,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form card */}
          <div
            style={{
              background: 'var(--kt-white)',
              borderRadius: 16,
              padding: '44px 48px',
              width: 420,
              flexShrink: 0,
              border: '1px solid var(--kt-border)',
              boxShadow: 'var(--kt-shadow-md)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-2xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                marginBottom: 4,
                letterSpacing: '-0.3px',
              }}
            >
              Sign in
            </h2>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                marginBottom: 28,
              }}
            >
              Good to have you back.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-medium)',
                      color: 'var(--kt-text)',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-accent)',
                      fontFamily: 'var(--kt-font-sans)',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: 4 }}>
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Sign in →
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--kt-border)' }} />
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--kt-text-placeholder)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--kt-border)' }} />
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
              }}
            >
              New to krewtree?{' '}
              <Link
                to="/site/signup"
                style={{
                  color: 'var(--kt-accent)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  textDecoration: 'none',
                }}
              >
                Create a free account →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom wordmark */}
      <p
        style={{
          textAlign: 'center',
          padding: '0 0 24px',
          fontSize: 11,
          color: 'var(--kt-grey-300)',
          letterSpacing: '0.02em',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
