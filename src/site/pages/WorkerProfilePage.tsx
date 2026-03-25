import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Divider, Progress } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import type { SkillEndorsement } from '../types'
import {
  MapPinIcon,
  BriefcaseIcon,
  StarIcon,
  VerifiedShieldIcon,
  LinkedInSimpleIcon,
  InstagramIcon,
  FacebookSimpleIcon,
  CheckIcon,
  FolderIcon,
  ClipboardIcon,
} from '../icons'
import { workers, skillEndorsements, resumeDocuments, portfolioItems } from '../data/mock'

export const WorkerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const worker = workers.find((w) => w.id === id) ?? workers[0]

  const isOwnProfile = worker.id === 'w1'
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>(
    skillEndorsements.filter(() => worker.id === 'w1')
  )
  const [endorsedSkills, setEndorsedSkills] = useState<Set<string>>(new Set())
  const [resumes] = useState(resumeDocuments.filter((r) => r.workerId === worker.id))
  const [portfolio] = useState(portfolioItems.filter((p) => p.workerId === worker.id))
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleEndorse = (skillName: string) => {
    if (endorsedSkills.has(skillName)) return
    setEndorsedSkills((prev) => new Set([...prev, skillName]))
    setEndorsements((prev) => [
      ...prev,
      { skillName, endorserId: 'viewer', endorserName: 'You', endorserInitials: 'YO' },
    ])
  }

  const handleMockUpload = () => {
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
  }

  const levelWidth = (level: string) =>
    level === 'Expert' ? '95%' : level === 'Intermediate' ? '65%' : '35%'

  const formatDate = (d: string) => {
    const [y, m] = d.split('-')
    const month = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' })
    return `${month} ${y}`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Cover / Hero */}
      <div
        style={{
          background: 'var(--kt-surface)',
          borderBottom: '1px solid var(--kt-border)',
        }}
      >
        {/* Cover bar */}
        <div
          style={{
            height: 120,
            background: 'var(--kt-grey-100)',
          }}
        />

        {/* Profile row */}
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '0 var(--kt-space-6)',
            paddingBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'flex-end',
              marginTop: -36,
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'var(--kt-primary)',
                color: 'var(--kt-primary-fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-2xl)',
                border: `4px solid ${worker.isPremium ? 'var(--kt-accent)' : 'var(--kt-white)'}`,
                flexShrink: 0,
                boxShadow: worker.isPremium ? '0 0 0 2px var(--kt-accent)' : 'var(--kt-shadow-sm)',
              }}
            >
              {worker.initials}
            </div>

            <div style={{ flex: 1, paddingBottom: 4, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <h1
                  style={{
                    fontSize: 'var(--kt-text-2xl)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    margin: 0,
                  }}
                >
                  {worker.name}
                </h1>
                {worker.isRegulixReady && <RegulixBadge size="md" />}
                {worker.isPremium && (
                  <Badge variant="accent" size="sm">
                    Premium
                  </Badge>
                )}
              </div>
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                {worker.headline}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                  }}
                >
                  <MapPinIcon size={14} />
                  {worker.location}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                  }}
                >
                  <BriefcaseIcon size={14} />
                  {worker.industries.join(', ')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingBottom: 4 }}>
              {isOwnProfile ? (
                <Button variant="primary" size="md" onClick={() => navigate('/site/profile/edit')}>
                  Edit profile
                </Button>
              ) : (
                <>
                  <Button variant="primary" size="md">
                    Message
                  </Button>
                  <Button variant="outline" size="md">
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Rating & hours */}
          <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {worker.performanceScore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StarIcon size={15} color="var(--kt-warning)" />
                <span
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  {worker.performanceScore}
                </span>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  ({worker.ratingCount} ratings)
                </span>
              </div>
            )}
            {worker.totalHoursWorked && (
              <div style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                {worker.totalHoursWorked.toLocaleString()} verified hours worked
              </div>
            )}
            {/* Social links */}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              {worker.socialLinks.linkedin && (
                <a
                  href={worker.socialLinks.linkedin}
                  style={{ color: 'var(--kt-text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <LinkedInSimpleIcon size={16} />
                </a>
              )}
              {worker.socialLinks.instagram && (
                <a
                  href={worker.socialLinks.instagram}
                  style={{ color: 'var(--kt-text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <InstagramIcon />
                </a>
              )}
              {worker.socialLinks.facebook && (
                <a
                  href={worker.socialLinks.facebook}
                  style={{ color: 'var(--kt-text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <FacebookSimpleIcon size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '28px var(--kt-space-6)',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* ---- Main ---- */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bio */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 12,
              }}
            >
              About
            </h2>
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)', lineHeight: 1.7 }}>
              {worker.bio}
            </p>
          </div>

          {/* Resume & Portfolio */}
          {(resumes.length > 0 || isOwnProfile) && (
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  Resume & Portfolio
                </h2>
                {isOwnProfile && (
                  <button
                    onClick={handleMockUpload}
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-primary)',
                      background: 'transparent',
                      border: '1px solid var(--kt-border)',
                      borderRadius: 'var(--kt-radius-md)',
                      padding: '5px 12px',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                      fontWeight: 'var(--kt-weight-medium)',
                    }}
                  >
                    {uploadSuccess ? (
                      <>
                        <CheckIcon size={12} /> Uploaded!
                      </>
                    ) : (
                      '+ Upload Resume'
                    )}
                  </button>
                )}
              </div>

              {/* Resume files */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginBottom: portfolio.length > 0 ? 20 : 0,
                }}
              >
                {resumes.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--kt-radius-md)',
                      border: '1px solid var(--kt-border)',
                      background: 'var(--kt-bg)',
                    }}
                  >
                    <span style={{ color: 'var(--kt-text-muted)' }}>
                      {doc.fileType === 'pdf' ? (
                        <FolderIcon size={24} />
                      ) : (
                        <ClipboardIcon size={24} />
                      )}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          fontWeight: 'var(--kt-weight-medium)',
                          color: 'var(--kt-text)',
                          marginBottom: 2,
                        }}
                      >
                        {doc.filename}
                        {doc.isPrimary && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: '10px',
                              color: 'var(--kt-success)',
                              background: 'color-mix(in srgb, var(--kt-success) 10%, transparent)',
                              padding: '1px 6px',
                              borderRadius: 'var(--kt-radius-full)',
                              fontWeight: 'var(--kt-weight-semibold)',
                            }}
                          >
                            Primary
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                        {doc.sizeKb}KB · Uploaded{' '}
                        {doc.uploadedDaysAgo === 0 ? 'today' : `${doc.uploadedDaysAgo} days ago`}
                      </p>
                    </div>
                    <button
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        padding: '4px 10px',
                        border: '1px solid var(--kt-border)',
                        borderRadius: 'var(--kt-radius-sm)',
                        background: 'transparent',
                        color: 'var(--kt-primary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--kt-font-sans)',
                        fontWeight: 'var(--kt-weight-medium)',
                      }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>

              {/* Portfolio */}
              {portfolio.length > 0 && (
                <>
                  <h3
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      marginBottom: 12,
                    }}
                  >
                    Portfolio
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {portfolio.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 14,
                          borderRadius: 'var(--kt-radius-md)',
                          border: '1px solid var(--kt-border)',
                          background: 'var(--kt-bg)',
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: 8, textAlign: 'center' }}>
                          {item.imageEmoji}
                        </div>
                        <p
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            fontWeight: 'var(--kt-weight-semibold)',
                            color: 'var(--kt-text)',
                            marginBottom: 4,
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                            marginBottom: 8,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: 'var(--kt-radius-full)',
                                background: 'color-mix(in srgb, var(--kt-primary) 8%, transparent)',
                                color: 'var(--kt-primary)',
                                fontWeight: 'var(--kt-weight-medium)',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <p
                          style={{
                            fontSize: '10px',
                            color: 'var(--kt-text-placeholder)',
                            marginTop: 6,
                          }}
                        >
                          {item.projectDate}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Job History */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 18,
              }}
            >
              Work Experience
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {worker.jobHistory.map((job, i) => {
                const isLast = i === worker.jobHistory.length - 1
                return (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    {/* Timeline */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: job.isRegulixVerified
                            ? 'var(--kt-accent)'
                            : 'var(--kt-border-strong)',
                          border: `2px solid ${job.isRegulixVerified ? 'var(--kt-olive-300)' : 'var(--kt-border)'}`,
                          marginTop: 4,
                        }}
                      />
                      {!isLast && (
                        <div
                          style={{
                            width: 2,
                            flex: 1,
                            background: 'var(--kt-border)',
                            margin: '4px 0',
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontWeight: 'var(--kt-weight-semibold)',
                              color: 'var(--kt-text)',
                              fontSize: 'var(--kt-text-sm)',
                              marginBottom: 2,
                            }}
                          >
                            {job.title}
                          </p>
                          <p
                            style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}
                          >
                            {job.employer}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xs)',
                              color: 'var(--kt-text-muted)',
                              marginBottom: 4,
                            }}
                          >
                            {formatDate(job.startDate)} —{' '}
                            {job.endDate ? formatDate(job.endDate) : 'Present'}
                          </p>
                          {job.isRegulixVerified && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                justifyContent: 'flex-end',
                              }}
                            >
                              <VerifiedShieldIcon />
                              <span
                                style={{
                                  fontSize: 'var(--kt-text-xs)',
                                  color: 'var(--kt-olive-700)',
                                  fontWeight: 'var(--kt-weight-medium)',
                                }}
                              >
                                Regulix Verified
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Skills */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 18,
              }}
            >
              Skills
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {worker.skills.map((skill) => {
                const skillEndorsers = endorsements.filter((e) => e.skillName === skill.name)
                const alreadyEndorsed = endorsedSkills.has(skill.name)
                return (
                  <div key={skill.name}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          fontWeight: 'var(--kt-weight-medium)',
                          color: 'var(--kt-text)',
                        }}
                      >
                        {skill.name}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-medium)',
                          color:
                            skill.level === 'Expert'
                              ? 'var(--kt-success)'
                              : skill.level === 'Intermediate'
                                ? 'var(--kt-info)'
                                : 'var(--kt-text-muted)',
                          padding: '2px 8px',
                          borderRadius: 'var(--kt-radius-full)',
                          background:
                            skill.level === 'Expert'
                              ? 'var(--kt-success-subtle)'
                              : skill.level === 'Intermediate'
                                ? 'var(--kt-info-subtle)'
                                : 'var(--kt-bg)',
                          border: `1px solid ${skill.level === 'Expert' ? 'var(--kt-success)' : skill.level === 'Intermediate' ? 'var(--kt-info)' : 'var(--kt-border)'}`,
                        }}
                      >
                        {skill.level}
                      </span>
                    </div>
                    <Progress
                      value={parseFloat(levelWidth(skill.level))}
                      color={skill.level === 'Expert' ? 'success' : 'primary'}
                      size="sm"
                    />
                    {/* Endorsements row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      {/* Endorser avatar stack */}
                      {skillEndorsers.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {skillEndorsers.slice(0, 3).map((e, idx) => (
                            <div
                              key={e.endorserId}
                              title={e.endorserName}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'var(--kt-primary)',
                                color: 'var(--kt-primary-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 'var(--kt-weight-bold)',
                                border: '2px solid var(--kt-surface)',
                                marginLeft: idx === 0 ? 0 : -6,
                                zIndex: 3 - idx,
                                position: 'relative',
                              }}
                            >
                              {e.endorserInitials}
                            </div>
                          ))}
                          {skillEndorsers.length > 3 && (
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'var(--kt-bg)',
                                border: '2px solid var(--kt-surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                color: 'var(--kt-text-muted)',
                                fontWeight: 'var(--kt-weight-bold)',
                                marginLeft: -6,
                                position: 'relative',
                              }}
                            >
                              +{skillEndorsers.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <span
                        style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}
                      >
                        {skillEndorsers.length > 0
                          ? `${skillEndorsers.length} endorsement${skillEndorsers.length !== 1 ? 's' : ''}`
                          : 'No endorsements yet'}
                      </span>
                      {!isOwnProfile && (
                        <button
                          onClick={() => handleEndorse(skill.name)}
                          disabled={alreadyEndorsed}
                          style={{
                            marginLeft: 'auto',
                            fontSize: 'var(--kt-text-xs)',
                            padding: '3px 10px',
                            border: `1px solid ${alreadyEndorsed ? 'var(--kt-border)' : 'var(--kt-primary)'}`,
                            borderRadius: 'var(--kt-radius-full)',
                            background: alreadyEndorsed ? 'var(--kt-bg)' : 'transparent',
                            color: alreadyEndorsed ? 'var(--kt-text-muted)' : 'var(--kt-primary)',
                            cursor: alreadyEndorsed ? 'default' : 'pointer',
                            fontFamily: 'var(--kt-font-sans)',
                            fontWeight: 'var(--kt-weight-medium)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {alreadyEndorsed ? (
                            <>
                              <CheckIcon size={12} /> Endorsed
                            </>
                          ) : (
                            '+ Endorse'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---- Sidebar ---- */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 80,
          }}
        >
          {/* Regulix Status */}
          <div
            style={{
              background: worker.isRegulixReady ? 'var(--kt-olive-100)' : 'var(--kt-surface)',
              border: `1px solid ${worker.isRegulixReady ? 'var(--kt-olive-300)' : 'var(--kt-border)'}`,
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
              textAlign: 'center',
            }}
          >
            <RegulixBadge
              size="lg"
              variant={worker.isRegulixReady ? 'filled' : 'pending'}
              pulse={worker.isRegulixReady}
            />
            <p
              style={{
                marginTop: 10,
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: worker.isRegulixReady ? 'var(--kt-olive-800)' : 'var(--kt-text-muted)',
              }}
            >
              {worker.isRegulixReady ? 'Regulix Ready' : 'Not Yet Regulix Ready'}
            </p>
            <p
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {worker.isRegulixReady
                ? 'All onboarding docs verified. Day-1 hire-ready.'
                : 'Complete onboarding to become hire-ready.'}
            </p>
          </div>

          {/* Profile completion */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Profile
              </span>
              <span
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-olive-700)',
                }}
              >
                {worker.profileCompletePct}%
              </span>
            </div>
            <Progress
              value={worker.profileCompletePct}
              color={worker.profileCompletePct >= 90 ? 'success' : 'warning'}
              size="sm"
            />
          </div>

          {/* Industries */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 10,
              }}
            >
              Industries
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {worker.industries.map((ind) => (
                <Badge key={ind} variant="secondary" size="sm">
                  {ind}
                </Badge>
              ))}
            </div>
          </div>

          {/* Back to jobs */}
          <Divider />
          <Link to="/site/jobs" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm" style={{ width: '100%' }}>
              ← Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
