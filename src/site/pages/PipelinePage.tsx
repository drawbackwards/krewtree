import React from 'react'
import { useAuth } from '../context/AuthContext'
import { PipelineKanban } from '../components/PipelineKanban/PipelineKanban'

const PipelinePage: React.FC = () => {
  const { user } = useAuth()
  if (!user) return null
  return <PipelineKanban companyId={user.id} />
}

export default PipelinePage
