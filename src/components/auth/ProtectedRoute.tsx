'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    console.log('ProtectedRoute: State -', { user: !!user, profile: !!profile, loading })
    
    if (!loading) {
      if (!user) {
        console.log('ProtectedRoute: No user, redirecting to /auth')
        router.push('/auth')
        return
      }

      if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        console.log('ProtectedRoute: User role not allowed, redirecting to /unauthorized')
        router.push('/unauthorized')
        return
      }
    }
  }, [user, profile, loading, allowedRoles, router])

  // Safety timeout - if loading takes more than 10 seconds, show error
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.error('ProtectedRoute: Loading timeout exceeded')
        setShowTimeout(true)
      }, 10000)
      return () => clearTimeout(timeout)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        {showTimeout && (
          <div className="mt-4 text-center">
            <p className="text-red-600">Loading is taking longer than expected...</p>
            <p className="text-sm text-gray-600 mt-2">Check the browser console for errors.</p>
            <button 
              onClick={() => router.push('/auth')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!user || (allowedRoles && profile && !allowedRoles.includes(profile.role))) {
    return null
  }

  return <>{children}</>
}