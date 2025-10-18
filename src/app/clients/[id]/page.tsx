'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DocumentsManager from '@/components/documents/DocumentsManager'
import DocumentsOverlay from '@/components/documents/DocumentsOverlay'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Home,
  MapPin,
  Heart,
  Pill,
  AlertTriangle,
  FileText,
  Edit,
  Utensils,
  MessageCircle,
  Baby,
  Activity,
  Camera,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { ClientType } from '@/lib/database.types'

interface Client {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  date_of_birth: string
  gender: string
  client_type: ClientType
  nhs_number: string | null
  room_number: string | null
  admission_date: string | null
  discharge_date: string | null
  address: string | null
  postcode: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  gp_name: string | null
  gp_practice: string | null
  gp_phone: string | null
  dietary_requirements: string | null
  allergies: string | null
  medical_conditions: string | null
  medications: string | null
  mobility_notes: string | null
  communication_notes: string | null
  is_active: boolean
  care_home_id: string
  care_homes: {
    id: string
    name: string
    address: string
    postcode: string
    phone: string
  } | null
}

interface CareIndicator {
  icon: LucideIcon
  label: string
  description: string
  tone: string
}

export default function ClientDetailPage() {
  const { profile } = useAuth()
  const params = useParams()
  const clientId = params?.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [documentsOverlayOpen, setDocumentsOverlayOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          care_homes (
            id,
            name,
            address,
            postcode,
            phone
          )
        `)
        .eq('id', clientId)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
        setError('Failed to load client details')
        return
      }

      setClient(data)
      await loadPhoto(data.photo_url ?? null)
    } catch (err) {
      console.error('Exception fetching client:', err)
      setError('An error occurred while loading client')
    } finally {
      setLoading(false)
    }
  }

  const loadPhoto = async (path: string | null) => {
    if (!path) {
      setPhotoUrl(null)
      return
    }

    const { data, error } = await supabase.storage.from('client-pictures').createSignedUrl(path, 60 * 60)

    if (error || !data) {
      console.error('Failed to load client photo', error)
      setPhotoUrl(null)
      return
    }

    setPhotoUrl(data.signedUrl)
  }

  const handleAvatarClick = () => {
    if (uploadingPhoto) return
    fileInputRef.current?.click()
  }

  const handlePhotoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !client) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const uniqueId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}`
      const filePath = `${client.id}/${uniqueId}.${fileExt}`

      if (client.photo_url) {
        await supabase.storage.from('client-pictures').remove([client.photo_url]).catch(() => undefined)
      }

      const { error: uploadError } = await supabase.storage
        .from('client-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Failed to upload client photo', uploadError)
        setError('Unable to upload photo. Please try again.')
        return
      }

      const { error: updateError } = await supabase
        .from('clients')
        .update({ photo_url: filePath })
        .eq('id', client.id)

      if (updateError) {
        console.error('Failed to save client photo path', updateError)
        setError('Unable to save photo.')
        return
      }

      await loadPhoto(filePath)
      setClient((previous) => (previous ? { ...previous, photo_url: filePath } : previous))
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
    if (!dateString) return 'Not recorded'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getGenderDisplay = (gender: string) => {
    return gender.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getClientTypeTheme = (type: ClientType) => {
    if (type === 'child') {
      return {
        gradient: 'from-rose-50 via-orange-50 to-amber-50',
        badgeClass: 'border-rose-300 bg-rose-100 text-rose-700',
        badgeLabel: 'Child in care',
        iconBackground: 'bg-rose-100 text-rose-600',
      }
    }

    return {
      gradient: 'from-blue-50 via-indigo-50 to-slate-50',
      badgeClass: 'border-blue-300 bg-blue-100 text-blue-700',
      badgeLabel: 'Adult in care',
      iconBackground: 'bg-blue-100 text-blue-600',
    }
  }

  const buildCareIndicators = (client: Client): CareIndicator[] => {
    const indicators: CareIndicator[] = []

    if (client.allergies) {
      indicators.push({
        icon: AlertTriangle,
        label: 'Allergies',
        description: client.allergies,
        tone: 'bg-orange-100 text-orange-700 border border-orange-200',
      })
    }

    if (client.medical_conditions) {
      indicators.push({
        icon: Heart,
        label: 'Medical',
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

  if (error || !client) {
    return (
      <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
        <DashboardLayout>
          <div className="space-y-6">
            <Button asChild variant="ghost">
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </Button>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">{error || 'Client not found'}</p>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const theme = getClientTypeTheme(client.client_type)
  const careIndicators = buildCareIndicators(client)
  const age = calculateAge(client.date_of_birth)
  const isChild = client.client_type === 'child'

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
      <DashboardLayout>
        <div className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelected}
          />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button asChild variant="ghost" className="w-fit">
                <Link href="/clients">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setDocumentsOverlayOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Button>
            </div>

            <Card className={`overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br ${theme.gradient} shadow-soft`}>
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-4">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={uploadingPhoto}
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/70 bg-white/80 shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    title="Update profile photo"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${client.first_name} ${client.last_name}`}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center rounded-2xl ${theme.iconBackground}`}>
                        {isChild ? <Baby className="h-8 w-8" /> : <User className="h-8 w-8" />}
                      </div>
                    )}
                    <span className="absolute -bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </span>
                  </button>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {client.first_name} {client.last_name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={theme.badgeClass}>{theme.badgeLabel}</Badge>
                      <Badge variant={client.is_active ? 'default' : 'outline'}>
                        {client.is_active ? 'Active placement' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {age} {age === 1 ? 'year' : 'years'}
                      </Badge>
                      <Badge variant="outline">{getGenderDisplay(client.gender)}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-gray-700 md:text-right">
                  <p>
                    <span className="font-semibold text-gray-900">NHS:</span>{' '}
                    {client.nhs_number ?? 'Not recorded'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Admitted:</span>{' '}
                    {formatDate(client.admission_date)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Care home:</span>{' '}
                    {client.care_homes?.name ?? 'Not assigned'}
                  </p>
                </div>
                {(profile?.role === 'business_owner' || profile?.role === 'manager') && (
                  <Button asChild>
                    <Link href={`/clients/${client.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {careIndicators.length > 0 && (
              <Card className="rounded-3xl border border-white/60 bg-white/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">Key care flags</CardTitle>
                  <CardDescription>Hover each tag for a quick reminder.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {careIndicators.map((indicator) => (
                    <span
                      key={indicator.label}
                      title={indicator.description}
                      aria-label={indicator.description}
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${indicator.tone} shadow-sm`}
                    >
                      <indicator.icon className="h-3.5 w-3.5" />
                      {indicator.label}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">Health Information</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="care">Care Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-medium">{formatDate(client.date_of_birth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{calculateAge(client.date_of_birth)} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client type:</span>
                      <span className="font-medium capitalize">{client.client_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium">{getGenderDisplay(client.gender)}</span>
                    </div>
                    {client.nhs_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">NHS Number:</span>
                        <span className="font-mono font-medium">{client.nhs_number}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Care Home Information */}
                {client.care_homes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-blue-600" />
                        Care Home
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium text-lg">{client.care_homes.name}</p>
                        <p className="text-gray-600 text-sm mt-1">{client.care_homes.address}</p>
                        <p className="text-gray-600 text-sm">{client.care_homes.postcode}</p>
                      </div>
                      {client.room_number && (
                        <div className="pt-3 border-t">
                          <span className="text-gray-600">Room Number:</span>
                          <span className="font-medium ml-2">{client.room_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{client.care_homes.phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admission Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Admission Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admission Date:</span>
                      <span className="font-medium">{formatDate(client.admission_date)}</span>
                    </div>
                    {client.discharge_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discharge Date:</span>
                        <span className="font-medium">{formatDate(client.discharge_date)}</span>
                      </div>
                    )}
                    {client.admission_date && !client.discharge_date && (
                      <div className="pt-3 border-t">
                        <span className="text-gray-600">Length of Stay:</span>
                        <span className="font-medium ml-2">
                          {Math.floor((new Date().getTime() - new Date(client.admission_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Previous Address */}
                {(client.address || client.postcode) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Previous Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {client.address && <p className="text-gray-700">{client.address}</p>}
                      {client.postcode && <p className="text-gray-700 mt-1">{client.postcode}</p>}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Health Information Tab */}
            <TabsContent value="health" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Allergies */}
                {client.allergies && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Allergies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{client.allergies}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Medical Conditions */}
                {client.medical_conditions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-blue-600" />
                        Medical Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{client.medical_conditions}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Medications */}
                {client.medications && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-blue-600" />
                        Current Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{client.medications}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Dietary Requirements */}
                {client.dietary_requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dietary Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{client.dietary_requirements}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Contact */}
                {client.emergency_contact_name && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-700">Emergency Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-gray-600 text-sm">Name</p>
                        <p className="font-medium text-lg">{client.emergency_contact_name}</p>
                      </div>
                      {client.emergency_contact_phone && (
                        <div>
                          <p className="text-gray-600 text-sm">Phone</p>
                          <p className="font-medium">{client.emergency_contact_phone}</p>
                        </div>
                      )}
                      {client.emergency_contact_relationship && (
                        <div>
                          <p className="text-gray-600 text-sm">Relationship</p>
                          <p className="font-medium">{client.emergency_contact_relationship}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* GP Information */}
                {(client.gp_name || client.gp_practice) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>GP Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {client.gp_name && (
                        <div>
                          <p className="text-gray-600 text-sm">GP Name</p>
                          <p className="font-medium">{client.gp_name}</p>
                        </div>
                      )}
                      {client.gp_practice && (
                        <div>
                          <p className="text-gray-600 text-sm">Practice</p>
                          <p className="font-medium">{client.gp_practice}</p>
                        </div>
                      )}
                      {client.gp_phone && (
                        <div>
                          <p className="text-gray-600 text-sm">Phone</p>
                          <p className="font-medium">{client.gp_phone}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Care Details Tab */}
            <TabsContent value="care" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Mobility Notes */}
                {client.mobility_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mobility Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{client.mobility_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Communication Notes */}
                {client.communication_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{client.communication_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Care Management</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4">
                    <Button asChild variant="outline">
                      <Link href={`/clients/${client.id}/care-plans`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Care Plans
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/clients/${client.id}/assessments`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Assessments
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/clients/${client.id}/incidents`}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        View Incidents
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <DocumentsManager entityType="clients" entityId={client.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
      <DocumentsOverlay
        open={documentsOverlayOpen}
        onClose={() => setDocumentsOverlayOpen(false)}
        entityType="clients"
        entityId={client.id}
        title={`${client.first_name} ${client.last_name}`}
      />
    </ProtectedRoute>
  )
}
