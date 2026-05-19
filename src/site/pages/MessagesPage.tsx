import React, { useCallback, useEffect, useState } from 'react'
import {
  getWorkerMessages,
  markMessageRead,
  type WorkerInboxMessage,
} from '../services/pipelineService'
import styles from './MessagesPage.module.css'

function formatRelativeTime(iso: string): string {
  const sent = new Date(iso).getTime()
  const diffMs = Date.now() - sent
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<WorkerInboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getWorkerMessages()
    setMessages(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleOpen(msg: WorkerInboxMessage) {
    const willOpen = openId !== msg.id
    setOpenId(willOpen ? msg.id : null)
    if (willOpen && !msg.readAt) {
      const now = new Date().toISOString()
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, readAt: now } : m)))
      await markMessageRead(msg.id)
    }
  }

  const unreadCount = messages.filter((m) => !m.readAt).length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
        {!loading && messages.length > 0 && (
          <span className={styles.unreadCount}>
            {unreadCount > 0
              ? `${unreadCount} unread of ${messages.length}`
              : `${messages.length} message${messages.length === 1 ? '' : 's'}`}
          </span>
        )}
      </header>

      {loading ? null : messages.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No messages yet</p>
          <p className={styles.emptyHint}>
            When a company reaches out about an application, you’ll see it here.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {messages.map((msg) => {
            const unread = !msg.readAt
            const isOpen = openId === msg.id
            return (
              <li key={msg.id} className={`${styles.row} ${unread ? styles.rowUnread : ''}`}>
                <button
                  type="button"
                  className={styles.rowHeader}
                  onClick={() => handleOpen(msg)}
                  aria-expanded={isOpen}
                >
                  {msg.companyLogo ? (
                    <img src={msg.companyLogo} alt="" className={styles.logo} aria-hidden="true" />
                  ) : (
                    <span className={styles.logo} aria-hidden="true">
                      {initials(msg.companyName)}
                    </span>
                  )}
                  <div className={styles.center}>
                    <div className={styles.fromLine}>
                      <span className={styles.fromCompany}>{msg.companyName}</span>
                      <span>· {msg.jobTitle}</span>
                    </div>
                    <div className={`${styles.subjectLine} ${unread ? styles.subjectUnread : ''}`}>
                      {unread && <span className={styles.unreadDot} aria-hidden="true" />}
                      {msg.subject}
                    </div>
                    {!isOpen && (
                      <div className={styles.preview}>
                        {msg.body.replace(/\s+/g, ' ').slice(0, 110)}
                      </div>
                    )}
                  </div>
                  <div className={styles.right}>
                    <span className={styles.sentTime}>{formatRelativeTime(msg.sentAt)}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className={styles.body}>
                    <div className={styles.bodyMeta}>
                      Sent {new Date(msg.sentAt).toLocaleString()}
                    </div>
                    {msg.body}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
