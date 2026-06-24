import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal, EmptyState } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { getCompanyTemplates, deleteJobTemplate, type JobTemplate } from '../../services/jobService'
import {
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  type MessageTemplate,
} from '../../services/messageTemplateService'

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level (0–1 yr)',
  mid: 'Mid Level (1–3 yrs)',
  senior: 'Senior (3–5 yrs)',
  lead: 'Lead / Expert (5+ yrs)',
}

const SectionCard: React.FC<{
  title: string
  description?: string
  /** Optional CTA rendered in the top-right of the header (e.g. a "New" button). */
  action?: React.ReactNode
  children: React.ReactNode
}> = ({ title, description, action, children }) => (
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
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
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
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
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

  // ── Message templates ────────────────────────────────────────────
  const [msgTemplates, setMsgTemplates] = useState<MessageTemplate[]>([])
  const [msgLoading, setMsgLoading] = useState(true)
  // Editor target: 'new' opens a blank editor, a MessageTemplate edits it.
  const [editorTarget, setEditorTarget] = useState<'new' | MessageTemplate | null>(null)
  const [deleteMsgTarget, setDeleteMsgTarget] = useState<MessageTemplate | null>(null)
  const [deletingMsg, setDeletingMsg] = useState(false)
  const [msgError, setMsgError] = useState('')

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setMsgLoading(true)
    const [jobs, messages] = await Promise.all([
      getCompanyTemplates(companyId),
      getMessageTemplates(companyId),
    ])
    setTemplates(jobs.data)
    setMsgTemplates(messages.data)
    setLoading(false)
    setMsgLoading(false)
  }, [companyId])

  useEffect(() => {
    load()
  }, [load])

  const handleSaveMessage = async (input: {
    name: string
    body: string
  }): Promise<string | null> => {
    if (editorTarget === 'new' || editorTarget === null) {
      const { data, error: err } = await createMessageTemplate(companyId, input)
      if (err || !data) return err ?? 'save_failed'
      setMsgTemplates((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      const { data, error: err } = await updateMessageTemplate(editorTarget.id, input)
      if (err || !data) return err ?? 'save_failed'
      setMsgTemplates((prev) =>
        prev.map((t) => (t.id === data.id ? data : t)).sort((a, b) => a.name.localeCompare(b.name))
      )
    }
    setEditorTarget(null)
    return null
  }

  const handleConfirmDeleteMessage = async (): Promise<void> => {
    if (!deleteMsgTarget) return
    setDeletingMsg(true)
    setMsgError('')
    const { error: err } = await deleteMessageTemplate(deleteMsgTarget.id)
    setDeletingMsg(false)
    if (err) {
      setMsgError(err)
      return
    }
    const removedId = deleteMsgTarget.id
    setDeleteMsgTarget(null)
    setMsgTemplates((prev) => prev.filter((t) => t.id !== removedId))
  }

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
        action={
          !loading && templates.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/site/post-job')}>
              New
            </Button>
          ) : undefined
        }
      >
        {loading ? (
          <p style={mutedText}>Loading templates…</p>
        ) : templates.length === 0 ? (
          <EmptyState
            message="No job templates yet. Save a posting as a template from the Post a Job screen to reuse it later."
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/site/post-job')}>
                + New job template
              </Button>
            }
          />
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

      <SectionCard
        title="Message templates"
        description="Reusable messages your team can insert when writing to a worker, or attach to a pipeline task to send automatically."
        action={
          !msgLoading && msgTemplates.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setEditorTarget('new')}>
              New
            </Button>
          ) : undefined
        }
      >
        {msgLoading ? (
          <p style={mutedText}>Loading templates…</p>
        ) : msgTemplates.length === 0 ? (
          <EmptyState
            message="No message templates yet. Create one to reuse it when messaging."
            action={
              <Button variant="outline" size="sm" onClick={() => setEditorTarget('new')}>
                + New template
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {msgTemplates.map((t, i) => (
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
                  <p
                    style={{
                      ...mutedText,
                      margin: '2px 0 0',
                      fontSize: 'var(--kt-text-xs)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 420,
                    }}
                  >
                    {t.body}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => setEditorTarget(t)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteMsgTarget(t)}
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

      <MessageTemplateEditor
        target={editorTarget}
        onClose={() => setEditorTarget(null)}
        onSave={handleSaveMessage}
      />

      <Modal
        open={deleteMsgTarget !== null}
        onClose={() => (deletingMsg ? undefined : setDeleteMsgTarget(null))}
        size="sm"
        title="Delete template?"
        description={`“${deleteMsgTarget?.name ?? 'This template'}” will be removed. Pipeline tasks using it will no longer send a message.`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteMsgTarget(null)} disabled={deletingMsg}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirmDeleteMessage()}
              loading={deletingMsg}
            >
              Delete template
            </Button>
          </div>
        }
      >
        {msgError && (
          <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
            {msgError}
          </p>
        )}
      </Modal>

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

// ── Message template editor modal ────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--kt-text-xs)',
  fontWeight: 'var(--kt-weight-semibold)',
  color: 'var(--kt-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: 'var(--kt-text-sm)',
  color: 'var(--kt-text)',
  background: 'var(--kt-surface)',
  border: '1px solid var(--kt-border)',
  borderRadius: 'var(--kt-radius-md)',
  fontFamily: 'inherit',
}

const MessageTemplateEditor: React.FC<{
  target: 'new' | MessageTemplate | null
  onClose: () => void
  onSave: (input: { name: string; body: string }) => Promise<string | null>
}> = ({ target, onClose, onSave }) => {
  const isEdit = target !== null && target !== 'new'
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset the form whenever the editor opens for a different target.
  useEffect(() => {
    if (target === null) return
    if (target === 'new') {
      setName('')
      setBody('')
    } else {
      setName(target.name)
      setBody(target.body)
    }
    setError('')
    setSaving(false)
  }, [target])

  const canSave = name.trim().length > 0 && body.trim().length > 0

  async function submit(): Promise<void> {
    if (!canSave || saving) return
    setSaving(true)
    setError('')
    const err = await onSave({ name: name.trim(), body: body.trim() })
    setSaving(false)
    if (err) setError('Could not save template. Please try again.')
  }

  return (
    <Modal
      open={target !== null}
      onClose={() => (saving ? undefined : onClose())}
      size="md"
      title={isEdit ? 'Edit message template' : 'New message template'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void submit()}
            loading={saving}
            disabled={!canSave}
          >
            {isEdit ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={fieldLabel} htmlFor="mt-name">
            Template name
          </label>
          <input
            id="mt-name"
            style={fieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Interview invite"
            maxLength={120}
            autoFocus
          />
        </div>
        <div>
          <label style={fieldLabel} htmlFor="mt-body">
            Message
          </label>
          <textarea
            id="mt-body"
            style={{ ...fieldInput, minHeight: 140, resize: 'vertical', lineHeight: 1.5 }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the message workers will receive… Paste any links inline."
            maxLength={10000}
          />
        </div>
        {error && (
          <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

export default TemplatesSettingsPage
