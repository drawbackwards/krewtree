import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, ACTIVE_COMPANY_KEY } from '../../lib/supabase'
import { clearSessionCache } from '../utils/sessionCache'

export type Persona = 'worker' | 'company'

export type CompanyRole = 'owner' | 'admin' | 'member'

/** A company seat the logged-in user holds. A user may hold several (agencies). */
export interface CompanyMembership {
  companyId: string
  companyName: string
  companyLogo: string | null
  role: CompanyRole
}

interface AuthState {
  user: User | null
  session: Session | null
  persona: Persona | null
  isLoggedIn: boolean
  /** True once the user has clicked the verification link in their email. */
  isEmailVerified: boolean
  isLoading: boolean
  /** Company seats the user holds (empty for workers / non-members). */
  memberships: CompanyMembership[]
  /** Id of the company the user is currently acting as, or null. */
  activeCompanyId: string | null
  /** The user's role in the active company, or null. */
  companyRole: CompanyRole | null
  /** Switch which company the user is acting as (must be one they belong to). */
  setActiveCompany: (companyId: string) => void
  /** Re-fetch memberships (e.g. after accepting an invite). */
  refreshMemberships: () => Promise<void>
  /** Create a new company, become its owner, and switch into it. */
  createCompany: (
    name: string,
    industry?: string
  ) => Promise<{ companyId: string | null; error: string | null }>

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
  memberships: [],
  activeCompanyId: null,
  companyRole: null,
  setActiveCompany: () => {},
  refreshMemberships: async () => {},
  createCompany: async () => ({ companyId: null, error: null }),
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
  const [memberships, setMemberships] = useState<CompanyMembership[]>([])
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)

  // Load the user's company seats and resolve which one is active. Multi-org:
  // a user may belong to several companies, so the active company is a persisted
  // selection (ACTIVE_COMPANY_KEY) rather than an identity. Falls back to the
  // earliest membership when the stored choice is gone / absent.
  const loadMemberships = async (userId: string) => {
    const { data } = await supabase
      .from('company_members')
      .select('company_id, role, company_profiles(name, logo_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    type Prof = { name: string | null; logo_url: string | null }
    const rows = (data ?? []).map((r) => {
      const raw = r.company_profiles as Prof | Prof[] | null
      const prof = Array.isArray(raw) ? (raw[0] ?? null) : raw
      return {
        companyId: r.company_id,
        companyName: prof?.name ?? '',
        companyLogo: prof?.logo_url ?? null,
        role: r.role as CompanyRole,
      }
    })
    setMemberships(rows)
    let stored: string | null = null
    try {
      stored = localStorage.getItem(ACTIVE_COMPANY_KEY)
    } catch {
      stored = null
    }
    const active = rows.find((m) => m.companyId === stored)?.companyId ?? rows[0]?.companyId ?? null
    setActiveCompanyId(active)
    try {
      if (active) localStorage.setItem(ACTIVE_COMPANY_KEY, active)
      else localStorage.removeItem(ACTIVE_COMPANY_KEY)
    } catch {
      // ignore persistence failures
    }
  }

  const clearMemberships = () => {
    setMemberships([])
    setActiveCompanyId(null)
    try {
      localStorage.removeItem(ACTIVE_COMPANY_KEY)
    } catch {
      // ignore
    }
  }

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
        loadMemberships(s.user.id)
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
        loadMemberships(s.user.id)
      } else {
        setPersonaState(null)
        clearMemberships()
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
      void loadMemberships(data.user.id)
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
    clearMemberships()
    // Profile-edit drafts are keyed per account (see WorkerProfileEditPage /
    // CompanyProfileEditPage storageKey), so they no longer need clearing here —
    // one account's draft can't leak into another's form.
    // Drop cached company-scoped Discover data so a fresh login doesn't read
    // the previous account's skills/coords/active-jobs entries.
    clearSessionCache()
  }, [])

  const setPersona = useCallback((p: Persona) => setPersonaState(p), [])

  const setActiveCompany = useCallback(
    (companyId: string) => {
      setActiveCompanyId((prev) => {
        // Guard: only switch to a company the user actually belongs to.
        if (companyId === prev) return prev
        if (!memberships.some((m) => m.companyId === companyId)) return prev
        try {
          localStorage.setItem(ACTIVE_COMPANY_KEY, companyId)
        } catch {
          // ignore
        }
        return companyId
      })
    },
    [memberships]
  )

  const companyRole = useMemo<CompanyRole | null>(
    () => memberships.find((m) => m.companyId === activeCompanyId)?.role ?? null,
    [memberships, activeCompanyId]
  )

  const refreshMemberships = useCallback(async () => {
    // loadMemberships closes over stable state setters; only the user id matters.
    if (user?.id) await loadMemberships(user.id)
  }, [user?.id])

  const createCompany = useCallback(
    async (name: string, industry?: string) => {
      const { data, error } = await supabase.rpc('create_company', {
        p_name: name,
        p_industry: industry ?? '',
      })
      if (error) return { companyId: null, error: error.message }
      const id = data as string
      // Persist the new company as active BEFORE reloading so loadMemberships
      // resolves it as the active selection.
      try {
        localStorage.setItem(ACTIVE_COMPANY_KEY, id)
      } catch {
        // ignore
      }
      if (user?.id) await loadMemberships(user.id)
      // A brand-new company account is a company persona.
      setPersonaState('company')
      return { companyId: id, error: null }
    },
    [user?.id]
  )

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
      memberships,
      activeCompanyId,
      companyRole,
      setActiveCompany,
      refreshMemberships,
      createCompany,
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
      memberships,
      activeCompanyId,
      companyRole,
      setActiveCompany,
      refreshMemberships,
      createCompany,
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
