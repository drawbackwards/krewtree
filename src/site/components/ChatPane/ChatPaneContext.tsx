import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

// Chat pane state — a LinkedIn-style docked chat for direct messages.
// Company pages (Discover, My Krew, WorkerDrawer) call openChat() with the
// worker to talk to; ChatPane renders the conversation bottom-right without
// navigating away. The full inbox lives on /site/messages.

export type ChatTarget = {
  workerId: string
  name: string
  avatarUrl: string | null
}

type ChatPaneContextValue = {
  target: ChatTarget | null
  minimized: boolean
  openChat: (target: ChatTarget) => void
  closeChat: () => void
  toggleMinimized: () => void
}

const ChatPaneContext = createContext<ChatPaneContextValue | null>(null)

export const ChatPaneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<ChatTarget | null>(null)
  const [minimized, setMinimized] = useState(false)

  const openChat = useCallback((next: ChatTarget): void => {
    setTarget(next)
    setMinimized(false)
  }, [])

  const closeChat = useCallback((): void => {
    setTarget(null)
    setMinimized(false)
  }, [])

  const toggleMinimized = useCallback((): void => {
    setMinimized((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({ target, minimized, openChat, closeChat, toggleMinimized }),
    [target, minimized, openChat, closeChat, toggleMinimized]
  )

  return <ChatPaneContext.Provider value={value}>{children}</ChatPaneContext.Provider>
}

export function useChatPane(): ChatPaneContextValue {
  const ctx = useContext(ChatPaneContext)
  if (!ctx) throw new Error('useChatPane must be used within ChatPaneProvider')
  return ctx
}
