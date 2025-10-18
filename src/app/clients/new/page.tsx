'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ClientType } from '@/lib/database.types'
import AddressAutocompleteInput from '@/components/address/AddressAutocompleteInput'

interface CareHome {
  id: string
  name: string
}

export default function NewClientPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [careHomes, setCareHomes] = useState<CareHome[]>([])

  const [formData, setFormData] = useState({
    // Basic Information
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'prefer_not_to_say',
    client_type: 'adult' as ClientType,
    nhs_number: '',
    
    // Care Home Assignment
    care_home_id: '',
    room_number: '',
    admission_date: '',
    
    // Address
    address: '',
    postcode: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // GP Information
    gp_name: '',
    gp_practice: '',
    gp_phone: '',
    
    // Health Information
    dietary_requirements: '',
    allergies: '',
    medical_conditions: '',
    medications: '',
    
    // Care Notes
    mobility_notes: '',
    communication_notes: '',
  })

  useEffect(() => {
    fetchCareHomes()
  }, [])

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const deriveClientType = (dob: string): ClientType => {
    if (!dob) return 'adult'
    return calculateAge(dob) < 18 ? 'child' : 'adult'
  }

  const fetchCareHomes = async () => {
    try {
      const { data, error } = await supabase
        .from('care_homes')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching care homes:', error)
        return
      }

      setCareHomes(data || [])
    } catch (err) {
      console.error('Exception fetching care homes:', err)
    }
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'date_of_birth') {
      const nextType = deriveClientType(value)
      setFormData(prev => ({
        ...prev,
        date_of_birth: value,
        client_type: nextType,
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    setError(null)
  }

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.date_of_birth) {
      setError('Date of birth is required')
      return false
    }
    if (!formData.client_type) {
      setError('Please select whether this is an adult or child in care')
      return false
    }
    if (!formData.care_home_id) {
      setError('Please select a care home')
      return false
    }
    if (!formData.emergency_contact_name.trim()) {
      setError('Emergency contact name is required')
      return false
    }
    if (!formData.emergency_contact_phone.trim()) {
      setError('Emergency contact phone is required')
      return false
    }
    if (formData.client_type === 'child' && !formData.emergency_contact_relationship.trim()) {
      setError('Please capture the emergency contact relationship for children in care')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const clientData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        client_type: formData.client_type,
        care_home_id: formData.care_home_id,
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        is_active: true,
      }

      // Add optional fields if they have values
      if (formData.nhs_number.trim()) clientData.nhs_number = formData.nhs_number.trim()
      if (formData.room_number.trim()) clientData.room_number = formData.room_number.trim()
      if (formData.admission_date) clientData.admission_date = formData.admission_date
      if (formData.address.trim()) clientData.address = formData.address.trim()
      if (formData.postcode.trim()) clientData.postcode = formData.postcode.trim().toUpperCase()
      if (formData.emergency_contact_relationship.trim()) clientData.emergency_contact_relationship = formData.emergency_contact_relationship.trim()
      if (formData.gp_name.trim()) clientData.gp_name = formData.gp_name.trim()
      if (formData.gp_practice.trim()) clientData.gp_practice = formData.gp_practice.trim()
      if (formData.gp_phone.trim()) clientData.gp_phone = formData.gp_phone.trim()
      if (formData.dietary_requirements.trim()) clientData.dietary_requirements = formData.dietary_requirements.trim()
      if (formData.allergies.trim()) clientData.allergies = formData.allergies.trim()
      if (formData.medical_conditions.trim()) clientData.medical_conditions = formData.medical_conditions.trim()
      if (formData.medications.trim()) clientData.medications = formData.medications.trim()
      if (formData.mobility_notes.trim()) clientData.mobility_notes = formData.mobility_notes.trim()
      if (formData.communication_notes.trim()) clientData.communication_notes = formData.communication_notes.trim()

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()

      if (insertError) {
        console.error('Error inserting client:', insertError)
        setError(`Failed to create client: ${insertError.message}`)
        return
      }

      console.log('Client created successfully:', data)
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/clients')
      }, 2000)

    } catch (err) {
      console.error('Exception creating client:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const derivedAge = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null
  const recommendedType = formData.date_of_birth ? deriveClientType(formData.date_of_birth) : formData.client_type
  const typeWarning = Boolean(formData.date_of_birth) && recommendedType !== formData.client_type
  const typeBadgeClass =
    formData.client_type === 'child'
      ? 'border-rose-300 bg-rose-100 text-rose-700'
      : 'border-blue-300 bg-blue-100 text-blue-700'

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
      <DashboardLayout>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-4">
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </Button>

            <Card className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 shadow-soft">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">Add a new client</h1>
                    <p className="text-sm text-gray-700">
                      Capture essential personal, clinical, and safeguarding details so the care team has what they need
                      on day one.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={typeBadgeClass}>
                        {formData.client_type === 'child' ? 'Child in care' : 'Adult in care'}
                      </Badge>
                      {derivedAge !== null && (
                        <Badge variant="outline">
                          {derivedAge} {derivedAge === 1 ? 'year' : 'years'}
                        </Badge>
                      )}
                      <Badge variant="outline" className="font-mono uppercase">
                        {formData.care_home_id ? 'Placement assigned' : 'Placement pending'}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-gray-700 shadow-sm">
                    <p className="font-semibold text-gray-900">CQC essentials</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                      <li>Confirm consent and next of kin information.</li>
                      <li>Flag dietary, allergy, and medication requirements.</li>
                      <li>Record safeguarding considerations for children.</li>
                    </ul>
                  </div>
                </div>

                {typeWarning && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Based on the date of birth, we recommend classifying this client as{' '}
                    <span className="font-semibold">{recommendedType}</span>. You can override this if there is a specific
                    placement agreement.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <UserPlus className="h-4 w-4" />
              <div className="ml-2">
                <h4 className="font-semibold">Success!</h4>
                <p>Client created successfully. Redirecting...</p>
              </div>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="bg-red-50 text-red-800 border-red-200">
              <div className="ml-2">
                <h4 className="font-semibold">Error</h4>
                <p>{error}</p>
              </div>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Personal details of the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="John"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Smith"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      disabled={loading}
                      required
                    />
                    {derivedAge !== null && (
                      <p className="text-xs text-gray-500">
                        Age {derivedAge} • Recommended classification: {recommendedType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleChange('gender', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Client type *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.client_type === 'adult' ? 'default' : 'outline'}
                        onClick={() => handleChange('client_type', 'adult')}
                        disabled={loading}
                      >
                        Adult
                      </Button>
                      <Button
                        type="button"
                        variant={formData.client_type === 'child' ? 'default' : 'outline'}
                        onClick={() => handleChange('client_type', 'child')}
                        disabled={loading}
                      >
                        Child
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formData.client_type === 'child'
                        ? 'Children in care add safeguarding and education prompts throughout the record.'
                        : 'Adult records emphasise independence, capacity, and advanced care planning.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nhs_number">NHS Number</Label>
                  <Input
                    id="nhs_number"
                    value={formData.nhs_number}
                    onChange={(e) => handleChange('nhs_number', e.target.value)}
                    placeholder="123 456 7890"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Care Home Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Care Home Assignment</CardTitle>
                <CardDescription>Assign client to a care home</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="care_home_id">Care Home *</Label>
                  <Select
                    value={formData.care_home_id}
                    onValueChange={(value) => handleChange('care_home_id', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="care_home_id">
                      <SelectValue placeholder="Select a care home" />
                    </SelectTrigger>
                    <SelectContent>
                      {careHomes.map((home) => (
                        <SelectItem key={home.id} value={home.id}>
                          {home.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room_number">Room Number</Label>
                    <Input
                      id="room_number"
                      value={formData.room_number}
                      onChange={(e) => handleChange('room_number', e.target.value)}
                      placeholder="e.g., 12A"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admission_date">Admission Date</Label>
                    <Input
                      id="admission_date"
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => handleChange('admission_date', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>Previous address (if applicable)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <AddressAutocompleteInput
                    id="address"
                    value={formData.address}
                    onChange={(val) => handleChange('address', val)}
                    onSuggestionSelect={(suggestion) => {
                      if (suggestion.postcode) handleChange('postcode', suggestion.postcode)
                    }}
                    placeholder="123 High Street"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => handleChange('postcode', e.target.value)}
                    placeholder="SW1A 1AA"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Primary contact in case of emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                    placeholder="Jane Smith"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                      placeholder="07700 900000"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                    <Input
                      id="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                      placeholder="Daughter"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GP Information */}
            <Card>
              <CardHeader>
                <CardTitle>GP Information</CardTitle>
                <CardDescription>General practitioner details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gp_name">GP Name</Label>
                  <Input
                    id="gp_name"
                    value={formData.gp_name}
                    onChange={(e) => handleChange('gp_name', e.target.value)}
                    placeholder="Dr. Williams"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gp_practice">GP Practice</Label>
                    <Input
                      id="gp_practice"
                      value={formData.gp_practice}
                      onChange={(e) => handleChange('gp_practice', e.target.value)}
                      placeholder="High Street Medical Centre"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gp_phone">GP Phone</Label>
                    <Input
                      id="gp_phone"
                      type="tel"
                      value={formData.gp_phone}
                      onChange={(e) => handleChange('gp_phone', e.target.value)}
                      placeholder="020 1234 5678"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Information */}
            <Card>
              <CardHeader>
                <CardTitle>Health Information</CardTitle>
                <CardDescription>Medical details and requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
                  <Textarea
                    id="dietary_requirements"
                    value={formData.dietary_requirements}
                    onChange={(e) => handleChange('dietary_requirements', e.target.value)}
                    placeholder="e.g., Diabetic diet, no dairy"
                    disabled={loading}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                    placeholder="e.g., Penicillin, peanuts"
                    disabled={loading}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={(e) => handleChange('medical_conditions', e.target.value)}
                    placeholder="e.g., Type 2 diabetes, hypertension"
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => handleChange('medications', e.target.value)}
                    placeholder="e.g., Metformin 500mg twice daily"
                    disabled={loading}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Care Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Care Notes</CardTitle>
                <CardDescription>Additional care requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobility_notes">Mobility Notes</Label>
                  <Textarea
                    id="mobility_notes"
                    value={formData.mobility_notes}
                    onChange={(e) => handleChange('mobility_notes', e.target.value)}
                    placeholder="e.g., Uses wheelchair, needs assistance with transfers"
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communication_notes">Communication Notes</Label>
                  <Textarea
                    id="communication_notes"
                    value={formData.communication_notes}
                    onChange={(e) => handleChange('communication_notes', e.target.value)}
                    placeholder="e.g., Hard of hearing, prefers large print"
                    disabled={loading}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/clients')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
