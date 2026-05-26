import React, { useEffect, useRef, useState } from 'react'
import type { ApplicationTask, ApplicationTaskNote, CompanyApplicant } from '../../types'
import { isTerminal } from '../../types'
import { CheckIcon, PlusIcon, DotsHorizontalIcon, ClipboardIcon, FlagFilledIcon } from '../../icons'
import { Modal, Tooltip } from '../../../components'
import type { PipelineStage } from '../../services/pipelineService'
import {
  getApplicationTasks,
  toggleTaskComplete,
  toggleTaskSkip,
  toggleTaskFlag,
  addTaskNote,
  editTaskNote,
  addAdHocTask,
  deleteAdHocTask,
  editAdHocTask,
  sendApplicationMessage,
  instantiateTemplatesForStage,
  countBlockingRequiredTasks,
} from '../../services/pipelineService'
import styles from './PipelineTab.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeInStage(enteredAt: string | null): string {
  if (!enteredAt) return ''
  const diffMs = Date.now() - new Date(enteredAt).getTime()
  const h = Math.floor(diffMs / 3_600_000)
  if (h < 24) return `${Math.max(1, h)}h`
  const d = Math.floor(h / 24)
  if (d < 14) return `${d}d`
  return `${Math.floor(d / 7)}w`
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
  // Reports the live count of incomplete required tasks for the current stage so
  // the drawer's stage control can gate forward moves as tasks change here.
  onRequiredCountChange?: (count: number) => void
  // Notifies the parent that applicant-level data changed (e.g. a task flag),
  // so the dashboard list/kanban can refetch and reflect it without a reload.
  onChanged?: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export const PipelineTab: React.FC<PipelineTabProps> = ({
  applicant,
  onRequiredCountChange,
  onChanged,
}) => {
  const terminal = isTerminal(applicant.status)

  const [tasks, setTasks] = useState<ApplicationTask[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sendingTask, setSendingTask] = useState<ApplicationTask | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState(false)

  // Load tasks when applicant or current stage changes
  useEffect(() => {
    let cancelled = false
    const stageId = applicant.currentStageId
    if (!stageId) return
    setLoaded(false)

    // Show existing tasks as soon as they load — don't block the list on
    // template instantiation.
    getApplicationTasks(applicant.id, stageId).then(({ data }) => {
      if (cancelled) return
      setTasks(data)
      setLoaded(true)
    })

    // Backfill stage-task templates for applicants who entered the stage before
    // the auto-instantiate hook landed. Runs off the critical path (no-op if
    // already instantiated); only refetch when it actually created tasks.
    instantiateTemplatesForStage(applicant.id, stageId).then((res) => {
      if (cancelled || res.inserted === 0) return
      getApplicationTasks(applicant.id, stageId).then(({ data }) => {
        if (!cancelled) setTasks(data)
      })
    })

    return () => {
      cancelled = true
    }
  }, [applicant.id, applicant.currentStageId])

  // Keep the drawer's stage gate in sync as tasks are completed/skipped/added.
  // Wait for the initial load so the empty starting state doesn't clobber the
  // gate value the slideover already seeded.
  useEffect(() => {
    if (loaded) onRequiredCountChange?.(countBlockingRequiredTasks(tasks))
  }, [tasks, loaded, onRequiredCountChange])

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
    onChanged?.()
  }

  const handleAddTask = async (label: string, isRequired: boolean) => {
    const { data } = await addAdHocTask(applicant.id, applicant.currentStageId, label, isRequired)
    if (data) setTasks((prev) => [...prev, data])
    setAddingTask(false)
  }

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
              {formatTimeInStage(applicant.stageEnteredAt)}
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
                      onAddNote={async (body) => {
                        const { data } = await addTaskNote(applicant.id, task.id, body)
                        if (data) {
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === task.id ? { ...t, notes: [...t.notes, data] } : t
                            )
                          )
                        }
                      }}
                      onEditNote={async (noteId, body) => {
                        const { data } = await editTaskNote(applicant.id, noteId, body)
                        if (data) {
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === task.id
                                ? {
                                    ...t,
                                    notes: t.notes.map((n) => (n.id === noteId ? data : n)),
                                  }
                                : t
                            )
                          )
                        }
                      }}
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
          </>
        )}
      </div>

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
  onAddNote: (body: string) => Promise<void>
  onEditNote: (noteId: string, body: string) => Promise<void>
  onEditAdHoc?: (patch: { label?: string; isRequired?: boolean }) => void
  onOpenSendMessage?: () => void
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggleComplete,
  onToggleSkip,
  onToggleFlag,
  onDelete,
  onAddNote,
  onEditNote,
  onEditAdHoc,
  onOpenSendMessage,
}) => {
  const isCompleted = task.state === 'completed'
  const isSkipped = task.state === 'skipped'
  const noteCount = task.notes.length

  // Default expanded only for active tasks that already have notes. Completed
  // and skipped tasks start collapsed so the timeline doesn't clutter the
  // "done" portion of the list.
  const [notesExpanded, setNotesExpanded] = useState(
    () => !isCompleted && !isSkipped && noteCount > 0
  )
  const [draft, setDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(task.label)
  const [editRequired, setEditRequired] = useState(task.isRequired)
  const menuRef = useRef<HTMLDivElement>(null)

  // Auto-collapse when the task is marked complete or skipped. Reopens are
  // a deliberate user action.
  useEffect(() => {
    if (isCompleted || isSkipped) setNotesExpanded(false)
  }, [isCompleted, isSkipped])

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const draftReady = draft.trim().length > 0

  const handleAddNote = async () => {
    if (!draftReady || savingNote) return
    setSavingNote(true)
    try {
      await onAddNote(draft)
      setDraft('')
    } finally {
      setSavingNote(false)
    }
  }

  const handleEditSave = () => {
    onEditAdHoc?.({ label: editLabel, isRequired: editRequired })
    setEditing(false)
  }

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
          {/* Notes toggle — clipboard icon + count badge, doubles as expand/collapse */}
          <button
            type="button"
            className={[
              styles.notesToggle,
              noteCount > 0 ? styles.notesToggleFilled : '',
              notesExpanded ? styles.notesToggleOpen : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setNotesExpanded((v) => !v)}
            aria-expanded={notesExpanded}
            aria-label={
              notesExpanded
                ? `Collapse notes${noteCount > 0 ? ` (${noteCount})` : ''}`
                : `Expand notes${noteCount > 0 ? ` (${noteCount})` : ''}`
            }
            title={noteCount === 0 ? 'Add note' : `${noteCount} note${noteCount === 1 ? '' : 's'}`}
          >
            <ClipboardIcon size={14} />
            {noteCount > 0 && <span className={styles.notesCountBadge}>{noteCount}</span>}
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
                  <>
                    <div className={styles.overflowDivider} />
                    <button
                      type="button"
                      className={[styles.overflowItem, styles.overflowItemDanger].join(' ')}
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete()
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes timeline + add form — both gated behind the expand toggle */}
      {notesExpanded && (
        <>
          {task.notes.length > 0 && (
            <ul className={styles.taskNotesList}>
              {task.notes.map((note) => (
                <NoteItem key={note.id} note={note} onEdit={onEditNote} />
              ))}
            </ul>
          )}

          <div className={styles.taskNotesEditor}>
            <textarea
              className={styles.taskNotesArea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note for this task..."
              rows={2}
            />
            <div className={styles.taskNotesActions}>
              <button
                type="button"
                className={styles.taskNotesSaveBtn}
                onClick={handleAddNote}
                disabled={!draftReady || savingNote}
              >
                {savingNote ? 'Saving…' : 'Add note'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── NoteItem ─────────────────────────────────────────────────────────────────
//
// One row in the notes timeline. Renders the body + timestamp by default; on
// hover, an "Edit" link appears in the footer. Click → swap to a textarea
// with Save / Cancel. Saving calls back to the parent which round-trips to
// the DB and updates local state with the returned row (so the "(edited)"
// indicator and edit timestamp appear without a refetch).

interface NoteItemProps {
  note: ApplicationTaskNote
  onEdit: (noteId: string, body: string) => Promise<void>
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.body)
  const [saving, setSaving] = useState(false)

  // If the parent passes a new note reference (e.g. after a successful save),
  // reset the draft so a subsequent edit starts from the latest body.
  useEffect(() => {
    if (!editing) setDraft(note.body)
  }, [note.body, editing])

  const dirty = draft.trim() !== note.body.trim()

  const handleSave = async () => {
    if (!dirty || saving || !draft.trim()) return
    setSaving(true)
    try {
      await onEdit(note.id, draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className={styles.taskNoteItem}>
        <textarea
          className={styles.taskNoteEditArea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
        />
        <div className={styles.taskNoteEditActions}>
          <button
            type="button"
            className={styles.taskNoteSaveBtn}
            onClick={handleSave}
            disabled={!dirty || saving || !draft.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className={styles.taskNoteCancelBtn}
            onClick={() => {
              setDraft(note.body)
              setEditing(false)
            }}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className={styles.taskNoteItem}>
      <p className={styles.taskNoteBody}>{note.body}</p>
      <div className={styles.taskNoteFooter}>
        <time
          className={styles.taskNoteTime}
          dateTime={note.createdAt}
          title={formatFullDateTime(note.createdAt)}
        >
          {formatNoteTimestamp(note.createdAt)}
        </time>
        {note.updatedAt && (
          <span
            className={styles.taskNoteEditedTag}
            title={`Edited ${formatFullDateTime(note.updatedAt)}`}
          >
            (edited {formatNoteTimestamp(note.updatedAt)})
          </span>
        )}
        <button type="button" className={styles.taskNoteEditLink} onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
    </li>
  )
}

// ── Time helpers used by TaskRow notes timeline ──────────────────────────────

// Wall-clock timestamp shown on every note row. The user asked for the
// actual time, not a relative "X ago" string. Format: "May 22, 2026 · 1:30 PM"
function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ── AddTaskForm ──────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  onSave: (label: string, isRequired: boolean) => void
  onCancel: () => void
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onSave, onCancel }) => {
  const [label, setLabel] = useState('')
  const [isRequired, setIsRequired] = useState(false)

  const handleSubmit = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    onSave(trimmed, isRequired)
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
