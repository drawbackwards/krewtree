import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Checkbox, Badge } from '../../../components'
import { industries } from '../../data/mock'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

const BENEFITS = [
  { icon: '💼', label: 'Browse 12,400+ jobs across 8 industries' },
  { icon: '🪪', label: 'One profile works everywhere you want to work' },
  { icon: '⚡', label: 'Get Regulix Ready — get hired the same day' },
  { icon: '✨', label: 'Free to sign up, always' },
]

export const WorkerSignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [regulixOptIn, setRegulixOptIn] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [industryOpen, setIndustryOpen] = useState(false)
  const industryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
        setIndustryOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleIndustry = (slug: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      valid = false
    } else {
      setPasswordError('')
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      valid = false
    } else {
      setConfirmPasswordError('')
    }

    if (!termsAgreed || !valid) return

    setPassword('')
    setConfirmPassword('')
    login('worker')
    navigate('/site/dashboard/worker')
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
            Already have an account?
          </span>
          <Link
            to="/site/login"
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
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(229,218,195,0.1)'
            }}
          >
            Sign in
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
          justifyContent: 'center',
          padding: '48px 24px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 56,
            width: '100%',
            maxWidth: 1060,
          }}
        >
          {/* Left — brand text (sticky) */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              position: 'sticky',
              top: 48,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(109,117,49,0.25)',
                border: '1px solid rgba(109,117,49,0.4)',
                borderRadius: 'var(--kt-radius-full)',
                padding: '4px 12px',
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 13 }}>👷</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--kt-sand-300)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Worker Account
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 3vw, 44px)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-sand-300)',
                lineHeight: 1.05,
                marginBottom: 16,
                letterSpacing: '-0.8px',
              }}
            >
              Find work faster.
            </h1>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'rgba(229,218,195,0.45)',
                lineHeight: 1.7,
                marginBottom: 44,
                maxWidth: 340,
              }}
            >
              Create a free profile and get connected to employers across every industry.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BENEFITS.map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(229,218,195,0.07)',
                      border: '1px solid rgba(229,218,195,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {icon}
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'rgba(229,218,195,0.5)',
                      lineHeight: 1.55,
                      paddingTop: 7,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Social proof tile */}
            <div
              style={{
                marginTop: 40,
                display: 'inline-flex',
                flexDirection: 'column',
                padding: '16px 20px',
                background: 'rgba(229,218,195,0.05)',
                border: '1px solid rgba(229,218,195,0.1)',
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--kt-text-2xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-sand-300)',
                  lineHeight: 1,
                }}
              >
                54,000+
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(229,218,195,0.35)',
                  marginTop: 4,
                  letterSpacing: '0.02em',
                }}
              >
                workers already on krewtree
              </span>
            </div>
          </div>

          {/* Right — white card */}
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '40px 44px 48px',
              width: 480,
              flexShrink: 0,
              boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <Badge variant="accent" size="sm">
                Worker Profile
              </Badge>
            </div>
            <h2
              style={{
                fontSize: 'var(--kt-text-2xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                marginBottom: 4,
                letterSpacing: '-0.3px',
                marginTop: 10,
              }}
            >
              Create your account
            </h2>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                marginBottom: 28,
              }}
            >
              Free forever. No credit card required.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input
                  label="Full name"
                  type="text"
                  placeholder="Marcus Torres"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="City, State"
                  type="text"
                  placeholder="Phoenix, AZ"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setConfirmPasswordError('')
                  }}
                  error={confirmPasswordError}
                  required
                />
              </div>

              {/* Industry multiselect dropdown */}
              <div ref={industryRef} style={{ position: 'relative' }}>
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-medium)',
                    color: 'var(--kt-text)',
                    marginBottom: 8,
                  }}
                >
                  Industries you work in{' '}
                  <span style={{ color: 'var(--kt-text-muted)', fontWeight: 400 }}>
                    (select all that apply)
                  </span>
                </p>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setIndustryOpen((o) => !o)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    border: `1.5px solid ${industryOpen ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                    borderRadius: 'var(--kt-radius-lg)',
                    background: 'white',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    fontSize: 'var(--kt-text-sm)',
                    color: selectedIndustries.length ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                    textAlign: 'left',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedIndustries.length === 0
                      ? 'Select industries…'
                      : selectedIndustries.length === 1
                        ? (industries.find((i) => i.slug === selectedIndustries[0])?.name ??
                          '1 selected')
                        : `${selectedIndustries.length} industries selected`}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      marginLeft: 8,
                      transform: industryOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown list */}
                {industryOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1.5px solid var(--kt-border)',
                      borderRadius: 'var(--kt-radius-lg)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 50,
                      overflow: 'hidden',
                    }}
                  >
                    {industries.map((ind) => {
                      const active = selectedIndustries.includes(ind.slug)
                      return (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => toggleIndustry(ind.slug)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            background: active ? 'rgba(109,117,49,0.07)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--kt-border)',
                            cursor: 'pointer',
                            fontFamily: 'var(--kt-font-sans)',
                            fontSize: 'var(--kt-text-sm)',
                            color: 'var(--kt-text)',
                            textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                          onMouseOver={(e) => {
                            if (!active) e.currentTarget.style.background = 'var(--kt-bg-subtle)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = active
                              ? 'rgba(109,117,49,0.07)'
                              : 'transparent'
                          }}
                        >
                          {/* Checkbox */}
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: `2px solid ${active ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                              background: active ? 'var(--kt-accent)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s',
                            }}
                          >
                            {active && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path
                                  d="M1 4l3 3 5-6"
                                  stroke="white"
                                  strokeWidth="1.75"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span style={{ fontSize: 15, lineHeight: 1 }}>{ind.icon}</span>
                          <span>{ind.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--kt-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Checkbox
                  checked={regulixOptIn}
                  onChange={(e) => setRegulixOptIn(e.target.checked)}
                  label="Start my Regulix verification to become hire-ready"
                  helperText="Takes ~10 min. Complete once, use everywhere."
                />
                <Checkbox
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  label="I agree to the Terms of Service and Privacy Policy"
                  required
                />
              </div>

              <div style={{ marginTop: 4 }}>
                <Button type="submit" variant="accent" size="lg" fullWidth disabled={!termsAgreed}>
                  Create free account →
                </Button>
              </div>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                }}
              >
                Wrong path?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/site/signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--kt-accent)',
                    fontFamily: 'var(--kt-font-sans)',
                    fontSize: 'inherit',
                    padding: 0,
                  }}
                >
                  Go back and choose your path
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      <p
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 0 20px',
          fontSize: 11,
          color: 'rgba(229,218,195,0.15)',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
