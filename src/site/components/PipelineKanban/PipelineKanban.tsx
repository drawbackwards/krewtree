import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { CompanyApplicant, KanbanStage } from '../../types'
import {
  getKanbanApplicants,
  setApplicantStage,
  rejectApplicant,
  hireApplicant,
  shortlistApplicant,
} from '../../services/applicantService'
import { KanbanIcon, CloseIcon } from '../../icons'
import { Modal } from '../../../components'
import { ApplicantSlideover } from '../ApplicantSlideover/ApplicantSlideover'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import styles from './PipelineKanban.module.css'

// ── Column definitions ─────────────────────────────────────────────────────

const COLUMNS: Array<{ stage: KanbanStage; label: string }> = [
  { stage: 'screening', label: 'Screening' },
  { stage: 'assessment', label: 'Assessment' },
  { stage: 'interview', label: 'Interview' },
  { stage: 'offer', label: 'Offer' },
]

const ACTIVE_STAGES = new Set<KanbanStage>(['screening', 'assessment', 'interview', 'offer'])

// ── Undo toast ─────────────────────────────────────────────────────────────

type UndoToast = {
  key: string
  message: string
  undoFn: () => void
  timerId: ReturnType<typeof setTimeout>
}

// ── Confirm modal ──────────────────────────────────────────────────────────

type ConfirmModal = {
  type: 'reject' | 'hire'
  applicant: CompanyApplicant
}

// ── Collapse state ────────────────────────────────────────────────────────

type CollapseState = Record<string, boolean>

function loadCollapseState(): CollapseState {
  try {
    const raw = localStorage.getItem('kt_kanban_collapsed_v1')
    return raw ? (JSON.parse(raw) as CollapseState) : {}
  } catch {
    return {}
  }
}

function saveCollapseState(state: CollapseState) {
  try {
    localStorage.setItem('kt_kanban_collapsed_v1', JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

// ── Props ──────────────────────────────────────────────────────────────────

type Props = {
  companyId: string
}

// ── Component ─────────────────────────────────────────────────────────────

export const PipelineKanban: React.FC<Props> = ({ companyId }) => {
  const navigate = useNavigate()
  const [applicants, setApplicants] = useState<CompanyApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)
  const [slideover, setSlideover] = useState<CompanyApplicant | null>(null)
  const [collapseState, setCollapseState] = useState<CollapseState>(loadCollapseState)

  // DnD sensors — distance constraint lets clicks pass through
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

  // Load applicants
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getKanbanApplicants(companyId).then(({ data, error }) => {
      if (cancelled) return
      setApplicants(data)
      setLoadError(error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [companyId])

  // Active applicants (no client-side filtering on dashboard)
  const filtered = useMemo(() => applicants.filter((a) => ACTIVE_STAGES.has(a.stage)), [applicants])

  const byStage = useMemo(() => {
    const map: Record<KanbanStage, CompanyApplicant[]> = {
      screening: [],
      assessment: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
      withdrawn: [],
      archived: [],
    }
    for (const a of filtered) map[a.stage]?.push(a)
    return map
  }, [filtered])

  const activeApplicant = activeId ? (applicants.find((a) => a.id === activeId) ?? null) : null

  // Undo toast helpers
  function dismissUndoToast() {
    setUndoToast((t) => {
      if (t) clearTimeout(t.timerId)
      return null
    })
  }

  function showUndoToast(message: string, undoFn: () => void) {
    setUndoToast((prev) => {
      if (prev) clearTimeout(prev.timerId)
      const timerId = setTimeout(() => setUndoToast(null), 5000)
      return { key: String(Date.now()), message, undoFn, timerId }
    })
  }

  // Drag handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const applicationId = String(event.active.id)
    const target = event.over?.id
    if (!target) return
    const nextStage = target as KanbanStage
    const current = applicants.find((a) => a.id === applicationId)
    if (!current || current.stage === nextStage) return

    const prevStage = current.stage
    const name = `${current.workerFirstName} ${current.workerLastInitial}.`
    const targetCol = COLUMNS.find((c) => c.stage === nextStage)

    // Optimistic update
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, stage: nextStage } : a))
    )

    const { error } = await setApplicantStage(applicationId, nextStage)
    if (error) {
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, stage: prevStage } : a))
      )
      return
    }

    // Show undo toast
    showUndoToast(`Moved ${name} to ${targetCol?.label ?? nextStage}.`, async () => {
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, stage: prevStage } : a))
      )
      await setApplicantStage(applicationId, prevStage)
    })
  }

  // Confirm actions
  async function handleConfirmReject() {
    if (!confirmModal) return
    const { applicant } = confirmModal
    setConfirmModal(null)
    const prevIndex = applicants.findIndex((a) => a.id === applicant.id)
    setApplicants((prev) => prev.filter((a) => a.id !== applicant.id))
    const { error } = await rejectApplicant(applicant.id)
    if (error) {
      setApplicants((prev) => {
        const next = [...prev]
        next.splice(Math.max(0, prevIndex), 0, applicant)
        return next
      })
    }
  }

  async function handleConfirmHire() {
    if (!confirmModal) return
    const { applicant } = confirmModal
    setConfirmModal(null)
    const prevIndex = applicants.findIndex((a) => a.id === applicant.id)
    setApplicants((prev) => prev.filter((a) => a.id !== applicant.id))
    const { error } = await hireApplicant(applicant.id)
    if (error) {
      setApplicants((prev) => {
        const next = [...prev]
        next.splice(Math.max(0, prevIndex), 0, applicant)
        return next
      })
    }
  }

  // Column collapse
  function toggleCollapse(stage: string) {
    setCollapseState((prev) => {
      const next = { ...prev, [stage]: !prev[stage] }
      saveCollapseState(next)
      return next
    })
  }

  // Test hook — allows unit tests to trigger drag without pointer simulation
  if (process.env.NODE_ENV === 'test') {
    ;(window as unknown as { __kanbanTest?: unknown }).__kanbanTest = {
      triggerDragEnd: (id: string, to: string) =>
        handleDragEnd({
          active: { id },
          over: { id: to },
        } as unknown as DragEndEvent),
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.root}>
        <WidgetHeader onViewAll={() => navigate('/site/dashboard/applicants')} />
        <div className={styles.viewPane}>
          <div className={styles.board}>
            {COLUMNS.map((c) => (
              <div key={c.stage} className={styles.skeleton} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.root}>
        <WidgetHeader onViewAll={() => navigate('/site/dashboard/applicants')} />
        <div className={styles.viewPane}>
          <div className={styles.errorState}>Couldn't load pipeline: {loadError}</div>
        </div>
      </div>
    )
  }

  // ── Zero-applications empty state ─────────────────────────────────────
  const totalActive = applicants.filter((a) => ACTIVE_STAGES.has(a.stage)).length
  if (totalActive === 0) {
    return (
      <div className={styles.root}>
        <WidgetHeader onViewAll={() => navigate('/site/dashboard/applicants')} />
        <div className={styles.viewPane}>
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No applicants yet.</p>
            <Link to="/site/post-job" className={styles.emptyStateCta}>
              Post your first job →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <WidgetHeader onViewAll={() => navigate('/site/dashboard/applicants')} />

      {/* ── Kanban board ─────────────────────────────────────────────────── */}
      <div className={styles.viewPane}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.board}>
            {COLUMNS.map((c) => (
              <KanbanColumn
                key={c.stage}
                stage={c.stage}
                label={c.label}
                applicants={byStage[c.stage]}
                collapsedOnMobile={!!collapseState[c.stage]}
                onToggleCollapse={() => toggleCollapse(c.stage)}
                onCardClick={setSlideover}
                onReject={(a) => setConfirmModal({ type: 'reject', applicant: a })}
                onHire={(a) => setConfirmModal({ type: 'hire', applicant: a })}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApplicant && (
              <div className={styles.dragOverlayCard}>
                <KanbanCard
                  applicant={activeApplicant}
                  onCardClick={() => {}}
                  onReject={() => {}}
                  onHire={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {/* end viewPane */}

      {/* Undo toast */}
      {undoToast && (
        <div className={styles.undoToast} role="status" aria-live="polite">
          <span className={styles.undoMessage}>{undoToast.message}</span>
          <button
            type="button"
            className={styles.undoBtn}
            onClick={() => {
              undoToast.undoFn()
              dismissUndoToast()
            }}
          >
            Undo
          </button>
          <button
            type="button"
            className={styles.undoDismiss}
            onClick={dismissUndoToast}
            aria-label="Dismiss"
          >
            <CloseIcon size={13} />
          </button>
        </div>
      )}

      {/* Applicant slideover */}
      <ApplicantSlideover
        applicant={slideover}
        onClose={() => setSlideover(null)}
        onSetStage={async (id, stage) => {
          const prev = applicants.find((a) => a.id === id)
          if (!prev) return
          setApplicants((list) => list.map((a) => (a.id === id ? { ...a, stage } : a)))
          const { error } = await setApplicantStage(id, stage)
          if (error) {
            setApplicants((list) =>
              list.map((a) => (a.id === id ? { ...a, stage: prev.stage } : a))
            )
          }
        }}
        onMessage={() => {}}
        onShortlist={async (id) => {
          const prev = applicants.find((a) => a.id === id)
          if (!prev) return
          setApplicants((list) =>
            list.map((a) => (a.id === id ? { ...a, isShortlisted: !a.isShortlisted } : a))
          )
          const { error } = await shortlistApplicant(id)
          if (error) {
            setApplicants((list) =>
              list.map((a) => (a.id === id ? { ...a, isShortlisted: prev.isShortlisted } : a))
            )
          }
        }}
        onReject={async (applicant) => {
          const { error } = await rejectApplicant(applicant.id)
          if (!error) {
            setApplicants((list) => list.filter((a) => a.id !== applicant.id))
          }
        }}
        onHire={async (applicant) => {
          const { error } = await hireApplicant(applicant.id)
          if (!error) {
            setApplicants((list) => list.filter((a) => a.id !== applicant.id))
          }
        }}
        onChanged={() => {
          if (slideover) {
            setApplicants((list) => list.filter((a) => a.id !== slideover.id))
          }
        }}
      />

      {/* Reject confirmation modal */}
      <Modal
        open={confirmModal?.type === 'reject'}
        onClose={() => setConfirmModal(null)}
        size="sm"
        title="Reject applicant"
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              onClick={() => setConfirmModal(null)}
              className={styles.modalBtnSecondary}
            >
              Cancel
            </button>
            <button type="button" onClick={handleConfirmReject} className={styles.modalBtnDanger}>
              Reject
            </button>
          </div>
        }
      >
        {confirmModal?.type === 'reject' && (
          <p className={styles.modalBody}>
            This will send{' '}
            <strong>
              {confirmModal.applicant.workerFirstName} {confirmModal.applicant.workerLastInitial}.
            </strong>{' '}
            a rejection notification. This can't be undone. Proceed?
          </p>
        )}
      </Modal>

      {/* Mark hired confirmation modal */}
      <Modal
        open={confirmModal?.type === 'hire'}
        onClose={() => setConfirmModal(null)}
        size="sm"
        title="Mark as hired"
        footer={
          <div style={{ display: 'flex', gap: 'var(--kt-space-3)' }}>
            <button
              type="button"
              onClick={() => setConfirmModal(null)}
              className={styles.modalBtnSecondary}
            >
              Cancel
            </button>
            <button type="button" onClick={handleConfirmHire} className={styles.modalBtnPrimary}>
              Confirm hire
            </button>
          </div>
        }
      >
        {confirmModal?.type === 'hire' && (
          <p className={styles.modalBody}>
            This will notify{' '}
            <strong>
              {confirmModal.applicant.workerFirstName} {confirmModal.applicant.workerLastInitial}.
            </strong>{' '}
            they've been hired and archive this applicant from the active board. Proceed?
          </p>
        )}
      </Modal>
    </div>
  )
}

// ── Widget header (extracted so it renders in loading/error states too) ────

const WidgetHeader: React.FC<{ onViewAll: () => void }> = ({ onViewAll }) => (
  <div className={styles.header}>
    <span className={styles.title}>
      <KanbanIcon size={16} color="var(--kt-olive-700)" />
      Applicant pipeline
    </span>
    <button
      type="button"
      onClick={onViewAll}
      style={{
        fontSize: 'var(--kt-text-sm)',
        color: 'var(--kt-navy-500)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'var(--kt-weight-bold)',
        fontFamily: 'var(--kt-font-sans)',
        whiteSpace: 'nowrap',
        padding: 0,
      }}
    >
      View pipeline →
    </button>
  </div>
)
