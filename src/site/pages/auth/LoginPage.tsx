import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

type UserType = 'worker' | 'company'

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

// ── Page ───────────────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const [userType, setUserType] = useState<UserType>(
    searchParams.get('type') === 'company' ? 'company' : 'worker'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isCompany = userType === 'company'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPassword('')
    login(userType)
    navigate(isCompany ? '/site/dashboard/company' : '/site/dashboard/worker')
  }

  const STATS = isCompany
    ? [
        { icon: 'building', label: '620+ verified companies hiring on krewtree' },
        { icon: 'hardhat', label: '54,000+ active workers ready to hire' },
        { icon: 'zap', label: 'Same-day hiring with Regulix Ready workers' },
      ]
    : [
        { icon: 'hardhat', label: '54,000+ active workers across 8 industries' },
        { icon: 'building', label: '620+ verified companies actively hiring' },
        { icon: 'zap', label: 'Same-day hiring with Regulix' },
      ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isCompany ? 'var(--kt-olive-700)' : 'var(--kt-navy-900)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--kt-font-sans)',
        transition: 'background 0.25s ease',
      }}
    >
      <KrewtreeBgMark />

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
          <KrewtreeLogo height={34} onDark accentColor={isCompany ? 'white' : undefined} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(255,255,255,0.7)' }}>
            New to krewtree?
          </span>
          <Link
            to="/site/signup"
            style={{
              background: 'rgba(229,218,195,0.1)',
              color: 'var(--kt-sand-300)',
              border: '1px solid rgba(229,218,195,0.2)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(229,218,195,0.16)'
              e.currentTarget.style.borderColor = 'rgba(229,218,195,0.35)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(229,218,195,0.1)'
              e.currentTarget.style.borderColor = 'rgba(229,218,195,0.2)'
            }}
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
          padding: '40px 24px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 56,
            width: '100%',
            maxWidth: 1020,
          }}
        >
          {/* Left — brand text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 'clamp(32px, 3.5vw, 52px)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-sand-300)',
                lineHeight: 1.05,
                marginBottom: 18,
                letterSpacing: '-1px',
              }}
            >
              Welcome back.
            </h1>
            <p
              style={{
                fontSize: 'var(--kt-text-lg)',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                marginBottom: 52,
                maxWidth: 380,
              }}
            >
              {isCompany
                ? 'Your next great hire is one sign-in away.'
                : 'Your next job is one sign-in away.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {STATS.map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'rgba(229,218,195,0.8)',
                    }}
                  >
                    <StatIcon icon={icon} />
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'white',
                      lineHeight: 1.55,
                      paddingTop: 7,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — white card */}
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '44px 48px',
              width: 440,
              flexShrink: 0,
              boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: '#8B9A3E',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              {isCompany ? 'Company Account' : 'Worker Account'}
            </span>
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

            {/* Worker / Company toggle */}
            <div
              style={{
                display: 'flex',
                background: 'var(--kt-surface)',
                borderRadius: 10,
                padding: 3,
                marginBottom: 24,
                border: '1px solid var(--kt-border)',
              }}
            >
              {(['worker', 'company'] as UserType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-medium)',
                    transition: 'all 0.15s ease',
                    background: userType === type ? 'white' : 'transparent',
                    color: userType === type ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                    boxShadow: userType === type ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  {type === 'worker' ? 'Worker' : 'Company'}
                </button>
              ))}
            </div>

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
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 0 20px',
          fontSize: 11,
          color: 'rgba(229,218,195,0.18)',
          letterSpacing: '0.02em',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
