import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  getCompanyStages,
  updateCompanyStage,
  type TaskTemplate,
  type TaskTemplatePatch,
  type TemplateStage,
  type CompanyStage,
} from '../../services/pipelineService'
import styles from './PipelineSettingsPage.module.css'

const STAGES: { stage: TemplateStage; label: string }[] = [
  { stage: 'screening', label: 'Screening' },
  { stage: 'assessment', label: 'Assessment' },
  { stage: 'interview', label: 'Interview' },
  { stage: 'offer', label: 'Offer' },
]

const PipelineSettingsPage: React.FC = () => {
  const { user } = useAuth()
  const companyId = user?.id ?? ''
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [stages, setStages] = useState<CompanyStage[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const [t, s] = await Promise.all([getTaskTemplates(companyId), getCompanyStages(companyId)])
    setTemplates(t.data)
    setStages(s.data)
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    load()
  }, [load])

  async function handleStageUpdate(
    stage: TemplateStage,
    patch: {
      enabled?: boolean
      purpose?: string | null
      slaHoursApproaching?: number | null
      slaHoursBreached?: number | null
    }
  ) {
    setStages((prev) => prev.map((s) => (s.stage === stage ? { ...s, ...patch } : s)))
    await updateCompanyStage(companyId, stage, patch)
  }

  async function handleCreate(stage: TemplateStage, label: string, isRequired: boolean) {
    const { data } = await createTaskTemplate(companyId, stage, label, isRequired)
    if (data) setTemplates((prev) => [...prev, data])
  }

  async function handleUpdate(id: string, patch: TaskTemplatePatch) {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: TaskTemplate = { ...t }
        if (patch.label !== undefined) next.label = patch.label
        if (patch.isRequired !== undefined) next.isRequired = patch.isRequired
        if (patch.messageSubject !== undefined) next.messageSubject = patch.messageSubject
        if (patch.messageBody !== undefined) next.messageBody = patch.messageBody
        if (patch.calendarLink !== undefined) next.calendarLink = patch.calendarLink
        if (patch.autoSend !== undefined) next.autoSend = patch.autoSend
        return next
      })
    )
    await updateTaskTemplate(id, patch)
  }

  async function handleDelete(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    await deleteTaskTemplate(id)
  }

  if (!companyId) return null

  return (
    <div>
      <p className={styles.intro}>
        Define the default tasks your team works through at each pipeline stage. Tasks are copied
        onto every new applicant when they enter the stage. Marking a task as required will block
        stage advancement until it&apos;s completed or skipped.
      </p>

      {loading ? (
        <div className={styles.loading}>Loading templates…</div>
      ) : (
        <div className={styles.stages}>
          {STAGES.map(({ stage, label }) => {
            const stageTemplates = templates
              .filter((t) => t.stage === stage)
              .sort((a, b) => a.order - b.order)
            const stageConfig: CompanyStage = stages.find((s) => s.stage === stage) ?? {
              id: '',
              companyId: companyId,
              stage,
              enabled: true,
              purpose: null,
              slaHoursApproaching: null,
              slaHoursBreached: null,
            }
            return (
              <StageBlock
                key={stage}
                stage={stage}
                label={label}
                stageConfig={stageConfig}
                templates={stageTemplates}
                onCreate={(text, req) => handleCreate(stage, text, req)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onStageUpdate={(patch) => handleStageUpdate(stage, patch)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

type StageBlockProps = {
  stage: TemplateStage
  label: string
  stageConfig: CompanyStage
  templates: TaskTemplate[]
  onCreate: (label: string, isRequired: boolean) => Promise<void>
  onUpdate: (id: string, patch: TaskTemplatePatch) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onStageUpdate: (patch: {
    enabled?: boolean
    purpose?: string | null
    slaHoursApproaching?: number | null
    slaHoursBreached?: number | null
  }) => Promise<void>
}

const StageBlock: React.FC<StageBlockProps> = ({
  label,
  stageConfig,
  templates,
  onCreate,
  onUpdate,
  onDelete,
  onStageUpdate,
}) => {
  const [newLabel, setNewLabel] = useState('')
  const [newRequired, setNewRequired] = useState(false)
  const [purposeDraft, setPurposeDraft] = useState(stageConfig.purpose ?? '')
  const [approachingDraft, setApproachingDraft] = useState<string>(
    stageConfig.slaHoursApproaching != null ? String(stageConfig.slaHoursApproaching) : ''
  )
  const [breachedDraft, setBreachedDraft] = useState<string>(
    stageConfig.slaHoursBreached != null ? String(stageConfig.slaHoursBreached) : ''
  )

  useEffect(() => {
    setPurposeDraft(stageConfig.purpose ?? '')
  }, [stageConfig.purpose])

  useEffect(() => {
    setApproachingDraft(
      stageConfig.slaHoursApproaching != null ? String(stageConfig.slaHoursApproaching) : ''
    )
  }, [stageConfig.slaHoursApproaching])

  useEffect(() => {
    setBreachedDraft(
      stageConfig.slaHoursBreached != null ? String(stageConfig.slaHoursBreached) : ''
    )
  }, [stageConfig.slaHoursBreached])

  function commitSla(field: 'approaching' | 'breached', value: string) {
    const trimmed = value.trim()
    const parsed = trimmed === '' ? null : Number(trimmed)
    if (parsed !== null && (!Number.isFinite(parsed) || parsed <= 0)) return
    const current =
      field === 'approaching' ? stageConfig.slaHoursApproaching : stageConfig.slaHoursBreached
    if (parsed === current) return
    onStageUpdate(
      field === 'approaching' ? { slaHoursApproaching: parsed } : { slaHoursBreached: parsed }
    )
  }

  async function submitNew() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    await onCreate(trimmed, newRequired)
    setNewLabel('')
    setNewRequired(false)
  }

  function onAddKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitNew()
    }
  }

  function commitPurpose() {
    const trimmed = purposeDraft.trim()
    const current = stageConfig.purpose ?? ''
    if (trimmed !== current) {
      onStageUpdate({ purpose: trimmed.length > 0 ? trimmed : null })
    }
  }

  return (
    <section
      className={stageConfig.enabled ? styles.stage : `${styles.stage} ${styles.stageDisabled}`}
    >
      <header className={styles.stageHeader}>
        <div className={styles.stageHeaderLeft}>
          <h2 className={styles.stageLabel}>{label}</h2>
          <span className={styles.stageCount}>
            {templates.length} {templates.length === 1 ? 'task' : 'tasks'}
          </span>
          {!stageConfig.enabled && <span className={styles.disabledPill}>Disabled</span>}
        </div>
        <div className={styles.stageHeaderRight}>
          <label className={styles.enabledToggle}>
            <input
              type="checkbox"
              checked={stageConfig.enabled}
              onChange={(e) => onStageUpdate({ enabled: e.target.checked })}
            />
            Enabled
          </label>
        </div>
      </header>

      <input
        type="text"
        className={styles.purposeInput}
        value={purposeDraft}
        onChange={(e) => setPurposeDraft(e.target.value)}
        onBlur={commitPurpose}
        placeholder={`Why does the ${label} stage exist in your process? (optional)`}
        maxLength={280}
      />

      <div className={styles.slaRow}>
        <span className={styles.slaLabel}>SLA (hours in stage)</span>
        <label className={styles.slaField}>
          <span>Warning at</span>
          <input
            type="number"
            min={1}
            className={styles.slaInput}
            value={approachingDraft}
            onChange={(e) => setApproachingDraft(e.target.value)}
            onBlur={(e) => commitSla('approaching', e.target.value)}
            placeholder="–"
          />
        </label>
        <label className={styles.slaField}>
          <span>Breach at</span>
          <input
            type="number"
            min={1}
            className={styles.slaInput}
            value={breachedDraft}
            onChange={(e) => setBreachedDraft(e.target.value)}
            onBlur={(e) => commitSla('breached', e.target.value)}
            placeholder="–"
          />
        </label>
      </div>

      {templates.length === 0 ? (
        <div className={styles.empty}>No tasks defined yet.</div>
      ) : (
        <div className={styles.taskList}>
          {templates.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              onUpdate={(patch) => onUpdate(t.id, patch)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}

      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          placeholder={`Add a task to ${label}…`}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={onAddKey}
        />
        <label className={styles.requiredToggle}>
          <input
            type="checkbox"
            checked={newRequired}
            onChange={(e) => setNewRequired(e.target.checked)}
          />
          Required
        </label>
        <button
          type="button"
          className={styles.addBtn}
          onClick={submitNew}
          disabled={!newLabel.trim()}
        >
          Add
        </button>
        <span />
      </div>
    </section>
  )
}

type TemplateRowProps = {
  template: TaskTemplate
  onUpdate: (patch: TaskTemplatePatch) => Promise<void>
  onDelete: () => Promise<void>
}

const TemplateRow: React.FC<TemplateRowProps> = ({ template, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(template.label)
  const hasMessage = !!(template.messageSubject || template.messageBody)
  const [messageOpen, setMessageOpen] = useState(hasMessage)

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== template.label) {
      onUpdate({ label: trimmed })
    } else {
      setDraft(template.label)
    }
    setEditing(false)
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(template.label)
      setEditing(false)
    }
  }

  return (
    <div className={styles.taskRowWrap}>
      <div className={styles.taskRow}>
        {editing ? (
          <input
            className={styles.editInput}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={onKey}
          />
        ) : (
          <button
            type="button"
            className={styles.taskLabel}
            onClick={() => setEditing(true)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'text',
            }}
          >
            {template.label}
            {hasMessage && (
              <span className={styles.messageBadge} style={{ marginLeft: 8 }}>
                ✉ message
              </span>
            )}
          </button>
        )}

        <label className={styles.requiredToggle}>
          <input
            type="checkbox"
            checked={template.isRequired}
            onChange={(e) => onUpdate({ isRequired: e.target.checked })}
          />
          Required
        </label>

        <button
          type="button"
          className={styles.messageToggleBtn}
          onClick={() => setMessageOpen((v) => !v)}
        >
          {messageOpen ? 'Hide message' : hasMessage ? 'Edit message' : '+ Attach message'}
        </button>

        <div className={styles.taskActions}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={onDelete}
            aria-label={`Delete ${template.label}`}
          >
            Delete
          </button>
        </div>
      </div>

      {messageOpen && <MessagePanel template={template} onUpdate={onUpdate} />}
    </div>
  )
}

type MessagePanelProps = {
  template: TaskTemplate
  onUpdate: (patch: TaskTemplatePatch) => Promise<void>
}

const MessagePanel: React.FC<MessagePanelProps> = ({ template, onUpdate }) => {
  const [subject, setSubject] = useState(template.messageSubject ?? '')
  const [body, setBody] = useState(template.messageBody ?? '')

  function commitSubject() {
    if (subject !== (template.messageSubject ?? '')) {
      onUpdate({ messageSubject: subject })
    }
  }

  function commitBody() {
    if (body !== (template.messageBody ?? '')) {
      onUpdate({ messageBody: body })
    }
  }

  return (
    <div className={styles.messagePanel}>
      <div className={styles.messageField}>
        <label className={styles.messageLabel}>Subject</label>
        <input
          className={styles.messageInput}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onBlur={commitSubject}
          placeholder="e.g. Let's schedule your interview"
        />
      </div>

      <div className={styles.messageField}>
        <label className={styles.messageLabel}>Message body</label>
        <textarea
          className={styles.messageTextarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={commitBody}
          placeholder="Hi there, congratulations on advancing to the interview stage…"
        />
      </div>

      <div className={styles.messageFooter}>
        <label className={styles.autoSendToggle}>
          <input
            type="checkbox"
            checked={template.autoSend}
            onChange={(e) => onUpdate({ autoSend: e.target.checked })}
          />
          Send automatically when applicant enters this stage
        </label>
        <span className={styles.messageHint}>
          {template.autoSend
            ? 'Will send instantly on stage entry'
            : 'You’ll review and send manually from the applicant drawer'}
        </span>
      </div>
    </div>
  )
}

export default PipelineSettingsPage
