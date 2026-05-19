import React, { useEffect, useState } from 'react'
import type { ApplicationLogEvent } from '../../types'
import { getApplicationLog } from '../../services/pipelineService'
import styles from './LogTab.module.css'

interface LogTabProps {
  applicationId: string
}

export const LogTab: React.FC<LogTabProps> = ({ applicationId }) => {
  const [events, setEvents] = useState<ApplicationLogEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getApplicationLog(applicationId).then(({ data }) => {
      if (!cancelled) {
        setEvents(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [applicationId])

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (events.length === 0) {
    return <p className={styles.empty}>No events yet.</p>
  }

  return (
    <div className={styles.root}>
      {events.map((event) => (
        <div key={event.id} className={styles.row}>
          <div className={styles.rowMeta}>
            <RelativeTime iso={event.createdAt} />
            <span className={styles.actor}>{event.actor}</span>
          </div>
          <p className={styles.description}>{event.description}</p>
        </div>
      ))}
    </div>
  )
}

// ── RelativeTime ─────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const RelativeTime: React.FC<{ iso: string }> = ({ iso }) => (
  <time dateTime={iso} title={formatFull(iso)} className={styles.timestamp}>
    {formatRelative(iso)}
  </time>
)
