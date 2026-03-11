import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

type UserType = 'worker' | 'company'

// ── Watermark ─────────────────────────────────────────────────────────────

// ── Page ───────────────────────────────────────────────────────────────────

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [userType, setUserType] = useState<UserType>('worker')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPassword('')
    login(userType)
    navigate(userType === 'worker' ? '/site/dashboard/worker' : '/site/dashboard/company')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--kt-navy-900)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--kt-font-sans)',
      }}
    >
      {/* Background tree mark */}
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
          <KrewtreeLogo height={34} onDark />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.45)' }}>
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
                color: 'rgba(229,218,195,0.45)',
                lineHeight: 1.7,
                marginBottom: 52,
                maxWidth: 380,
              }}
            >
              Your next job — or your next great hire — is one sign-in away.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '👷', label: '54,000+ active workers' },
                { icon: '🏢', label: '620+ verified companies hiring' },
                { icon: '⚡', label: 'Same-day hiring with Regulix' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(229,218,195,0.07)',
                      border: '1px solid rgba(229,218,195,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 17,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.5)' }}>
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
                  {type === 'worker' ? '👷 Worker' : '🏢 Company'}
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
