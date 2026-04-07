import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Checkbox } from '../../../components'
// TODO: replace with real Supabase query for industries list
import { industries } from '../../data/mock'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { BriefcaseIcon, ShieldCheckIcon, LightningIcon, SparkleIcon } from '../../icons'
import styles from './WorkerSignupPage.module.css'

const BENEFITS: { icon: React.ReactNode; label: string }[] = [
  { icon: <BriefcaseIcon size={15} />, label: 'Browse 12,400+ jobs across 8 industries' },
  { icon: <ShieldCheckIcon size={15} />, label: 'One profile works everywhere you want to work' },
  { icon: <LightningIcon size={15} />, label: 'Get Regulix Ready — get hired the same day' },
  { icon: <SparkleIcon size={15} />, label: 'Free to sign up, always' },
]

export const WorkerSignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
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

  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      valid = false
    } else setPasswordError('')

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      valid = false
    } else setConfirmPasswordError('')

    if (!termsAgreed || !valid) return

    setAuthError('')
    setIsSubmitting(true)
    const { error } = await signUp(email, password, 'worker', firstName, lastName)
    setIsSubmitting(false)
    if (error) {
      setAuthError(error)
      return
    }

    setPassword('')
    setConfirmPassword('')
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
        className={styles.topBar}
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/site"
          style={{ display: 'inline-flex', lineHeight: 0 }}
          aria-label="krewtree home"
        >
          <KrewtreeLogo height={30} onDark accentColor="white" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            className={styles.alreadyLabel}
            style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(255,255,255,0.7)' }}
          >
            Already have an account?
          </span>
          <Link
            to="/site/login"
            style={{
              background: 'rgba(229,218,195,0.1)',
              color: 'var(--kt-sand-300)',
              border: '1px solid rgba(229,218,195,0.2)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '6px 16px',
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
        className={styles.mainContent}
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
          className={styles.contentRow}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: 1060,
          }}
        >
          {/* Left — brand text (sticky) */}
          <div className={styles.brandPanel}>
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
              className={styles.brandSubhead}
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                marginBottom: 44,
                maxWidth: 340,
              }}
            >
              Create a free profile and get connected to employers across every industry.
            </p>
            <div className={styles.benefitsList}>
              {BENEFITS.map(({ icon, label }) => (
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
                      fontSize: 15,
                      flexShrink: 0,
                      marginTop: 1,
                      color: 'white',
                    }}
                  >
                    {icon}
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'rgba(255,255,255,0.85)',
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
              className={styles.socialProof}
              style={{
                marginTop: 40,
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
                54,000+
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.75)',
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
            className={styles.formCard}
            style={{
              background: 'white',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--kt-navy-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Worker Account
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
              Free forever. No credit card required.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <div className={styles.nameGrid}>
                <Input
                  label="First name"
                  type="text"
                  placeholder="Your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last name"
                  type="text"
                  placeholder="Your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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

              <div className={styles.passwordGrid}>
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
                  Industries you work in
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
                          <span>{ind.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Checkbox
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  label="I agree to the Terms of Service and Privacy Policy"
                  required
                />
              </div>

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
                  variant="accent"
                  size="lg"
                  fullWidth
                  disabled={!termsAgreed || isSubmitting}
                >
                  {isSubmitting ? 'Creating account…' : 'Create free account →'}
                </Button>
              </div>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                }}
              >
                Need to create a company account?{' '}
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
