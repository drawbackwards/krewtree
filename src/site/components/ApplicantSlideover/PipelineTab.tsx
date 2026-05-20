import React, { useEffect, useRef, useState } from 'react'
import type { ApplicationTask, CompanyApplicant } from '../../types'
import { isTerminal } from '../../types'
import {
  CheckIcon,
  PlusIcon,
  DotsHorizontalIcon,
  ClipboardIcon,
  TrashIcon,
  CalendarIcon,
  FlagFilledIcon,
} from '../../icons'
import { Modal, Tooltip } from '../../../components'
import {
  getApplicationTasks,
  toggleTaskComplete,
  toggleTaskSkip,
  toggleTaskFlag,
  saveTaskNotes,
  addAdHocTask,
  deleteAdHocTask,
  editAdHocTask,
  editTemplateDueDate,
  saveStageNotes,
  getStageNotes,
  sendApplicationMessage,
  type PipelineStage,
} from '../../services/pipelineService'
import styles from './PipelineTab.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeInStage(enteredAt: string | null): string {
  if (!enteredAt) return ''
  const ms = Date.now() - new Date(enteredAt).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  const remDays = days % 7
  return remDays > 0 ? `${weeks}w ${remDays}d` : `${weeks}w`
}

function formatDueDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSentAt(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMin = Math.floor((now - d.getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Props ────────────────────────────────────────────────────────────────────

interface PipelineTabProps {
  applicant: CompanyApplicant
  stages: PipelineStage[]
  onAdvance: (nextStageId: string) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export const PipelineTab: React.FC<PipelineTabProps> = ({ applicant, stages, onAdvance }) => {
  const terminal = isTerminal(applicant.status)

  const [tasks, setTasks] = useState<ApplicationTask[]>([])
  const [sendingTask, setSendingTask] = useState<ApplicationTask | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [stageNotes, setStageNotes] = useState('')
  const [notesLoaded, setNotesLoaded] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [softBlockOpen, setSoftBlockOpen] = useState(false)

  // Load tasks and notes when applicant or current stage changes
  useEffect(() => {
    let cancelled = false
    getApplicationTasks(applicant.id, applicant.currentStageId).then(({ data }) => {
      if (!cancelled) setTasks(data)
    })
    getStageNotes(applicant.id, applicant.currentStageId).then(({ data }) => {
      if (!cancelled) {
        setStageNotes(data?.notes ?? '')
        setNotesLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [applicant.id, applicant.currentStageId])

  // ── Task actions ──────────────────────────────────────────────────────────

  const handleToggleComplete = async (task: ApplicationTask) => {
    const next = task.state !== 'completed'
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              state: next ? 'completed' : 'incomplete',
              completedAt: next ? new Date().toISOString() : null,
              skippedAt: next ? null : t.skippedAt,
            }
          : t
      )
    )
    await toggleTaskComplete(applicant.id, task.id, next)
  }

  const handleToggleSkip = async (task: ApplicationTask) => {
    const next = task.state !== 'skipped'
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              state: next ? 'skipped' : 'incomplete',
              skippedAt: next ? new Date().toISOString() : null,
              completedAt: next ? null : t.completedAt,
            }
          : t
      )
    )
    await toggleTaskSkip(applicant.id, task.id, next)
  }

  const handleDeleteTask = async (task: ApplicationTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    await deleteAdHocTask(applicant.id, task.id)
  }

  const handleToggleFlag = async (task: ApplicationTask) => {
    const next = !task.flagged
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, flagged: next } : t)))
    await toggleTaskFlag(applicant.id, task.id, next)
  }

  const handleAddTask = async (label: string, isRequired: boolean, dueDate: string | null) => {
    const { data } = await addAdHocTask(
      applicant.id,
      applicant.currentStageId,
      label,
      isRequired,
      dueDate
    )
    if (data) setTasks((prev) => [...prev, data])
    setAddingTask(false)
  }

  // ── Stage notes ───────────────────────────────────────────────────────────

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNotesBlur = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await saveStageNotes(applicant.id, applicant.currentStageId, stageNotes)
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 2000)
    }, 300)
  }

  // ── Advance logic ─────────────────────────────────────────────────────────

  const incompletedRequired = tasks.filter((t) => t.isRequired && t.state === 'incomplete')

  const handleAdvanceClick = () => {
    if (incompletedRequired.length > 0) {
      setSoftBlockOpen(true)
    } else {
      const next = nextStage
      if (next) onAdvance(next.id)
    }
  }

  // Derive next stage from the ordered stages array
  const currentIdx = stages.findIndex((s) => s.id === applicant.currentStageId)
  const nextStage: PipelineStage | null =
    currentIdx >= 0 && currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* Scrollable body */}
      <div className={styles.body}>
        {/* Stage indicator */}
        <div className={styles.stageBlock}>
          <span className={styles.stageName}>{applicant.currentStageName}</span>
          {applicant.stageEnteredAt && (
            <span className={styles.timeInStage}>
              In stage {formatTimeInStage(applicant.stageEnteredAt)}
            </span>
          )}
        </div>

        {/* Task list — hidden in terminal stages */}
        {!terminal && (
          <>
            <div className={styles.taskSection}>
              {tasks.length === 0 && !addingTask ? (
                <p className={styles.emptyTasks}>No tasks for this stage yet.</p>
              ) : (
                <div className={styles.taskList}>
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggleComplete={() => handleToggleComplete(task)}
                      onToggleSkip={() => handleToggleSkip(task)}
                      onToggleFlag={() => handleToggleFlag(task)}
                      onDelete={task.source === 'ad_hoc' ? () => handleDeleteTask(task) : undefined}
                      onSaveNotes={(notes) => saveTaskNotes(applicant.id, task.id, notes)}
                      onEditAdHoc={
                        task.source === 'ad_hoc'
                          ? (patch) => {
                              setTasks((prev) =>
                                prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t))
                              )
                              editAdHocTask(applicant.id, task.id, patch)
                            }
                          : undefined
                      }
                      onEditDueDate={(dueDate) => {
                        setTasks((prev) =>
                          prev.map((t) => (t.id === task.id ? { ...t, dueDate } : t))
                        )
                        editTemplateDueDate(applicant.id, task.id, dueDate)
                      }}
                      onOpenSendMessage={() => setSendingTask(task)}
                    />
                  ))}
                </div>
              )}

              {addingTask ? (
                <AddTaskForm onSave={handleAddTask} onCancel={() => setAddingTask(false)} />
              ) : (
                <button
                  type="button"
                  className={styles.addTaskBtn}
                  onClick={() => setAddingTask(true)}
                >
                  <PlusIcon size={12} />
                  Add task
                </button>
              )}
            </div>

            {/* Stage notes */}
            <div className={styles.notesSection}>
              <div className={styles.notesHeader}>
                Notes for this stage
                {savedIndicator && <span className={styles.savedIndicator}>Saved</span>}
              </div>
              {notesLoaded && (
                <textarea
                  className={styles.notesTextarea}
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add observations, context, or anything that doesn't fit a specific task..."
                  rows={3}
                />
              )}
            </div>
          </>
        )}

        {/* Terminal: still show stage notes */}
        {terminal && (
          <div className={styles.notesSection} style={{ marginTop: 16 }}>
            <div className={styles.notesHeader}>
              Notes for this stage
              {savedIndicator && <span className={styles.savedIndicator}>Saved</span>}
            </div>
            {notesLoaded && (
              <textarea
                className={styles.notesTextarea}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add a final observation..."
                rows={3}
              />
            )}
          </div>
        )}
      </div>

      {/* Sticky inline advance */}
      <div className={styles.advanceBar}>
        {terminal ? (
          <p className={styles.closedLine}>This application is closed.</p>
        ) : nextStage ? (
          <button type="button" className={styles.advanceBtn} onClick={handleAdvanceClick}>
            Advance to {nextStage.name}
          </button>
        ) : (
          <button type="button" className={styles.advanceBtn} onClick={handleAdvanceClick}>
            Mark hired
          </button>
        )}
      </div>

      {/* Soft-block modal */}
      <Modal
        open={softBlockOpen}
        onClose={() => setSoftBlockOpen(false)}
        size="sm"
        title="Required tasks are incomplete"
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              className={styles.modalBtnSecondary}
              onClick={() => setSoftBlockOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.modalBtnPrimary}
              onClick={() => {
                setSoftBlockOpen(false)
                if (nextStage) onAdvance(nextStage.id)
              }}
            >
              Advance anyway
            </button>
          </div>
        }
      >
        <div className={styles.softBlockBody}>
          <p className={styles.softBlockText}>
            {incompletedRequired.length} required task
            {incompletedRequired.length !== 1 ? 's are' : ' is'} incomplete. Advance anyway?
          </p>
          <ul className={styles.softBlockList}>
            {incompletedRequired.slice(0, 5).map((t) => (
              <li key={t.id}>{t.label}</li>
            ))}
            {incompletedRequired.length > 5 && (
              <li className={styles.softBlockMore}>+{incompletedRequired.length - 5} more</li>
            )}
          </ul>
        </div>
      </Modal>

      {sendingTask && (
        <SendMessageModal
          task={sendingTask}
          error={sendError}
          onCancel={() => {
            setSendingTask(null)
            setSendError(null)
          }}
          onSend={async ({ subject, body }) => {
            setSendError(null)
            const { data, error } = await sendApplicationMessage(sendingTask.id, {
              override: { subject, body, calendarLink: null },
            })
            if (error || !data) {
              setSendError(error ?? 'send_failed')
              return
            }
            setTasks((prev) =>
              prev.map((t) =>
                t.id === sendingTask.id
                  ? {
                      ...t,
                      state: 'completed',
                      completedAt: t.completedAt ?? new Date().toISOString(),
                      messageSentAt: data.sentAt,
                    }
                  : t
              )
            )
            setSendingTask(null)
          }}
        />
      )}
    </div>
  )
}

// ── TaskRow ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: ApplicationTask
  onToggleComplete: () => void
  onToggleSkip: () => void
  onToggleFlag: () => void
  onDelete?: () => void
  onSaveNotes: (notes: string) => void
  onEditAdHoc?: (patch: { label?: string; isRequired?: boolean; dueDate?: string | null }) => void
  onEditDueDate?: (dueDate: string | null) => void
  onOpenSendMessage?: () => void
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggleComplete,
  onToggleSkip,
  onToggleFlag,
  onDelete,
  onSaveNotes,
  onEditAdHoc,
  onEditDueDate,
  onOpenSendMessage,
}) => {
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesValue, setNotesValue] = useState(task.notes ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(task.label)
  const [editRequired, setEditRequired] = useState(task.isRequired)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const handleNotesBlur = () => {
    onSaveNotes(notesValue)
  }

  const handleEditSave = () => {
    onEditAdHoc?.({ label: editLabel, isRequired: editRequired })
    setEditing(false)
  }

  const isCompleted = task.state === 'completed'
  const isSkipped = task.state === 'skipped'

  if (editing) {
    return (
      <div className={styles.taskRowEdit}>
        <input
          className={styles.editLabelInput}
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
        />
        <label className={styles.editRequiredLabel}>
          <input
            type="checkbox"
            checked={editRequired}
            onChange={(e) => setEditRequired(e.target.checked)}
          />
          Required to advance
        </label>
        <div className={styles.editActions}>
          <button type="button" className={styles.editSaveBtn} onClick={handleEditSave}>
            Save
          </button>
          <button type="button" className={styles.editCancelBtn} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.taskRow}>
      <div className={styles.taskMain}>
        {/* Checkbox */}
        <button
          type="button"
          className={[
            styles.checkbox,
            isCompleted ? styles.checkboxChecked : '',
            isSkipped ? styles.checkboxSkipped : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={isSkipped ? undefined : onToggleComplete}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          disabled={isSkipped}
        >
          {isCompleted && <CheckIcon size={10} color="var(--kt-primary-fg)" />}
        </button>

        {/* Label + tags */}
        <div className={styles.taskLabelBlock}>
          <span
            className={[
              styles.taskLabel,
              isCompleted ? styles.taskLabelCompleted : '',
              isSkipped ? styles.taskLabelSkipped : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {task.label}
          </span>
          <div className={styles.taskTags}>
            {task.isRequired && !isSkipped && <span className={styles.requiredPill}>Required</span>}
            {task.flagged && (
              <Tooltip content="Flagged for follow-up" position="top">
                <span className={styles.flagBadge} aria-label="Flagged">
                  <FlagFilledIcon size={9} />
                </span>
              </Tooltip>
            )}
            {isSkipped && <span className={styles.skippedTag}>Skipped</span>}
            {task.dueDate && (
              <span className={styles.dueDate}>Due {formatDueDate(task.dueDate)}</span>
            )}
            {task.messageSubject && task.messageSentAt && (
              <span className={styles.sentPill}>Sent {formatSentAt(task.messageSentAt)}</span>
            )}
            {task.messageSubject && !task.messageSentAt && (
              <button type="button" className={styles.sendMessageBtn} onClick={onOpenSendMessage}>
                ✉ Send message
              </button>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className={styles.taskActions}>
          {/* Notes icon */}
          <button
            type="button"
            className={[styles.notesIcon, task.notes ? styles.notesIconFilled : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setNotesOpen((v) => !v)}
            aria-label="Task notes"
            title="Task notes"
          >
            <ClipboardIcon size={14} />
          </button>

          {/* Overflow menu */}
          <div className={styles.overflowWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.overflowBtn}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Task options"
            >
              <DotsHorizontalIcon size={14} />
            </button>
            {menuOpen && (
              <div className={styles.overflowMenu}>
                {onEditAdHoc && (
                  <button
                    type="button"
                    className={styles.overflowItem}
                    onClick={() => {
                      setMenuOpen(false)
                      setEditing(true)
                    }}
                  >
                    Edit
                  </button>
                )}
                {!onEditAdHoc && onEditDueDate && (
                  <label className={styles.overflowItem} style={{ cursor: 'pointer' }}>
                    Edit due date
                    <input
                      type="date"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        setMenuOpen(false)
                        onEditDueDate(e.target.value || null)
                      }}
                    />
                  </label>
                )}
                {!isSkipped ? (
                  <button
                    type="button"
                    className={styles.overflowItem}
                    onClick={() => {
                      setMenuOpen(false)
                      onToggleSkip()
                    }}
                  >
                    Skip
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.overflowItem}
                    onClick={() => {
                      setMenuOpen(false)
                      onToggleSkip()
                    }}
                  >
                    Unskip
                  </button>
                )}
                <button
                  type="button"
                  className={styles.overflowItem}
                  onClick={() => {
                    setMenuOpen(false)
                    onToggleFlag()
                  }}
                >
                  {task.flagged ? 'Clear Flag' : 'Flag for follow-up'}
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className={[styles.overflowItem, styles.overflowItemDanger].join(' ')}
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                  >
                    <TrashIcon size={13} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline notes expand */}
      {notesOpen && (
        <textarea
          className={styles.taskNotesArea}
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add a note for this task..."
          rows={2}
          autoFocus
        />
      )}
    </div>
  )
}

// ── AddTaskForm ──────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  onSave: (label: string, isRequired: boolean, dueDate: string | null) => void
  onCancel: () => void
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onSave, onCancel }) => {
  const [label, setLabel] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [showDueDate, setShowDueDate] = useState(false)

  const handleSubmit = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    onSave(trimmed, isRequired, dueDate || null)
  }

  return (
    <div className={styles.addTaskForm}>
      <input
        type="text"
        className={styles.addTaskInput}
        placeholder="What needs to happen?"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        maxLength={200}
        autoFocus
      />

      <div className={styles.addTaskMeta}>
        {!showDueDate ? (
          <button
            type="button"
            className={styles.addDueDateLink}
            onClick={() => setShowDueDate(true)}
          >
            <CalendarIcon size={12} />
            Add due date
          </button>
        ) : (
          <input
            type="date"
            className={styles.dueDateInput}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        )}
        <label className={styles.addRequiredLabel}>
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
          />
          Required to advance
        </label>
      </div>

      <div className={styles.addTaskFooter}>
        <button type="button" className={styles.addTaskSaveBtn} onClick={handleSubmit}>
          Save
        </button>
        <button type="button" className={styles.addTaskCancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── SendMessageModal ─────────────────────────────────────────────────────────

interface SendMessageModalProps {
  task: ApplicationTask
  error: string | null
  onCancel: () => void
  onSend: (msg: { subject: string; body: string }) => Promise<void>
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ task, error, onCancel, onSend }) => {
  const [subject, setSubject] = useState(task.messageSubject ?? '')
  const [body, setBody] = useState(task.messageBody ?? '')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    try {
      await onSend({
        subject: subject.trim(),
        body: body.trim(),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Send message"
      footer={
        <div className={styles.sendModalFooter}>
          <button
            type="button"
            className={styles.sendModalCancelBtn}
            onClick={onCancel}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.sendModalSendBtn}
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      }
    >
      <div className={styles.sendModalBody}>
        <p className={styles.sendModalHint}>
          This will be saved to the worker's inbox and recorded in this applicant's history.
        </p>

        <div className={styles.sendField}>
          <label className={styles.sendFieldLabel}>Subject</label>
          <input
            className={styles.sendFieldInput}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className={styles.sendField}>
          <label className={styles.sendFieldLabel}>Message</label>
          <textarea
            className={styles.sendFieldTextarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
          />
        </div>

        {error && <p className={styles.sendModalError}>Could not send: {error}</p>}
      </div>
    </Modal>
  )
}
