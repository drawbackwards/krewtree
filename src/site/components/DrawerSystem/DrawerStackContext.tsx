import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CompanyApplicant } from '../../types'
import type { KrewWorker } from '../../services/krewService'

// ── Stack entry shapes ──────────────────────────────────────────────────────
//
// Each entry carries the id to fetch by + optional preload data so the drawer
// can render immediately without a loading flicker when the opener already had
// the row in hand. `onWrite` is invoked after any write the drawer performs,
// so the opener can refetch its own list/table.

export type ApplicationDrawerTab = 'summary' | 'pipeline' | 'log'
export type WorkerDrawerTab = 'summary' | 'matches' | 'history' | 'notes'

export type ApplicationDrawerEntry = {
  type: 'application'
  applicationId: string
  defaultTab?: ApplicationDrawerTab
  preloadedApplicant?: CompanyApplicant
  onWrite?: () => void
}

export type WorkerDrawerEntry = {
  type: 'worker'
  workerId: string
  defaultTab?: WorkerDrawerTab
  preloadedWorker?: KrewWorker
  onWrite?: () => void
}

export type DrawerStackEntry = ApplicationDrawerEntry | WorkerDrawerEntry

// ── Context API ─────────────────────────────────────────────────────────────

export interface DrawerStackValue {
  stack: DrawerStackEntry[]
  /** Push a drawer onto the stack. Cap at 2: a third push replaces the top. */
  openDrawer: (entry: DrawerStackEntry) => void
  /** Peel the top entry off. No-op when the stack is empty. */
  popDrawer: () => void
  /** Empty the stack. */
  closeAllDrawers: () => void
  /** Patch the base entry's preloaded data after the fact. Used when a page
   *  opens the drawer from a deep-link before its row data has loaded — once
   *  the list arrives, the page calls this to attach the matching row so the
   *  drawer's hero re-renders with the rich preload instead of generic text. */
  updateBasePreload: (workerId: string, preloaded: KrewWorker) => void
}

const DrawerStackContext = createContext<DrawerStackValue | null>(null)

// Identity key for a stack entry — DrawerSystem uses the same shape as its
// React key, so two entries must never share one.
function entryKey(entry: DrawerStackEntry): string {
  return `${entry.type}-${entry.type === 'application' ? entry.applicationId : entry.workerId}`
}

// ── Provider ────────────────────────────────────────────────────────────────

export const DrawerStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<DrawerStackEntry[]>([])

  const openDrawer = useCallback((entry: DrawerStackEntry) => {
    setStack((prev) => {
      if (prev.length === 0) return [entry]
      // Re-opening the entry that's already the base is a no-op — pushing it
      // would give two stack entries the same identity (duplicate React keys
      // in DrawerSystem). updateBasePreload exists for late preload patching.
      if (entryKey(prev[0]) === entryKey(entry)) return prev
      // Cap guard — replace the top rather than growing past 2.
      return [prev[0], entry]
    })
  }, [])

  const popDrawer = useCallback(() => {
    setStack((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)))
  }, [])

  const closeAllDrawers = useCallback(() => {
    setStack([])
  }, [])

  const updateBasePreload = useCallback((workerId: string, preloaded: KrewWorker) => {
    setStack((prev) => {
      const base = prev[0]
      if (!base || base.type !== 'worker' || base.workerId !== workerId) return prev
      // Only patch when preload was actually missing — repeat calls are a no-op
      // so an effect that fires on every workers update doesn't churn the stack.
      if (base.preloadedWorker) return prev
      const next = prev.slice()
      next[0] = { ...base, preloadedWorker: preloaded }
      return next
    })
  }, [])

  // Lock body scroll whenever the stack is non-empty.
  useEffect(() => {
    if (stack.length === 0) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [stack.length])

  // Esc peels the top drawer (one press = one peel).
  useEffect(() => {
    if (stack.length === 0) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') popDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [stack.length, popDrawer])

  const value = useMemo<DrawerStackValue>(
    () => ({ stack, openDrawer, popDrawer, closeAllDrawers, updateBasePreload }),
    [stack, openDrawer, popDrawer, closeAllDrawers, updateBasePreload]
  )

  return <DrawerStackContext.Provider value={value}>{children}</DrawerStackContext.Provider>
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useDrawerStack(): DrawerStackValue {
  const ctx = useContext(DrawerStackContext)
  if (!ctx) {
    throw new Error('useDrawerStack must be used inside <DrawerStackProvider>')
  }
  return ctx
}
