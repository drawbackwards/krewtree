import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Textarea, Select, Button, Badge, Alert, Switch, Divider } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { industries } from '../data/mock'

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div style={{
    background: 'var(--kt-surface)',
    border: '1px solid var(--kt-border)',
    borderRadius: 'var(--kt-radius-lg)',
    padding: 28,
  }}>
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 'var(--kt-text-md)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 4 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>{subtitle}</p>
      )}
    </div>
    {children}
  </div>
)

const FieldRow = ({ children, columns = 2 }: { children: React.ReactNode; columns?: number }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
    {children}
  </div>
)

const payTypeOptions = [
  { value: 'hour', label: 'Per Hour' },
  { value: 'salary', label: 'Annual Salary' },
]

const typeOptions = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Temporary', label: 'Temporary' },
]

const experienceOptions = [
  { value: 'entry', label: 'Entry Level (0–1 yr)' },
  { value: 'mid', label: 'Mid Level (1–3 yrs)' },
  { value: 'senior', label: 'Senior (3–5 yrs)' },
  { value: 'lead', label: 'Lead / Expert (5+ yrs)' },
]

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [location, setLocation] = useState('')
  const [payMin, setPayMin] = useState('')
  const [payMax, setPayMax] = useState('')
  const [payType, setPayType] = useState('hour')
  const [experience, setExperience] = useState('mid')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [parsedSkills, setParsedSkills] = useState<string[]>([])
  const [isSponsored, setIsSponsored] = useState(false)
  const [regulixPreferred, setRegulixPreferred] = useState(false)
  const [questions, setQuestions] = useState<string[]>(['', '', ''])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !parsedSkills.includes(s)) {
      setParsedSkills(prev => [...prev, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s: string) => setParsedSkills(prev => prev.filter(x => x !== s))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Job title is required'
    if (!industry) e.industry = 'Industry is required'
    if (!location.trim()) e.location = 'Location is required'
    if (!payMin || !payMax) e.pay = 'Pay range is required'
    if (payMin && payMax && Number(payMin) >= Number(payMax)) e.pay = 'Pay min must be less than pay max'
    if (!description.trim()) e.description = 'Job description is required'
    if (!requirements.trim()) e.requirements = 'Requirements are required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
    setTimeout(() => navigate('/site/dashboard/company'), 2500)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px var(--kt-space-6)' }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <h1 style={{ fontSize: 'var(--kt-text-2xl)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-text)', textAlign: 'center' }}>
          Job Posted Successfully!
        </h1>
        <p style={{ fontSize: 'var(--kt-text-md)', color: 'var(--kt-text-muted)', textAlign: 'center', maxWidth: 400 }}>
          Your job listing is now live. Redirecting you to your dashboard…
        </p>
        {regulixPreferred && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RegulixBadge pulse />
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-olive-700)', fontWeight: 'var(--kt-weight-medium)' }}>
              Regulix Preferred — your listing is boosted to hire-ready candidates
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>

      {/* Page Header */}
      <div style={{ background: 'var(--kt-surface)', padding: '36px var(--kt-space-6) 28px', borderBottom: '1px solid var(--kt-border)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'var(--kt-text-2xl)', fontWeight: 'var(--kt-weight-display)', color: 'var(--kt-text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Post a Job
          </h1>
          <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            Fill in the details below to publish your job listing to thousands of qualified workers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px var(--kt-space-6)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">
              Please fix the errors below before submitting.
            </Alert>
          )}

          {/* Basic Info */}
          <Section title="Basic Information" subtitle="Tell workers what the role is and where it's located.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Job Title"
                placeholder="e.g. Framing Carpenter, CNA, CDL-A Driver…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={errors.title}
                required
              />
              <FieldRow>
                <Select
                  label="Industry"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  error={errors.industry}
                  required
                  options={[{ value: '', label: 'Select an industry…' }, ...industries.map(i => ({ value: i.slug, label: i.name }))]}
                />
                <Select
                  label="Job Type"
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                  options={typeOptions}
                />
              </FieldRow>
              <FieldRow>
                <Input
                  label="Location"
                  placeholder="e.g. Phoenix, AZ"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  error={errors.location}
                  required
                />
                <Select
                  label="Experience Level"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  options={experienceOptions}
                />
              </FieldRow>
            </div>
          </Section>

          {/* Compensation */}
          <Section title="Compensation" subtitle="Set a competitive pay range to attract qualified candidates.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Select
                label="Pay Type"
                value={payType}
                onChange={e => setPayType(e.target.value)}
                options={payTypeOptions}
              />
              <FieldRow>
                <Input
                  label={`Minimum Pay (${payType === 'hour' ? '$/hr' : 'K/yr'})`}
                  type="number"
                  placeholder={payType === 'hour' ? '18' : '35'}
                  value={payMin}
                  onChange={e => setPayMin(e.target.value)}
                  error={errors.pay}
                />
                <Input
                  label={`Maximum Pay (${payType === 'hour' ? '$/hr' : 'K/yr'})`}
                  type="number"
                  placeholder={payType === 'hour' ? '26' : '50'}
                  value={payMax}
                  onChange={e => setPayMax(e.target.value)}
                />
              </FieldRow>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                💡 Jobs with a posted pay range receive 3× more applications on average.
              </p>
            </div>
          </Section>

          {/* Description */}
          <Section title="Job Description" subtitle="Describe the role, day-to-day responsibilities, and work environment.">
            <Textarea
              label="Description"
              placeholder="This role involves… Workers will be responsible for… The ideal candidate…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              error={errors.description}
              rows={6}
              maxChars={1500}
              required
            />
          </Section>

          {/* Requirements */}
          <Section title="Requirements" subtitle="List the qualifications, certifications, and experience needed.">
            <Textarea
              label="Requirements"
              placeholder="• 3+ years experience&#10;• OSHA 10 certification preferred&#10;• Valid driver's license…"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              error={errors.requirements}
              rows={5}
              maxChars={1000}
              required
              helperText="Enter each requirement on a new line for best formatting."
            />
          </Section>

          {/* Skills */}
          <Section title="Required Skills" subtitle="Tag the skills workers need. These help match your job to the right candidates.">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <Input
                placeholder="Add a skill (e.g. Framing, CPR/BLS, CDL-A)…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                style={{ flex: 1 }}
              />
              <Button type="button" variant="outline" size="md" onClick={addSkill}>Add</Button>
            </div>
            {parsedSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {parsedSkills.map(s => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px 4px 12px',
                      background: 'var(--kt-primary-subtle)', color: 'var(--kt-primary)',
                      borderRadius: 'var(--kt-radius-full)', fontSize: 'var(--kt-text-xs)',
                      fontWeight: 'var(--kt-weight-medium)',
                      border: '1px solid var(--kt-primary-subtle)',
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kt-primary)', fontSize: 14, padding: 0, lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            {parsedSkills.length === 0 && (
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>No skills added yet. Type a skill and press Enter or click Add.</p>
            )}
          </Section>

          {/* Pre-Interview Questions */}
          <Section title="Pre-Interview Questions" subtitle="Optional screening questions applicants will answer when they apply.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map((q, i) => (
                <Input
                  key={i}
                  label={`Question ${i + 1}${i === 0 ? '' : ' (optional)'}`}
                  placeholder={
                    i === 0 ? 'e.g. Do you have a valid driver\'s license?' :
                    i === 1 ? 'e.g. Are you available to start immediately?' :
                    'e.g. Do you have the required certification?'
                  }
                  value={q}
                  onChange={e => {
                    const next = [...questions]
                    next[i] = e.target.value
                    setQuestions(next)
                  }}
                />
              ))}
            </div>
          </Section>

          {/* Listing Options */}
          <Section title="Listing Options" subtitle="Boost your listing's visibility and attract hire-ready candidates.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Regulix Preferred */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                padding: '16px 18px',
                background: regulixPreferred ? 'linear-gradient(135deg, #f0f4e8, #e8eedb)' : 'var(--kt-bg)',
                border: `1px solid ${regulixPreferred ? 'var(--kt-olive-300)' : 'var(--kt-border)'}`,
                borderRadius: 'var(--kt-radius-md)',
                transition: 'all var(--kt-duration-fast)',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <RegulixBadge size="md" pulse={regulixPreferred} />
                  <div>
                    <p style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', fontSize: 'var(--kt-text-sm)', marginBottom: 4 }}>
                      Regulix Preferred
                    </p>
                    <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', lineHeight: 1.5 }}>
                      Mark this job as preferring Regulix Ready candidates. Your listing will be boosted to workers with completed W-4, I-9, direct deposit, and background check.
                    </p>
                    {regulixPreferred && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {['W-4 Done', 'I-9 Verified', 'Direct Deposit', 'Background Check'].map(tag => (
                          <span key={tag} style={{
                            fontSize: 'var(--kt-text-xs)', padding: '2px 8px',
                            background: 'var(--kt-olive-100)', color: 'var(--kt-olive-800)',
                            borderRadius: 'var(--kt-radius-full)', fontWeight: 'var(--kt-weight-medium)',
                          }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={regulixPreferred}
                  onChange={e => setRegulixPreferred(e.target.checked)}
                  size="md"
                />
              </div>

              <Divider />

              {/* Featured / Sponsored */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                padding: '16px 18px',
                background: isSponsored ? 'var(--kt-primary-subtle)' : 'var(--kt-bg)',
                border: `1px solid ${isSponsored ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                borderRadius: 'var(--kt-radius-md)',
                transition: 'all var(--kt-duration-fast)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', fontSize: 'var(--kt-text-sm)' }}>
                      Featured / Sponsored Listing
                    </p>
                    {isSponsored && <Badge variant="accent" size="sm">⭐ Active</Badge>}
                  </div>
                  <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', lineHeight: 1.5 }}>
                    Pin your job to the top of search results and add an eye-catching "Featured" banner. Sponsored jobs get 5× more views.
                  </p>
                </div>
                <Switch
                  checked={isSponsored}
                  onChange={e => setIsSponsored(e.target.checked)}
                  size="md"
                />
              </div>
            </div>
          </Section>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 40 }}>
            <Button type="button" variant="ghost" size="lg" onClick={() => navigate('/site/dashboard/company')}>
              Cancel
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => {}}>
              Save Draft
            </Button>
            <Button type="submit" variant="primary" size="lg">
              Publish Job
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
