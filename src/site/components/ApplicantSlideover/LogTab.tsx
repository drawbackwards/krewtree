import React, { useEffect, useMemo, useState } from 'react'
import type { ApplicationLogEvent, LogEventType } from '../../types'
import { getApplicationLog, addLogNote, type PipelineStage } from '../../services/pipelineService'
import { StagePill } from '../StagePill/StagePill'
import { PlusIcon } from '../../icons'
import styles from './LogTab.module.css'

interface LogTabProps {
  applicationId: string
  stages: PipelineStage[]
}

export const LogTab: React.FC<LogTabProps> = ({ applicationId, stages }) => {
  const [events, setEvents] = useState<ApplicationLogEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [addingNote, setAddingNote] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  // Build an id → name map once per stages change so the stage pill can
  // resolve a label without a lookup loop per row.
  const stageNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of stages) m.set(s.id, s.name)
    return m
  }, [stages])

  useEffect(() => {
    let cancelled = false
    getApplicationLog(applicationId).then(({ data }) => {
      if (!cancelled) {
        setEvents(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [applicationId])

  const draftReady = draft.trim().length > 0

  const handleSaveNote = async () => {
    if (!draftReady || saving) return
    setSaving(true)
    const { data } = await addLogNote(applicationId, draft)
    if (data) {
      setEvents((prev) => [data, ...prev])
      setDraft('')
      setAddingNote(false)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setAddingNote(false)
    setDraft('')
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {addingNote ? (
          <span className={styles.headerTitle}>New note</span>
        ) : (
          <button type="button" className={styles.addNoteBtn} onClick={() => setAddingNote(true)}>
            <PlusIcon size={12} />
            Add note
          </button>
        )}
      </div>

      {addingNote && (
        <div className={styles.noteForm}>
          <textarea
            className={styles.noteTextarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note to the log..."
            rows={3}
            autoFocus
          />
          <div className={styles.noteActions}>
            <button
              type="button"
              className={styles.noteCancelBtn}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.noteSaveBtn}
              onClick={handleSaveNote}
              disabled={!draftReady || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : events.length === 0 ? (
        <p className={styles.empty}>No events yet.</p>
      ) : (
        <ul className={styles.list}>
          {events.map((event) => {
            const stageName = event.stageId ? (stageNameById.get(event.stageId) ?? null) : null
            return (
              <li key={event.id} className={styles.item}>
                <div className={styles.headlineRow}>
                  {stageName && <StagePill label={stageName} size="sm" />}
                  <p className={styles.headline}>{renderHeadline(event)}</p>
                </div>
                {event.noteBody && <div className={styles.noteBox}>{event.noteBody}</div>}
                <div className={styles.footer}>
                  <time
                    className={styles.timestamp}
                    dateTime={event.createdAt}
                    title={formatFullDateTime(event.createdAt)}
                  >
                    {formatLogTimestamp(event.createdAt)}
                  </time>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Headline rendering ──────────────────────────────────────────────────────
//
// Action + task name as a single sentence, with the task name emphasised so
// it reads as the thing the action happened to. Falls back to the persisted
// description for events that predate the structured columns or for event
// types that don't carry a task (e.g. application lifecycle changes).

function renderHeadline(event: ApplicationLogEvent): React.ReactNode {
  const task = event.taskLabel
  const action = ACTION_BY_TYPE[event.eventType]

  if (action && task) {
    return action.taskFirst ? (
      <>
        <strong>{task}</strong> {action.verb}
      </>
    ) : (
      <>
        {action.verb} <strong>{task}</strong>
      </>
    )
  }

  if (event.eventType === 'stage_notes_updated') {
    return 'Stage notes updated'
  }

  if (event.eventType === 'note_added') {
    return 'Note added'
  }

  return event.description
}

type ActionPhrase = {
  // Phrase template: either "[task] verb" (taskFirst) or "verb [task]".
  verb: string
  taskFirst: boolean
}

const ACTION_BY_TYPE: Partial<Record<LogEventType, ActionPhrase>> = {
  task_created: { verb: 'added', taskFirst: true },
  task_completed: { verb: 'completed', taskFirst: true },
  task_uncompleted: { verb: 'marked incomplete', taskFirst: true },
  task_skipped: { verb: 'skipped', taskFirst: true },
  task_unskipped: { verb: 'unskipped', taskFirst: true },
  task_deleted: { verb: 'deleted', taskFirst: true },
  task_flagged: { verb: 'flagged for follow-up', taskFirst: true },
  task_unflagged: { verb: 'flag cleared', taskFirst: true },
  task_note_added: { verb: 'Note added to', taskFirst: false },
  task_note_edited: { verb: 'Note edited on', taskFirst: false },
}

// ── Timestamp helpers — match the format used by task notes ─────────────────

function formatLogTimestamp(iso: string): string {
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
