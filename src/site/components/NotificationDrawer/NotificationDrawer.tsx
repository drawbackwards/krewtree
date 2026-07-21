import React from 'react'
import { Link } from 'react-router-dom'
import type { Notification } from '../../types'
import styles from './NotificationDrawer.module.css'

interface NotificationDrawerProps {
  notifications: Notification[]
  onMarkAllRead: () => void
  onNotificationClick: (id: string) => void
}

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

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  onMarkAllRead,
  onNotificationClick,
}) => {
  const hasUnread = notifications.some((n) => !n.isRead)

  return (
    <div className={styles.drawer} role="dialog" aria-label="Notifications">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Notifications</span>
        {hasUnread && (
          <button className={styles.markAllBtn} onClick={onMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              to={n.link}
              className={[styles.item, !n.isRead ? styles.unread : ''].filter(Boolean).join(' ')}
              onClick={() => onNotificationClick(n.id)}
            >
              <div className={styles.content}>
                <div className={styles.title}>{n.title}</div>
                <div className={styles.body}>{n.body}</div>
                <div className={styles.meta}>
                  <span className={styles.time}>{timeLabel(n.createdAt)}</span>
                  {!n.isRead && <span className={styles.unreadDot} aria-label="unread" />}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <Link to="/site/notifications" className={styles.viewAllLink}>
          View all
        </Link>
      </div>
    </div>
  )
}
