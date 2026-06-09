import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkerJobMatch } from '../../services/krewService'
import { useDrawerStack } from '../DrawerSystem/DrawerStackContext'
import { useToast } from '../../../components/Toast/Toast'
import { CheckIcon } from '../../icons'
import styles from './WorkerMatchesTab.module.css'

export interface WorkerMatchesTabProps {
  matches: WorkerJobMatch[]
  loading: boolean
}

function formatPay(job: WorkerJobMatch['job']): string | null {
  if (!job.payMin || !job.payMax) return null
  if (job.payType === 'hour') return `$${job.payMin}–${job.payMax}/hr`
  return `$${(job.payMin / 1000).toFixed(0)}k–${(job.payMax / 1000).toFixed(0)}k/yr`
}

function formatPosted(days: number): string {
  if (days <= 0) return 'Posted today'
  if (days === 1) return 'Posted 1d ago'
  return `Posted ${days}d ago`
}

export const WorkerMatchesTab: React.FC<WorkerMatchesTabProps> = ({ matches, loading }) => {
  const navigate = useNavigate()
  const { closeAllDrawers } = useDrawerStack()
  const { toast } = useToast()
  const [invited, setInvited] = useState<Set<string>>(new Set())

  const handleInvite = (jobId: string, jobTitle: string): void => {
    setInvited((prev) => {
      const next = new Set(prev)
      next.add(jobId)
      return next
    })
    toast({
      title: 'Invitation sent',
      description: `Invited worker to ${jobTitle}.`,
      variant: 'success',
    })
  }

  const handleViewJob = (jobId: string): void => {
    // Close the drawer first, then defer the navigate so the krew page's
    // drawer ↔ URL sync effect can run and clear `?worker=` on the current
    // path. If we navigate synchronously, that effect fires afterwards and
    // calls setSearchParams against our new path, clobbering the push.
    closeAllDrawers()
    setTimeout(() => navigate(`/site/jobs/${jobId}`), 0)
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <p className={styles.loading}>Loading…</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>No active jobs match this worker right now.</p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {matches.map(({ job, isStrong, signals }) => {
          const pay = formatPay(job)
          const isInvited = invited.has(job.id)
          const applicantText =
            job.totalApplicants === 1 ? '1 applicant' : `${job.totalApplicants} applicants`
          return (
            <li key={job.id}>
              <article
                className={[styles.card, isStrong ? styles.cardStrong : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.topRow}>
                  <h4 className={styles.title}>{job.title}</h4>
                  {isStrong && <span className={styles.strongBadge}>Strong match</span>}
                </div>
                <div className={styles.metaRow}>
                  {job.location && <span>{job.location}</span>}
                  {job.location && (job.type || pay) && <span className={styles.middot}>·</span>}
                  {job.type && <span>{job.type}</span>}
                  {job.type && pay && <span className={styles.middot}>·</span>}
                  {pay && <span>{pay}</span>}
                </div>
                {(signals.locationMatch ||
                  signals.tradeMatch ||
                  signals.matchedSkills.length > 0) && (
                  <div className={styles.signalRow}>
                    {signals.locationMatch && <span className={styles.signal}>Location match</span>}
                    {signals.tradeMatch && <span className={styles.signal}>Trade match</span>}
                    {signals.matchedSkills.slice(0, 3).map((skill) => (
                      <span key={skill} className={styles.signal}>
                        {skill}
                      </span>
                    ))}
                    {signals.matchedSkills.length > 3 && (
                      <span className={styles.signal}>+{signals.matchedSkills.length - 3}</span>
                    )}
                  </div>
                )}
                <div className={styles.footer}>
                  <div className={styles.context}>
                    <span>{applicantText}</span>
                    <span className={styles.middot}>·</span>
                    <span>{formatPosted(job.postedDaysAgo)}</span>
                    {job.urgentHiring && <span className={styles.urgentPill}>Urgent</span>}
                  </div>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleViewJob(job.id)}
                    >
                      View job
                    </button>
                    <button
                      type="button"
                      className={[styles.inviteBtn, isInvited ? styles.inviteBtnDone : '']
                        .filter(Boolean)
                        .join(' ')}
                      disabled={isInvited}
                      onClick={() => {
                        if (!isInvited) handleInvite(job.id, job.title)
                      }}
                    >
                      {isInvited ? (
                        <>
                          <CheckIcon size={14} />
                          Invited
                        </>
                      ) : (
                        'Invite'
                      )}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
