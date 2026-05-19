import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApplicantsView } from '../../services/companyPreferenceService'
import {
  getWidgetApplicants,
  setApplicantStage,
  shortlistApplicant,
  DEFAULT_WIDGET_FILTERS,
} from '../../services/applicantService'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { ApplicantSlideover } from '../ApplicantSlideover/ApplicantSlideover'
import { ApplicantListView } from './ApplicantListView'
import { WidgetKanbanView } from './WidgetKanbanView'
import styles from './ApplicantsWidget.module.css'

type Props = {
  view: ApplicantsView
  onViewChange: (v: ApplicantsView) => void
  companyId: string
}

export const ApplicantsWidget: React.FC<Props> = ({ view, onViewChange, companyId }) => {
  const [applicants, setApplicants] = useState<CompanyApplicant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasJobs, setHasJobs] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<CompanyApplicant | null>(null)

  const fetchApplicants = useCallback(async () => {
    setLoading(true)
    const { data, total: t, error } = await getWidgetApplicants(companyId, DEFAULT_WIDGET_FILTERS)
    if (!error) {
      setApplicants(data)
      setTotal(t)
      setHasJobs(t > 0 || data.length > 0)
    }
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  const handleSetStage = useCallback(
    async (id: string, stage: KanbanStage) => {
      await setApplicantStage(id, stage)
      fetchApplicants()
    },
    [fetchApplicants]
  )

  const handleShortlist = useCallback(async (id: string) => {
    await shortlistApplicant(id)
    setSelectedApplicant((prev) =>
      prev?.id === id ? { ...prev, isShortlisted: !prev.isShortlisted } : prev
    )
  }, [])

  return (
    <>
      <div className={styles.widget}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Applicants</h2>
          <div className={styles.headerRight}>
            {/* List / Kanban toggle */}
            <div className={styles.toggle} role="group" aria-label="Applicants view">
              <button
                type="button"
                className={`${styles.toggleBtn} ${view === 'list' ? styles.toggleActive : ''}`}
                onClick={() => onViewChange('list')}
                aria-pressed={view === 'list'}
              >
                List
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${view === 'kanban' ? styles.toggleActive : ''}`}
                onClick={() => onViewChange('kanban')}
                aria-pressed={view === 'kanban'}
              >
                Kanban
              </button>
            </div>
            <Link to="/site/dashboard/applicants" className={styles.viewAll}>
              View all →
            </Link>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {view === 'list' ? (
            <ApplicantListView
              applicants={applicants}
              total={total}
              loading={loading}
              hasJobs={hasJobs}
              onOpenApplicant={setSelectedApplicant}
              onRefresh={() => fetchApplicants()}
            />
          ) : (
            <WidgetKanbanView
              companyId={companyId}
              filters={DEFAULT_WIDGET_FILTERS}
              onOpenApplicant={setSelectedApplicant}
            />
          )}
        </div>
      </div>

      <ApplicantSlideover
        applicant={selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        onSetStage={handleSetStage}
        onMessage={() => {}}
        onShortlist={handleShortlist}
      />
    </>
  )
}
