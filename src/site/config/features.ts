/**
 * Build-time feature flags.
 *
 * Flags are read from `import.meta.env.VITE_*` so they are resolved at build
 * time. Flip a flag in `.env.local` (or the Vercel environment) and redeploy
 * to change it in production.
 *
 * regulix — the Regulix partner integration (Regulix Ready badges, "Regulix
 * Preferred" jobs, endorsements, connect/import nudges, status boxes, and all
 * Regulix-only filters). Kept OFF until the Regulix connection is live. When
 * off, the presentational Regulix components render `null` and every Regulix
 * surface / filter is hidden; the underlying database columns are left intact.
 *
 * DEV-ONLY OVERRIDE: while developing (`import.meta.env.DEV`) you can flip a
 * flag from the browser without restarting the dev server. In the devtools
 * console run one of:
 *   localStorage.kt_ff_regulix = 'on'   // force Regulix ON,  then reload
 *   localStorage.kt_ff_regulix = 'off'  // force Regulix OFF, then reload
 *   delete localStorage.kt_ff_regulix   // back to the .env value, then reload
 * The override is ignored in production builds, so launch behavior is governed
 * purely by VITE_ENABLE_REGULIX.
 */

/** Read a dev-only localStorage override for a flag. Returns null in prod or when unset/invalid. */
function devOverride(key: string): boolean | null {
  if (!import.meta.env.DEV) return null
  try {
    const v = window.localStorage.getItem(key)
    if (v === 'on') return true
    if (v === 'off') return false
  } catch {
    // localStorage can throw (private mode / disabled) — fall back to env.
  }
  return null
}

const regulixEnv = import.meta.env.VITE_ENABLE_REGULIX === 'true'

export const FEATURES = {
  regulix: devOverride('kt_ff_regulix') ?? regulixEnv,
} as const

export type FeatureName = keyof typeof FEATURES
