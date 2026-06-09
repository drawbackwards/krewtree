import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApplicantsView } from '../../services/companyPreferenceService'
import {
  getWidgetApplicants,
  shortlistApplicant,
  DEFAULT_WIDGET_FILTERS,
} from '../../services/applicantService'
import type { CompanyApplicant } from '../../types'
import { useDrawerStack } from '../DrawerSystem/DrawerStackContext'
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
  // Bumped on any external mutation so child views (kanban, list) can refetch.
  const [refreshTick, setRefreshTick] = useState(0)
  const { openDrawer } = useDrawerStack()

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

  // Row-level shortlist (from in-row star button, not the drawer).
  const handleRowShortlist = useCallback(
    async (id: string) => {
      const { error } = await shortlistApplicant(id)
      if (error) return
      fetchApplicants()
      setRefreshTick((t) => t + 1)
    },
    [fetchApplicants]
  )

  const handleDrawerWrite = useCallback(() => {
    fetchApplicants()
    setRefreshTick((t) => t + 1)
  }, [fetchApplicants])

  const handleOpenApplicant = useCallback(
    (a: CompanyApplicant) => {
      openDrawer({
        type: 'application',
        applicationId: a.id,
        preloadedApplicant: a,
        onWrite: handleDrawerWrite,
      })
    },
    [openDrawer, handleDrawerWrite]
  )

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
              onOpenApplicant={handleOpenApplicant}
              onShortlist={(a) => handleRowShortlist(a.id)}
              onRefresh={() => fetchApplicants()}
            />
          ) : (
            <WidgetKanbanView
              companyId={companyId}
              filters={DEFAULT_WIDGET_FILTERS}
              onOpenApplicant={handleOpenApplicant}
              refreshTick={refreshTick}
            />
          )}
        </div>
      </div>
    </>
  )
}
