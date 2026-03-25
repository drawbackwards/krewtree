import React from 'react'
import { Link } from 'react-router-dom'
import type { Notification } from '../../types'
import { ClipboardIcon, MessageIcon, RefreshIcon, BellIcon, StarIcon } from '../../icons'
import styles from './NotificationDrawer.module.css'

interface NotificationDrawerProps {
  notifications: Notification[]
  onMarkAllRead: () => void
  onNotificationClick: (id: string) => void
}

const TYPE_ICONS: Record<Notification['type'], React.ReactNode> = {
  application: <ClipboardIcon size={14} />,
  message: <MessageIcon size={14} />,
  status_change: <RefreshIcon size={14} />,
  job_alert: <BellIcon size={14} />,
  review: <StarIcon size={14} />,
}

function timeLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return '1 day ago'
  return `${daysAgo} days ago`
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
              <div className={[styles.iconWrap, styles[n.type]].join(' ')}>
                {TYPE_ICONS[n.type]}
              </div>
              <div className={styles.content}>
                <div className={styles.title}>{n.title}</div>
                <div className={styles.body}>{n.body}</div>
                <div className={styles.meta}>
                  <span className={styles.time}>{timeLabel(n.createdDaysAgo)}</span>
                  {!n.isRead && <span className={styles.unreadDot} aria-label="unread" />}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <Link to="/site/dashboard/worker" className={styles.viewAllLink}>
          View all activity
        </Link>
      </div>
    </div>
  )
}
