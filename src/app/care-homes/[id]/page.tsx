'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Home, 
  Edit,
  MapPin,
  Phone,
  Mail,
  Bed,
  Users,
  User,
  Calendar,
  Building,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
  cqc_rating: string | null
  cqc_registration_number: string | null
  is_active: boolean
  image_url: string | null
  created_at: string
}

interface Client {
  id: string
  first_name: string
  last_name: string
  room_number: string | null
  date_of_birth: string
  is_active: boolean
  admission_date: string | null
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  phone: string | null
}

export default function CareHomeDetailPage() {
  const { profile } = useAuth()
  const params = useParams()
  const careHomeId = params?.id as string
  const [careHome, setCareHome] = useState<CareHome | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (careHomeId) {
      fetchData()
    }
  }, [careHomeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch care home details
      const { data: careHomeData, error: careHomeError } = await supabase
        .from('care_homes')
        .select('*')
        .eq('id', careHomeId)
        .single()

      if (careHomeError) {
        console.error('Error fetching care home:', careHomeError)
        setError('Failed to load care home details')
        return
      }

      // Fetch clients in this care home
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, room_number, date_of_birth, is_active, admission_date')
        .eq('care_home_id', careHomeId)
        .order('last_name', { ascending: true })

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      }

      // Fetch staff assigned to this care home
      const { data: staffData, error: staffError } = await supabase
        .from('user_care_homes')
        .select(`
          profiles (
            id,
            first_name,
            last_name,
            email,
            role,
            phone
          )
        `)
        .eq('care_home_id', careHomeId)

      if (staffError) {
        console.error('Error fetching staff:', staffError)
      }

      setCareHome(careHomeData)
      setClients(clientsData || [])
      
      // Extract staff from nested structure
      const extractedStaff = (staffData?.map(item => item.profiles).filter(Boolean) || []) as Staff[]
      setStaff(extractedStaff)
      
    } catch (err) {
      console.error('Exception fetching data:', err)
      setError('An error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }

  const getCareTypeDisplay = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
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

  const getRoleDisplay = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'business_owner':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'carer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !careHome) {
    return (
      <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
        <DashboardLayout>
          <div className="space-y-6">
            <Button asChild variant="ghost">
              <Link href="/care-homes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Care Homes
              </Link>
            </Button>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">{error || 'Care home not found'}</p>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const occupancyPercentage = (careHome.current_occupancy / careHome.capacity) * 100
  const availableBeds = careHome.capacity - careHome.current_occupancy
  const activeClients = clients.filter(c => c.is_active).length

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/care-homes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Care Homes
              </Link>
            </Button>
          </div>

          {/* Care Home Image Banner */}
          {careHome.image_url && (
            <div className="relative h-72 md:h-96 w-full rounded-xl overflow-hidden shadow-xl">
              <img
                src={careHome.image_url}
                alt={careHome.name}
                className="w-full h-full object-cover object-center"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                <div className="p-6 md:p-8 text-white w-full">
                  <h1 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">{careHome.name}</h1>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getCareTypeColor(careHome.care_home_type)}>
                      {getCareTypeDisplay(careHome.care_home_type)}
                    </Badge>
                    <Badge variant={careHome.is_active ? "default" : "outline"} className="bg-white/20 text-white border-white/40">
                      {careHome.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {careHome.cqc_rating && (
                      <Badge variant="outline" className="bg-yellow-100/90 text-yellow-900 border-yellow-200">
                        CQC: {careHome.cqc_rating}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header without Image */}
          {!careHome.image_url && (
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{careHome.name}</h1>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getCareTypeColor(careHome.care_home_type)}>
                      {getCareTypeDisplay(careHome.care_home_type)}
                    </Badge>
                    <Badge variant={careHome.is_active ? "default" : "outline"}>
                      {careHome.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {careHome.cqc_rating && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                        CQC: {careHome.cqc_rating}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {profile?.role === 'business_owner' && (
                <Button asChild>
                  <Link href={`/care-homes/${careHome.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Care Home
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Edit Button (for when image exists) */}
          {careHome.image_url && profile?.role === 'business_owner' && (
            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/care-homes/${careHome.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Care Home
                </Link>
              </Button>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  Total Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{careHome.capacity}</div>
                <p className="text-xs text-gray-500">beds</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Current Occupancy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{careHome.current_occupancy}</div>
                <p className="text-xs text-gray-500">{occupancyPercentage.toFixed(1)}% occupied</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Available Beds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
                <p className="text-xs text-gray-500">beds available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeClients}</div>
                <p className="text-xs text-gray-500">of {clients.length} total</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
              <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{careHome.phone}</span>
                    </div>
                    {careHome.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{careHome.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{careHome.address}</p>
                    <p className="text-gray-700">{careHome.city}</p>
                    <p className="text-gray-700">{careHome.postcode}</p>
                  </CardContent>
                </Card>

                {/* CQC Information */}
                {(careHome.cqc_rating || careHome.cqc_registration_number) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        CQC Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {careHome.cqc_rating && (
                        <div>
                          <p className="text-gray-600 text-sm">CQC Rating</p>
                          <p className="font-medium text-lg">{careHome.cqc_rating}</p>
                        </div>
                      )}
                      {careHome.cqc_registration_number && (
                        <div>
                          <p className="text-gray-600 text-sm">Registration Number</p>
                          <p className="font-medium">{careHome.cqc_registration_number}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Occupancy Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Occupancy Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Occupied</span>
                        <span className="font-medium">{careHome.current_occupancy} / {careHome.capacity}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all"
                          style={{ width: `${occupancyPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-gray-600 text-xs">Occupancy Rate</p>
                        <p className="text-xl font-bold text-blue-600">{occupancyPercentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Available</p>
                        <p className="text-xl font-bold text-green-600">{availableBeds}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-6">
              {clients.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                      <p className="text-gray-600 mb-4">This care home has no clients assigned.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <Card key={client.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              {client.first_name} {client.last_name}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              <Badge variant={client.is_active ? "default" : "outline"} className="text-xs">
                                {client.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {client.room_number && (
                          <div className="text-sm">
                            <span className="text-gray-600">Room:</span>
                            <span className="font-medium ml-2">{client.room_number}</span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-medium ml-2">{calculateAge(client.date_of_birth)} years</span>
                        </div>
                        {client.admission_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Admitted: {formatDate(client.admission_date)}</span>
                          </div>
                        )}
                        <div className="pt-2">
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
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-6">
              {staff.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No staff assigned</h3>
                      <p className="text-gray-600 mb-4">This care home has no staff members assigned.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((member) => (
                    <Card key={member.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          {member.first_name} {member.last_name}
                        </CardTitle>
                        <CardDescription>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {getRoleDisplay(member.role)}
                          </Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700 truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-700">{member.phone}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
