import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components'
import { BriefcaseIcon } from '../icons'
import { useAuth } from '../context/AuthContext'
import { getDashboardApplications, type DashboardApplication } from '../services/workerService'
import { daysSince } from '../utils/date'

type StageCfg = { variant: 'secondary' | 'info' | 'warning' | 'success'; label: string }

const STAGE_CFG: Record<DashboardApplication['stage'], StageCfg> = {
  Applied: { variant: 'secondary', label: 'Applied' },
  Reviewed: { variant: 'info', label: 'Reviewed' },
  Interview: { variant: 'warning', label: 'Interview' },
  Offer: { variant: 'success', label: 'Offer' },
  Closed: { variant: 'secondary', label: 'Closed' },
}

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<DashboardApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getDashboardApplications(user.id, 50).then(({ data }) => {
      setApplications(data)
      setLoading(false)
    })
  }, [user])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px var(--kt-space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <BriefcaseIcon size={20} />
          <h1
            style={{
              fontSize: 'var(--kt-text-2xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: 0,
            }}
          >
            All applications
          </h1>
        </div>

        <div
          style={{
            background: 'var(--kt-surface)',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)',
            overflow: 'hidden',
          }}
        >
          {!loading && applications.length === 0 && (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                color: 'var(--kt-text-muted)',
                fontSize: 'var(--kt-text-sm)',
              }}
            >
              No applications yet.{' '}
              <Link to="/site/jobs" style={{ color: 'var(--kt-accent)' }}>
                Browse jobs →
              </Link>
            </div>
          )}

          {applications.length > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '10px 24px',
                  borderBottom: '1px solid var(--kt-border)',
                  background: 'var(--kt-bg)',
                  gap: 12,
                }}
              >
                {['Job', 'Stage', 'Applied', ''].map((h, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {applications.map((app, i) => {
                const cfg = STAGE_CFG[app.stage]
                const isLast = i === applications.length - 1
                const d = daysSince(app.appliedAt)
                return (
                  <div
                    key={app.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      padding: '14px 24px',
                      alignItems: 'center',
                      borderBottom: isLast ? 'none' : '1px solid var(--kt-border)',
                      gap: 12,
                      opacity: app.stage === 'Closed' ? 0.65 : 1,
                    }}
                  >
                    <div>
                      <Link
                        to={`/site/jobs/${app.jobId}`}
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          fontWeight: 'var(--kt-weight-medium)',
                          color: 'var(--kt-teal-600, var(--kt-accent))',
                          textDecoration: 'none',
                          display: 'block',
                          marginBottom: 2,
                        }}
                      >
                        {app.jobTitle}
                      </Link>
                      <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                        {app.companyName}
                      </p>
                    </div>
                    <div>
                      <Badge variant={cfg.variant} size="sm" dot>
                        {cfg.label}
                      </Badge>
                    </div>
                    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                      {d === 0 ? 'Today' : `${d}d ago`}
                    </span>
                    <Link to={`/site/jobs/${app.jobId}`}>
                      <span
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          color: 'var(--kt-accent)',
                          textDecoration: 'none',
                        }}
                      >
                        View job →
                      </span>
                    </Link>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
