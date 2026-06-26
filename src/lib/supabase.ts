import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[krewtree] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your project values.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Untyped escape hatch for relations not present in the generated Database
 * types (e.g. tables we deliberately keep out of the types). It is a BARE
 * SupabaseClient with no <Database> generic, so `untypedDb.from(name)` returns
 * a loose builder. Crucially it does NOT reference the typed client's relation
 * union, so adding a view/table to database.types.ts can never change how
 * `.from()` resolves here (the old `ReturnType<typeof supabase.from>` cast did,
 * and broke compilation whenever the types grew). Callers cast result rows.
 */
export const untypedDb = supabase as unknown as SupabaseClient

/**
 * Current user's id from the locally cached session — no network round trip,
 * unlike `auth.getUser()` which revalidates against the auth server on every
 * call. Services should use this for identity; RLS enforces authorization
 * server-side regardless of what the client claims.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user.id ?? null
}
