'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Plus, Users, Bed, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

interface CareHome {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  phone: string
  email: string | null
  care_home_type: string
  capacity: number
  current_occupancy: number
  is_active: boolean
  image_url: string | null
  created_at: string
}

export default function CareHomesPage() {
  const { profile } = useAuth()
  const [careHomes, setCareHomes] = useState<CareHome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchCareHomes()
    }
  }, [profile])

  const fetchCareHomes = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('care_homes')
        .select('*')
        .order('name', { ascending: true })

      // If user is a manager, only show their assigned care homes
      if (profile?.role === 'manager') {
        const { data: assignments, error: assignError } = await supabase
          .from('manager_care_homes')
          .select('care_home_id')
          .eq('manager_id', profile.id)

        if (assignError) {
          console.error('Error fetching manager assignments:', assignError)
          setError('Failed to load care home assignments')
          return
        }

        const assignedHomeIds = assignments.map(a => a.care_home_id)
        
        if (assignedHomeIds.length === 0) {
          // Manager has no assigned homes
          setCareHomes([])
          setLoading(false)
          return
        }

        query = query.in('id', assignedHomeIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching care homes:', error)
        setError('Failed to load care homes')
        return
      }

      setCareHomes(data || [])
    } catch (err) {
      console.error('Exception fetching care homes:', err)
      setError('An error occurred while loading care homes')
    } finally {
      setLoading(false)
    }
  }

  const getCareTypeColor = (type: string) => {
    switch (type) {
      case 'residential':
        return 'bg-blue-100 text-blue-800'
      case 'nursing':
        return 'bg-green-100 text-green-800'
      case 'dementia':
        return 'bg-purple-100 text-purple-800'
      case 'learning_disabilities':
        return 'bg-yellow-100 text-yellow-800'
      case 'mental_health':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCareTypeDisplay = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Care Homes</h1>
              <p className="text-gray-600 mt-1">Manage your care facilities</p>
            </div>
            {profile?.role === 'business_owner' && (
              <Button asChild>
                <Link href="/care-homes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Care Home
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Homes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{careHomes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {careHomes.reduce((sum, home) => sum + home.capacity, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Current Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {careHomes.reduce((sum, home) => sum + home.current_occupancy, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Homes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {careHomes.filter(home => home.is_active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">{error}</p>
                <div className="flex justify-center mt-4">
                  <Button onClick={fetchCareHomes} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Care Homes List */}
          {!loading && !error && careHomes.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No care homes yet</h3>
                  <p className="text-gray-600 mb-4">Get started by adding your first care home.</p>
                  {profile?.role === 'business_owner' && (
                    <Button asChild>
                      <Link href="/care-homes/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Care Home
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && careHomes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {careHomes.map((home) => (
                <Card key={home.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Care Home Image - Always shown with placeholder if no image */}
                  <div className="relative h-56 w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
                    {home.image_url ? (
                      <img
                        src={home.image_url}
                        alt={home.name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                        onError={(e) => {
                          // Replace with placeholder if image fails to load
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center">
                                <svg class="h-16 w-16 text-blue-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span class="text-sm text-blue-400 font-medium">Care Home</span>
                              </div>
                            `
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Home className="h-16 w-16 text-blue-300 mb-2" />
                        <span className="text-sm text-blue-400 font-medium">Care Home</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Home className="h-5 w-5 text-blue-600" />
                          {home.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <Badge className={getCareTypeColor(home.care_home_type)}>
                            {getCareTypeDisplay(home.care_home_type)}
                          </Badge>
                        </CardDescription>
                      </div>
                      {!home.is_active && (
                        <Badge variant="outline" className="text-gray-500">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700">{home.address}</p>
                        <p className="text-gray-600">{home.city}, {home.postcode}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{home.phone}</span>
                      </div>
                      {home.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{home.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Occupancy */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Occupancy</span>
                        </div>
                        <span className={`text-sm font-semibold ${getOccupancyColor(home.current_occupancy, home.capacity)}`}>
                          {home.current_occupancy} / {home.capacity}
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(home.current_occupancy / home.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/care-homes/${home.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {profile?.role === 'business_owner' && (
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/care-homes/${home.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
