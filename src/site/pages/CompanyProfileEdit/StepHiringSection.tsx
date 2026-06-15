import React, { useRef, useState } from 'react'
import { Button, Input } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import { uploadCompanyPhoto } from '../../services/companyService'
import type { CompanyPhoto, StepHiringData } from './types'
import { MAX_PHOTOS } from './types'
import styles from './CompanyProfileEdit.module.css'

export const StepHiringSection: React.FC<{
  data: StepHiringData
  onChange: (d: StepHiringData) => void
}> = ({ data, onChange }) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const set = <K extends keyof StepHiringData>(key: K, val: StepHiringData[K]) =>
    onChange({ ...data, [key]: val })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (data.photos.length >= MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos.`)
      return
    }
    setUploadError('')
    setIsUploading(true)
    const { url, error } = await uploadCompanyPhoto(user.id, file, data.photos.length)
    setIsUploading(false)
    if (error || !url) {
      setUploadError(error ?? 'Upload failed')
      return
    }
    const newPhoto: CompanyPhoto = {
      id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
      url,
      caption: '',
    }
    set('photos', [...data.photos, newPhoto])
    e.target.value = ''
  }

  const updatePhotoCaption = (id: string, caption: string) =>
    set(
      'photos',
      data.photos.map((p) => (p.id === id ? { ...p, caption } : p))
    )

  const removePhoto = (id: string) =>
    set(
      'photos',
      data.photos.filter((p) => p.id !== id)
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Photos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Photos
          </h3>
          <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
            Up to {MAX_PHOTOS}. Show projects, crew, equipment — anything that helps workers picture
            the job.
          </p>
        </div>

        <div className={styles.photoGrid}>
          {data.photos.map((p) => (
            <div key={p.id} className={styles.photoCard}>
              <img src={p.url} alt={p.caption || 'Company photo'} className={styles.photoImg} />
              <Input
                value={p.caption}
                onChange={(e) => updatePhotoCaption(p.id, e.target.value)}
                placeholder="Caption (optional)"
                maxLength={100}
              />
              <Button size="sm" variant="ghost" onClick={() => removePhoto(p.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div>
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
            disabled={isUploading || data.photos.length >= MAX_PHOTOS}
          >
            {isUploading ? 'Uploading…' : '+ Add photo'}
          </Button>
          {uploadError && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-danger)',
              }}
            >
              {uploadError}
            </span>
          )}
          {!uploadError && data.photos.length >= MAX_PHOTOS && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
              }}
            >
              Maximum of {MAX_PHOTOS} reached.
            </span>
          )}
        </div>
      </div>

      {/* Social URLs */}
      <div>
        <h3
          style={{
            fontSize: 'var(--kt-text-md)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Social links
        </h3>
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 12px',
          }}
        >
          Optional. Empty fields are hidden on your public profile.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Facebook"
            type="url"
            value={data.facebookUrl}
            onChange={(e) => set('facebookUrl', e.target.value)}
            placeholder="https://facebook.com/yourcompany"
          />
          <Input
            label="Instagram"
            type="url"
            value={data.instagramUrl}
            onChange={(e) => set('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/yourcompany"
          />
          <Input
            label="LinkedIn"
            type="url"
            value={data.linkedinUrl}
            onChange={(e) => set('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/company/yourcompany"
          />
          <Input
            label="YouTube"
            type="url"
            value={data.youtubeUrl}
            onChange={(e) => set('youtubeUrl', e.target.value)}
            placeholder="https://youtube.com/@yourcompany"
          />
          <Input
            label="TikTok"
            type="url"
            value={data.tiktokUrl}
            onChange={(e) => set('tiktokUrl', e.target.value)}
            placeholder="https://tiktok.com/@yourcompany"
          />
        </div>
      </div>
    </div>
  )
}
