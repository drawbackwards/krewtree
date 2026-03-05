import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

export const SiteRouter: React.FC = () => {
  const [persona, setPersona] = useState<Persona>('worker')

  return (
    <>
      <Navbar persona={persona} onPersonaChange={setPersona} />
      <Routes>
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
      </Routes>
    </>
  )
}
