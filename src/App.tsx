import React from 'react'
import { SiteRouter } from './site/Router'
import { AuthProvider } from './site/context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <SiteRouter />
    </AuthProvider>
  )
}
