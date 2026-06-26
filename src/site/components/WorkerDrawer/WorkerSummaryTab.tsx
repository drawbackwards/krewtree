import React from 'react'
import type { WorkerDetail } from '../../services/krewService'
import previewStyles from '../ApplicantPreviewBody/ApplicantPreviewBody.module.css'

export interface WorkerSummaryTabProps {
  worker: WorkerDetail
}

// Worker-scoped Summary content. Mirrors the section markup and styling of
// ApplicantPreviewBody so the two drawers look consistent. Krew affiliation
// (formerly the gray RelationshipStrip) is shown as a pill beside the name in
// the drawer hero — not duplicated here.
export const WorkerSummaryTab: React.FC<WorkerSummaryTabProps> = ({ worker }) => {
  return (
    <div className={previewStyles.body}>
      {worker.topSkills.length > 0 && (
        <section className={previewStyles.section}>
          <h3 className={previewStyles.sectionHeading}>Top skills</h3>
          <div className={previewStyles.skillsStrip}>
            {worker.topSkills.map((skill) => (
              <span key={skill} className={previewStyles.skillPill}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {worker.jobHistory.length > 0 && (
        <section className={previewStyles.section}>
          <h3 className={previewStyles.sectionHeading}>Work experience</h3>
          <div className={previewStyles.timeline}>
            {worker.jobHistory.slice(0, 3).map((job, i, arr) => {
              const isLast = i === arr.length - 1
              return (
                <div key={`${job.employer}-${job.title}`} className={previewStyles.timelineRow}>
                  <div className={previewStyles.timelineMarker}>
                    <div className={previewStyles.timelineDot} />
                    {!isLast && <div className={previewStyles.timelineLine} />}
                  </div>
                  <div className={previewStyles.timelineContent}>
                    {job.isCurrent && (
                      <p className={previewStyles.currentRoleLabel}>Currently at</p>
                    )}
                    <p className={previewStyles.jobTitle}>{job.title}</p>
                    <p className={previewStyles.jobMeta}>
                      {job.employer} · {job.duration}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {worker.certifications.length > 0 && (
        <section className={previewStyles.section}>
          <h3 className={previewStyles.sectionHeading}>Certifications</h3>
          <ul className={previewStyles.certList}>
            {worker.certifications.map((c) => (
              <li key={c.name} className={previewStyles.certItem}>
                <div className={previewStyles.certText}>
                  <p className={previewStyles.certName}>{c.name}</p>
                  <p className={previewStyles.certIssuer}>{c.issuer}</p>
                </div>
                {c.expiresOn && (
                  <span className={previewStyles.certMeta}>Expires {c.expiresOn}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {worker.references.length > 0 && (
        <section className={previewStyles.section}>
          <h3 className={previewStyles.sectionHeading}>References</h3>
          <ul className={previewStyles.certList}>
            {worker.references.map((r) => (
              <li key={r.id} className={previewStyles.certItem}>
                <div className={previewStyles.certText}>
                  <p className={previewStyles.certName}>{r.name}</p>
                  <p className={previewStyles.certIssuer}>{r.company}</p>
                </div>
                {(r.phone || r.email) && (
                  <span className={previewStyles.certMeta}>{r.phone ?? r.email}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {worker.topSkills.length === 0 &&
        worker.jobHistory.length === 0 &&
        worker.certifications.length === 0 &&
        worker.references.length === 0 && (
          <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
            This worker hasn't filled out their profile yet.
          </p>
        )}
    </div>
  )
}
