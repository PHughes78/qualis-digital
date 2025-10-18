'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Users,
  Plus,
  Search,
  Home,
  Calendar,
  User,
  AlertCircle,
  Heart,
  Pill,
  Activity,
  Utensils,
  MessageCircle,
  Baby,
  ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ClientType } from '@/lib/database.types'

interface Client {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  client_type: ClientType
  nhs_number: string | null
  room_number: string | null
  admission_date: string | null
  is_active: boolean
  care_home_id: string
  photo_url: string | null
  profile_image_url?: string | null
  medical_conditions: string | null
  allergies: string | null
  medications: string | null
  mobility_notes: string | null
  dietary_requirements: string | null
  communication_notes: string | null
  care_homes: {
    id: string
    name: string
  } | null
}

interface CareHome {
  id: string
  name: string
}

interface CareIndicator {
  icon: LucideIcon
  label: string
  description: string
  tone: string
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
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | ClientType>('all')
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, selectedCareHome, statusFilter, clientTypeFilter])

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

      const clientsWithPhotos: Client[] = await Promise.all(
        (clientsData ?? []).map(async (clientRow) => {
          let profileImageUrl: string | null = null
          if (clientRow.photo_url) {
            const { data: signed } = await supabase.storage
              .from('client-pictures')
              .createSignedUrl(clientRow.photo_url, 60 * 30)
            profileImageUrl = signed?.signedUrl ?? null
          }

          return {
            ...clientRow,
            profile_image_url: profileImageUrl,
          }
        })
      )

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

      setClients(clientsWithPhotos)
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

    if (clientTypeFilter !== 'all') {
      filtered = filtered.filter(client => client.client_type === clientTypeFilter)
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

  const getClientTypeTheme = (type: ClientType) => {
    if (type === 'child') {
      return {
        gradient: 'from-rose-50 via-orange-50 to-amber-50',
        badgeClass: 'border-rose-300 bg-rose-100 text-rose-700',
        badgeLabel: 'Child in care',
        statusRing: 'border-rose-200',
        avatarGlow: 'shadow-[0_0_0_4px] shadow-rose-100',
      }
    }
    return {
      gradient: 'from-blue-50 via-indigo-50 to-slate-50',
      badgeClass: 'border-blue-300 bg-blue-100 text-blue-700',
      badgeLabel: 'Adult in care',
      statusRing: 'border-blue-200',
      avatarGlow: 'shadow-[0_0_0_4px] shadow-blue-100',
    }
  }

  const buildCareIndicators = (client: Client): CareIndicator[] => {
    const indicators: CareIndicator[] = []

    if (client.allergies) {
      indicators.push({
        icon: AlertCircle,
        label: 'Allergies',
        description: client.allergies,
        tone: 'bg-orange-100 text-orange-700 border border-orange-200',
      })
    }

    if (client.medical_conditions) {
      indicators.push({
        icon: Heart,
        label: 'Medical conditions',
        description: client.medical_conditions,
        tone: 'bg-red-100 text-red-700 border border-red-200',
      })
    }

    if (client.medications) {
      indicators.push({
        icon: Pill,
        label: 'Medications',
        description: client.medications,
        tone: 'bg-sky-100 text-sky-700 border border-sky-200',
      })
    }

    if (client.dietary_requirements) {
      indicators.push({
        icon: Utensils,
        label: 'Dietary',
        description: client.dietary_requirements,
        tone: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      })
    }

    if (client.mobility_notes) {
      indicators.push({
        icon: Activity,
        label: 'Mobility',
        description: client.mobility_notes,
        tone: 'bg-purple-100 text-purple-700 border border-purple-200',
      })
    }

    if (client.communication_notes) {
      indicators.push({
        icon: MessageCircle,
        label: 'Communication',
        description: client.communication_notes,
        tone: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      })
    }

    return indicators
  }

  const totalClients = clients.length
  const activeClientCount = clients.filter((client) => client.is_active).length
  const childClientCount = clients.filter((client) => client.client_type === 'child').length
  const adultClientCount = totalClients - childClientCount

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
                <div className="text-2xl font-bold">{totalClients}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeClientCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Adults in Care</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-700">{adultClientCount}</div>
                <p className="mt-1 text-xs text-gray-500">Includes respite and residential placements.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Children in Care</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{childClientCount}</div>
                <p className="mt-1 text-xs text-rose-500">Safeguarding reminders enabled.</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-gray-500">
            {careHomes.length} care homes available. Use the filters below to focus by location or care model.
          </p>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>{careHomes.length} care homes available for placement.</span>
                <span>Combine filters to focus on specific teams or risk profiles.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                {/* Client Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Client Type</label>
                  <Select
                    value={clientTypeFilter}
                    onValueChange={(value) => setClientTypeFilter(value as 'all' | ClientType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="adult">Adults</SelectItem>
                      <SelectItem value="child">Children</SelectItem>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => {
                const theme = getClientTypeTheme(client.client_type)
                const careIndicators = buildCareIndicators(client)
                const age = calculateAge(client.date_of_birth)
                const isChild = client.client_type === 'child'

                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Card className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-argon">
                    <div className={`bg-gradient-to-br ${theme.gradient} p-6 pb-12`}>
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`relative mb-3 h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg ${theme.avatarGlow}`}
                        >
                          {client.profile_image_url ? (
                            <img
                              src={client.profile_image_url}
                              alt={`${client.first_name} ${client.last_name}`}
                              className="h-full w-full rounded-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
                              <User className="h-12 w-12 text-white" />
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-3 ${theme.statusRing} ${
                              client.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                          {client.first_name} {client.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {age} {age === 1 ? 'year' : 'years'} • {client.gender}
                        </p>

                        <Badge className={`mt-3 flex items-center gap-1 text-xs ${theme.badgeClass}`}>
                          {isChild ? <Baby className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                          {theme.badgeLabel}
                        </Badge>
                      </div>
                    </div>

                    {careIndicators.length > 0 && (
                      <div className="-mt-8 flex flex-wrap justify-center gap-2 px-4">
                        {careIndicators.map((indicator) => (
                          <span
                            key={indicator.label}
                            title={indicator.description}
                            aria-label={indicator.description}
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${indicator.tone} shadow-sm transition-colors hover:opacity-90`}
                          >
                            <indicator.icon className="h-3.5 w-3.5" />
                            {indicator.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <CardContent className="space-y-4 pb-6 pt-6">
                      {careIndicators.length > 0 && (
                        <p className="text-center text-[11px] uppercase tracking-wide text-gray-400">
                          Hover a badge above to read the summary
                        </p>
                      )}
                      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        {client.care_homes ? (
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Home className="h-4 w-4" />
                            </span>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900">{client.care_homes.name}</p>
                              {client.room_number ? (
                                <p className="text-xs text-gray-600">Room {client.room_number}</p>
                              ) : (
                                <p className="text-xs text-gray-400">Room not assigned</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No care home assigned</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                        {client.nhs_number ? (
                          <div>
                            <span className="font-medium text-gray-800">NHS</span>
                            <p className="mt-1 font-semibold tracking-wide text-gray-700">{client.nhs_number}</p>
                          </div>
                        ) : null}
                        <div>
                          <span className="font-medium text-gray-800">Admitted</span>
                          <p className="mt-1 text-gray-700">
                            {client.admission_date ? formatDate(client.admission_date) : 'Not recorded'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Care duration</span>
                          <p className="mt-1 text-gray-700">
                            {client.admission_date
                              ? `${Math.max(
                                  1,
                                  Math.floor(
                                    (Date.now() - new Date(client.admission_date).getTime()) / (1000 * 60 * 60 * 24),
                                  ),
                                )} days`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Status</span>
                          <p className="mt-1 text-gray-700">{client.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>
                      <div className="text-center text-sm font-semibold text-blue-600 transition group-hover:text-blue-700">
                        View profile
                      </div>
                    </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
