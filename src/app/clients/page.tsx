'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search, Home, Calendar, User, AlertCircle, Heart, Pill, Activity } from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  nhs_number: string | null
  room_number: string | null
  admission_date: string | null
  is_active: boolean
  care_home_id: string
  profile_image_url: string | null
  medical_conditions: string | null
  allergies: string | null
  medications: string | null
  mobility_notes: string | null
  care_homes: {
    id: string
    name: string
  } | null
}

interface CareHome {
  id: string
  name: string
}

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [careHomes, setCareHomes] = useState<CareHome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCareHome, setSelectedCareHome] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, selectedCareHome, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get manager's assigned care homes if applicable
      let assignedHomeIds: string[] = []
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

        assignedHomeIds = assignments.map(a => a.care_home_id)
        
        if (assignedHomeIds.length === 0) {
          // Manager has no assigned homes, show empty state
          setClients([])
          setCareHomes([])
          setLoading(false)
          return
        }
      }
      
      // Fetch clients with care home info
      let clientsQuery = supabase
        .from('clients')
        .select(`
          *,
          care_homes (
            id,
            name
          )
        `)
        .order('last_name', { ascending: true })

      // Filter by manager's assigned homes
      if (profile?.role === 'manager' && assignedHomeIds.length > 0) {
        clientsQuery = clientsQuery.in('care_home_id', assignedHomeIds)
      }

      const { data: clientsData, error: clientsError } = await clientsQuery

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        setError('Failed to load clients')
        return
      }

      // Fetch care homes for filter
      let homesQuery = supabase
        .from('care_homes')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

      // Filter care homes list by manager's assignments
      if (profile?.role === 'manager' && assignedHomeIds.length > 0) {
        homesQuery = homesQuery.in('id', assignedHomeIds)
      }

      const { data: homesData, error: homesError } = await homesQuery

      if (homesError) {
        console.error('Error fetching care homes:', homesError)
      }

      setClients(clientsData || [])
      setCareHomes(homesData || [])
    } catch (err) {
      console.error('Exception fetching data:', err)
      setError('An error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = [...clients]

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(client => client.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(client => !client.is_active)
    }

    // Filter by care home
    if (selectedCareHome !== 'all') {
      filtered = filtered.filter(client => client.care_home_id === selectedCareHome)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(client => 
        client.first_name.toLowerCase().includes(term) ||
        client.last_name.toLowerCase().includes(term) ||
        client.nhs_number?.toLowerCase().includes(term) ||
        client.room_number?.toLowerCase().includes(term)
      )
    }

    setFilteredClients(filtered)
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="text-gray-600 mt-1">Manage client records and care information</p>
            </div>
            {(profile?.role === 'business_owner' || profile?.role === 'manager') && (
              <Button asChild>
                <Link href="/clients/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  {clients.filter(c => !c.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Care Homes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{careHomes.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Name, NHS number, room..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Care Home Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Care Home</label>
                  <Select value={selectedCareHome} onValueChange={setSelectedCareHome}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Care Homes</SelectItem>
                      {careHomes.map((home) => (
                        <SelectItem key={home.id} value={home.id}>
                          {home.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Button onClick={fetchData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && clients.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                  <p className="text-gray-600 mb-4">Get started by adding your first client.</p>
                  {(profile?.role === 'business_owner' || profile?.role === 'manager') && (
                    <Button asChild>
                      <Link href="/clients/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {!loading && !error && clients.length > 0 && filteredClients.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clients List */}
          {!loading && !error && filteredClients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Profile Header Section */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 pb-12">
                    <div className="flex flex-col items-center">
                      {/* Round Profile Image */}
                      <div className="relative w-24 h-24 mb-3">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                          {client.profile_image_url ? (
                            <img
                              src={client.profile_image_url}
                              alt={`${client.first_name} ${client.last_name}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Replace with placeholder if image fails to load
                                e.currentTarget.style.display = 'none'
                                const parent = e.currentTarget.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500">
                                      <svg class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                  `
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500">
                              <User className="h-12 w-12 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Active Status Indicator */}
                        <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white ${client.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      
                      {/* Client Name & Age */}
                      <h3 className="text-lg font-bold text-gray-900 text-center">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {calculateAge(client.date_of_birth)} years • {client.gender}
                      </p>
                    </div>
                  </div>

                  <CardContent className="space-y-4 -mt-6">
                    {/* Care Home & Room */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      {client.care_homes && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Home className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{client.care_homes.name}</span>
                        </div>
                      )}
                      {client.room_number && (
                        <div className="text-sm text-gray-600">
                          Room {client.room_number}
                        </div>
                      )}
                    </div>

                    {/* Medical Alerts Section - Only show if there are alerts */}
                    {(client.medical_conditions || client.allergies || client.medications || client.mobility_notes) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Care Alerts</h4>
                        
                        {/* Medical Conditions */}
                        {client.medical_conditions && (
                          <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-lg p-2">
                            <Heart className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-red-900">Medical Conditions</div>
                              <div className="text-xs text-red-700 line-clamp-2">{client.medical_conditions}</div>
                            </div>
                          </div>
                        )}

                        {/* Allergies */}
                        {client.allergies && (
                          <div className="flex gap-2 items-start bg-orange-50 border border-orange-200 rounded-lg p-2">
                            <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-orange-900">Allergies</div>
                              <div className="text-xs text-orange-700 line-clamp-2">{client.allergies}</div>
                            </div>
                          </div>
                        )}

                        {/* Medications */}
                        {client.medications && (
                          <div className="flex gap-2 items-start bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <Pill className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-blue-900">Medications</div>
                              <div className="text-xs text-blue-700 line-clamp-2">{client.medications}</div>
                            </div>
                          </div>
                        )}

                        {/* Mobility Notes */}
                        {client.mobility_notes && (
                          <div className="flex gap-2 items-start bg-purple-50 border border-purple-200 rounded-lg p-2">
                            <Activity className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-purple-900">Mobility</div>
                              <div className="text-xs text-purple-700 line-clamp-2">{client.mobility_notes}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="space-y-1 text-xs text-gray-600">
                      {client.nhs_number && (
                        <div>
                          <span className="font-medium">NHS:</span> {client.nhs_number}
                        </div>
                      )}
                      {client.admission_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Admitted {formatDate(client.admission_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <Button asChild variant="default" size="sm" className="w-full bg-gradient-primary hover:opacity-90">
                      <Link href={`/clients/${client.id}`}>
                        View Full Profile
                      </Link>
                    </Button>
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
