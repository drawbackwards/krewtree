import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CompanyApplicant } from '../../types'
import { getRecentApplicants, countNewApplicantsSince } from '../../services/applicantService'
import { PersonIcon } from '../../icons'
import { StagePill } from '../StagePill/StagePill'
import { ApplicantSlideover } from '../ApplicantSlideover/ApplicantSlideover'
import styles from './RecentApplicantsWidget.module.css'

export interface RecentApplicantsWidgetProps {
  companyId: string
  /** Supabase user.last_sign_in_at. When present, the "# since last login"
   *  badge counts applicants that arrived after this timestamp. */
  lastSignInAt?: string | null
}

export const RecentApplicantsWidget: React.FC<RecentApplicantsWidgetProps> = ({
  companyId,
  lastSignInAt,
}) => {
  const [rows, setRows] = useState<CompanyApplicant[]>([])
  const [newCount, setNewCount] = useState(0)
  const [open, setOpen] = useState<CompanyApplicant | null>(null)

  // "Since last login" reference timestamp. Prefer the Supabase session's
  // last_sign_in_at. Fall back to "24 hours ago" so the badge still surfaces
  // fresh applicants even on first-ever login.
  const sinceIso = React.useMemo(() => {
    if (lastSignInAt) return lastSignInAt
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }, [lastSignInAt])

  const load = React.useCallback(() => {
    getRecentApplicants(companyId, 5).then(({ data }) => setRows(data))
    countNewApplicantsSince(companyId, sinceIso).then(({ count }) => setNewCount(count))
  }, [companyId, sinceIso])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <h2 className={styles.title}>
              <PersonIcon size={16} color="var(--kt-olive-700)" />
              Recent applicants
            </h2>
            {newCount > 0 && (
              <span className={styles.newBadge} title={`${newCount} new since your last visit`}>
                {newCount} new since last login
              </span>
            )}
          </div>
          <Link to="/site/dashboard/applicants" className={styles.viewAll}>
            View all →
          </Link>
        </div>

        <div className={styles.table}>
          {/* Header row */}
          <div className={[styles.row, styles.headerRow].join(' ')}>
            <div>Applicant</div>
            <div>Job</div>
            <div>Stage</div>
            <div className={styles.alignRight}>Match</div>
          </div>

          {rows.length === 0 ? (
            <div className={styles.empty}>
              <p>No applicants yet. Post a job to start receiving applications.</p>
            </div>
          ) : (
            <>
              {rows.map((a) => (
                <div key={a.id} className={styles.row}>
                  <div className={styles.applicantCell}>
                    <div className={styles.avatar}>{a.workerInitials}</div>
                    <button
                      type="button"
                      className={styles.applicantName}
                      onClick={() => setOpen(a)}
                    >
                      {a.workerFirstName} {a.workerLastInitial}.
                    </button>
                  </div>
                  <div className={styles.jobCell}>
                    <Link to="/site/dashboard/jobs" className={styles.jobLink}>
                      {a.jobTitle}
                    </Link>
                  </div>
                  <div>
                    <StagePill stage={a.stage} size="sm" />
                  </div>
                  <div className={[styles.alignRight, styles.matchCell].join(' ')}>
                    {a.matchScore}%
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, i) => (
                <div
                  key={`filler-${i}`}
                  className={[styles.row, styles.fillerRow].join(' ')}
                  aria-hidden="true"
                />
              ))}
            </>
          )}
        </div>
      </div>

      <ApplicantSlideover
        applicant={open}
        onClose={() => setOpen(null)}
        onSetStage={(id, stage) => {
          void id
          void stage
        }}
        onMessage={(id) => {
          void id
        }}
        onShortlist={(id) => {
          void id
        }}
      />
    </>
  )
}
