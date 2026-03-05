import React, { useState, useRef, useEffect } from 'react'
import type { Conversation, Message } from '../data/mock'
import { conversations as initialConvs } from '../data/mock'

export const MessagesPage: React.FC = () => {
  const [convs, setConvs] = useState<Conversation[]>(initialConvs)
  const [selectedId, setSelectedId] = useState<string>(initialConvs[0].id)
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selected = convs.find((c) => c.id === selectedId)!
  const totalUnread = convs.reduce((s, c) => s + c.unreadCount, 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId, selected?.messages.length])

  const handleSelectConv = (id: string) => {
    setSelectedId(id)
    setConvs((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, isRead: true })) }
          : c
      )
    )
  }

  const handleSend = () => {
    if (!draft.trim()) return
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      fromId: 'w1',
      fromName: 'Marcus T.',
      fromInitials: 'MT',
      isCompany: false,
      content: draft.trim(),
      timestamp: 'Just now',
      isRead: true,
    }
    setConvs((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, newMsg], lastActivity: 'Just now' }
          : c
      )
    )
    setDraft('')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--kt-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          width: '100%',
          padding: '24px var(--kt-space-6)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 'var(--kt-text-2xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              marginBottom: 4,
            }}
          >
            Messages
          </h1>
          {totalUnread > 0 && (
            <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
              {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-xl)',
            overflow: 'hidden',
            minHeight: 500,
          }}
        >
          {/* Conversation List */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: '1px solid var(--kt-border)',
              background: 'var(--kt-surface)',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--kt-border)' }}>
              <span
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Conversations
              </span>
            </div>
            {convs.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              const isActive = conv.id === selectedId
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    border: 'none',
                    borderBottom: '1px solid var(--kt-border)',
                    background: isActive
                      ? 'color-mix(in srgb, var(--kt-primary) 8%, transparent)'
                      : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'var(--kt-sand-400)',
                      color: 'var(--kt-navy-900)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'var(--kt-weight-bold)',
                      fontSize: 'var(--kt-text-sm)',
                      position: 'relative',
                    }}
                  >
                    {conv.companyName.slice(0, 2).toUpperCase()}
                    {conv.unreadCount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 16,
                          height: 16,
                          background: '#e03e3e',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '2px solid var(--kt-surface)',
                        }}
                      >
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          fontWeight:
                            conv.unreadCount > 0
                              ? 'var(--kt-weight-semibold)'
                              : 'var(--kt-weight-medium)',
                          color: 'var(--kt-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 120,
                        }}
                      >
                        {conv.companyName}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--kt-text-placeholder)',
                          flexShrink: 0,
                        }}
                      >
                        {conv.lastActivity}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--kt-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}
                    >
                      {conv.jobTitle}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--kt-text-placeholder)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lastMsg?.content}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Message Thread */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--kt-bg)',
            }}
          >
            {/* Thread header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--kt-border)',
                background: 'var(--kt-surface)',
              }}
            >
              <div
                style={{
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  fontSize: 'var(--kt-text-sm)',
                  marginBottom: 2,
                }}
              >
                {selected.companyName}
              </div>
              <div style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                Re: {selected.jobTitle}
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {selected.messages.map((msg) => {
                const isMe = !msg.isCompany
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      gap: 8,
                      alignItems: 'flex-end',
                    }}
                  >
                    {!isMe && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: 'var(--kt-sand-400)',
                          color: 'var(--kt-navy-900)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--kt-weight-bold)',
                          fontSize: '11px',
                        }}
                      >
                        {msg.fromInitials}
                      </div>
                    )}
                    <div style={{ maxWidth: '68%' }}>
                      <div
                        style={{
                          padding: '10px 14px',
                          background: isMe ? 'var(--kt-primary)' : 'var(--kt-surface)',
                          color: isMe ? 'var(--kt-primary-fg)' : 'var(--kt-text)',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          border: isMe ? 'none' : '1px solid var(--kt-border)',
                          fontSize: 'var(--kt-text-sm)',
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.content}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--kt-text-placeholder)',
                          marginTop: 3,
                          textAlign: isMe ? 'right' : 'left',
                        }}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                    {isMe && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: 'var(--kt-primary)',
                          color: 'var(--kt-primary-fg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--kt-weight-bold)',
                          fontSize: '11px',
                        }}
                      >
                        MT
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send input */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--kt-border)',
                background: 'var(--kt-surface)',
                display: 'flex',
                gap: 10,
              }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-full)',
                  background: 'var(--kt-bg)',
                  color: 'var(--kt-text)',
                  fontSize: 'var(--kt-text-sm)',
                  fontFamily: 'var(--kt-font-sans)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                style={{
                  padding: '10px 20px',
                  background: 'var(--kt-primary)',
                  color: 'var(--kt-primary-fg)',
                  border: 'none',
                  borderRadius: 'var(--kt-radius-full)',
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  opacity: draft.trim() ? 1 : 0.5,
                  fontFamily: 'var(--kt-font-sans)',
                  transition: 'opacity 0.15s',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
