'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CarerDashboard from '@/components/dashboards/CarerDashboard'
import ManagerDashboard from '@/components/dashboards/ManagerDashboard'
import BusinessOwnerDashboard from '@/components/dashboards/BusinessOwnerDashboard'

export default function DashboardPage() {
  const { profile } = useAuth()

  const renderDashboard = () => {
    if (!profile) return null

    switch (profile.role) {
      case 'carer':
        return <CarerDashboard />
      case 'manager':
        return <ManagerDashboard />
      case 'business_owner':
        return <BusinessOwnerDashboard />
      default:
        return <CarerDashboard />
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {renderDashboard()}
      </DashboardLayout>
    </ProtectedRoute>
  )
}