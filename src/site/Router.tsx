import React, { useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import type { Persona } from './components/Navbar/Navbar'
import { Navbar } from './components/Navbar/Navbar'
import {
  LandingPage,
  JobsPage,
  JobDetailPage,
  WorkerDashboard,
  WorkerProfilePage,
  CompanyDashboard,
  PostJobPage,
  CompanyProfilePage,
  SavedJobsPage,
  MessagesPage,
  ReferralPage,
} from './pages'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupRolePage } from './pages/auth/SignupRolePage'
import { WorkerSignupPage } from './pages/auth/WorkerSignupPage'
import { CompanySignupPage } from './pages/auth/CompanySignupPage'

// ── Layout wrapper for pages that use the full Navbar ─────────────────────────
const AppLayout: React.FC<{ persona: Persona; onPersonaChange: (p: Persona) => void }> = ({
  persona,
  onPersonaChange,
}) => (
  <>
    <Navbar persona={persona} onPersonaChange={onPersonaChange} />
    <Outlet />
  </>
)

export const SiteRouter: React.FC = () => {
  const [persona, setPersona] = useState<Persona>('worker')

  return (
    <Routes>
      {/* ── Auth routes — no Navbar ──────────────────────────────────── */}
      <Route path="/site/login" element={<LoginPage />} />
      <Route path="/site/signup" element={<SignupRolePage />} />
      <Route path="/site/signup/worker" element={<WorkerSignupPage />} />
      <Route path="/site/signup/company" element={<CompanySignupPage />} />

      {/* ── App routes — full Navbar via AppLayout ───────────────────── */}
      <Route element={<AppLayout persona={persona} onPersonaChange={setPersona} />}>
        <Route path="/site" element={<LandingPage />} />
        <Route path="/site/jobs" element={<JobsPage />} />
        <Route path="/site/jobs/:id" element={<JobDetailPage />} />
        <Route path="/site/dashboard/worker" element={<WorkerDashboard />} />
        <Route path="/site/dashboard/company" element={<CompanyDashboard />} />
        <Route path="/site/profile/:id" element={<WorkerProfilePage />} />
        <Route path="/site/post-job" element={<PostJobPage />} />
        <Route path="/site/company/:id" element={<CompanyProfilePage />} />
        <Route path="/site/saved-jobs" element={<SavedJobsPage />} />
        <Route path="/site/messages" element={<MessagesPage />} />
        <Route path="/site/referrals" element={<ReferralPage />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/site" replace />} />
      </Route>
    </Routes>
  )
}
