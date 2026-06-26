import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { clearSessionCache } from '../utils/sessionCache'

export type Persona = 'worker' | 'company'

interface AuthState {
  user: User | null
  session: Session | null
  persona: Persona | null
  isLoggedIn: boolean
  /** True once the user has clicked the verification link in their email. */
  isEmailVerified: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null; persona?: Persona }>
  signUp: (
    email: string,
    password: string,
    persona: Persona,
    displayName?: string,
    lastName?: string,
    industry?: string,
    phone?: string,
    hqCity?: string,
    hqState?: string
  ) => Promise<{ error: string | null; persona?: Persona; userId?: string }>
  logout: () => Promise<void>
  resendVerificationEmail: () => Promise<{ error: string | null }>
  /** Initiates an email change — Supabase sends a confirmation link to the new address. */
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>
  /** Set persona without changing auth state (used on landing/signup choice screens) */
  setPersona: (p: Persona) => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  persona: null,
  isLoggedIn: false,
  isEmailVerified: false,
  isLoading: true,
  login: async () => ({ error: null, persona: undefined }),
  signUp: async () => ({ error: null, persona: undefined, userId: undefined }),
  logout: async () => {},
  resendVerificationEmail: async () => ({ error: null }),
  updateEmail: async () => ({ error: null }),
  setPersona: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [persona, setPersonaState] = useState<Persona | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Resolve the user's persona. The role is set in user_metadata at signup
  // (handle_new_user reads raw_user_meta_data->>'role'), so it rides on the
  // session/JWT and needs no query. Only fall back to a user_roles read when
  // metadata is missing (legacy accounts) — this avoids a per-event DB lookup
  // that previously fired on every token refresh and tab refocus.
  const loadRole = async (sessionUser: User) => {
    const metaRole = (sessionUser.user_metadata?.role as Persona | undefined) ?? undefined
    if (metaRole === 'worker' || metaRole === 'company') {
      setPersonaState(metaRole)
      return
    }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', sessionUser.id)
      .single()
    if (data) setPersonaState(data.role as Persona)
  }

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadRole(s.user).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Keep state in sync with Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadRole(s.user)
      } else {
        setPersonaState(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null; persona?: Persona }> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      if (!data.user) return { error: 'Login failed.' }
      // Persona rides on user_metadata (set at signup) — read it off the session
      // instead of a user_roles round trip. Fall back to the table only for legacy
      // accounts whose metadata predates the role being written there.
      const metaRole = (data.user.user_metadata?.role as Persona | undefined) ?? undefined
      let role: Persona | undefined =
        metaRole === 'worker' || metaRole === 'company' ? metaRole : undefined
      if (!role) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        role = roleData?.role as Persona | undefined
      }
      if (role) setPersonaState(role)
      return { error: null, persona: role }
    },
    []
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      role: Persona,
      displayName = '',
      lastName = '',
      industry = '',
      phone = '',
      hqCity = '',
      hqState = ''
    ): Promise<{ error: string | null; persona?: Persona; userId?: string }> => {
      // Pass role + name in metadata — the handle_new_user trigger creates the rows
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: role === 'worker' ? displayName : '',
            last_name: role === 'worker' ? lastName : '',
            company_name: role === 'company' ? displayName : '',
            industry: role === 'company' ? industry : '',
            phone: role === 'company' ? phone : '',
            hq_city: role === 'company' ? hqCity : '',
            hq_state: role === 'company' ? hqState : '',
          },
        },
      })
      if (error) return { error: error.message }
      if (!data.user) return { error: 'Sign-up failed. No user returned.' }
      setPersonaState(role)
      return { error: null, persona: role, userId: data.user.id }
    },
    []
  )

  const resendVerificationEmail = useCallback(async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: user?.email ?? '' })
    if (error) return { error: error.message }
    return { error: null }
  }, [user?.email])

  const updateEmail = useCallback(async (newEmail: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setPersonaState(null)
    // Profile-edit drafts are keyed per account (see WorkerProfileEditPage /
    // CompanyProfileEditPage storageKey), so they no longer need clearing here —
    // one account's draft can't leak into another's form.
    // Drop cached company-scoped Discover data so a fresh login doesn't read
    // the previous account's skills/coords/active-jobs entries.
    clearSessionCache()
  }, [])

  const setPersona = useCallback((p: Persona) => setPersonaState(p), [])

  // Memoize the context value so consumers (Navbar, route guards, every useAuth()
  // caller) only re-render when auth state actually changes, not on every render
  // of the provider's parent. Handlers above are stable via useCallback.
  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      persona,
      isLoggedIn: !!user,
      isEmailVerified: !!user?.email_confirmed_at,
      isLoading,
      login,
      signUp,
      logout,
      resendVerificationEmail,
      updateEmail,
      setPersona,
    }),
    [
      user,
      session,
      persona,
      isLoading,
      login,
      signUp,
      logout,
      resendVerificationEmail,
      updateEmail,
      setPersona,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
