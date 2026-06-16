import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Modal } from '../../../components'
import styles from './ImageCropModal.module.css'

export interface ImageCropModalProps {
  open: boolean
  /** Source image to crop. The modal resets each time this changes. */
  file: File | null
  onCancel: () => void
  /** Receives the cropped square image, ready to upload. */
  onConfirm: (file: File) => void
  title?: string
  /** Output edge length in pixels (square). Default 512. */
  outputSize?: number
  /** Circular window (logos) vs. square (default). */
  shape?: 'circle' | 'square'
  /** True while the parent is uploading the confirmed crop. */
  busy?: boolean
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

type Offset = { x: number; y: number }

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  file,
  onCancel,
  onConfirm,
  title = 'Adjust image',
  outputSize = 512,
  shape = 'circle',
  busy = false,
}) => {
  const [src, setSrc] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const naturalRef = useRef({ w: 0, h: 0 })
  // Drag origin captured on pointer-down so moves are deltas, not absolutes.
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 })

  // Build (and tear down) an object URL for the incoming file.
  useEffect(() => {
    if (!file) {
      setSrc('')
      return
    }
    const url = URL.createObjectURL(file)
    setSrc(url)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Edge length of the square stage, in CSS pixels.
  const stageSize = (): number => stageRef.current?.clientWidth ?? 320

  // Scale that makes the image just cover the stage at zoom = 1.
  const baseScale = (): number => {
    const { w, h } = naturalRef.current
    if (!w || !h) return 1
    return stageSize() / Math.min(w, h)
  }

  // Keep the image covering the stage on every side.
  const clamp = useCallback((next: Offset, z: number): Offset => {
    const { w, h } = naturalRef.current
    const v = stageSize()
    const s = baseScale() * z
    const dispW = w * s
    const dispH = h * s
    const minX = Math.min(0, v - dispW)
    const minY = Math.min(0, v - dispH)
    return {
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onImageLoad = () => {
    const el = imgRef.current
    if (!el) return
    naturalRef.current = { w: el.naturalWidth, h: el.naturalHeight }
    // Center the image within the stage.
    const v = stageSize()
    const s = baseScale()
    setOffset(clamp({ x: (v - el.naturalWidth * s) / 2, y: (v - el.naturalHeight * s) / 2 }, 1))
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStart.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.px
    const dy = e.clientY - dragStart.current.py
    setOffset(clamp({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy }, zoom))
  }

  const endDrag = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDragging(false)
  }

  const handleZoom = (next: number) => {
    const v = stageSize()
    // Zoom about the stage center so the framed subject stays put.
    const sOld = baseScale() * zoom
    const sNew = baseScale() * next
    const cx = (v / 2 - offset.x) / sOld
    const cy = (v / 2 - offset.y) / sOld
    setZoom(next)
    setOffset(clamp({ x: v / 2 - cx * sNew, y: v / 2 - cy * sNew }, next))
  }

  const handleConfirm = () => {
    const el = imgRef.current
    if (!el) return
    const s = baseScale() * zoom
    const v = stageSize()
    // Map the visible stage back into natural-image coordinates.
    const sx = -offset.x / s
    const sy = -offset.y / s
    const sw = v / s
    const sh = v / s

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(el, sx, sy, sw, sh, 0, 0, outputSize, outputSize)

    const type =
      file?.type === 'image/png' || file?.type === 'image/webp' ? file.type : 'image/jpeg'
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const base = (file?.name ?? 'image').replace(/\.[^.]+$/, '')
        onConfirm(new File([blob], `${base}.${ext}`, { type }))
      },
      type,
      0.92
    )
  }

  const s = baseScale() * zoom
  const imgStyle: React.CSSProperties = {
    width: naturalRef.current.w * s,
    height: naturalRef.current.h * s,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      size="sm"
      title={title}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={busy || !src}>
            {busy ? 'Saving…' : 'Save image'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          ref={stageRef}
          className={`${styles.stage} ${dragging ? styles.stageDragging : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              className={styles.image}
              style={imgStyle}
              onLoad={onImageLoad}
              draggable={false}
            />
          )}
          <div className={shape === 'circle' ? styles.maskCircle : styles.maskSquare} />
        </div>

        <div className={styles.controls}>
          <div className={styles.zoomRow}>
            <span className={styles.zoomLabel}>Zoom</span>
            <input
              type="range"
              className={styles.slider}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(Number(e.target.value))}
            />
          </div>
          <p className={styles.hint}>Drag to reposition · slide to zoom</p>
        </div>
      </div>
    </Modal>
  )
}
