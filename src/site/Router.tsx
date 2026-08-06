import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
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
const TemplatesSettingsPage = lazy(() => import('./pages/Settings/TemplatesSettingsPage'))
const AccountSettingsPage = lazy(() =>
  import('./pages/Settings/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage }))
)
const TeamSettingsPage = lazy(() => import('./pages/Settings/TeamSettingsPage'))
const PersonalProfilePage = lazy(() =>
  import('./pages/Settings/PersonalProfilePage').then((m) => ({ default: m.PersonalProfilePage }))
)
const AcceptInvitePage = lazy(() =>
  import('./pages/AcceptInvitePage').then((m) => ({ default: m.AcceptInvitePage }))
)
const NotificationsSettingsPage = lazy(() =>
  import('./pages/Settings/NotificationsSettingsPage').then((m) => ({
    default: m.NotificationsSettingsPage,
  }))
)
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
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
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)
const VerifyEmailPage = lazy(() =>
  import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
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
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (persona && userPersona !== persona) {
    return (
      <Navigate
        to={userPersona === 'company' ? '/dashboard/company' : '/dashboard/worker'}
        replace
      />
    )
  }
  return <Outlet />
}

// Settings index → the first tab that persona can see. Companies land on their
// profile; workers only have personal preferences.
const SettingsIndexRedirect: React.FC = () => {
  const { persona } = useAuth()
  return (
    <Navigate
      to={persona === 'company' ? '/settings/profile' : '/settings/notifications'}
      replace
    />
  )
}

// Legacy `/dashboard/applicants/worker/:workerId` → unified public profile.
const RedirectWorkerToProfile: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>()
  return <Navigate to={`/profile/${workerId}`} replace />
}

export const SiteRouter: React.FC = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ── Auth routes — no Navbar ──────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupRolePage />} />
        <Route path="/signup/worker" element={<WorkerSignupPage />} />
        <Route path="/signup/company" element={<CompanySignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* ── App routes — full Navbar via AppLayout ───────────────────── */}
        <Route element={<AppLayout />}>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          {/* Analytics is an owner-only tab inside JobDetailPage; this path just
              deep-links that tab (JobDetailPage gates it to the job owner). */}
          <Route path="/jobs/:id/analytics" element={<JobDetailPage />} />
          <Route path="/profile/:id" element={<WorkerProfilePage />} />
          <Route path="/company/:id" element={<CompanyProfilePage />} />
          {/* Company invite acceptance — works logged-out (prompts sign-in). */}
          <Route path="/join" element={<AcceptInvitePage />} />

          {/* Worker-only */}
          <Route element={<RequireAuth persona="worker" />}>
            <Route path="/dashboard/worker" element={<WorkerDashboard />} />
            <Route path="/profile/edit" element={<WorkerProfileEditPage />} />
            <Route path="/profile/create" element={<WorkerProfileEditPage />} />
            <Route path="/saved-jobs" element={<SavedJobsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/referrals" element={<ReferralPage />} />
          </Route>

          {/* Company-only */}
          <Route element={<RequireAuth persona="company" />}>
            <Route path="/dashboard/company" element={<CompanyDashboard />} />
            <Route path="/dashboard/krew" element={<KrewPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/dashboard/jobs" element={<JobPostsPage />} />
            <Route path="/dashboard/applicants" element={<AllApplicantsPage />} />
            {/* Legacy applicant-profile URL — the page merged into the public
                worker profile. Redirect (preserving the worker id) for any
                bookmarks/deep links still pointing here. */}
            <Route
              path="/dashboard/applicants/worker/:workerId"
              element={<RedirectWorkerToProfile />}
            />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/post-job" element={<PostJobPage />} />
            <Route path="/post-job/:id" element={<PostJobPage />} />
            <Route path="/company/edit" element={<Navigate to="/settings/profile" replace />} />
          </Route>

          {/* Requires auth (any persona) */}
          <Route element={<RequireAuth />}>
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            {/* Settings shell is shared: the Notifications tab is personal and
                available to both personas; organization tabs are nested behind
                a company guard below. */}
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<SettingsIndexRedirect />} />
              <Route path="my-profile" element={<PersonalProfilePage />} />
              <Route path="notifications" element={<NotificationsSettingsPage />} />
              <Route element={<RequireAuth persona="company" />}>
                <Route path="profile" element={<CompanyProfileEditPage />} />
                <Route path="pipeline" element={<PipelineSettingsPage />} />
                <Route path="templates" element={<TemplatesSettingsPage />} />
                <Route
                  path="pipeline-tasks"
                  element={<Navigate to="/settings/pipeline" replace />}
                />
                <Route path="account" element={<AccountSettingsPage />} />
                <Route path="team" element={<TeamSettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all — real 404 page (keeps the navbar) */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  </>
)
