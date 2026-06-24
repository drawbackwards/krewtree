import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getConversations,
  getConversationStub,
  getApplicationThreadRef,
  getThreadMessages,
  sendMessage,
  markThreadRead,
  conversationKey,
  MESSAGES_READ_EVENT,
  type ApplicationThreadRef,
  type Conversation,
  type ThreadMessage,
} from '../services/messageService'
import { ChevronLeftIcon } from '../icons'
import { ComposerMenu } from '../components/ComposerMenu/ComposerMenu'
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

function formatDayLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Decode a conversation key back into its pair coordinates. */
function parseConversationKey(key: string): { companyId: string; workerId: string } | null {
  const [companyId, workerId] = key.split(':')
  if (companyId && workerId) return { companyId, workerId }
  return null
}

export const MessagesPage: React.FC = () => {
  const { persona, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const myId = user?.id ?? null

  // Deep links: ?dm=<otherPartyId> opens the pair thread with that
  // counterpart (worker id for company viewers, company id for worker
  // viewers); ?application=<id> resolves the application to its pair
  // thread and tags composed messages with that application's context.
  const deepLinkApplication = searchParams.get('application')
  const deepLinkDm = searchParams.get('dm')

  const [appRef, setAppRef] = useState<ApplicationThreadRef | null>(null)
  useEffect(() => {
    if (!deepLinkApplication) {
      setAppRef(null)
      return
    }
    let cancelled = false
    getApplicationThreadRef(deepLinkApplication).then(({ data }) => {
      if (!cancelled) setAppRef(data)
    })
    return () => {
      cancelled = true
    }
  }, [deepLinkApplication])

  const deepLinkKey = useMemo(() => {
    if (deepLinkApplication) {
      return appRef ? conversationKey(appRef.companyId, appRef.workerId) : null
    }
    if (deepLinkDm && myId && persona) {
      return persona === 'company'
        ? conversationKey(myId, deepLinkDm)
        : conversationKey(deepLinkDm, myId)
    }
    return null
  }, [deepLinkApplication, appRef, deepLinkDm, myId, persona])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const selected = useMemo(
    () => conversations.find((c) => c.key === selectedKey) ?? null,
    [conversations, selectedKey]
  )

  // Select the deep-linked thread once it's resolvable (dm links need the
  // auth user, application links need the resolved pair).
  useEffect(() => {
    if (deepLinkKey) setSelectedKey(deepLinkKey)
  }, [deepLinkKey])

  // ── Load conversation list ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!persona) return
    setLoading(true)
    const { data, error } = await getConversations()
    let list = data
    // Deep link to a pair with no messages yet (e.g. company starting a
    // conversation from the pipeline or chat pane) — fetch its header.
    if (deepLinkKey && !data.some((c) => c.key === deepLinkKey)) {
      const parsed = parseConversationKey(deepLinkKey)
      if (parsed) {
        const { data: stub } = await getConversationStub(parsed.companyId, parsed.workerId)
        if (stub) list = [stub, ...data]
      }
    }
    setConversations(list)
    setLoadError(error)
    setLoading(false)
  }, [persona, deepLinkKey])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ── Load + mark read the selected thread ──────────────────────────────────
  // The key encodes the pair, so the fetch doesn't need the Conversation
  // object — which may not exist yet when a deep link selects a thread
  // before the list has loaded.
  useEffect(() => {
    const parsed = selectedKey ? parseConversationKey(selectedKey) : null
    if (!parsed || !persona) {
      setThread([])
      return
    }
    let cancelled = false
    setThreadLoading(true)
    getThreadMessages(parsed.companyId, parsed.workerId).then(({ data }) => {
      if (cancelled) return
      setThread(data)
      setThreadLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedKey, persona])

  useEffect(() => {
    if (!selected || selected.unreadCount === 0) return
    markThreadRead(selected.companyId, selected.workerId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.key === selected.key ? { ...c, unreadCount: 0 } : c))
      )
      window.dispatchEvent(new Event(MESSAGES_READ_EVENT))
    })
  }, [selected])

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread])

  function handleSelect(conv: Conversation): void {
    setSelectedKey(conv.key)
    setDraft('')
    setSendError(null)
    // Selecting from the list always rewrites to a dm link, which clears
    // any active application context from a previous deep link.
    const otherPartyId = persona === 'company' ? conv.workerId : conv.companyId
    setSearchParams({ dm: otherPartyId }, { replace: true })
  }

  function handleBack(): void {
    setSelectedKey(null)
    setSearchParams({}, { replace: true })
  }

  // ── Send / reply ──────────────────────────────────────────────────────────
  async function handleSend(): Promise<void> {
    if (!selected || !persona || sending) return
    const body = draft.trim()
    if (!body) return

    // Arriving via ?application=<id> tags sends with that application so
    // the other party sees which job the message is about.
    const applicationId =
      appRef && selected.key === conversationKey(appRef.companyId, appRef.workerId)
        ? appRef.applicationId
        : null

    setSending(true)
    setSendError(null)
    const { data, error } = await sendMessage(selected.companyId, selected.workerId, body, {
      applicationId,
    })
    setSending(false)

    if (error || !data) {
      setSendError('Message failed to send. Please try again.')
      return
    }

    setThread((prev) => [...prev, data])
    setDraft('')
    setConversations((prev) =>
      prev.map((c) =>
        c.key === selected.key ? { ...c, lastMessage: data, messageCount: c.messageCount + 1 } : c
      )
    )
    composerRef.current?.focus()
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Insert a template into the draft: fill an empty composer, otherwise
  // append after the existing text so nothing is clobbered.
  function handleInsertTemplate(text: string): void {
    setDraft((prev) => (prev.trim() ? `${prev}\n\n${text}` : text))
    composerRef.current?.focus()
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  const isCompany = persona === 'company'

  function counterpartName(c: Conversation): string {
    return isCompany ? c.workerName || 'Worker' : c.companyName
  }

  function counterpartAvatar(c: Conversation): string | null {
    return isCompany ? c.workerAvatar : c.companyLogo
  }

  function contextLine(c: Conversation): string {
    return c.lastMessage?.jobTitle ?? 'Direct message'
  }

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const at = a.lastMessage?.sentAt ?? ''
        const bt = b.lastMessage?.sentAt ?? ''
        return bt.localeCompare(at)
      }),
    [conversations]
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
        {!loading && conversations.length > 0 && (
          <span className={styles.unreadCount}>
            {totalUnread > 0
              ? `${totalUnread} unread`
              : `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`}
          </span>
        )}
      </header>

      {loading ? null : loadError ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Couldn’t load messages</p>
          <p className={styles.emptyHint}>{loadError}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No messages yet</p>
          <p className={styles.emptyHint}>
            {isCompany
              ? 'Message a worker from Discover or My Krew, or start a conversation from your pipeline — it will appear here.'
              : 'When a company reaches out, you’ll see it here.'}
          </p>
        </div>
      ) : (
        <div className={`${styles.layout} ${selectedKey ? styles.layoutThreadOpen : ''}`}>
          {/* ── Conversation list ── */}
          <aside className={styles.listPane} aria-label="Conversations">
            <ul className={styles.convList}>
              {sortedConversations.map((c) => {
                const active = c.key === selectedKey
                const unread = c.unreadCount > 0
                return (
                  <li key={c.key}>
                    <button
                      type="button"
                      className={[
                        styles.convRow,
                        active ? styles.convRowActive : '',
                        unread ? styles.convRowUnread : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleSelect(c)}
                      aria-current={active}
                    >
                      {counterpartAvatar(c) ? (
                        <img
                          src={counterpartAvatar(c)!}
                          alt=""
                          className={styles.avatar}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className={styles.avatar} aria-hidden="true">
                          {initials(counterpartName(c))}
                        </span>
                      )}
                      <span className={styles.convCenter}>
                        <span className={styles.convTopLine}>
                          <span className={unread ? styles.convNameUnread : styles.convName}>
                            {counterpartName(c)}
                          </span>
                          {c.lastMessage && (
                            <span className={styles.convTime}>
                              {formatRelativeTime(c.lastMessage.sentAt)}
                            </span>
                          )}
                        </span>
                        <span className={styles.convJob}>{contextLine(c)}</span>
                        <span className={styles.convPreview}>
                          {c.lastMessage
                            ? c.lastMessage.body.replace(/\s+/g, ' ').slice(0, 90)
                            : 'No messages yet'}
                        </span>
                      </span>
                      {unread && (
                        <span className={styles.unreadPill}>
                          {c.unreadCount > 9 ? '9+' : c.unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* ── Thread ── */}
          <section className={styles.threadPane} aria-label="Conversation">
            {!selected ? (
              <div className={styles.threadEmpty}>
                <p className={styles.emptyTitle}>Select a conversation</p>
                <p className={styles.emptyHint}>
                  Choose a conversation on the left to read and reply.
                </p>
              </div>
            ) : (
              <>
                <header className={styles.threadHeader}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={handleBack}
                    aria-label="Back to conversations"
                  >
                    <ChevronLeftIcon size={14} />
                  </button>
                  <div className={styles.threadHeaderCenter}>
                    <span className={styles.threadName}>{counterpartName(selected)}</span>
                    <span className={styles.threadJobLine}>
                      <Link
                        to={
                          isCompany
                            ? `/site/profile/${selected.workerId}`
                            : `/site/company/${selected.companyId}`
                        }
                        className={styles.threadJobLink}
                      >
                        View profile
                      </Link>
                    </span>
                  </div>
                </header>

                <div className={styles.threadScroll} ref={scrollRef}>
                  {threadLoading ? null : thread.length === 0 ? (
                    <div className={styles.threadEmpty}>
                      <p className={styles.emptyHint}>
                        No messages yet — write the first one below.
                      </p>
                    </div>
                  ) : (
                    thread.map((msg, i) => {
                      const prev = thread[i - 1]
                      const mine = msg.senderRole === persona
                      const newDay =
                        !prev ||
                        new Date(prev.sentAt).toDateString() !== new Date(msg.sentAt).toDateString()
                      return (
                        <React.Fragment key={msg.id}>
                          {newDay && (
                            <div className={styles.dayDivider}>{formatDayLabel(msg.sentAt)}</div>
                          )}
                          <div
                            className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ''}`}
                          >
                            <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
                              <div className={styles.bubbleBody}>{msg.body}</div>
                              <div
                                className={`${styles.bubbleTime} ${
                                  mine ? styles.bubbleTimeMine : ''
                                }`}
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
                      placeholder={`Message ${counterpartName(selected)}…`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      rows={2}
                      maxLength={10000}
                      disabled={sending || !user}
                      aria-label="Message text"
                    />
                    <button
                      type="button"
                      className={styles.sendBtn}
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                    {isCompany && (
                      <ComposerMenu
                        companyId={selected.companyId}
                        disabled={sending || !user}
                        onInsert={handleInsertTemplate}
                      />
                    )}
                  </div>
                  <div className={styles.composerHint}>
                    Enter to send · Shift+Enter for a new line
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
