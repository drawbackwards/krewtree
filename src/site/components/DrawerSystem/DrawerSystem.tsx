import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { DrawerShell } from '../DrawerShell/DrawerShell'
import { ApplicantSlideover } from '../ApplicantSlideover/ApplicantSlideover'
import { WorkerDrawer } from '../WorkerDrawer/WorkerDrawer'
import {
  useDrawerStack,
  type DrawerStackEntry,
  type ApplicationDrawerEntry,
  type WorkerDrawerEntry,
} from './DrawerStackContext'

// ── DrawerSystem ────────────────────────────────────────────────────────────
//
// Mounted once at the app shell. Renders zero, one, or two DrawerShells from
// the global stack state. The base entry is rendered first, the top entry
// second (so it draws on top by DOM order). Esc / scrim clicks call popDrawer
// from the stack context; this component just wires shells to entries.

function getBackLabel(entry: DrawerStackEntry): string {
  if (entry.type === 'application') {
    const a = entry.preloadedApplicant
    return a ? `${a.workerFirstName} ${a.workerLastInitial}.` : 'applicant'
  }
  const w = entry.preloadedWorker
  if (!w) return 'worker'
  const initial = w.lastName ? `${w.lastName[0]}.` : ''
  return `${w.firstName}${initial ? ' ' + initial : ''}`.trim() || 'worker'
}

export const DrawerSystem: React.FC = () => {
  const { stack, popDrawer, closeAllDrawers } = useDrawerStack()

  // Route change closes the whole stack. Drawer actions that navigate (e.g.
  // "Message" → /site/messages) must NOT pop the stack themselves: on pages
  // that mirror the drawer into the URL (KrewPage's drawer ↔ URL sync), the
  // synchronous pop re-renders the page before the route transition commits,
  // and its sync effect fires a competing navigation that clobbers the
  // intended one. Comparing against the previous pathname (rather than firing
  // on mount) keeps `?worker=X` deep-link refreshes working.
  const { pathname } = useLocation()
  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname
    closeAllDrawers()
  }, [pathname, closeAllDrawers])

  if (stack.length === 0) return null

  return (
    <>
      {stack.map((entry, i) => {
        const isTop = i === stack.length - 1 && stack.length === 2
        const baseEntry = stack[0]
        const onBack = isTop ? popDrawer : undefined
        const backLabel = isTop ? getBackLabel(baseEntry) : undefined

        return (
          <DrawerShell
            key={`${entry.type}-${entry.type === 'application' ? entry.applicationId : entry.workerId}`}
            isTop={isTop}
            onClose={popDrawer}
            ariaLabel={entry.type === 'application' ? 'Applicant details' : 'Worker details'}
          >
            {entry.type === 'application' ? (
              <ApplicantSlideover
                entry={entry as ApplicationDrawerEntry}
                onClose={popDrawer}
                onBack={onBack}
                backLabel={backLabel}
              />
            ) : (
              <WorkerDrawer
                entry={entry as WorkerDrawerEntry}
                onClose={popDrawer}
                onBack={onBack}
                backLabel={backLabel}
              />
            )}
          </DrawerShell>
        )
      })}
    </>
  )
}
