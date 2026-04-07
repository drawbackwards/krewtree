import React, { useState, useRef } from 'react'
import { Button, Input, Textarea, Select, Checkbox } from '../../../components'
import { INDUSTRIES } from '../../data/industries'
import {
  PlusIcon,
  XIcon,
  CheckCircleIcon,
  UploadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  SparkleIcon,
} from './icons'
import type { WorkEntry, Step3Data } from './types'
import { uploadWorkerResume } from '../../services/workerService'
import styles from './Step3Section.module.css'

// ── Collapsible work entry card ───────────────────────────────────────────────

const WorkEntryCard: React.FC<{
  entry: WorkEntry
  isExpanded: boolean
  onToggle: () => void
  onRemove: () => void
  onChange: (field: keyof WorkEntry, val: unknown) => void
  workerIndustries: string[]
}> = ({ entry, isExpanded, onToggle, onRemove, onChange, workerIndustries }) => {
  const formatMonthDate = (d: string) => {
    if (!d) return ''
    const [y, m] = d.split('-')
    const month = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' })
    return `${month} ${y}`
  }

  const industryOptions = INDUSTRIES.filter((i) => workerIndustries.includes(i.id)).map((i) => ({
    label: i.name,
    value: i.id,
  }))

  if (!isExpanded) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--kt-radius-md)',
          border: '1px solid var(--kt-border)',
          background: 'var(--kt-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          cursor: 'pointer',
          gap: 8,
        }}
        onClick={onToggle}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              color: 'var(--kt-text)',
            }}
          >
            {entry.employerName || 'Untitled position'}
          </p>
          {entry.roleTitle && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
              }}
            >
              {entry.roleTitle}
            </p>
          )}
          {(entry.startDate || entry.isCurrent) && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
              }}
            >
              {formatMonthDate(entry.startDate)} —{' '}
              {entry.isCurrent ? 'Present' : formatMonthDate(entry.endDate)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
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
          <ChevronDownIcon />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 'var(--kt-radius-md)',
        border: '1px solid var(--kt-border)',
        background: 'var(--kt-surface)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--kt-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-medium)',
            color: 'var(--kt-text)',
          }}
        >
          {entry.employerName || 'New position'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
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
          <ChevronUpIcon />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div className={styles.workEntryGrid}>
          <Input
            label="Employer name"
            value={entry.employerName}
            onChange={(e) => onChange('employerName', e.target.value)}
            placeholder="Company or client name"
          />
          <Input
            label="Role title"
            value={entry.roleTitle}
            onChange={(e) => onChange('roleTitle', e.target.value)}
            placeholder="Your job title"
          />
          <Input
            label="Start date"
            type="month"
            value={entry.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
          <div>
            <Input
              label="End date"
              type="month"
              value={entry.endDate}
              onChange={(e) => onChange('endDate', e.target.value)}
              disabled={entry.isCurrent}
            />
            <div style={{ marginTop: 6 }}>
              <Checkbox
                label="Currently working here"
                checked={entry.isCurrent}
                onChange={(e) => onChange('isCurrent', e.target.checked)}
              />
            </div>
          </div>
          <Select
            label="Contract type"
            value={entry.contractType}
            onChange={(e) => onChange('contractType', e.target.value)}
            options={[
              { label: 'Day rate', value: 'day_rate' },
              { label: 'Project-based', value: 'project' },
              { label: 'Long-term temp', value: 'long_term_temp' },
            ]}
            placeholder="Select type"
          />
          <Select
            label="Industry"
            value={entry.industryId}
            onChange={(e) => onChange('industryId', e.target.value)}
            options={industryOptions}
            placeholder="Select industry"
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Project description"
              value={entry.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Describe the work, scope, and key accomplishments (max 2000 characters)"
              rows={3}
            />
            <p
              style={{
                textAlign: 'right',
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                margin: '3px 0 0',
              }}
            >
              {entry.description.length} / 2000
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mock resume entries (placeholder for AI resume parse) ─────────────────────

const MOCK_RESUME_ENTRIES: WorkEntry[] = [
  {
    id: 'resume-1',
    employerName: 'Harmon General Contracting',
    roleTitle: 'Lead Framing Carpenter',
    startDate: '2022-03',
    endDate: '2024-11',
    isCurrent: false,
    contractType: 'long_term_temp',
    industryId: 'construction',
    description:
      'Led framing crew on 12-unit townhome and commercial remodel projects. Responsible for blueprint interpretation and daily crew coordination.',
  },
  {
    id: 'resume-2',
    employerName: 'BlueLine Construction',
    roleTitle: 'Journeyman Carpenter',
    startDate: '2020-06',
    endDate: '2022-02',
    isCurrent: false,
    contractType: 'project',
    industryId: 'construction',
    description:
      'Installed finish carpentry, cabinetry, and trim work on residential builds. Completed OSHA 30 during this period.',
  },
]

// ── Step 3: Work History ───────────────────────────────────────────────────────

export const Step3Section: React.FC<{
  data: Step3Data
  workerIndustries: string[]
  userId: string | null
  onChange: (d: Step3Data) => void
}> = ({ data, workerIndustries, userId, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleResumeUpload = async (file: File) => {
    setResumeFile(file.name)
    setAnalyzing(true)
    setAnalyzed(false)
    setUploadError(null)

    if (userId) {
      const { error } = await uploadWorkerResume(userId, file)
      if (error) setUploadError(error)
    }

    // Simulate AI analysis delay then prefill mock work history entries
    setTimeout(() => {
      setAnalyzing(false)
      setAnalyzed(true)
      const newEntries = MOCK_RESUME_ENTRIES.map((e) => ({ ...e, id: crypto.randomUUID() }))
      onChange({ ...data, workHistory: [...newEntries, ...data.workHistory] })
      setExpandedId(null)
    }, 2200)
  }

  const addEntry = () => {
    const newId = crypto.randomUUID()
    onChange({
      ...data,
      workHistory: [
        {
          id: newId,
          employerName: '',
          roleTitle: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          contractType: '',
          industryId: workerIndustries[0] ?? '',
          description: '',
        },
        ...data.workHistory,
      ],
    })
    setExpandedId(newId)
  }

  const removeEntry = (id: string) => {
    onChange({ ...data, workHistory: data.workHistory.filter((e) => e.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  const updateEntry = (id: string, field: keyof WorkEntry, val: unknown) =>
    onChange({
      ...data,
      workHistory: data.workHistory.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Resume upload */}
      <div
        style={{
          padding: 20,
          borderRadius: 'var(--kt-radius-md)',
          border: '1px solid var(--kt-border)',
          background: 'var(--kt-surface)',
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              margin: 0,
            }}
          >
            Resume
          </h3>
        </div>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 12px',
          }}
        >
          Upload your resume and AI will analyze it to prefill your work history.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) handleResumeUpload(f)
          }}
        />

        {!resumeFile && (
          <div
            style={{
              border: '1.5px dashed var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              padding: '20px',
              textAlign: 'center',
              background: 'var(--kt-surface-raised)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleResumeUpload(f)
            }}
          >
            <div
              style={{ color: 'var(--kt-text-muted)', display: 'flex', justifyContent: 'center' }}
            >
              <UploadIcon size={20} />
            </div>
            <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
              Drag your resume here or click to browse · PDF, DOC, DOCX
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <UploadIcon size={14} /> Upload resume
            </Button>
          </div>
        )}

        {resumeFile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 'var(--kt-radius-md)',
              border: '1px solid var(--kt-border)',
              background: 'var(--kt-surface-raised)',
            }}
          >
            <FileTextIcon />
            <span style={{ flex: 1, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
              {resumeFile}
            </span>
            {analyzing && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-accent)',
                }}
              >
                <SparkleIcon /> Analyzing with AI…
              </span>
            )}
            {analyzed && !uploadError && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-success)',
                }}
              >
                <CheckCircleIcon color="var(--kt-success)" /> Work history prefilled
              </span>
            )}
            {uploadError && (
              <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-danger)' }}>
                {uploadError}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setResumeFile(null)
                setAnalyzed(false)
              }}
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
        )}
      </div>

      {/* Work History */}
      <div>
        <h3
          style={{
            fontSize: 'var(--kt-text-md)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Work History
        </h3>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 12px',
          }}
        >
          New to the industry? No problem — add experience as you go, or skip this step.
        </p>
        {data.workHistory.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Button size="sm" variant="outline" onClick={addEntry}>
              <PlusIcon /> Add experience
            </Button>
          </div>
        )}

        {data.workHistory.length === 0 && (
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
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
              No work history added yet. Upload your resume above or add experience manually.
            </p>
            <Button size="sm" variant="outline" onClick={addEntry}>
              <PlusIcon /> Add experience
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.workHistory.map((entry) => (
            <WorkEntryCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => setExpandedId((prev) => (prev === entry.id ? null : entry.id))}
              onRemove={() => removeEntry(entry.id)}
              onChange={(field, val) => updateEntry(entry.id, field, val)}
              workerIndustries={workerIndustries}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
