import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getThreadMessages,
  sendMessage,
  markThreadRead,
  MESSAGES_READ_EVENT,
  type ThreadMessage,
} from '../../services/messageService'
import { ChevronDownIcon, CloseIcon, EnvelopeIcon } from '../../icons'
import { ComposerMenu } from '../ComposerMenu/ComposerMenu'
import { useChatPane } from './ChatPaneContext'
import styles from './ChatPane.module.css'

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Docked direct-message chat, bottom-right (LinkedIn-style). Renders only
 * while a target worker is set via useChatPane().openChat() — company
 * persona only, since direct threads are opened from company-side pages.
 */
export const ChatPane: React.FC = () => {
  const { user, persona } = useAuth()
  const { target, minimized, closeChat, toggleMinimized } = useChatPane()
  const navigate = useNavigate()

  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const companyId = user?.id ?? null
  const workerId = target?.workerId ?? null

  // Load the thread whenever the target changes, and mark incoming
  // messages read so the nav badge clears.
  useEffect(() => {
    if (!companyId || !workerId) {
      setThread([])
      setDraft('')
      setSendError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    getThreadMessages(companyId, workerId).then(({ data }) => {
      if (cancelled) return
      setThread(data)
      setLoading(false)
      const hasUnreadIncoming = data.some((m) => !m.readAt && m.senderRole === 'worker')
      if (hasUnreadIncoming) {
        markThreadRead(companyId, workerId).then(() => {
          window.dispatchEvent(new Event(MESSAGES_READ_EVENT))
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [companyId, workerId])

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread, minimized])

  if (!target || !companyId || persona !== 'company') return null

  async function handleSend(): Promise<void> {
    if (!companyId || !workerId || sending) return
    const body = draft.trim()
    if (!body) return

    setSending(true)
    setSendError(null)
    const { data, error } = await sendMessage(companyId, workerId, body)
    setSending(false)

    if (error || !data) {
      setSendError('Message failed to send. Please try again.')
      return
    }
    setThread((prev) => [...prev, data])
    setDraft('')
    composerRef.current?.focus()
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInsertTemplate(text: string): void {
    setDraft((prev) => (prev.trim() ? `${prev}\n\n${text}` : text))
    composerRef.current?.focus()
  }

  function handleOpenInbox(): void {
    closeChat()
    navigate(`/site/messages?dm=${target!.workerId}`)
  }

  return (
    <section
      className={`${styles.pane} ${minimized ? styles.paneMinimized : ''}`}
      aria-label={`Chat with ${target.name}`}
    >
      <header className={styles.header}>
        <button
          type="button"
          className={styles.headerIdentity}
          onClick={toggleMinimized}
          aria-expanded={!minimized}
          aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
        >
          {target.avatarUrl ? (
            <img src={target.avatarUrl} alt="" className={styles.avatar} aria-hidden="true" />
          ) : (
            <span className={styles.avatar} aria-hidden="true">
              {initials(target.name)}
            </span>
          )}
          <span className={styles.headerName}>{target.name}</span>
        </button>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={handleOpenInbox}
            aria-label="Open in Messages"
            title="Open in Messages"
          >
            <EnvelopeIcon size={14} />
          </button>
          <button
            type="button"
            className={`${styles.headerBtn} ${minimized ? styles.headerBtnFlipped : ''}`}
            onClick={toggleMinimized}
            aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
          >
            <ChevronDownIcon size={14} />
          </button>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={closeChat}
            aria-label="Close chat"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      </header>

      {!minimized && (
        <>
          <div className={styles.scroll} ref={scrollRef}>
            {loading ? null : thread.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>Start a conversation with {target.name}.</p>
              </div>
            ) : (
              thread.map((msg, i) => {
                const prev = thread[i - 1]
                const mine = msg.senderRole === 'company'
                const newDay =
                  !prev ||
                  new Date(prev.sentAt).toDateString() !== new Date(msg.sentAt).toDateString()
                return (
                  <React.Fragment key={msg.id}>
                    {newDay && (
                      <div className={styles.dayDivider}>{formatDayLabel(msg.sentAt)}</div>
                    )}
                    <div className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ''}`}>
                      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
                        <div className={styles.bubbleBody}>{msg.body}</div>
                        <div
                          className={`${styles.bubbleTime} ${mine ? styles.bubbleTimeMine : ''}`}
                        >
                          {msg.applicationId && msg.jobTitle && (
                            <>
                              <Link
                                to={`/site/jobs/${msg.jobId}`}
                                className={styles.bubbleTimeLink}
                              >
                                Re: {msg.jobTitle}
                              </Link>
                              {' · '}
                            </>
                          )}
                          {formatClockTime(msg.sentAt)}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })
            )}
          </div>

          <footer className={styles.composer}>
            {sendError && (
              <div className={styles.sendError} role="alert">
                {sendError}
              </div>
            )}
            <div className={styles.composerRow}>
              <textarea
                ref={composerRef}
                className={styles.composerInput}
                placeholder={`Message ${target.name}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                rows={1}
                maxLength={10000}
                disabled={sending}
                aria-label="Message text"
              />
              <button
                type="button"
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || !draft.trim()}
              >
                {sending ? '…' : 'Send'}
              </button>
              <ComposerMenu
                companyId={companyId}
                disabled={sending}
                onInsert={handleInsertTemplate}
              />
            </div>
          </footer>
        </>
      )}
    </section>
  )
}
