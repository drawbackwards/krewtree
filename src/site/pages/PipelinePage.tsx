
import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from '../../components'
import { useAuth } from '../context/AuthContext'
import {
  getPipelineStages,
  addPipelineStage,
  renamePipelineStage,
  removePipelineStage,
  replacePipelineFromTemplate,
  type PipelineStage,
  type PipelineTemplate,
} from '../services/pipelineService'
import styles from './PipelinePage.module.css'

const TERMINAL_STAGES = ['Hired', 'Rejected', 'Withdrawn', 'Archived']

const TEMPLATES: Array<{ id: PipelineTemplate; label: string; description: string }> = [
  {
    id: 'short',
    label: 'Short',
    description: 'Fast-turnaround hiring — 3 stages: Applied, Review, Offer.',
  },
  {
    id: 'long',
    label: 'Long',
    description:
      'Multi-step hiring — 5 stages: Applied, Phone Screen, Interview, Reference Check, Offer.',
  },
  {
    id: 'build_your_own',
    label: 'Build Your Own',
    description: 'Start fresh with a single "Applied" stage and add your own.',
  },
]

// ── Inline name editor ───────────────────────────────────────────────────────

type StageRowProps = {
  stage: PipelineStage
  index: number
  isFirst: boolean
  onRename: (id: string, name: string) => Promise<void>
  onRemove: (id: string) => void
}

const StageRow: React.FC<StageRowProps> = ({ stage, index, isFirst, onRename, onRemove }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === stage.name) {
      setDraft(stage.name)
      setEditing(false)
      return
    }
    if (trimmed.length > 40) return
    await onRename(stage.id, trimmed)
    setEditing(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') {
      setDraft(stage.name)
      setEditing(false)
    }
  }

  return (
    <div className={styles.stageRow}>
      <span className={styles.stageIndex}>{index + 1}</span>

      {editing ? (
        <input
          ref={inputRef}
          className={styles.nameInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          maxLength={40}
        />
      ) : (
        <button
          type="button"
          className={styles.nameBtn}
          onClick={() => setEditing(true)}
          title="Click to rename"
        >
          {stage.name}
          {isFirst && <span className={styles.firstTag}>First stage</span>}
        </button>
      )}

      <button
        type="button"
        className={styles.removeBtn}
        onClick={() => onRemove(stage.id)}
        title="Remove stage"
        aria-label={`Remove ${stage.name}`}
      >
        ×
      </button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export const PipelinePage: React.FC = () => {
  const { user } = useAuth()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [addName, setAddName] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // Remove confirmation
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState('')
  const [removing, setRemoving] = useState(false)

  // Template replacement
  const [templateModal, setTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate>('short')
  const [replacing, setReplacing] = useState(false)
  const [replaceError, setReplaceError] = useState('')

  useEffect(() => {
    if (!user) return
    getPipelineStages(user.id).then(({ data }) => {
      setStages(data)
      setLoading(false)
    })
  }, [user])

  const handleRename = async (id: string, name: string) => {
    const prev = stages.find((s) => s.id === id)?.name ?? ''
    setStages((s) => s.map((st) => (st.id === id ? { ...st, name } : st)))
    const { error } = await renamePipelineStage(id, name)
    if (error) setStages((s) => s.map((st) => (st.id === id ? { ...st, name: prev } : st)))
  }

  const handleAdd = async () => {
    const trimmed = addName.trim()
    if (!trimmed) {
      setAddError('Stage name is required.')
      return
    }
    if (trimmed.length > 40) {
      setAddError('Stage name must be 40 characters or fewer.')
      return
    }
    setAdding(true)
    setAddError('')
    const { data, error } = await addPipelineStage(user!.id, trimmed)
    setAdding(false)
    if (error) {
      setAddError(error)
      return
    }
    if (data) setStages((s) => [...s, data])
    setAddName('')
  }

  const handleRemoveConfirm = async () => {
    if (!removeId) return
    setRemoving(true)
    setRemoveError('')
    const { error } = await removePipelineStage(removeId)
    setRemoving(false)
    if (error) {
      setRemoveError(error)
      return
    }
    setStages((s) => s.filter((st) => st.id !== removeId))
    setRemoveId(null)
  }

  const handleReplace = async () => {
    setReplacing(true)
    setReplaceError('')
    const { error } = await replacePipelineFromTemplate(user!.id, selectedTemplate)
    setReplacing(false)
    if (error) {
      setReplaceError(error)
      return
    }
    const { data } = await getPipelineStages(user!.id)
    setStages(data)
    setTemplateModal(false)
  }

  const removeTarget = removeId ? stages.find((s) => s.id === removeId) : null

  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <h2 className={styles.title}>Pipeline</h2>
        <p className={styles.subtitle}>
          Define the stages applicants move through at your company. Changes apply to jobs posted
          after you save. Existing jobs keep their current pipeline.
        </p>
      </header>

      {/* ── Active stages ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active stages</h2>
        <p className={styles.sectionHint}>Click a stage name to rename it.</p>

        {loading && <div className={styles.loadingRow}>Loading pipeline…</div>}

        {!loading && stages.length === 0 && (
          <div className={styles.emptyRow}>No stages yet. Add one below.</div>
        )}

        {!loading &&
          stages.map((stage, i) => (
            <StageRow
              key={stage.id}
              stage={stage}
              index={i}
              isFirst={i === 0}
              onRename={handleRename}
              onRemove={(id) => {
                setRemoveId(id)
                setRemoveError('')
              }}
            />
          ))}

        {/* Add stage */}
        <div className={styles.addRow}>
          <input
            type="text"
            className={styles.addInput}
            placeholder="New stage name"
            value={addName}
            onChange={(e) => {
              setAddName(e.target.value)
              setAddError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            maxLength={40}
            disabled={adding}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={adding || !addName.trim()}
          >
            {adding ? 'Adding…' : 'Add stage'}
          </Button>
        </div>
        {addError && <p className={styles.errorText}>{addError}</p>}
      </section>

      {/* ── Terminal stages ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Terminal stages</h2>
        <p className={styles.sectionHint}>System-defined. Not editable.</p>
        <div className={styles.terminalList}>
          {TERMINAL_STAGES.map((name) => (
            <div key={name} className={styles.terminalRow}>
              <span className={styles.terminalName}>{name}</span>
              <span className={styles.terminalTag}>System</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Replace from template ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Replace with a template</h2>
        <p className={styles.sectionHint}>
          Replaces your current pipeline with a pre-built template. Existing jobs are unaffected.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTemplateModal(true)
            setReplaceError('')
          }}
        >
          Choose template…
        </Button>
      </section>

      {/* ── Remove confirmation modal ── */}
      <Modal
        open={!!removeId}
        onClose={() => {
          setRemoveId(null)
          setRemoveError('')
        }}
        title="Remove stage"
      >
        <div style={{ padding: '8px 0 16px' }}>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              marginBottom: 16,
            }}
          >
            Remove <strong>{removeTarget?.name}</strong>? Applicants currently in this stage must be
            moved first.
          </p>
          {removeError && (
            <p className={styles.errorText} style={{ marginBottom: 12 }}>
              {removeError}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="danger" size="sm" disabled={removing} onClick={handleRemoveConfirm}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRemoveId(null)
                setRemoveError('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Template replacement modal ── */}
      <Modal
        open={templateModal}
        onClose={() => setTemplateModal(false)}
        title="Replace pipeline with template"
      >
        <div style={{ padding: '8px 0 16px' }}>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              marginBottom: 16,
            }}
          >
            This will replace all current stages. Jobs already posted keep their existing pipeline.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {TEMPLATES.map((t) => (
              <label
                key={t.id}
                className={[
                  styles.templateOption,
                  selectedTemplate === t.id ? styles.templateSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={selectedTemplate === t.id}
                  onChange={() => setSelectedTemplate(t.id)}
                  style={{ display: 'none' }}
                />
                <span className={styles.templateLabel}>{t.label}</span>
                <span className={styles.templateDesc}>{t.description}</span>
              </label>
            ))}
          </div>
          {replaceError && (
            <p className={styles.errorText} style={{ marginBottom: 12 }}>
              {replaceError}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="danger" size="sm" disabled={replacing} onClick={handleReplace}>
              {replacing ? 'Replacing…' : 'Replace pipeline'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTemplateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
