import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KanbanApplicant, KanbanStage } from '../../data/mock'
import styles from './KanbanBoard.module.css'

interface KanbanBoardProps {
  initialApplicants: KanbanApplicant[]
}

const STAGES: { id: KanbanStage; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' },
]

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialApplicants }) => {
  const navigate = useNavigate()
  const [applicants, setApplicants] = useState<KanbanApplicant[]>(initialApplicants)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<KanbanStage | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValues, setNoteValues] = useState<Record<string, string>>(
    Object.fromEntries(initialApplicants.map(a => [a.id, a.notes]))
  )

  const byStage = (stage: KanbanStage) => applicants.filter(a => a.stage === stage)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  const handleDragOver = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  const handleDrop = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault()
    if (!draggingId) return
    setApplicants(prev =>
      prev.map(a => (a.id === draggingId ? { ...a, stage } : a))
    )
    setDraggingId(null)
    setDragOverStage(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverStage(null)
  }

  const moveToStage = (id: string, stage: KanbanStage) => {
    setApplicants(prev => prev.map(a => (a.id === id ? { ...a, stage } : a)))
  }

  const saveNote = (id: string) => {
    setApplicants(prev =>
      prev.map(a => (a.id === id ? { ...a, notes: noteValues[id] ?? '' } : a))
    )
    setEditingNoteId(null)
  }

  return (
    <div className={styles.board}>
      {STAGES.map(({ id: stage, label }) => {
        const cards = byStage(stage)
        return (
          <div key={stage} className={styles.column}>
            <div className={[styles.columnHeader, styles[stage]].join(' ')}>
              <span>{label}</span>
              <span className={styles.columnCount}>{cards.length}</span>
            </div>

            <div
              className={[
                styles.dropZone,
                dragOverStage === stage ? styles.dragOver : '',
              ].filter(Boolean).join(' ')}
              onDragOver={e => handleDragOver(e, stage)}
              onDrop={e => handleDrop(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
            >
              {cards.length === 0 && (
                <div className={styles.emptyDrop}>Drop here</div>
              )}

              {cards.map(applicant => (
                <div
                  key={applicant.id}
                  className={[
                    styles.card,
                    draggingId === applicant.id ? styles.dragging : '',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={e => handleDragStart(e, applicant.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className={styles.jobTag}>{applicant.jobTitle}</div>
                  <div className={styles.cardTop}>
                    <div className={styles.cardAvatar}>{applicant.workerInitials}</div>
                    <div className={styles.cardName}>{applicant.workerName}</div>
                  </div>

                  <div className={styles.cardMeta}>
                    {applicant.isRegulixReady && (
                      <span className={styles.regulixChip}>✓ Regulix</span>
                    )}
                    {applicant.performanceScore && (
                      <span className={styles.scoreChip}>
                        ★ {applicant.performanceScore}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {editingNoteId === applicant.id ? (
                    <textarea
                      className={styles.noteInput}
                      value={noteValues[applicant.id] ?? ''}
                      onChange={e =>
                        setNoteValues(prev => ({ ...prev, [applicant.id]: e.target.value }))
                      }
                      onBlur={() => saveNote(applicant.id)}
                      autoFocus
                      rows={2}
                      placeholder="Add a note..."
                    />
                  ) : (
                    <div
                      onClick={() => setEditingNoteId(applicant.id)}
                      style={{
                        fontSize: '10px',
                        color: noteValues[applicant.id] ? 'var(--kt-text-muted)' : 'var(--kt-text-placeholder)',
                        marginTop: 'var(--kt-space-1)',
                        cursor: 'text',
                        fontStyle: noteValues[applicant.id] ? 'normal' : 'italic',
                        minHeight: '16px',
                        lineHeight: 1.4,
                      }}
                    >
                      {noteValues[applicant.id] || 'Add note...'}
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.cardDaysAgo}>{applicant.appliedDaysAgo}d ago</span>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate(`/site/profile/${applicant.workerId}`)}
                        title="View profile"
                      >
                        View
                      </button>
                      {stage !== 'rejected' && stage !== 'hired' && (
                        <button
                          className={[styles.actionBtn, styles.reject].join(' ')}
                          onClick={() => moveToStage(applicant.id, 'rejected')}
                          title="Reject"
                        >
                          ✗
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
