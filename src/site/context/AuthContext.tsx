import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type Persona = 'worker' | 'company'

interface AuthState {
  user: User | null
  session: Session | null
  persona: Persona | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null; persona?: Persona }>
  signUp: (
    email: string,
    password: string,
    persona: Persona,
    displayName?: string
  ) => Promise<{ error: string | null; persona?: Persona }>
  logout: () => Promise<void>
  /** Set persona without changing auth state (used on landing/signup choice screens) */
  setPersona: (p: Persona) => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  persona: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => ({ error: null, persona: undefined }),
  signUp: async () => ({ error: null, persona: undefined }),
  logout: async () => {},
  setPersona: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [persona, setPersonaState] = useState<Persona | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch the user's role from the database and set persona
  const loadRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('id', userId).single()
    if (data) setPersonaState(data.role as Persona)
  }

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadRole(s.user.id).finally(() => setIsLoading(false))
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
        loadRole(s.user.id)
      } else {
        setPersonaState(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ error: string | null; persona?: Persona }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Login failed.' }
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    const role = roleData?.role as Persona | undefined
    if (role) setPersonaState(role)
    return { error: null, persona: role }
  }

  const signUp = async (
    email: string,
    password: string,
    role: Persona,
    displayName = ''
  ): Promise<{ error: string | null; persona?: Persona }> => {
    // Pass role + name in metadata — the handle_new_user trigger creates the rows
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: role === 'worker' ? displayName : '',
          company_name: role === 'company' ? displayName : '',
        },
      },
    })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Sign-up failed — no user returned.' }

    setPersonaState(role)
    return { error: null, persona: role }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setPersonaState(null)
  }

  const setPersona = (p: Persona) => setPersonaState(p)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        persona,
        isLoggedIn: !!user,
        isLoading,
        login,
        signUp,
        logout,
        setPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
