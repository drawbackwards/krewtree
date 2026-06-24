import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Button, Modal } from '../../../components'
import { useToast } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { DotsHorizontalIcon, GripIcon } from '../../icons'
import {
  getPipelineStages,
  addPipelineStage,
  renamePipelineStage,
  setPipelineStageActive,
  countActiveApplicationsInStage,
  bulkMoveApplicationsBetweenStages,
  removePipelineStage,
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  reorderPipelineStages,
  reorderTaskTemplates,
  type PipelineStage,
  type TaskTemplate,
  type TaskTemplatePatch,
} from '../../services/pipelineService'
import { getMessageTemplates, type MessageTemplate } from '../../services/messageTemplateService'
import styles from './PipelineSettingsPage.module.css'

const PipelineSettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const companyId = user?.id ?? ''
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  // Set when enabling auto-send makes a stage fire more than one message on entry.
  const [autoSendWarning, setAutoSendWarning] = useState<{
    toggledId: string
    stageName: string
    count: number
  } | null>(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const [s, t, m] = await Promise.all([
      getPipelineStages(companyId, { includeInactive: true }),
      getTaskTemplates(companyId),
      getMessageTemplates(companyId),
    ])
    setStages([...s.data].sort((a, b) => a.sortOrder - b.sortOrder))
    setTemplates(t.data)
    setMessageTemplates(m.data)
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAddStage(name: string) {
    const { data, error } = await addPipelineStage(companyId, name)
    if (error || !data) {
      toast({ variant: 'danger', title: 'Could not add stage', description: error ?? undefined })
      return
    }
    setStages((prev) => [...prev, data])
    toast({ variant: 'success', title: `Stage "${data.name}" added` })
  }

  async function handleRenameStage(stageId: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, name } : s)))
    await renamePipelineStage(stageId, name)
  }

  const [bulkMove, setBulkMove] = useState<{
    stageId: string
    stageName: string
    count: number
  } | null>(null)

  const [deleteInfo, setDeleteInfo] = useState<{
    stageId: string
    stageName: string
    count: number
    taskCount: number
  } | null>(null)

  async function disableStage(stageId: string, opts: { silent?: boolean } = {}) {
    const { error } = await setPipelineStageActive(stageId, false)
    if (error) {
      toast({ variant: 'danger', title: 'Could not turn off stage', description: error })
      return false
    }
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, isActive: false } : s)))
    if (!opts.silent) {
      const name = stages.find((s) => s.id === stageId)?.name ?? 'Stage'
      toast({ variant: 'success', title: `${name} turned off` })
    }
    return true
  }

  async function handleToggleStage(stageId: string, isActive: boolean) {
    const name = stages.find((s) => s.id === stageId)?.name ?? 'Stage'
    if (isActive) {
      const { error } = await setPipelineStageActive(stageId, true)
      if (error) {
        toast({ variant: 'danger', title: 'Could not turn on stage', description: error })
        return
      }
      setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, isActive: true } : s)))
      toast({ variant: 'success', title: `${name} turned on` })
      return
    }

    const count = await countActiveApplicationsInStage(stageId)
    if (count === 0) {
      await disableStage(stageId)
      return
    }

    setBulkMove({ stageId, stageName: name, count })
  }

  async function handleBulkMoveAndDisable(targetStageId: string) {
    if (!bulkMove) return { error: 'no_target' as const }
    const { error: moveError, moved } = await bulkMoveApplicationsBetweenStages(
      bulkMove.stageId,
      targetStageId
    )
    if (moveError) return { error: moveError }
    const ok = await disableStage(bulkMove.stageId, { silent: true })
    if (!ok) return { error: 'disable_failed' }
    const targetName = stages.find((s) => s.id === targetStageId)?.name ?? 'new stage'
    toast({
      variant: 'success',
      title: `${bulkMove.stageName} turned off`,
      description: `${moved} application${moved === 1 ? '' : 's'} moved to ${targetName}`,
    })
    setBulkMove(null)
    return { error: null }
  }

  async function handleRequestDeleteStage(stageId: string) {
    const name = stages.find((s) => s.id === stageId)?.name ?? 'Stage'
    const taskCount = templates.filter((t) => t.stageId === stageId).length
    const count = await countActiveApplicationsInStage(stageId)
    setDeleteInfo({ stageId, stageName: name, count, taskCount })
  }

  async function handleConfirmDeleteStage(targetStageId: string | null) {
    if (!deleteInfo) return { error: 'no_stage' as const }
    let movedMsg = ''
    if (deleteInfo.count > 0) {
      if (!targetStageId) return { error: 'no_target' as const }
      const { error: moveError, moved } = await bulkMoveApplicationsBetweenStages(
        deleteInfo.stageId,
        targetStageId
      )
      if (moveError) return { error: moveError }
      const targetName = stages.find((s) => s.id === targetStageId)?.name ?? 'new stage'
      movedMsg = `${moved} application${moved === 1 ? '' : 's'} moved to ${targetName}`
    }
    const { error } = await removePipelineStage(deleteInfo.stageId)
    if (error) return { error }
    setStages((prev) => prev.filter((s) => s.id !== deleteInfo.stageId))
    setTemplates((prev) => prev.filter((t) => t.stageId !== deleteInfo.stageId))
    toast({
      variant: 'success',
      title: `${deleteInfo.stageName} deleted`,
      description: movedMsg || undefined,
    })
    setDeleteInfo(null)
    return { error: null }
  }

  async function handleCreateTemplate(stageId: string, label: string, isRequired: boolean) {
    const { data, error } = await createTaskTemplate(companyId, stageId, label, isRequired)
    if (error || !data) {
      toast({ variant: 'danger', title: 'Could not add task', description: error ?? undefined })
      return
    }
    setTemplates((prev) => [...prev, data])
    toast({ variant: 'success', title: `Task "${data.label}" added` })
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
        if (patch.autoSend !== undefined) next.autoSend = patch.autoSend
        if (patch.messageTemplateId !== undefined) next.messageTemplateId = patch.messageTemplateId
        return next
      })
    )
    await updateTaskTemplate(id, patch)

    // Warn if enabling auto-send means this stage now sends more than one
    // message on entry. The user can keep it that way; this is just a heads-up.
    if (patch.autoSend === true) {
      const toggled = templates.find((t) => t.id === id)
      if (toggled) {
        const count = templates.filter(
          (t) =>
            t.stageId === toggled.stageId &&
            (t.id === id || t.autoSend) &&
            (t.messageTemplateId || t.messageBody)
        ).length
        if (count > 1) {
          const stageName = stages.find((s) => s.id === toggled.stageId)?.name ?? 'this stage'
          setAutoSendWarning({ toggledId: id, stageName, count })
        }
      }
    }
  }

  async function handleDeleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    await deleteTaskTemplate(id)
  }

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 6 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  const sensors = useSensors(mouseSensor, touchSensor)

  async function handleStageDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = [...stages]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    setStages(next)
    const { error } = await reorderPipelineStages(next.map((s) => s.id))
    if (error) {
      toast({ variant: 'danger', title: 'Could not reorder stages', description: error })
      load()
    }
  }

  async function handleTemplateReorder(stageId: string, orderedIds: string[]) {
    const newOrderById = new Map(orderedIds.map((id, i) => [id, i]))
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.stageId !== stageId) return t
        const newOrder = newOrderById.get(t.id)
        if (newOrder === undefined) return t
        return { ...t, order: newOrder }
      })
    )
    const { error } = await reorderTaskTemplates(orderedIds)
    if (error) {
      toast({ variant: 'danger', title: 'Could not reorder tasks', description: error })
      load()
    }
  }

  if (!companyId) return null

  return (
    <div>
      <p className={styles.intro}>
        This is your starting pipeline. Tailor it to fit your hiring process. Add stages, rename
        them, or switch one off to hide it from new jobs without losing its tasks. Drag the grip
        handle on the left to reorder stages and tasks.
      </p>

      {loading ? (
        <div className={styles.loading}>Loading pipeline…</div>
      ) : (
        <>
          <DndContext sensors={sensors} onDragEnd={handleStageDragEnd}>
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
                    messageTemplates={messageTemplates}
                    onRename={(name) => handleRenameStage(stage.id, name)}
                    onToggle={(isActive) => handleToggleStage(stage.id, isActive)}
                    onDeleteStage={() => handleRequestDeleteStage(stage.id)}
                    onCreate={(label, req) => handleCreateTemplate(stage.id, label, req)}
                    onUpdate={handleUpdateTemplate}
                    onDelete={handleDeleteTemplate}
                    onReorderTemplates={(ids) => handleTemplateReorder(stage.id, ids)}
                  />
                )
              })}
            </div>
          </DndContext>
          <AddStageRow onAdd={handleAddStage} />
        </>
      )}

      <BulkMoveModal
        info={bulkMove}
        targets={stages.filter((s) => s.isActive && s.id !== bulkMove?.stageId)}
        onCancel={() => setBulkMove(null)}
        onConfirm={handleBulkMoveAndDisable}
      />

      <DeleteStageModal
        info={deleteInfo}
        targets={stages.filter((s) => s.isActive && s.id !== deleteInfo?.stageId)}
        onCancel={() => setDeleteInfo(null)}
        onConfirm={handleConfirmDeleteStage}
      />

      <Modal
        open={autoSendWarning !== null}
        onClose={() => setAutoSendWarning(null)}
        size="sm"
        title="Multiple messages are set to autosend"
        description={
          autoSendWarning
            ? `Entering “${autoSendWarning.stageName}” will automatically send ${autoSendWarning.count} separate messages to the applicant.`
            : undefined
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="ghost"
              onClick={() => {
                if (autoSendWarning)
                  handleUpdateTemplate(autoSendWarning.toggledId, { autoSend: false })
                setAutoSendWarning(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setAutoSendWarning(null)}>
              Confirm setup
            </Button>
          </div>
        }
      />
    </div>
  )
}

// ── Bulk move modal ───────────────────────────────────────────────────────────

type BulkMoveModalProps = {
  info: { stageId: string; stageName: string; count: number } | null
  targets: PipelineStage[]
  onCancel: () => void
  onConfirm: (targetStageId: string) => Promise<{ error: string | null }>
}

const BulkMoveModal: React.FC<BulkMoveModalProps> = ({ info, targets, onCancel, onConfirm }) => {
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (info && targets.length > 0) setTargetId(targets[0].id)
    if (!info) {
      setTargetId('')
      setError('')
      setBusy(false)
    }
  }, [info, targets])

  if (!info) return null

  const countLabel = `${info.count} active application${info.count === 1 ? '' : 's'}`
  const noTargets = targets.length === 0

  async function submit() {
    if (!targetId) return
    setBusy(true)
    setError('')
    const { error: err } = await onConfirm(targetId)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <Modal open onClose={onCancel} title={`Turn off ${info.stageName}`}>
      <div className={styles.bulkMoveBody}>
        {noTargets ? (
          <p className={styles.bulkMoveText}>
            {countLabel} {info.count === 1 ? 'is' : 'are'} in <strong>{info.stageName}</strong>, but
            no other stage is currently on. Turn another stage on first, then try again.
          </p>
        ) : (
          <>
            <p className={styles.bulkMoveText}>
              {countLabel} {info.count === 1 ? 'is' : 'are'} in <strong>{info.stageName}</strong>.
              Move them to:
            </p>
            <select
              className={styles.bulkMoveSelect}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={busy}
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}

        {error && <p className={styles.bulkMoveError}>{error}</p>}

        <div className={styles.bulkMoveActions}>
          {!noTargets && (
            <Button variant="primary" size="sm" disabled={busy || !targetId} onClick={submit}>
              {busy ? 'Moving…' : `Move ${info.count} and turn off`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete stage modal ────────────────────────────────────────────────────────

type DeleteStageModalProps = {
  info: { stageId: string; stageName: string; count: number; taskCount: number } | null
  targets: PipelineStage[]
  onCancel: () => void
  onConfirm: (targetStageId: string | null) => Promise<{ error: string | null }>
}

const DeleteStageModal: React.FC<DeleteStageModalProps> = ({
  info,
  targets,
  onCancel,
  onConfirm,
}) => {
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (info && targets.length > 0) setTargetId(targets[0].id)
    if (!info) {
      setTargetId('')
      setError('')
      setBusy(false)
    }
  }, [info, targets])

  if (!info) return null

  const hasApplicants = info.count > 0
  const countLabel = `${info.count} active application${info.count === 1 ? '' : 's'}`
  const blocked = hasApplicants && targets.length === 0

  async function submit() {
    if (hasApplicants && !targetId) return
    setBusy(true)
    setError('')
    const { error: err } = await onConfirm(hasApplicants ? targetId : null)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <Modal open onClose={onCancel} title={`Delete ${info.stageName}`}>
      <div className={styles.bulkMoveBody}>
        <p className={styles.bulkMoveText}>
          Deleting <strong>{info.stageName}</strong> is permanent.{' '}
          {info.taskCount > 0 ? (
            <>
              All <strong>{info.taskCount}</strong> task{info.taskCount === 1 ? '' : 's'} defined on
              this stage will also be deleted.
            </>
          ) : (
            'This stage has no tasks defined.'
          )}
        </p>

        {hasApplicants &&
          (blocked ? (
            <p className={styles.bulkMoveText}>
              {countLabel} {info.count === 1 ? 'is' : 'are'} in this stage, but no other stage is
              currently on. Turn another stage on first, then try again.
            </p>
          ) : (
            <>
              <p className={styles.bulkMoveText}>
                {countLabel} {info.count === 1 ? 'is' : 'are'} in this stage. Move{' '}
                {info.count === 1 ? 'it' : 'them'} to:
              </p>
              <select
                className={styles.bulkMoveSelect}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={busy}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </>
          ))}

        {error && <p className={styles.bulkMoveError}>{error}</p>}

        <div className={styles.bulkMoveActions}>
          {!blocked && (
            <Button
              variant="danger"
              size="sm"
              disabled={busy || (hasApplicants && !targetId)}
              onClick={submit}
            >
              {busy
                ? 'Deleting…'
                : hasApplicants
                  ? `Move ${info.count} and delete`
                  : 'Delete stage'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Stage overflow menu ───────────────────────────────────────────────────────

type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

const OverflowMenu: React.FC<{ items: OverflowItem[]; ariaLabel: string }> = ({
  items,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.overflowBtn}
        onClick={handleToggle}
        aria-label={ariaLabel}
      >
        <DotsHorizontalIcon size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={[styles.overflowItem, item.danger ? styles.overflowDanger : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
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
  messageTemplates: MessageTemplate[]
  onRename: (name: string) => Promise<void>
  onToggle: (isActive: boolean) => Promise<void>
  onDeleteStage: () => void
  onCreate: (label: string, isRequired: boolean) => Promise<void>
  onUpdate: (id: string, patch: TaskTemplatePatch) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorderTemplates: (orderedIds: string[]) => Promise<void>
}

const StageBlock: React.FC<StageBlockProps> = ({
  stage,
  templates,
  messageTemplates,
  onRename,
  onToggle,
  onDeleteStage,
  onCreate,
  onUpdate,
  onDelete,
  onReorderTemplates,
}) => {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(stage.name)
  const [newLabel, setNewLabel] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  const draggable = useDraggable({ id: stage.id })
  const droppable = useDroppable({ id: stage.id })

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

  const taskSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleTaskDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = templates.findIndex((t) => t.id === active.id)
    const newIndex = templates.findIndex((t) => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = [...templates]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    onReorderTemplates(next.map((t) => t.id))
  }

  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  const classes = [styles.stage]
  if (!stage.isActive) classes.push(styles.stageDisabled)
  if (draggable.isDragging) classes.push(styles.stageDragging)
  if (droppable.isOver && !draggable.isDragging) classes.push(styles.stageDropTarget)

  return (
    <section ref={setRef} className={classes.join(' ')}>
      <header className={styles.stageHeader}>
        <div className={styles.stageHeaderLeft}>
          <button
            type="button"
            className={styles.dragHandle}
            aria-label={`Reorder ${stage.name}`}
            {...draggable.attributes}
            {...draggable.listeners}
          >
            <GripIcon size={14} />
          </button>
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
          <OverflowMenu
            ariaLabel={`Actions for ${stage.name}`}
            items={[
              {
                label: stage.isActive ? 'Deactivate' : 'Activate',
                onClick: () => onToggle(!stage.isActive),
              },
              { label: 'Delete', danger: true, onClick: onDeleteStage },
            ]}
          />
        </div>
      </header>

      {templates.length === 0 ? (
        <div className={styles.empty}>No tasks defined yet.</div>
      ) : (
        <DndContext sensors={taskSensors} onDragEnd={handleTaskDragEnd}>
          <div className={styles.taskList}>
            {templates.map((t) => (
              <TemplateRow
                key={t.id}
                template={t}
                messageTemplates={messageTemplates}
                onUpdate={(patch) => onUpdate(t.id, patch)}
                onDelete={() => onDelete(t.id)}
              />
            ))}
          </div>
        </DndContext>
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
  messageTemplates: MessageTemplate[]
  onUpdate: (patch: TaskTemplatePatch) => Promise<void>
  onDelete: () => Promise<void>
}

const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  messageTemplates,
  onUpdate,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(template.label)

  const draggable = useDraggable({ id: template.id })
  const droppable = useDroppable({ id: template.id })

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

  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  const wrapClasses = [styles.taskRowWrap]
  if (draggable.isDragging) wrapClasses.push(styles.taskDragging)
  if (droppable.isOver && !draggable.isDragging) wrapClasses.push(styles.taskDropTarget)

  return (
    <div ref={setRef} className={wrapClasses.join(' ')}>
      <div className={styles.taskRow}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`Reorder ${template.label}`}
          {...draggable.attributes}
          {...draggable.listeners}
        >
          <GripIcon size={14} />
        </button>
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

      <div className={styles.taskMessageRow}>
        <span className={styles.taskMessageLabel}>Message</span>
        <select
          className={styles.taskMessageSelect}
          value={template.messageTemplateId ?? ''}
          onChange={(e) =>
            onUpdate({ messageTemplateId: e.target.value === '' ? null : e.target.value })
          }
          aria-label={`Message template for ${template.label}`}
        >
          <option value="">None</option>
          {messageTemplates.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {template.messageTemplateId && (
          <label className={styles.requiredToggle}>
            <input
              type="checkbox"
              checked={template.autoSend}
              onChange={(e) => onUpdate({ autoSend: e.target.checked })}
            />
            Auto-send on stage entry
          </label>
        )}
      </div>
    </div>
  )
}

export default PipelineSettingsPage
