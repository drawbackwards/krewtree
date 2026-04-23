import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar/Navbar'
import {
  LandingPage,
  JobsPage,
  JobDetailPage,
  WorkerDashboard,
  WorkerProfilePage,
  WorkerProfileEditPage,
  CompanyDashboard,
  PostJobPage,
  CompanyProfilePage,
  SavedJobsPage,
  MessagesPage,
  ReferralPage,
  JobPostsPage,
  AllApplicantsPage,
  CompanyApplicantProfilePage,
} from './pages'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupRolePage } from './pages/auth/SignupRolePage'
import { WorkerSignupPage } from './pages/auth/WorkerSignupPage'
import { CompanySignupPage } from './pages/auth/CompanySignupPage'
import { useAuth } from './context/AuthContext'
import type { Persona } from './context/AuthContext'

// Scrolls to the top of the page on every navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Layout wrapper — Navbar reads auth/persona from context directly
const AppLayout: React.FC = () => (
  <>
    <Navbar />
    <Outlet />
  </>
)

// Requires authentication. Optionally enforces a specific persona.
// Shows nothing while session is loading, then redirects to login if not authenticated.
// If a persona is required and doesn't match, redirects to the correct dashboard.
const RequireAuth: React.FC<{ persona?: Persona }> = ({ persona }) => {
  const { isLoggedIn, isLoading, persona: userPersona } = useAuth()
  if (isLoading) return null
  if (!isLoggedIn) return <Navigate to="/site/login" replace />
  if (persona && userPersona !== persona) {
    return (
      <Navigate
        to={userPersona === 'company' ? '/site/dashboard/company' : '/site/dashboard/worker'}
        replace
      />
    )
  }
  return <Outlet />
}

export const SiteRouter: React.FC = () => (
  <>
    <ScrollToTop />
    <Routes>
      {/* ── Auth routes — no Navbar ──────────────────────────────────── */}
      <Route path="/site/login" element={<LoginPage />} />
      <Route path="/site/signup" element={<SignupRolePage />} />
      <Route path="/site/signup/worker" element={<WorkerSignupPage />} />
      <Route path="/site/signup/company" element={<CompanySignupPage />} />

      {/* ── App routes — full Navbar via AppLayout ───────────────────── */}
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route path="/site" element={<LandingPage />} />
        <Route path="/site/jobs" element={<JobsPage />} />
        <Route path="/site/jobs/:id" element={<JobDetailPage />} />
        <Route path="/site/profile/:id" element={<WorkerProfilePage />} />
        <Route path="/site/company/:id" element={<CompanyProfilePage />} />

        {/* Worker-only */}
        <Route element={<RequireAuth persona="worker" />}>
          <Route path="/site/dashboard/worker" element={<WorkerDashboard />} />
          <Route path="/site/profile/edit" element={<WorkerProfileEditPage />} />
          <Route path="/site/profile/create" element={<WorkerProfileEditPage />} />
          <Route path="/site/saved-jobs" element={<SavedJobsPage />} />
          <Route path="/site/referrals" element={<ReferralPage />} />
        </Route>

        {/* Company-only */}
        <Route element={<RequireAuth persona="company" />}>
          <Route path="/site/dashboard/company" element={<CompanyDashboard />} />
          <Route path="/site/dashboard/jobs" element={<JobPostsPage />} />
          <Route path="/site/dashboard/applicants" element={<AllApplicantsPage />} />
          <Route
            path="/site/dashboard/applicants/worker/:workerId"
            element={<CompanyApplicantProfilePage />}
          />
          <Route path="/site/post-job" element={<PostJobPage />} />
          <Route path="/site/post-job/:id" element={<PostJobPage />} />
        </Route>

        {/* Requires auth (any persona) */}
        <Route element={<RequireAuth />}>
          <Route path="/site/messages" element={<MessagesPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/site" replace />} />
      </Route>
    </Routes>
  </>
)
