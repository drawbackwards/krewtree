import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components'
import { JobCard } from '../components/JobCard/JobCard'
import { savedJobs as initialSavedJobs, SavedJob } from '../data/mock'

export const SavedJobsPage: React.FC = () => {
  const [saved, setSaved] = useState<SavedJob[]>(initialSavedJobs)
  const [sort, setSort] = useState<'recent' | 'industry'>('recent')

  const sorted = [...saved].sort((a, b) => {
    if (sort === 'recent') return a.savedDaysAgo - b.savedDaysAgo
    return a.job.industry.localeCompare(b.job.industry)
  })

  const handleUnsave = (id: string) => {
    setSaved(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px var(--kt-space-6)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 'var(--kt-text-2xl)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-text)', marginBottom: 4 }}>
              Saved Jobs
            </h1>
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
              {saved.length} saved position{saved.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/site/jobs">
            <Button variant="primary" size="sm">Browse More Jobs</Button>
          </Link>
        </div>

        {/* Sort bar */}
        {saved.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>Sort by:</span>
            {[
              { val: 'recent', label: 'Date saved' },
              { val: 'industry', label: 'Industry' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setSort(val as typeof sort)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--kt-radius-full)',
                  border: `1px solid ${sort === val ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                  background: sort === val ? 'color-mix(in srgb, var(--kt-primary) 8%, transparent)' : 'transparent',
                  color: sort === val ? 'var(--kt-primary)' : 'var(--kt-text-muted)',
                  fontSize: 'var(--kt-text-xs)', fontWeight: 'var(--kt-weight-medium)',
                  cursor: 'pointer', fontFamily: 'var(--kt-font-sans)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Saved job list */}
        {sorted.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--kt-surface)', borderRadius: 'var(--kt-radius-xl)',
            border: '1px solid var(--kt-border)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>🔖</div>
            <h2 style={{ fontSize: 'var(--kt-text-lg)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 8 }}>
              No saved jobs yet
            </h2>
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', marginBottom: 20 }}>
              Bookmark jobs you're interested in to revisit them later.
            </p>
            <Link to="/site/jobs">
              <Button variant="primary" size="md">Browse Jobs</Button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sorted.map(item => (
              <div key={item.id} style={{
                background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-xl)', overflow: 'hidden',
              }}>
                <JobCard job={item.job} compact={false} />
                {/* Meta bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px', borderTop: '1px solid var(--kt-border)',
                  background: 'var(--kt-bg)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      🔖 Saved {item.savedDaysAgo === 0 ? 'today' : `${item.savedDaysAgo}d ago`}
                    </span>
                    {item.note && (
                      <span style={{
                        fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)',
                        padding: '2px 8px', background: 'var(--kt-surface)', borderRadius: 'var(--kt-radius-full)',
                        border: '1px solid var(--kt-border)',
                        maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        📝 {item.note}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnsave(item.id)}
                    style={{
                      fontSize: 'var(--kt-text-xs)', color: 'var(--kt-danger)',
                      background: 'transparent', border: '1px solid var(--kt-danger)',
                      borderRadius: 'var(--kt-radius-sm)', padding: '3px 10px',
                      cursor: 'pointer', fontFamily: 'var(--kt-font-sans)',
                      fontWeight: 'var(--kt-weight-medium)',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
