import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getPipelineStages,
  addPipelineStage,
  renamePipelineStage,
  removePipelineStage,
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  type PipelineStage,
  type TaskTemplate,
  type TaskTemplatePatch,
} from '../../services/pipelineService'
import styles from './PipelineSettingsPage.module.css'

const PipelineSettingsPage: React.FC = () => {
  const { user } = useAuth()
  const companyId = user?.id ?? ''
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const [s, t] = await Promise.all([getPipelineStages(companyId), getTaskTemplates(companyId)])
    setStages([...s.data].sort((a, b) => a.sortOrder - b.sortOrder))
    setTemplates(t.data)
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAddStage(name: string) {
    const { data } = await addPipelineStage(companyId, name)
    if (data) setStages((prev) => [...prev, data])
  }

  async function handleRenameStage(stageId: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, name } : s)))
    await renamePipelineStage(stageId, name)
  }

  async function handleRemoveStage(stageId: string) {
    const { error } = await removePipelineStage(stageId)
    if (error) {
      window.alert(error)
      return
    }
    setStages((prev) => prev.filter((s) => s.id !== stageId))
    setTemplates((prev) => prev.filter((t) => t.stageId !== stageId))
  }

  async function handleCreateTemplate(stageId: string, label: string, isRequired: boolean) {
    const { data } = await createTaskTemplate(companyId, stageId, label, isRequired)
    if (data) setTemplates((prev) => [...prev, data])
  }

  async function handleUpdateTemplate(id: string, patch: TaskTemplatePatch) {
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

  async function handleDeleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    await deleteTaskTemplate(id)
  }

  if (!companyId) return null

  return (
    <div>
      <p className={styles.intro}>
        Manage your pipeline stages and the default tasks your team works through at each stage.
        Tasks are copied onto every new applicant when they enter the stage. Marking a task as
        required will block stage advancement until it&apos;s completed or skipped.
      </p>

      {loading ? (
        <div className={styles.loading}>Loading pipeline…</div>
      ) : (
        <>
          <div className={styles.stages}>
            {stages.map((stage) => {
              const stageTemplates = templates
                .filter((t) => t.stageId === stage.id)
                .sort((a, b) => a.order - b.order)
              return (
                <StageBlock
                  key={stage.id}
                  stage={stage}
                  templates={stageTemplates}
                  onRename={(name) => handleRenameStage(stage.id, name)}
                  onRemove={() => handleRemoveStage(stage.id)}
                  onCreate={(label, req) => handleCreateTemplate(stage.id, label, req)}
                  onUpdate={handleUpdateTemplate}
                  onDelete={handleDeleteTemplate}
                />
              )
            })}
          </div>
          <AddStageRow onAdd={handleAddStage} />
        </>
      )}
    </div>
  )
}

// ── Add stage row ─────────────────────────────────────────────────────────────

const AddStageRow: React.FC<{ onAdd: (name: string) => Promise<void> }> = ({ onAdd }) => {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    setBusy(true)
    await onAdd(trimmed)
    setValue('')
    setBusy(false)
  }

  return (
    <div className={styles.addRow}>
      <input
        className={styles.addInput}
        placeholder="Add a new pipeline stage…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
        disabled={busy}
      />
      <button
        type="button"
        className={styles.addBtn}
        onClick={submit}
        disabled={!value.trim() || busy}
      >
        Add stage
      </button>
    </div>
  )
}

// ── Stage block ───────────────────────────────────────────────────────────────

type StageBlockProps = {
  stage: PipelineStage
  templates: TaskTemplate[]
  onRename: (name: string) => Promise<void>
  onRemove: () => Promise<void>
  onCreate: (label: string, isRequired: boolean) => Promise<void>
  onUpdate: (id: string, patch: TaskTemplatePatch) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const StageBlock: React.FC<StageBlockProps> = ({
  stage,
  templates,
  onRename,
  onRemove,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(stage.name)
  const [newLabel, setNewLabel] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  function commitRename() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== stage.name) {
      onRename(trimmed)
    } else {
      setNameDraft(stage.name)
    }
    setEditingName(false)
  }

  async function submitNew() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    await onCreate(trimmed, newRequired)
    setNewLabel('')
    setNewRequired(false)
  }

  return (
    <section className={styles.stage}>
      <header className={styles.stageHeader}>
        <div className={styles.stageHeaderLeft}>
          {editingName ? (
            <input
              className={styles.editInput}
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitRename()
                } else if (e.key === 'Escape') {
                  setNameDraft(stage.name)
                  setEditingName(false)
                }
              }}
            />
          ) : (
            <button
              type="button"
              className={styles.stageLabel}
              onClick={() => setEditingName(true)}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'text' }}
            >
              {stage.name}
            </button>
          )}
          <span className={styles.stageCount}>
            {templates.length} {templates.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <div className={styles.stageHeaderRight}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={onRemove}
            aria-label={`Remove ${stage.name} stage`}
          >
            Remove
          </button>
        </div>
      </header>

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
          placeholder={`Add a task to ${stage.name}…`}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitNew()
            }
          }}
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

// ── Template row ──────────────────────────────────────────────────────────────

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
                message
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

// ── Message panel ─────────────────────────────────────────────────────────────

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
            : "You'll review and send manually from the applicant drawer"}
        </span>
      </div>
    </div>
  )
}

export default PipelineSettingsPage
