import React, { useRef, useState } from 'react'
import { Button, Input } from '../../../components'
import type { Step1Data } from './types'
import { useAuth } from '../../context/AuthContext'
import { uploadWorkerAvatar, updateWorkerAvatarUrl } from '../../services/workerService'
import { CheckCircleIcon } from '../../icons'
import styles from './Step1Section.module.css'

export const Step1Section: React.FC<{ data: Step1Data; onChange: (d: Step1Data) => void }> = ({
  data,
  onChange,
}) => {
  const set = (field: keyof Step1Data, val: string) => onChange({ ...data, [field]: val })
  const { user, isEmailVerified, resendVerificationEmail, updateEmail } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // ── Email change state ──────────────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState(user?.email ?? '')
  const emailChanged = emailInput.trim() !== (user?.email ?? '')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleUpdateEmail = async () => {
    if (!emailInput.trim() || !emailChanged) return
    setEmailStatus('sending')
    setEmailError('')
    const { error } = await updateEmail(emailInput.trim())
    if (error) {
      setEmailStatus('error')
      setEmailError(error)
      return
    }
    setEmailStatus('sent')
  }

  const handleResend = async () => {
    setResendStatus('sending')
    const { error } = await resendVerificationEmail()
    setResendStatus(error ? 'error' : 'sent')
  }

  const metaFirst: string = user?.user_metadata?.first_name ?? ''
  const metaLast: string = user?.user_metadata?.last_name ?? ''
  const initials = data.firstName
    ? `${data.firstName[0]}${data.lastName?.[0] ?? ''}`.toUpperCase()
    : metaFirst
      ? `${metaFirst[0]}${metaLast[0] ?? ''}`.toUpperCase()
      : ''

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadError('')
    setIsUploading(true)
    const { url, error } = await uploadWorkerAvatar(user.id, file)
    if (error || !url) {
      setUploadError(error ?? 'Upload failed')
      setIsUploading(false)
      return
    }
    const { error: dbError } = await updateWorkerAvatarUrl(user.id, url)
    setIsUploading(false)
    if (dbError) {
      setUploadError(dbError)
      return
    }
    onChange({ ...data, avatarUrl: url })
    // Reset so the same file can be re-selected if needed
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile photo */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-medium)',
            color: 'var(--kt-text)',
            marginBottom: 10,
          }}
        >
          Profile Photo
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--kt-primary)',
              color: 'var(--kt-primary-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials || '?'
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Upload photo'}
            </Button>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
              JPG, PNG, or WebP · Max 5 MB
            </p>
            {uploadError && (
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-danger)', margin: 0 }}>
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.formGrid}>
        <Input
          label="First name"
          value={data.firstName}
          onChange={(e) => set('firstName', e.target.value)}
          placeholder="First"
          required
        />
        <Input
          label="Last name"
          value={data.lastName}
          onChange={(e) => set('lastName', e.target.value)}
          placeholder="Last"
          required
        />
        {/* Email — editable, has its own update + verify flow */}
        <div>
          {/* Label row: "Email" on left, verify status on right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <label
              htmlFor="input-email"
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-medium)',
                color: 'var(--kt-text)',
              }}
            >
              Email
            </label>

            {/* Verified */}
            {!emailChanged && isEmailVerified && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-success)',
                }}
              >
                <CheckCircleIcon size={12} color="var(--kt-success)" /> Verified
              </span>
            )}

            {/* Not verified — resend link */}
            {!emailChanged && !isEmailVerified && emailStatus === 'idle' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-warning)' }}>
                  Not verified.
                </span>
                {resendStatus === 'sent' ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-success)',
                    }}
                  >
                    <CheckCircleIcon size={12} color="var(--kt-success)" /> Sent
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === 'sending'}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-accent)',
                      cursor: resendStatus === 'sending' ? 'default' : 'pointer',
                      textDecoration: 'underline',
                      fontFamily: 'var(--kt-font-sans)',
                    }}
                  >
                    {resendStatus === 'sending' ? 'Sending…' : 'Resend verification →'}
                  </button>
                )}
              </span>
            )}
          </div>

          <Input
            id="input-email"
            type="email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value)
              setEmailStatus('idle')
            }}
          />

          {/* Update button + feedback when email has changed */}
          {emailChanged && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpdateEmail}
                disabled={emailStatus === 'sending'}
              >
                {emailStatus === 'sending' ? 'Sending…' : 'Update email'}
              </Button>
              {emailStatus === 'sent' && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-success)',
                  }}
                >
                  <CheckCircleIcon size={12} color="var(--kt-success)" />
                  Check your inbox to confirm
                </span>
              )}
              {emailStatus === 'error' && (
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-danger)' }}>
                  {emailError}
                </span>
              )}
            </div>
          )}
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <label
              htmlFor="input-phone"
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-medium)',
                color: 'var(--kt-text)',
              }}
            >
              Phone
            </label>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-accent)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                textDecoration: 'none',
              }}
            >
              Verify number →
            </button>
          </div>
          <Input
            id="input-phone"
            type="tel"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. (555) 000-0000"
          />
        </div>
        <Input
          label="City"
          value={data.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="e.g. Denver"
        />
        <Input
          label="State / Region"
          value={data.region}
          onChange={(e) => set('region', e.target.value)}
          placeholder="e.g. CO"
        />
      </div>
    </div>
  )
}
