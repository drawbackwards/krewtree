import React, { useState, useEffect, useRef } from 'react'
import { Button, Input } from '../../../components'
import { INDUSTRIES, searchSkills, getSkillsByIndustry } from '../../data/industries'
import type { SkillTag } from '../../data/industries'
import { PlusIcon, XIcon } from './icons'
import type { ProfileSkill, ProfileCert, Step2Data } from './types'
import styles from './Step2Section.module.css'

// ── Skill search input ────────────────────────────────────────────────────────

const SkillSearchInput: React.FC<{
  industryId: string
  selectedIds: Set<string>
  onAdd: (skill: SkillTag | null, customName?: string) => void
}> = ({ industryId, selectedIds, onAdd }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SkillTag[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    const res = searchSkills(query, industryId).filter((s) => !selectedIds.has(s.id))
    setResults(res)
    setOpen(res.length > 0)
  }, [query, industryId, selectedIds])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      if (results.length > 0) {
        onAdd(results[0])
      } else {
        onAdd(null, query.trim())
      }
      setQuery('')
      setOpen(false)
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <Input
        placeholder="Search or type a skill name, press Enter to add"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--kt-surface)',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-md)',
            boxShadow: 'var(--kt-shadow-md)',
            marginTop: 4,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {results.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => {
                onAdd(skill)
                setQuery('')
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--kt-surface-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {skill.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Industry skills card ───────────────────────────────────────────────────────

const emptyStep2 = (): Step2Data => ({ skills: [], certifications: [] })

const IndustrySkillsCard: React.FC<{
  industryId: string
  data: Step2Data
  onChange: (d: Step2Data) => void
  onRemoveIndustry: () => void
  isOnly: boolean
}> = ({ industryId, data, onChange, onRemoveIndustry, isOnly }) => {
  const ind = INDUSTRIES.find((i) => i.id === industryId)
  const allSkills = getSkillsByIndustry(industryId)
  const selectedIds = new Set(data.skills.map((s) => s.canonicalId).filter(Boolean) as string[])
  const suggestedChips = allSkills.filter((s) => !selectedIds.has(s.id)).slice(0, 5)

  const addSkill = (tag: SkillTag | null, customName?: string) => {
    if (tag && selectedIds.has(tag.id)) return
    const newSkill: ProfileSkill = tag
      ? {
          id: crypto.randomUUID(),
          name: tag.name,
          yearsExp: null,
          source: 'suggested',
          canonicalId: tag.id,
        }
      : { id: crypto.randomUUID(), name: customName ?? '', yearsExp: null, source: 'custom' }
    onChange({ ...data, skills: [...data.skills, newSkill] })
  }

  const removeSkill = (id: string) =>
    onChange({ ...data, skills: data.skills.filter((s) => s.id !== id) })

  const updateSkillYears = (id: string, val: string) => {
    const num = val === '' ? null : Math.max(0, Math.min(99, parseInt(val) || 0))
    onChange({
      ...data,
      skills: data.skills.map((s) => (s.id === id ? { ...s, yearsExp: num } : s)),
    })
  }

  const addCert = () =>
    onChange({
      ...data,
      certifications: [
        ...data.certifications,
        { id: crypto.randomUUID(), certName: '', issuingBody: '', earnedDate: '' },
      ],
    })
  const removeCert = (id: string) =>
    onChange({ ...data, certifications: data.certifications.filter((c) => c.id !== id) })
  const updateCert = (id: string, field: keyof ProfileCert, val: string) =>
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    })

  return (
    <div
      style={{
        border: '1px solid var(--kt-border)',
        borderRadius: 'var(--kt-radius-md)',
        background: 'var(--kt-surface)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--kt-surface-raised)',
          borderBottom: '1px solid var(--kt-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 'var(--kt-weight-semibold)',
            fontSize: 'var(--kt-text-md)',
            color: 'var(--kt-text)',
          }}
        >
          {ind?.name}
        </span>
        {!isOnly && (
          <button
            type="button"
            onClick={onRemoveIndustry}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-text-muted)',
              fontSize: 'var(--kt-text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <XIcon size={12} /> Remove
          </button>
        )}
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Skills */}
        <div>
          <h4
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Skills
          </h4>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              margin: '0 0 12px',
            }}
          >
            Add skills so employers can find you.
          </p>

          <SkillSearchInput industryId={industryId} selectedIds={selectedIds} onAdd={addSkill} />

          {suggestedChips.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  margin: '0 0 6px',
                }}
              >
                Suggested:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestedChips.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => addSkill(skill)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: 'var(--kt-radius-full)',
                      border: '1.5px solid var(--kt-border)',
                      background: 'var(--kt-surface)',
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text)',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--kt-accent)'
                      e.currentTarget.style.color = 'var(--kt-accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--kt-border)'
                      e.currentTarget.style.color = 'var(--kt-text)'
                    }}
                  >
                    + {skill.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-medium)',
                  color: 'var(--kt-text-muted)',
                  margin: '0 0 6px',
                }}
              >
                Your skills ({data.skills.length})
              </p>
              <div className={styles.skillsGrid}>
                {data.skills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 12px',
                      borderRadius: 'var(--kt-radius-md)',
                      border: '1px solid var(--kt-border)',
                      background: 'var(--kt-surface-raised)',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 'var(--kt-text-sm)',
                        color: 'var(--kt-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {skill.name}
                    </span>
                    <label
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        width: 44,
                      }}
                    >
                      Yrs exp
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      placeholder="—"
                      value={skill.yearsExp === null ? '' : skill.yearsExp}
                      onChange={(e) => updateSkillYears(skill.id, e.target.value)}
                      style={{
                        width: 48,
                        flexShrink: 0,
                        padding: '4px 8px',
                        borderRadius: 'var(--kt-radius-sm)',
                        border: '1px solid var(--kt-border)',
                        fontSize: 'var(--kt-text-sm)',
                        background: 'var(--kt-surface)',
                        color: 'var(--kt-text)',
                        fontFamily: 'var(--kt-font-sans)',
                        textAlign: 'center',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--kt-text-muted)',
                        padding: 4,
                        display: 'flex',
                        borderRadius: 'var(--kt-radius-sm)',
                      }}
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 12,
                padding: '16px 20px',
                borderRadius: 'var(--kt-radius-md)',
                background: 'var(--kt-surface-raised)',
                border: '1px dashed var(--kt-border)',
                textAlign: 'center',
              }}
            >
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                No skills added yet. Use the suggestions above or search for a skill.
              </p>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div>
          <h4
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Certifications
          </h4>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              margin: '0 0 12px',
            }}
          >
            Self-reported. Add the cert name, issuing body, and earned date.
          </p>
          {data.certifications.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <Button size="sm" variant="outline" onClick={addCert}>
                <PlusIcon /> Add certification
              </Button>
            </div>
          )}

          {data.certifications.length === 0 && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--kt-radius-md)',
                background: 'var(--kt-surface-raised)',
                border: '1px dashed var(--kt-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                textAlign: 'center',
              }}
            >
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                Got certifications? Add them here.
              </p>
              <Button size="sm" variant="outline" onClick={addCert}>
                <PlusIcon /> Add certification
              </Button>
            </div>
          )}

          {data.certifications.map((cert, idx) => {
            return (
              <div
                key={cert.id}
                style={{
                  padding: 14,
                  borderRadius: 'var(--kt-radius-md)',
                  border: '1px solid var(--kt-border)',
                  background: 'var(--kt-surface)',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                    Certification {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCert(cert.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--kt-text-muted)',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Input
                    label="Certification name"
                    value={cert.certName}
                    onChange={(e) => updateCert(cert.id, 'certName', e.target.value)}
                    placeholder="e.g. OSHA 30, CPR/AED"
                  />
                  <Input
                    label="Issuing body"
                    value={cert.issuingBody}
                    onChange={(e) => updateCert(cert.id, 'issuingBody', e.target.value)}
                    placeholder="e.g. OSHA, Red Cross"
                  />
                  <Input
                    label="Earned date"
                    type="date"
                    value={cert.earnedDate}
                    onChange={(e) => updateCert(cert.id, 'earnedDate', e.target.value)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Step 2 (outer: industry picker + cards) ───────────────────────────────────

export const Step2Section: React.FC<{
  workerIndustries: string[]
  allData: Record<string, Step2Data>
  onChange: (industryId: string, d: Step2Data) => void
  onAddIndustry: (id: string) => void
  onRemoveIndustry: (id: string) => void
}> = ({ workerIndustries, allData, onChange, onAddIndustry, onRemoveIndustry }) => {
  const [addDropOpen, setAddDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const available = INDUSTRIES.filter((i) => !workerIndustries.includes(i.id))

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setAddDropOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {workerIndustries.map((id) => (
        <IndustrySkillsCard
          key={id}
          industryId={id}
          data={allData[id] ?? emptyStep2()}
          onChange={(d) => onChange(id, d)}
          onRemoveIndustry={() => onRemoveIndustry(id)}
          isOnly={workerIndustries.length === 1}
        />
      ))}

      {available.length > 0 && (
        <div ref={dropRef} style={{ position: 'relative', alignSelf: 'center' }}>
          <Button size="sm" variant="ghost" onClick={() => setAddDropOpen((o) => !o)}>
            <PlusIcon /> Add another industry
          </Button>
          {addDropOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 100,
                marginTop: 6,
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                boxShadow: 'var(--kt-shadow-md)',
                minWidth: 180,
              }}
            >
              {available.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => {
                    onAddIndustry(ind.id)
                    setAddDropOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--kt-surface-raised)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
