import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../components'

type UserType = 'worker' | 'company'

const TreeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" opacity=".9" />
    <rect x="14" y="24" width="4" height="5" rx="1" opacity=".6" />
  </svg>
)

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [userType, setUserType] = useState<UserType>('worker')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(userType === 'worker' ? '/site/dashboard/worker' : '/site/dashboard/company')
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'var(--kt-font-sans)',
        background: 'var(--kt-bg)',
      }}
    >
      {/* ── LEFT BRAND PANEL ─────────────────────────────────────────── */}
      <div
        style={{
          width: '42%',
          minWidth: 360,
          flexShrink: 0,
          background: 'var(--kt-navy-900)',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 48px',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/site')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            alignSelf: 'flex-start',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--kt-radius-md)',
              background: 'var(--kt-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <TreeIcon />
          </div>
          <span
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-sand-300)',
            }}
          >
            krewtree
          </span>
        </button>

        {/* Center content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: 60,
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 44px)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-sand-300)',
              lineHeight: 1.1,
              marginBottom: 16,
              letterSpacing: '-0.5px',
            }}
          >
            Welcome back.
          </h2>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'rgba(229,218,195,0.5)',
              lineHeight: 1.7,
              marginBottom: 52,
              maxWidth: 340,
            }}
          >
            Your next job — or your next great hire — is waiting.
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
                    borderRadius: 'var(--kt-radius-md)',
                    background: 'rgba(229,218,195,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.55)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 'var(--kt-text-xs)', color: 'rgba(229,218,195,0.2)' }}>
          A Regulix Partner Platform · © 2026 krewtree
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '20px 48px',
            gap: 12,
            borderBottom: '1px solid var(--kt-border)',
          }}
        >
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            New to krewtree?
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/site/signup')}>
            Create account
          </Button>
        </div>

        {/* Form area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 48px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420 }}>
            <h1
              style={{
                fontSize: 'var(--kt-text-3xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                marginBottom: 6,
                letterSpacing: '-0.3px',
              }}
            >
              Sign in
            </h1>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'var(--kt-text-muted)',
                marginBottom: 32,
              }}
            >
              Good to have you back.
            </p>

            {/* User type toggle */}
            <div
              style={{
                display: 'flex',
                background: 'var(--kt-surface)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 4,
                marginBottom: 28,
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
                    padding: '9px 0',
                    borderRadius: 'var(--kt-radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-medium)',
                    transition: 'all 0.15s ease',
                    background: userType === type ? 'white' : 'transparent',
                    color: userType === type ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                    boxShadow: userType === type ? 'var(--kt-shadow-sm)' : 'none',
                  }}
                >
                  {type === 'worker' ? '👷 Worker' : '🏢 Company'}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Password row — custom label row for "Forgot password?" link */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--kt-border)' }} />
              <span
                style={{
                  fontSize: 'var(--kt-text-xs)',
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
              <button
                onClick={() => navigate('/site/signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--kt-accent)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  fontFamily: 'var(--kt-font-sans)',
                  fontSize: 'inherit',
                  padding: 0,
                }}
              >
                Create a free account →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
