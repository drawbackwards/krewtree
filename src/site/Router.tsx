import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../components'
import { Navbar } from './components/Navbar/Navbar'
import { DrawerStackProvider } from './components/DrawerSystem/DrawerStackContext'
import { DrawerSystem } from './components/DrawerSystem/DrawerSystem'
import { ChatPaneProvider } from './components/ChatPane/ChatPaneContext'
import { ChatPane } from './components/ChatPane/ChatPane'
import { useAuth } from './context/AuthContext'
import type { Persona } from './context/AuthContext'

// ── Lazy route modules ───────────────────────────────────────────────────────
// Each page is its own chunk so a visitor only downloads the surface they're
// on (a logged-out landing visit shouldn't pull the company pipeline/kanban).
// Pages use named exports, hence the .then(m => ({ default: m.X })) shims.
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const JobsPage = lazy(() => import('./pages/JobsPage').then((m) => ({ default: m.JobsPage })))
const JobDetailPage = lazy(() =>
  import('./pages/JobDetailPage').then((m) => ({ default: m.JobDetailPage }))
)
const WorkerDashboard = lazy(() =>
  import('./pages/WorkerDashboard').then((m) => ({ default: m.WorkerDashboard }))
)
const WorkerProfilePage = lazy(() =>
  import('./pages/WorkerProfilePage').then((m) => ({ default: m.WorkerProfilePage }))
)
const WorkerProfileEditPage = lazy(() =>
  import('./pages/WorkerProfileEditPage').then((m) => ({ default: m.WorkerProfileEditPage }))
)
const CompanyDashboard = lazy(() =>
  import('./pages/CompanyDashboard').then((m) => ({ default: m.CompanyDashboard }))
)
const PostJobPage = lazy(() =>
  import('./pages/PostJobPage').then((m) => ({ default: m.PostJobPage }))
)
const CompanyProfilePage = lazy(() =>
  import('./pages/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage }))
)
const CompanyProfileEditPage = lazy(() =>
  import('./pages/CompanyProfileEditPage').then((m) => ({ default: m.CompanyProfileEditPage }))
)
const SavedJobsPage = lazy(() =>
  import('./pages/SavedJobsPage').then((m) => ({ default: m.SavedJobsPage }))
)
const MessagesPage = lazy(() =>
  import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage }))
)
const ReferralPage = lazy(() =>
  import('./pages/ReferralPage').then((m) => ({ default: m.ReferralPage }))
)
const JobPostsPage = lazy(() =>
  import('./pages/JobPostsPage').then((m) => ({ default: m.JobPostsPage }))
)
const AllApplicantsPage = lazy(() =>
  import('./pages/AllApplicantsPage').then((m) => ({ default: m.AllApplicantsPage }))
)
const CompanyApplicantProfilePage = lazy(() =>
  import('./pages/CompanyApplicantProfilePage').then((m) => ({
    default: m.CompanyApplicantProfilePage,
  }))
)
const ApplicationsPage = lazy(() =>
  import('./pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage }))
)
const PipelinePage = lazy(() =>
  import('./pages/PipelinePage').then((m) => ({ default: m.PipelinePage }))
)
const KrewPage = lazy(() => import('./pages/KrewPage').then((m) => ({ default: m.KrewPage })))
const DiscoverPage = lazy(() =>
  import('./pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage }))
)
const SettingsLayout = lazy(() => import('./pages/Settings/SettingsLayout'))
const PipelineSettingsPage = lazy(() => import('./pages/Settings/PipelineSettingsPage'))
const AccountSettingsPage = lazy(() =>
  import('./pages/Settings/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage }))
)
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const SignupRolePage = lazy(() =>
  import('./pages/auth/SignupRolePage').then((m) => ({ default: m.SignupRolePage }))
)
const WorkerSignupPage = lazy(() =>
  import('./pages/auth/WorkerSignupPage').then((m) => ({ default: m.WorkerSignupPage }))
)
const CompanySignupPage = lazy(() =>
  import('./pages/auth/CompanySignupPage').then((m) => ({ default: m.CompanySignupPage }))
)

// Centered spinner shown while a route chunk downloads. Kept minimal so the
// flash on fast connections is unobtrusive.
const RouteFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--kt-space-16, 64px)' }}>
    <Spinner size="lg" />
  </div>
)

// Scrolls to the top of the page on every navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Layout wrapper — Navbar reads auth/persona from context directly.
// DrawerStackProvider lives here so any page can call useDrawerStack() to
// open WorkerDrawer or ApplicationDrawer; DrawerSystem renders the active
// drawer(s) on top of whatever page is current. ChatPaneProvider lets any
// company page call useChatPane().openChat() to dock a direct-message chat
// bottom-right; the pane survives route changes like LinkedIn's.
const AppLayout: React.FC = () => (
  <DrawerStackProvider>
    <ChatPaneProvider>
      <Navbar />
      <Outlet />
      <DrawerSystem />
      <ChatPane />
    </ChatPaneProvider>
  </DrawerStackProvider>
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
    <Suspense fallback={<RouteFallback />}>
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
            <Route path="/site/applications" element={<ApplicationsPage />} />
            <Route path="/site/referrals" element={<ReferralPage />} />
          </Route>

          {/* Company-only */}
          <Route element={<RequireAuth persona="company" />}>
            <Route path="/site/dashboard/company" element={<CompanyDashboard />} />
            <Route path="/site/dashboard/krew" element={<KrewPage />} />
            <Route path="/site/discover" element={<DiscoverPage />} />
            <Route path="/site/dashboard/jobs" element={<JobPostsPage />} />
            <Route path="/site/dashboard/applicants" element={<AllApplicantsPage />} />
            <Route
              path="/site/dashboard/applicants/worker/:workerId"
              element={<CompanyApplicantProfilePage />}
            />
            <Route path="/site/pipeline" element={<PipelinePage />} />
            <Route path="/site/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/site/settings/profile" replace />} />
              <Route path="profile" element={<CompanyProfileEditPage />} />
              <Route path="pipeline" element={<PipelineSettingsPage />} />
              <Route
                path="pipeline-tasks"
                element={<Navigate to="/site/settings/pipeline" replace />}
              />
              <Route path="account" element={<AccountSettingsPage />} />
            </Route>
            <Route path="/site/post-job" element={<PostJobPage />} />
            <Route path="/site/post-job/:id" element={<PostJobPage />} />
            <Route
              path="/site/company/edit"
              element={<Navigate to="/site/settings/profile" replace />}
            />
          </Route>

          {/* Requires auth (any persona) */}
          <Route element={<RequireAuth />}>
            <Route path="/site/messages" element={<MessagesPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/site" replace />} />
        </Route>
      </Routes>
    </Suspense>
  </>
)
