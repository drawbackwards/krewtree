import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Modal, Tooltip } from '../../../components'
import type { CompanyApplicant } from '../../types'
import {
  getWidgetApplicants,
  setApplicantStage,
  rejectApplicant,
  hireApplicant,
  type WidgetFilters,
} from '../../services/applicantService'
import { getPipelineStages, type PipelineStage } from '../../services/pipelineService'
import {
  DotsHorizontalIcon,
  FlagFilledIcon,
  HourglassFilledIcon,
  PauseIcon,
  RegulixMarkIcon,
  StarIcon,
} from '../../icons'
import styles from './WidgetKanbanView.module.css'

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_CARDS_PER_COL = 15
const MAX_FETCH = 200

// ── Helpers ────────────────────────────────────────────────────────────────

function timeInStage(iso: string | null | undefined): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diffMs / 3_600_000)
  if (h < 24) return `${Math.max(1, h)}h`
  const d = Math.floor(h / 24)
  if (d < 14) return `${d}d`
  return `${Math.floor(d / 7)}w`
}

function flagTooltip(labels: string[]): string {
  if (labels.length === 0) return 'Flagged for follow-up'
  if (labels.length === 1) {
    const label = labels[0]
    const truncated = label.length > 50 ? `${label.slice(0, 50)}…` : label
    return `Flagged: "${truncated}"`
  }
  return `${labels.length} flagged tasks`
}

// ── Types ──────────────────────────────────────────────────────────────────

type ConfirmModal = { type: 'reject' | 'hire'; applicant: CompanyApplicant }
type UndoToast = {
  id: string
  message: string
  undo: () => void
  timerId: ReturnType<typeof setTimeout>
}

// ── Card ───────────────────────────────────────────────────────────────────

type CardProps = {
  applicant: CompanyApplicant
  isDragging?: boolean
  onOpen: (a: CompanyApplicant) => void
  onReject: (a: CompanyApplicant) => void
  onHire: (a: CompanyApplicant) => void
}

const KanbanCard: React.FC<CardProps> = ({
  applicant: a,
  isDragging,
  onOpen,
  onReject,
  onHire,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      onClick={() => onOpen(a)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(a)}
      style={{ position: 'relative' }}
    >
      <div className={styles.cardTop}>
        {/* Avatar */}
        <div className={styles.cardAvatar}>
          {a.workerAvatar ? (
            <img src={a.workerAvatar} alt="" className={styles.cardAvatarImg} />
          ) : (
            a.workerInitials.slice(0, 2)
          )}
        </div>
        {/* Identity stack: name + primary trade */}
        <div className={styles.cardIdentity}>
          <span className={styles.cardName}>
            {a.workerFirstName} {a.workerLastInitial}.
          </span>
          {a.workerPrimaryTrade && (
            <span className={styles.cardSubtext}>{a.workerPrimaryTrade}</span>
          )}
        </div>
        {/* Overflow menu */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            className={styles.cardOverflowBtn}
            data-open={menuOpen}
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            aria-label="More actions"
          >
            <DotsHorizontalIcon size={13} />
          </button>
          {menuOpen && (
            <div className={styles.overflowDropdown} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.overflowItem}
                onClick={() => {
                  setMenuOpen(false)
                  onOpen(a)
                }}
              >
                Open profile
              </button>
              <button
                type="button"
                className={`${styles.overflowItem} ${styles.danger}`}
                onClick={() => {
                  setMenuOpen(false)
                  onReject(a)
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className={`${styles.overflowItem} ${styles.danger}`}
                onClick={() => {
                  setMenuOpen(false)
                  onHire(a)
                }}
              >
                Mark hired
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body — indented to align with the identity column above */}
      <div className={styles.cardBody}>
        <div className={styles.cardJob}>
          <span className={styles.cardJobLine}>
            <span className={styles.cardJobLabel}>Applied to:</span>{' '}
            <span className={styles.cardJobTitle}>{a.jobTitle}</span>
          </span>
          {a.jobStatus === 'paused' && (
            <Tooltip content="Job is paused — no new applicants" position="top">
              <span className={styles.pauseIcon} aria-label="Job paused">
                <PauseIcon size={9} />
              </span>
            </Tooltip>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardSignals}>
            {a.isRegulixReady && (
              <Tooltip content="Regulix Ready — paperwork complete" position="top">
                <span className={styles.signalRegulix} aria-label="Regulix Ready">
                  <RegulixMarkIcon size={12} />
                </span>
              </Tooltip>
            )}
            {a.isShortlisted && (
              <Tooltip content="Shortlisted by your team" position="top">
                <span className={styles.signalShortlist} aria-label="Shortlisted">
                  <StarIcon size={11} />
                </span>
              </Tooltip>
            )}
            {a.flagged && (
              <Tooltip content={flagTooltip(a.flaggedTaskLabels)} position="top">
                <span className={styles.signalFlag} aria-label="Flagged">
                  <FlagFilledIcon size={11} />
                </span>
              </Tooltip>
            )}
            {a.slaState !== 'none' && (
              <Tooltip
                content={
                  a.slaState === 'breached'
                    ? 'Overdue — has been in this stage too long'
                    : 'Almost overdue — move soon to stay on track'
                }
                position="top"
              >
                <span
                  className={
                    a.slaState === 'breached'
                      ? styles.signalSlaBreached
                      : styles.signalSlaApproaching
                  }
                  aria-label={a.slaState === 'breached' ? 'SLA breached' : 'SLA approaching'}
                >
                  <HourglassFilledIcon size={11} />
                </span>
              </Tooltip>
            )}
          </div>
          <span className={styles.cardTimeInStage}>{timeInStage(a.stageEnteredAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Draggable card wrapper ─────────────────────────────────────────────────

const DraggableCard: React.FC<CardProps> = (props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.applicant.id,
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <KanbanCard {...props} isDragging={isDragging} />
    </div>
  )
}

// ── Droppable column ───────────────────────────────────────────────────────

type ColumnProps = {
  stage: PipelineStage
  applicants: CompanyApplicant[]
  totalInStage: number
  cardsPerCol: number
  onOpen: (a: CompanyApplicant) => void
  onReject: (a: CompanyApplicant) => void
  onHire: (a: CompanyApplicant) => void
}

const KanbanColumn: React.FC<ColumnProps> = ({
  stage,
  applicants,
  totalInStage,
  cardsPerCol,
  onOpen,
  onReject,
  onHire,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const visible = applicants.slice(0, cardsPerCol)
  const moreCount = totalInStage - cardsPerCol

  return (
    <div ref={setNodeRef} className={`${styles.column} ${isOver ? styles.dropOver : ''}`}>
      <div className={styles.colHeader}>
        <span className={styles.colName}>{stage.name}</span>
        <span className={styles.colCount}>({totalInStage})</span>
      </div>
      {visible.map((a) => (
        <DraggableCard
          key={a.id}
          applicant={a}
          onOpen={onOpen}
          onReject={onReject}
          onHire={onHire}
        />
      ))}
      {moreCount > 0 && (
        <Link
          to={`/site/dashboard/applicants?stageId=${encodeURIComponent(stage.id)}`}
          className={styles.moreLink}
        >
          +{moreCount} more
        </Link>
      )}
    </div>
  )
}

// ── WidgetKanbanView ───────────────────────────────────────────────────────

type Props = {
  companyId: string
  filters: WidgetFilters
  onOpenApplicant: (a: CompanyApplicant) => void
  cardsPerCol?: number
}

export const WidgetKanbanView: React.FC<Props> = ({
  companyId,
  filters,
  onOpenApplicant,
  cardsPerCol = DEFAULT_CARDS_PER_COL,
}) => {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [applicants, setApplicants] = useState<CompanyApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toast, setToast] = useState<UndoToast | null>(null)
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null)
  const [actionPending, setActionPending] = useState(false)

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  const sensors = useSensors(mouseSensor, touchSensor)

  // Fetch stages and applicants together on mount / filter change
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      getPipelineStages(companyId),
      getWidgetApplicants(companyId, filters, MAX_FETCH),
    ]).then(([stagesRes, applicantsRes]) => {
      if (cancelled) return
      setStages(stagesRes.data)
      // TEMP: sessionStorage flag overlays every signal on the first applicant
      // so we can preview the fully-loaded card state visually.
      // Toggle in DevTools: sessionStorage.setItem('kt:demoCard', 'full')
      const isDemo =
        typeof window !== 'undefined' && window.sessionStorage.getItem('kt:demoCard') === 'full'
      const data = applicantsRes.data
      if (isDemo && data.length > 0) {
        data[0] = {
          ...data[0],
          isRegulixReady: true,
          isShortlisted: true,
          flagged: true,
          flaggedTaskLabels: ['Verify references'],
          slaState: 'breached',
          jobStatus: 'paused',
        }
      }
      setApplicants(data)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [companyId, filters])

  // Group applicants by currentStageId
  const byStage = React.useMemo(() => {
    const map = new Map<string, CompanyApplicant[]>()
    for (const s of stages) map.set(s.id, [])
    for (const a of applicants) {
      if (map.has(a.currentStageId)) {
        map.get(a.currentStageId)!.push(a)
      }
    }
    return map
  }, [stages, applicants])

  const activeApplicant = activeId ? (applicants.find((a) => a.id === activeId) ?? null) : null

  // Toast helpers
  function showToast(message: string, undo: () => void) {
    setToast((prev) => {
      if (prev) clearTimeout(prev.timerId)
      const timerId = setTimeout(() => setToast(null), 5000)
      return { id: String(Date.now()), message, undo, timerId }
    })
  }

  // Drag handlers
  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const appId = String(e.active.id)
    const targetStageId = e.over ? String(e.over.id) : null
    if (!targetStageId) return

    const current = applicants.find((a) => a.id === appId)
    if (!current || current.currentStageId === targetStageId) return

    const targetStage = stages.find((s) => s.id === targetStageId)
    if (!targetStage) return

    const prevStageId = current.currentStageId
    const prevStageName = current.currentStageName
    const name = `${current.workerFirstName} ${current.workerLastInitial}.`

    // Optimistic update
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, currentStageId: targetStageId, currentStageName: targetStage.name }
          : a
      )
    )

    const { error } = await setApplicantStage(appId, targetStageId)
    if (error) {
      // Revert
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, currentStageId: prevStageId, currentStageName: prevStageName }
            : a
        )
      )
      return
    }

    showToast(`Moved ${name} to ${targetStage.name}.`, async () => {
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, currentStageId: prevStageId, currentStageName: prevStageName }
            : a
        )
      )
      await setApplicantStage(appId, prevStageId)
    })
  }

  // Confirm actions
  const handleConfirm = useCallback(async () => {
    if (!confirm) return
    setActionPending(true)
    const { applicant, type } = confirm
    setConfirm(null)
    // Optimistic remove
    setApplicants((prev) => prev.filter((a) => a.id !== applicant.id))
    const { error } =
      type === 'reject' ? await rejectApplicant(applicant.id) : await hireApplicant(applicant.id)
    if (error) {
      // Restore on failure
      setApplicants((prev) => [applicant, ...prev])
    }
    setActionPending(false)
  }, [confirm])

  if (loading) return <div className={styles.loading}>Loading…</div>

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {stages.map((stage) => {
            const colApplicants = byStage.get(stage.id) ?? []
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                applicants={colApplicants}
                totalInStage={colApplicants.length}
                cardsPerCol={cardsPerCol}
                onOpen={onOpenApplicant}
                onReject={(a) => setConfirm({ type: 'reject', applicant: a })}
                onHire={(a) => setConfirm({ type: 'hire', applicant: a })}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeApplicant && (
            <div className={styles.dragGhost}>
              <div className={styles.cardTop}>
                <div className={styles.cardAvatar}>
                  {activeApplicant.workerInitials.slice(0, 2)}
                </div>
                <div className={styles.cardIdentity}>
                  <span className={styles.cardName}>
                    {activeApplicant.workerFirstName} {activeApplicant.workerLastInitial}.
                  </span>
                  {activeApplicant.workerPrimaryTrade && (
                    <span className={styles.cardSubtext}>{activeApplicant.workerPrimaryTrade}</span>
                  )}
                </div>
              </div>
              <span className={styles.cardJobTitle}>{activeApplicant.jobTitle}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Undo toast */}
      {toast && (
        <div className={styles.toast} key={toast.id}>
          <span>{toast.message}</span>
          <button
            type="button"
            className={styles.toastUndo}
            onClick={() => {
              clearTimeout(toast.timerId)
              toast.undo()
              setToast(null)
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Confirm modals */}
      {confirm?.type === 'reject' && (
        <Modal open title="Reject applicant" onClose={() => setConfirm(null)}>
          <p className={styles.confirmBody}>
            Reject {confirm.applicant.workerFirstName} {confirm.applicant.workerLastInitial}. for{' '}
            <strong>{confirm.applicant.jobTitle}</strong>? This removes them from your active
            pipeline.
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.confirmCancel} onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDanger}
              onClick={handleConfirm}
              disabled={actionPending}
            >
              {actionPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </Modal>
      )}
      {confirm?.type === 'hire' && (
        <Modal open title="Mark as hired" onClose={() => setConfirm(null)}>
          <p className={styles.confirmBody}>
            Mark {confirm.applicant.workerFirstName} {confirm.applicant.workerLastInitial}. as hired
            for <strong>{confirm.applicant.jobTitle}</strong>?
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.confirmCancel} onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDanger}
              onClick={handleConfirm}
              disabled={actionPending}
            >
              {actionPending ? 'Marking…' : 'Mark hired'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
