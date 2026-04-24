import React, { useEffect, useMemo, useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { getKanbanApplicants, setApplicantStage } from '../../services/applicantService'
import { KanbanColumn } from './KanbanColumn'
import styles from './PipelineKanban.module.css'

type Props = {
  companyId: string
}

const COLUMNS: Array<{ stage: KanbanStage; label: string }> = [
  { stage: 'new', label: 'New' },
  { stage: 'reviewed', label: 'Reviewed' },
  { stage: 'interview', label: 'Interview' },
  { stage: 'offer', label: 'Offer' },
]

export const PipelineKanban: React.FC<Props> = ({ companyId }) => {
  const [applicants, setApplicants] = useState<CompanyApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  const byStage = useMemo(() => {
    const map: Record<KanbanStage, CompanyApplicant[]> = {
      new: [],
      reviewed: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    }
    for (const a of applicants) map[a.stage]?.push(a)
    return map
  }, [applicants])

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const applicationId = String(event.active.id)
    const target = event.over?.id
    if (!target) return
    const nextStage = target as KanbanStage
    const current = applicants.find((a) => a.id === applicationId)
    if (!current || current.stage === nextStage) return

    const previous = applicants
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, stage: nextStage } : a))
    )
    const { error } = await setApplicantStage(applicationId, nextStage)
    if (error) setApplicants(previous)
  }

  // Test hook: lets unit tests invoke drag-end without simulating pointer events.
  // Guarded on NODE_ENV so it never lands in production bundles.
  if (process.env.NODE_ENV === 'test') {
    ;(window as unknown as { __kanbanTest?: unknown }).__kanbanTest = {
      triggerDragEnd: (id: string, to: string) =>
        handleDragEnd({
          active: { id },
          over: { id: to },
        } as unknown as DragEndEvent),
    }
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.title}>Pipeline</span>
        </div>
        <div className={styles.board}>
          {COLUMNS.map((c) => (
            <div key={c.stage} className={styles.skeleton} />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>Couldn't load pipeline: {loadError}</div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Pipeline</span>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {COLUMNS.map((c) => (
            <KanbanColumn
              key={c.stage}
              stage={c.stage}
              label={c.label}
              applicants={byStage[c.stage]}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
