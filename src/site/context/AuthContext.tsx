import React, { createContext, useContext, useState } from 'react'

export type Persona = 'worker' | 'company'

interface AuthState {
  isLoggedIn: boolean
  persona: Persona
  /** Set persona without logging in (e.g. when choosing a path on the landing page) */
  setPersona: (p: Persona) => void
  /** Mark user as logged in with the given persona */
  login: (p: Persona) => void
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  persona: 'worker',
  setPersona: () => {},
  login: () => {},
  logout: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [persona, setPersonaState] = useState<Persona>('worker')

  const setPersona = (p: Persona) => setPersonaState(p)

  const login = (p: Persona) => {
    setPersonaState(p)
    setIsLoggedIn(true)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setPersonaState('worker')
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, persona, setPersona, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
