import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import type { CompanyApplicant } from '../../types'
import {
  getRecentApplicants,
  advanceApplicantStage,
  rejectApplicant,
  shortlistApplicant,
  addApplicantNote,
  countNewApplicantsSince,
} from '../../services/applicantService'
import { DotsHorizontalIcon, PersonIcon, RegulixMarkIcon } from '../../icons'
import { StagePill } from '../StagePill/StagePill'
import { ApplicantSlideover } from '../ApplicantSlideover/ApplicantSlideover'
import styles from './RecentApplicantsWidget.module.css'

// Inline overflow menu — mirrors the pattern used in CompanyDashboard
// for the active jobs module.
type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={styles.overflowBtn}
        title="More actions"
        type="button"
      >
        <DotsHorizontalIcon size={13} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className={[styles.overflowItem, item.danger ? styles.danger : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
  const navigate = useNavigate()
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

  const handleAdvance = async (id: string) => {
    await advanceApplicantStage(id)
    setOpen(null) // row may leave the widget (excluded stage)
    load()
  }

  const handleReject = async (id: string) => {
    await rejectApplicant(id)
    setOpen(null)
    load()
  }

  const handleMessage = (id: string) => {
    // TODO: open messaging UI once built (spec §10.5). For now navigate.
    navigate('/site/messages')
    void id
  }

  const handleShortlist = async (id: string) => {
    await shortlistApplicant(id)
    load()
  }

  const handleAddNote = async (id: string) => {
    const text = window.prompt('Add a note about this applicant:')
    if (text && text.trim()) {
      await addApplicantNote(id, text.trim())
      load()
    }
  }

  return (
    <>
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <h2 className={styles.title}>
              <PersonIcon size={16} color="var(--kt-navy-500)" />
              Recent applicants
            </h2>
            {newCount > 0 && (
              <span className={styles.newBadge} title={`${newCount} new since your last visit`}>
                {newCount} new since last login
              </span>
            )}
          </div>
          <Link to="/site/dashboard/applicants" className={styles.viewAll}>
            View all applicants →
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className={styles.empty}>
            <p>No applicants yet. Post a job to start receiving applications.</p>
          </div>
        ) : (
          <div className={styles.table}>
            {/* Header row */}
            <div className={[styles.row, styles.headerRow].join(' ')}>
              <div>Applicant</div>
              <div>Job title</div>
              <div>Stage</div>
              <div className={styles.alignRight}>Match</div>
              <div className={styles.alignCenter}>Regulix</div>
              <div>Applied</div>
              <div />
            </div>

            {/* Data rows */}
            {rows.map((a) => {
              const overflowItems: OverflowItem[] = [
                { label: 'View profile', onClick: () => setOpen(a) },
              ]
              if (a.stage !== 'hired' && a.stage !== 'rejected') {
                overflowItems.push({ label: 'Advance stage', onClick: () => handleAdvance(a.id) })
              }
              overflowItems.push(
                { label: 'Message', onClick: () => handleMessage(a.id) },
                {
                  label: a.isShortlisted ? 'Unshortlist' : 'Shortlist',
                  onClick: () => handleShortlist(a.id),
                },
                { label: 'Add note', onClick: () => handleAddNote(a.id) }
              )
              if (a.stage !== 'rejected') {
                overflowItems.push({
                  label: 'Reject',
                  danger: true,
                  onClick: () => handleReject(a.id),
                })
              }

              return (
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
                    <Link to={`/site/dashboard/jobs`} className={styles.jobLink}>
                      {a.jobTitle}
                    </Link>
                  </div>
                  <div>
                    <StagePill stage={a.stage} size="sm" />
                  </div>
                  <div className={[styles.alignRight, styles.matchCell].join(' ')}>
                    {a.matchScore}%
                  </div>
                  <div className={styles.alignCenter}>
                    {a.isRegulixReady ? <RegulixMarkIcon size={16} /> : null}
                  </div>
                  <div className={styles.dateCell}>{formatShortDate(a.appliedAt)}</div>
                  <div className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => setOpen(a)}
                    >
                      View profile
                    </button>
                    <OverflowMenu items={overflowItems} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ApplicantSlideover
        applicant={open}
        onClose={() => setOpen(null)}
        onAdvance={handleAdvance}
        onReject={handleReject}
        onMessage={handleMessage}
        onShortlist={handleShortlist}
      />
    </>
  )
}
