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
import { Users, Plus, Search, Home, Calendar, User } from 'lucide-react'
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
      
      // Fetch clients with care home info
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          care_homes (
            id,
            name
          )
        `)
        .order('last_name', { ascending: true })

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        setError('Failed to load clients')
        return
      }

      // Fetch care homes for filter
      const { data: homesData, error: homesError } = await supabase
        .from('care_homes')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

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
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          {client.first_name} {client.last_name}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div className="flex gap-2">
                            <Badge variant={client.is_active ? "default" : "outline"}>
                              {client.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-gray-600">
                              {calculateAge(client.date_of_birth)} years
                            </Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Care Home */}
                    {client.care_homes && (
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{client.care_homes.name}</span>
                      </div>
                    )}

                    {/* Room Number */}
                    {client.room_number && (
                      <div className="text-sm">
                        <span className="text-gray-600">Room: </span>
                        <span className="font-medium text-gray-900">{client.room_number}</span>
                      </div>
                    )}

                    {/* NHS Number */}
                    {client.nhs_number && (
                      <div className="text-sm">
                        <span className="text-gray-600">NHS: </span>
                        <span className="font-mono text-gray-900">{client.nhs_number}</span>
                      </div>
                    )}

                    {/* Admission Date */}
                    {client.admission_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Admitted: </span>
                        <span className="text-gray-700">{formatDate(client.admission_date)}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/clients/${client.id}`}>
                          View Profile
                        </Link>
                      </Button>
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
