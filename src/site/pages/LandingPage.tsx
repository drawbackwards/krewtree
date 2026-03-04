import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Badge } from '../../components'
import { RegulixBadge } from '../components'
import { industries, jobs } from '../data/mock'
import { JobCard } from '../components/JobCard/JobCard'

// ---- Shared section styles ----
const S = {
  section: (bg = 'var(--kt-bg)'): React.CSSProperties => ({
    backgroundColor: bg,
    padding: '80px var(--kt-space-6)',
  }),
  inner: (): React.CSSProperties => ({
    maxWidth: 1200,
    margin: '0 auto',
  }),
  sectionTitle: (): React.CSSProperties => ({
    fontSize: 'var(--kt-text-3xl)',
    fontWeight: 'var(--kt-weight-bold)',
    color: 'var(--kt-text)',
    marginBottom: 12,
    letterSpacing: '-0.3px',
  }),
  sectionSubtitle: (): React.CSSProperties => ({
    fontSize: 'var(--kt-text-lg)',
    color: 'var(--kt-text-muted)',
    maxWidth: 560,
    lineHeight: 'var(--kt-leading-normal)',
  }),
}

const FeatureItem = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={{
      width: 44,
      height: 44,
      borderRadius: 'var(--kt-radius-md)',
      background: 'rgba(229,218,195,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-sand-300)', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.55)', lineHeight: 1.6 }}>{body}</p>
    </div>
  </div>
)

const StepCard = ({ num, title, body }: { num: string; title: string; body: string }) => (
  <div style={{
    background: 'var(--kt-surface)',
    border: '1px solid var(--kt-border)',
    borderRadius: 'var(--kt-radius-lg)',
    padding: '28px 24px',
    position: 'relative',
    textAlign: 'center',
  }}>
    <div style={{
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'var(--kt-navy-900)',
      color: 'var(--kt-sand-400)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'var(--kt-weight-bold)',
      fontSize: 'var(--kt-text-xl)',
      margin: '0 auto 16px',
    }}>
      {num}
    </div>
    <p style={{ fontWeight: 'var(--kt-weight-semibold)', fontSize: 'var(--kt-text-lg)', color: 'var(--kt-text)', marginBottom: 8 }}>{title}</p>
    <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', lineHeight: 1.6 }}>{body}</p>
  </div>
)

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const featuredJobs = jobs.filter(j => j.isSponsored).slice(0, 3)

  const handleSearch = () => {
    navigate(`/site/jobs?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>

      {/* ======== HERO ======== */}
      <section style={{
        background: 'var(--kt-bg)',
        padding: '80px var(--kt-space-6) 72px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--kt-border)',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'radial-gradient(var(--kt-grey-400, #aaa) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <Badge variant="accent" size="sm">
                Now Live — 12,400+ Active Jobs
              </Badge>
              <RegulixBadge size="sm" showTooltip={false} />
            </div>

            <h1 style={{
              fontSize: 'clamp(38px, 6vw, 72px)',
              fontWeight: 300,
              color: 'var(--kt-text)',
              lineHeight: 1.05,
              marginBottom: 20,
              letterSpacing: '-2px',
            }}>
              Find your krew.<br />
              <span style={{ color: 'var(--kt-primary)', fontWeight: 600 }}>Grow your tree.</span>
            </h1>

            <p style={{
              fontSize: 'var(--kt-text-xl)',
              color: 'var(--kt-text-muted)',
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 540,
            }}>
              The job board built for real work. Connect workers and employers across every industry — with verified histories, instant hiring, and zero runaround.
            </p>

            {/* Search bar */}
            <div style={{
              display: 'flex',
              background: 'var(--kt-surface)',
              borderRadius: 'var(--kt-radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--kt-shadow-md)',
              maxWidth: 640,
              border: '1px solid var(--kt-border)',
            }}>
              <input
                type="text"
                placeholder="Job title, skill, or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  border: 'none',
                  outline: 'none',
                  fontSize: 'var(--kt-text-md)',
                  color: 'var(--kt-text)',
                  fontFamily: 'var(--kt-font-sans)',
                  background: 'transparent',
                }}
              />
              <div style={{ width: 1, background: 'var(--kt-border)', margin: '12px 0' }} />
              <input
                type="text"
                placeholder="Phoenix, AZ"
                style={{
                  width: 160,
                  padding: '16px 16px',
                  border: 'none',
                  outline: 'none',
                  fontSize: 'var(--kt-text-md)',
                  color: 'var(--kt-text)',
                  fontFamily: 'var(--kt-font-sans)',
                  background: 'transparent',
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  background: 'var(--kt-accent)',
                  color: 'white',
                  border: 'none',
                  padding: '0 28px',
                  fontWeight: 'var(--kt-weight-semibold)',
                  fontSize: 'var(--kt-text-md)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                  transition: 'background var(--kt-duration-fast)',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--kt-accent-hover, #5a6128)')}
                onMouseOut={e => (e.currentTarget.style.background = 'var(--kt-accent)')}
              >
                Search Jobs
              </button>
            </div>

            <p style={{ marginTop: 16, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-placeholder)' }}>
              Popular: CDL Driver · Framing Carpenter · CNA · Line Cook · Landscape Tech
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 0,
            marginTop: 64,
            borderTop: '1px solid var(--kt-border)',
            paddingTop: 40,
            flexWrap: 'wrap',
          }}>
            {[
              { num: '12,400+', label: 'Active Jobs' },
              { num: '54,000+', label: 'Workers' },
              { num: '620+', label: 'Verified Companies' },
              { num: '8', label: 'Industries' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: '1 1 140px',
                padding: '0 32px 0 0',
                borderRight: i < 3 ? '1px solid var(--kt-border)' : 'none',
                marginRight: i < 3 ? 32 : 0,
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-text)', lineHeight: 1 }}>
                  {s.num}
                </div>
                <div style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== INDUSTRIES ======== */}
      <section style={{ ...S.section('var(--kt-bg-subtle)') }}>
        <div style={S.inner()}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={S.sectionTitle()}>Browse by Industry</h2>
            <p style={{ ...S.sectionSubtitle(), margin: '0 auto' }}>
              One account works across every industry. Find the right opportunity wherever you want to work.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {industries.map(ind => (
              <button
                key={ind.id}
                onClick={() => navigate(`/site/jobs?industry=${ind.slug}`)}
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--kt-font-sans)',
                  transition: 'all var(--kt-duration-base) var(--kt-ease)',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = 'var(--kt-shadow-md)'
                  e.currentTarget.style.borderColor = 'var(--kt-border-strong)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'var(--kt-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{ind.icon}</span>
                <div>
                  <p style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', fontSize: 'var(--kt-text-md)' }}>
                    {ind.name}
                  </p>
                  <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', marginTop: 2 }}>
                    {ind.jobCount.toLocaleString()} jobs
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ======== FOR WORKERS / FOR COMPANIES ======== */}
      <section style={{ ...S.section(), paddingTop: 80, paddingBottom: 80 }}>
        <div style={S.inner()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

            {/* For Workers */}
            <div style={{
              background: `linear-gradient(140deg, var(--kt-navy-900), var(--kt-navy-800))`,
              borderRadius: 'var(--kt-radius-xl)',
              padding: '48px 40px',
            }}>
              <Badge variant="accent" size="sm" style={{ marginBottom: 20 }}>For Workers</Badge>
              <h2 style={{ fontSize: 'var(--kt-text-3xl)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-sand-300)', marginBottom: 12, lineHeight: 1.2 }}>
                Your profile,<br/>your history,<br/>one account.
              </h2>
              <p style={{ color: 'rgba(229,218,195,0.55)', fontSize: 'var(--kt-text-md)', marginBottom: 32, lineHeight: 1.6 }}>
                Build a verified work history, showcase your skills, and let employers find you — across every industry from a single profile.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
                <FeatureItem icon={<span style={{ fontSize: 20 }}>⚡</span>} title="Instant Hire Ready" body="Connect your Regulix account to signal employers you can start same-day." />
                <FeatureItem icon={<span style={{ fontSize: 20 }}>📋</span>} title="Verified Job History" body="Your Regulix timecard data becomes your verified employment record." />
                <FeatureItem icon={<span style={{ fontSize: 20 }}>⭐</span>} title="Performance Score" body="Earn ratings from employers that build your reputation across jobs." />
                <FeatureItem icon={<span style={{ fontSize: 20 }}>🚀</span>} title="Boost Your Application" body="Stand out in the applicant pool with a premium listing." />
              </div>
              <Button variant="secondary" size="lg" onClick={() => navigate('/site/dashboard/worker')}>
                Explore Worker Dashboard →
              </Button>
            </div>

            {/* For Companies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'var(--kt-sand-50)',
                border: '1px solid var(--kt-sand-200)',
                borderRadius: 'var(--kt-radius-xl)',
                padding: '40px 36px',
              }}>
                <Badge variant="primary" size="sm" style={{ marginBottom: 20 }}>For Companies</Badge>
                <h2 style={{ fontSize: 'var(--kt-text-3xl)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-navy-900)', marginBottom: 12, lineHeight: 1.2 }}>
                  Hire ready.<br/>Ship faster.
                </h2>
                <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-md)', marginBottom: 28, lineHeight: 1.6 }}>
                  Post jobs, browse verified workers, and hire people who can start tomorrow — with all their paperwork already done.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                  {[
                    'Post across all industries from one account',
                    'See Regulix Ready badge on hire-ready workers',
                    'Pre-screen with custom interview questions',
                    'Verify your company for premium trust signals',
                    'Sponsored job posts for maximum visibility',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--kt-olive-700)" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path fillRule="evenodd" d="M12 1.5l9 3.375v7.5c0 5.25-3.75 10.125-9 11.625C6.75 22.5 3 17.625 3 12.375v-7.5L12 1.5zm4.28 7.72a.75.75 0 00-1.06-1.06L10.5 12.88 8.78 11.16a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd"/>
                      </svg>
                      <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="primary" size="md" onClick={() => navigate('/site/dashboard/company')}>
                  Go to Company Dashboard →
                </Button>
              </div>

              {/* Regulix callout */}
              <div style={{
                background: 'var(--kt-olive-50)',
                border: '1.5px solid var(--kt-olive-300)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--kt-radius-md)',
                  background: 'var(--kt-olive-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" d="M12 1.5l9 3.375v7.5c0 5.25-3.75 10.125-9 11.625C6.75 22.5 3 17.625 3 12.375v-7.5L12 1.5zm4.28 7.72a.75.75 0 00-1.06-1.06L10.5 12.88 8.78 11.16a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd"/></svg>
                </div>
                <div>
                  <p style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-olive-900)', fontSize: 'var(--kt-text-md)', marginBottom: 4 }}>
                    Powered by Regulix
                  </p>
                  <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-olive-800)', lineHeight: 1.5 }}>
                    Krewtree is a Regulix partner platform. Workers with a Regulix account have completed all onboarding paperwork and can start work immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== FEATURED JOBS ======== */}
      <section style={{ ...S.section('var(--kt-bg-subtle)') }}>
        <div style={S.inner()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <h2 style={S.sectionTitle()}>Featured Jobs</h2>
              <p style={S.sectionSubtitle()}>Hand-picked opportunities from verified employers.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/site/jobs')}>Browse All Jobs →</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {featuredJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      </section>

      {/* ======== HOW IT WORKS ======== */}
      <section style={S.section()}>
        <div style={S.inner()}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={S.sectionTitle()}>How Krewtree Works</h2>
            <p style={{ ...S.sectionSubtitle(), margin: '0 auto' }}>
              Three steps to finding your next job or your next great hire.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            <StepCard num="01" title="Create Your Profile" body="Workers build a verified profile with skills, job history, and Regulix connection. Companies set up their business profile and verify credentials." />
            <StepCard num="02" title="Connect" body="Workers browse and apply to jobs across industries. Companies post jobs and discover qualified, hire-ready applicants with verified work histories." />
            <StepCard num="03" title="Get to Work" body="Regulix Ready workers can start the same day they're hired — all paperwork is done. No delays, no back-and-forth onboarding." />
          </div>
        </div>
      </section>

      {/* ======== CTA ======== */}
      <section style={{
        background: `linear-gradient(135deg, var(--kt-navy-900), var(--kt-navy-950))`,
        padding: '80px var(--kt-space-6)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <RegulixBadge size="lg" variant="onDark" pulse showTooltip={false} />
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-sand-300)', marginTop: 20, marginBottom: 16, lineHeight: 1.1 }}>
            Ready to build your krew?
          </h2>
          <p style={{ fontSize: 'var(--kt-text-lg)', color: 'rgba(229,218,195,0.55)', marginBottom: 40, lineHeight: 1.6 }}>
            Join thousands of workers and employers already using Krewtree to find faster, better matches — powered by Regulix.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="xl" onClick={() => navigate('/site/jobs')}>
              Find Jobs Now
            </Button>
            <Button variant="accent" size="xl" onClick={() => navigate('/site/post-job')}>
              Post a Job
            </Button>
          </div>
        </div>
      </section>

      {/* ======== FOOTER ======== */}
      <footer style={{
        background: 'var(--kt-navy-950)',
        padding: '40px var(--kt-space-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 'var(--kt-text-xl)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-sand-400)' }}>
            krewtree
          </span>
          <span style={{ color: 'rgba(229,218,195,0.3)', fontSize: 'var(--kt-text-sm)' }}>· A Regulix Partner Platform</span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.4)' }}>
          {['About', 'Employers', 'Workers', 'Industries', 'Privacy', 'Terms'].map(l => (
            <a key={l} href="#" style={{ color: 'inherit', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--kt-sand-400)')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(229,218,195,0.4)')}>
              {l}
            </a>
          ))}
        </div>
        <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.25)' }}>© 2026 Krewtree. All rights reserved.</span>
      </footer>
    </div>
  )
}
