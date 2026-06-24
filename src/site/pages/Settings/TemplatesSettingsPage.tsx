import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { getCompanyTemplates, deleteJobTemplate, type JobTemplate } from '../../services/jobService'

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level (0–1 yr)',
  mid: 'Mid Level (1–3 yrs)',
  senior: 'Senior (3–5 yrs)',
  lead: 'Lead / Expert (5+ yrs)',
}

const SectionCard: React.FC<{
  title: string
  description?: string
  children: React.ReactNode
}> = ({ title, description, children }) => (
  <section
    style={{
      background: 'var(--kt-surface)',
      border: '1px solid var(--kt-border)',
      borderRadius: 'var(--kt-radius-lg)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}
  >
    <div>
      <h2
        style={{
          fontSize: 'var(--kt-text-lg)',
          fontWeight: 'var(--kt-weight-bold)',
          color: 'var(--kt-text)',
          margin: '0 0 4px',
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
          {description}
        </p>
      )}
    </div>
    {children}
  </section>
)

const mutedText: React.CSSProperties = {
  fontSize: 'var(--kt-text-sm)',
  color: 'var(--kt-text-muted)',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const Detail: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => {
  if (children === null || children === undefined || children === '') return null
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--kt-text-xs)',
          fontWeight: 'var(--kt-weight-semibold)',
          color: 'var(--kt-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <div
        style={{
          margin: '3px 0 0',
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-text)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function payText(p: JobTemplate['payload']): string {
  if (p.payMin == null && p.payMax == null) return ''
  const fmt = (n: number): string => (p.payType === 'salary' ? `$${n}K` : `$${n}`)
  const unit = p.payType === 'salary' ? '/yr' : '/hr'
  const range =
    p.payMin != null && p.payMax != null
      ? `${fmt(p.payMin)}–${fmt(p.payMax)}`
      : fmt((p.payMin ?? p.payMax) as number)
  return `${range} ${unit}`
}

function optionFlags(p: JobTemplate['payload']): string {
  const flags: string[] = []
  if (p.isSponsored) flags.push('Boosted')
  if (p.urgentHiring) flags.push('Urgently hiring')
  if (p.regulixPreferred) flags.push('Regulix preferred')
  return flags.join(', ')
}

export const TemplatesSettingsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const companyId = user?.id ?? ''

  const [templates, setTemplates] = useState<JobTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTarget, setViewTarget] = useState<JobTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await getCompanyTemplates(companyId)
    setTemplates(data)
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    load()
  }, [load])

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    const { error: err } = await deleteJobTemplate(deleteTarget.id)
    setDeleting(false)
    if (err) {
      setError(err)
      return
    }
    const removedId = deleteTarget.id
    setDeleteTarget(null)
    setTemplates((prev) => prev.filter((t) => t.id !== removedId))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard
        title="Job templates"
        description="Reusable job postings your team has saved. Load one from the Post a Job screen to prefill the form. Save a new one there with “Save as template”."
      >
        {loading ? (
          <p style={mutedText}>Loading templates…</p>
        ) : templates.length === 0 ? (
          <p style={mutedText}>
            No job templates yet. Open Post a Job and choose “Save as template” to create one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {templates.map((t, i) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '14px 0',
                  borderTop:
                    i === 0 ? 'none' : '1px solid var(--kt-border-subtle, rgba(0,0,0,0.06))',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.name}
                  </p>
                  <p style={{ ...mutedText, margin: '2px 0 0', fontSize: 'var(--kt-text-xs)' }}>
                    {t.payload.title ? `${t.payload.title} · ` : ''}Saved {formatDate(t.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => setViewTarget(t)}>
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(t)}
                    style={{ color: 'var(--kt-danger)' }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        size="md"
        title={viewTarget?.name}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => viewTarget && navigate(`/site/post-job?template=${viewTarget.id}`)}
            >
              Use to create a job
            </Button>
          </div>
        }
      >
        {viewTarget &&
          (() => {
            const p = viewTarget.payload
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Detail label="Job title">{p.title}</Detail>
                <Detail label="Industry">{p.industry}</Detail>
                <Detail label="Job type">{p.type}</Detail>
                <Detail label="Location">{p.location}</Detail>
                <Detail label="Pay">{payText(p) || undefined}</Detail>
                <Detail label="Experience">
                  {p.experienceLevel
                    ? (EXPERIENCE_LABELS[p.experienceLevel] ?? p.experienceLevel)
                    : undefined}
                </Detail>
                <Detail label="Description">{p.description}</Detail>
                <Detail label="Requirements">
                  {p.requirements?.length ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {p.requirements.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : undefined}
                </Detail>
                <Detail label="Skills">{p.skills?.length ? p.skills.join(', ') : undefined}</Detail>
                <Detail label="Screening questions">
                  {p.preInterviewQuestions?.length ? (
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      {p.preInterviewQuestions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ol>
                  ) : undefined}
                </Detail>
                <Detail label="Options">{optionFlags(p) || undefined}</Detail>
              </div>
            )
          })()}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        size="sm"
        title="Delete template?"
        description={`“${deleteTarget?.name ?? 'This template'}” will be removed. Jobs you already created from it are not affected.`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleConfirmDelete()} loading={deleting}>
              Delete template
            </Button>
          </div>
        }
      >
        {error && (
          <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
            {error}
          </p>
        )}
      </Modal>
    </div>
  )
}

export default TemplatesSettingsPage
