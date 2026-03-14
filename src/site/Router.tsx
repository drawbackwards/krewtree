import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
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
import { ColorLandingPage } from './pages/ColorLandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { LoginPageV2 } from './pages/auth/LoginPageV2'
import { LoginPageV3 } from './pages/auth/LoginPageV3'
import { SignupRolePage } from './pages/auth/SignupRolePage'
import { WorkerSignupPage } from './pages/auth/WorkerSignupPage'
import { CompanySignupPage } from './pages/auth/CompanySignupPage'

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

export const SiteRouter: React.FC = () => (
  <>
    <ScrollToTop />
    <Routes>
      {/* ── Auth routes — no Navbar ──────────────────────────────────── */}
      <Route path="/site/login" element={<LoginPage />} />
      <Route path="/site/login/v2" element={<LoginPageV2 />} />
      <Route path="/site/login/v3" element={<LoginPageV3 />} />
      <Route path="/site/signup" element={<SignupRolePage />} />
      <Route path="/site/signup/worker" element={<WorkerSignupPage />} />
      <Route path="/site/signup/company" element={<CompanySignupPage />} />

      {/* ── App routes — full Navbar via AppLayout ───────────────────── */}
      <Route element={<AppLayout />}>
        <Route path="/site" element={<LandingPage />} />
        <Route path="/site/color" element={<ColorLandingPage />} />
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
  </>
)
