import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Spinner } from '../../components'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIFICATIONS_READ_EVENT,
} from '../services/notificationService'
import type { Notification } from '../types'

function timeLabel(createdAt: string): string {
  const then = new Date(createdAt).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  return new Date(createdAt).toLocaleDateString()
}

export const NotificationsPage: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getNotifications(100).then(({ data }) => {
      if (cancelled) return
      setItems(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const hasUnread = items.some((n) => !n.isRead)

  const handleItemClick = (id: string): void => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    markNotificationRead(id).then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
  }

  const handleMarkAll = (): void => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    markAllNotificationsRead().then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 'var(--kt-text-xl)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: 0,
          }}
        >
          Notifications
        </h1>
        {hasUnread && (
          <button
            onClick={handleMarkAll}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--kt-navy-500)',
              fontWeight: 'var(--kt-weight-bold)',
              fontSize: 'var(--kt-text-sm)',
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState message="No notifications yet." />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)',
            overflow: 'hidden',
            background: 'var(--kt-surface)',
          }}
        >
          {items.map((n, i) => (
            <Link
              key={n.id}
              to={n.link}
              onClick={() => handleItemClick(n.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                textDecoration: 'none',
                borderTop: i === 0 ? 'none' : '1px solid var(--kt-border)',
                background: n.isRead ? 'transparent' : 'var(--kt-bg-subtle)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  {n.title}
                </div>
                {n.body && (
                  <div
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {n.body}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    marginTop: 4,
                  }}
                >
                  {timeLabel(n.createdAt)}
                </div>
              </div>
              {!n.isRead && (
                <span
                  aria-label="unread"
                  style={{
                    flexShrink: 0,
                    width: 8,
                    height: 8,
                    borderRadius: 'var(--kt-radius-full)',
                    background: 'var(--kt-navy-500)',
                    marginTop: 6,
                  }}
                />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
