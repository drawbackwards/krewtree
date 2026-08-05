import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

/**
 * Whether Sentry should report. Active only when a DSN is configured AND this is
 * a production build — `import.meta.env.PROD` is true for any `vite build`
 * (Vercel Production and Preview), and false for local `npm run dev`, so local
 * work never pollutes the dashboard.
 */
const enabled = Boolean(dsn) && import.meta.env.PROD

/**
 * Initialize error monitoring. Safe to call unconditionally — a no-op when
 * disabled (no DSN, or local dev), so nothing breaks before Sentry is set up.
 */
export function initSentry(): void {
  if (!enabled) return

  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? 'production',
    // Light performance sampling; revisit once we see real traffic.
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  })
}

/**
 * Report a handled error — e.g. a service `{ data, error }` failure that did not
 * throw, or a caught exception worth surfacing. Safe when Sentry is disabled;
 * the report is simply dropped.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!enabled) return
  Sentry.captureException(error, context ? { extra: context } : undefined)
}
