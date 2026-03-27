import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Select, Checkbox, Radio } from '../../../components'
// TODO: replace with real Supabase query for industries list
import { industries } from '../../data/mock'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

const BENEFITS = [
  { key: 'clipboard', label: 'Post unlimited jobs — 14-day free trial, no credit card' },
  { key: 'users', label: 'Access 54,000+ verified workers across 8 industries' },
  { key: 'zap', label: 'Hire same-day with Regulix Ready applicants' },
  { key: 'inbox', label: 'Applicant tracking + direct messaging included' },
]

const BenefitIcon = ({ icon }: { icon: string }) => {
  const p = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'white',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: 17,
    height: 17,
  }
  switch (icon) {
    case 'clipboard':
      return (
        <svg {...p}>
          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      )
    case 'users':
      return (
        <svg {...p}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'zap':
      return (
        <svg {...p}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    case 'inbox':
      return (
        <svg {...p}>
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
      )
    default:
      return null
  }
}

const COMPANY_SIZES = [
  { value: '1-9', label: '1–9' },
  { value: '10-50', label: '10–50' },
  { value: '51-200', label: '51–200' },
  { value: '201+', label: '201+' },
]

export const CompanySignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('10-50')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const industryOptions = industries.map((ind) => ({
    value: ind.slug,
    label: ind.name,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true)
    const { error } = await signUp(
      email,
      password,
      'company',
      companyName,
      '',
      industry,
      companySize
    )
    setIsSubmitting(false)
    if (error) {
      setAuthError(error)
      return
    }
    setPassword('')
    setConfirmPassword('')
    navigate('/site/dashboard/company')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--kt-olive-700)',
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
          <KrewtreeLogo height={34} onDark accentColor="white" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(255,255,255,0.7)' }}>
            Already have an account?
          </span>
          <Link
            to="/site/login?type=company"
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
              Hire faster.
            </h1>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                marginBottom: 44,
                maxWidth: 340,
              }}
            >
              Post jobs and find Regulix Ready workers who can start the same day they're hired — no
              paperwork delays.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BENEFITS.map(({ key, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <BenefitIcon icon={key} />
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

            {/* Social proof tile */}
            <div
              style={{
                marginTop: 40,
                display: 'inline-flex',
                flexDirection: 'column',
                padding: '16px 20px 16px 0',
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
                620+
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.75)',
                  marginTop: 4,
                  letterSpacing: '0.02em',
                }}
              >
                verified companies hiring on krewtree
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
            <span
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--kt-olive-label)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Company Account
            </span>
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
              14-day free trial. No credit card required.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <Input
                label="Company name"
                type="text"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />

              <Input
                label="Work email"
                type="email"
                placeholder="Your work email"
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

              <Select
                label="Primary industry"
                placeholder="Select industry"
                options={industryOptions}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />

              {/* Company size */}
              <div>
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-medium)',
                    color: 'var(--kt-text)',
                    marginBottom: 10,
                  }}
                >
                  Company size
                </p>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {COMPANY_SIZES.map(({ value, label }) => (
                    <Radio
                      key={value}
                      label={label}
                      name="company-size"
                      value={value}
                      checked={companySize === value}
                      onChange={() => setCompanySize(value)}
                    />
                  ))}
                </div>
              </div>

              <Checkbox
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                label="I agree to the Terms of Service and Privacy Policy"
                required
              />

              {authError && (
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-error, #c0392b)',
                    margin: 0,
                  }}
                >
                  {authError}
                </p>
              )}

              <div style={{ marginTop: 4 }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!termsAgreed || isSubmitting}
                >
                  {isSubmitting ? 'Creating account…' : 'Create company account →'}
                </Button>
              </div>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                }}
              >
                Need to create a worker account?{' '}
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
                  Go back
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
