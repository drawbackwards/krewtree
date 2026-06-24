import React, { useEffect, useState } from 'react'
import { addWorkerNote, type WorkerNote } from '../../services/krewService'
import { useAuth } from '../../context/AuthContext'
import { PlusIcon } from '../../icons'
import logStyles from '../ApplicantSlideover/LogTab.module.css'

// Worker notes — same UI as the note composer + note box on the application
// drawer's Log tab. Persists to localStorage today (see krewService) until a
// real `worker_notes` table lands. Initial notes arrive from the drawer
// bootstrap so we don't fire a redundant listWorkerNotes() on tab activation.

export interface WorkerNotesTabProps {
  workerId: string
  initialNotes: WorkerNote[]
  loading: boolean
  onWrite?: () => void
}

function formatLogTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

export const WorkerNotesTab: React.FC<WorkerNotesTabProps> = ({
  workerId,
  initialNotes,
  loading,
  onWrite,
}) => {
  const { user } = useAuth()
  const [notes, setNotes] = useState<WorkerNote[]>(initialNotes)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  // Mirror bootstrap-supplied notes into local state. Swapping workers reseeds;
  // local additions stay between bootstrap completions on the same worker.
  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  const draftReady = draft.trim().length > 0

  const handleSave = async (): Promise<void> => {
    if (!draftReady || saving) return
    setSaving(true)
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
    const authorName =
      (meta.company_name as string) || (meta.first_name as string) || user?.email || 'You'
    const { data } = await addWorkerNote(workerId, draft, authorName)
    if (data) {
      setNotes((prev) => [data, ...prev])
      setDraft('')
      setAdding(false)
      onWrite?.()
    }
    setSaving(false)
  }

  const handleCancel = (): void => {
    setAdding(false)
    setDraft('')
  }

  return (
    <div className={logStyles.root}>
      <div className={logStyles.header}>
        {adding ? (
          <span className={logStyles.headerTitle}>New note</span>
        ) : (
          <button type="button" className={logStyles.addNoteBtn} onClick={() => setAdding(true)}>
            <PlusIcon size={12} />
            Add note
          </button>
        )}
      </div>

      {adding && (
        <div className={logStyles.noteForm}>
          <textarea
            className={logStyles.noteTextarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note about this worker..."
            rows={3}
            autoFocus
          />
          <div className={logStyles.noteActions}>
            <button
              type="button"
              className={logStyles.noteCancelBtn}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={logStyles.noteSaveBtn}
              onClick={() => void handleSave()}
              disabled={!draftReady || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={logStyles.loading}>Loading…</div>
      ) : notes.length === 0 ? (
        <p className={logStyles.empty}>No notes yet.</p>
      ) : (
        <ul className={logStyles.list}>
          {notes.map((n) => (
            <li key={n.id} className={logStyles.item}>
              <div className={logStyles.noteBox}>
                <span className={logStyles.noteLabel}>Note:</span> {n.text}
                <time
                  className={logStyles.noteBoxTime}
                  dateTime={n.createdAt}
                  title={formatLogTimestamp(n.createdAt)}
                >
                  {formatLogTimestamp(n.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
