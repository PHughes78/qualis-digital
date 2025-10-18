'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import AddressAutocompleteInput from '@/components/address/AddressAutocompleteInput'
import { ArrowLeft, Home, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewCareHomePage() {
  const { profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    care_home_type: 'residential',
    capacity: '',
    manager_id: profile?.id || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (careHomeId: string): Promise<string | null> => {
    if (!imageFile) return null

    try {
      setUploadingImage(true)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${careHomeId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('care-home-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('care-home-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Exception uploading image:', err)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Care home name is required')
      return false
    }
    if (!formData.address.trim()) {
      setError('Address is required')
      return false
    }
    if (!formData.city.trim()) {
      setError('City is required')
      return false
    }
    if (!formData.postcode.trim()) {
      setError('Postcode is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      setError('Capacity must be greater than 0')
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
      // First, create the care home record
      const { data, error: insertError } = await supabase
        .from('care_homes')
        .insert([
          {
            name: formData.name.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            postcode: formData.postcode.trim().toUpperCase(),
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            care_home_type: formData.care_home_type,
            capacity: parseInt(formData.capacity),
            current_occupancy: 0,
            manager_id: profile?.id || null,
            is_active: true,
            image_url: null, // Will update if image is uploaded
          }
        ])
        .select()

      if (insertError) {
        console.error('Error inserting care home:', insertError)
        setError(`Failed to create care home: ${insertError.message}`)
        return
      }

      const newCareHome = data[0]

      // Upload image if provided
      if (imageFile && newCareHome) {
        const imageUrl = await uploadImage(newCareHome.id)
        
        if (imageUrl) {
          // Update care home with image URL
          const { error: updateError } = await supabase
            .from('care_homes')
            .update({ image_url: imageUrl })
            .eq('id', newCareHome.id)

          if (updateError) {
            console.error('Error updating image URL:', updateError)
            // Don't fail the whole operation if image update fails
          }
        }
      }

      console.log('Care home created successfully:', data)
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/care-homes')
      }, 2000)

    } catch (err) {
      console.error('Exception creating care home:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['business_owner']}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/care-homes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Care Homes
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Care Home</h1>
            <p className="text-gray-600 mt-1">Create a new care facility</p>
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Home className="h-4 w-4" />
              <div className="ml-2">
                <h4 className="font-semibold">Success!</h4>
                <p>Care home created successfully. Redirecting...</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Care Home Details</CardTitle>
              <CardDescription>Enter the information for the new care facility</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Care Home Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Sunnydale Care Home"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="image">Care Home Photo (Optional)</Label>
                    <p className="text-sm text-gray-500">Upload a high-quality image of your care home (recommended: 1200x800px or larger)</p>
                    <div className="space-y-3">
                      {imagePreview ? (
                        <div className="relative">
                          <div className="relative h-64 w-full rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeImage}
                              disabled={loading}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove Image
                            </Button>
                            {imageFile && (
                              <span className="text-sm text-gray-600 flex items-center">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="image"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-12 h-12 mb-4 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-700">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 mb-1">
                                PNG, JPG, JPEG or WEBP (MAX. 5MB)
                              </p>
                              <p className="text-xs text-gray-400">
                                Best results: 1200x800px or larger
                              </p>
                            </div>
                            <Input
                              id="image"
                              type="file"
                              className="hidden"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={handleImageChange}
                              disabled={loading}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="care_home_type">Type of Care *</Label>
                    <Select
                      value={formData.care_home_type}
                      onValueChange={(value) => handleChange('care_home_type', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="care_home_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="nursing">Nursing</SelectItem>
                        <SelectItem value="dementia">Dementia Care</SelectItem>
                        <SelectItem value="learning_disabilities">Learning Disabilities</SelectItem>
                        <SelectItem value="mental_health">Mental Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (Number of Beds) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleChange('capacity', e.target.value)}
                      placeholder="e.g., 30"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <AddressAutocompleteInput
                      id="address"
                      value={formData.address}
                      onChange={(val) => handleChange('address', val)}
                      onSuggestionSelect={(suggestion) => {
                        if (suggestion.city) handleChange('city', suggestion.city)
                        if (suggestion.postcode) handleChange('postcode', suggestion.postcode)
                      }}
                      placeholder="e.g., 123 High Street"
                      disabled={loading}
                      required
                      error={error === 'Address is required' ? error : null}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="e.g., London"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode *</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => handleChange('postcode', e.target.value)}
                        placeholder="e.g., SW1A 1AA"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="e.g., 020 1234 5678"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="e.g., info@carehome.co.uk"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/care-homes')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="flex-1"
                  >
                    {loading || uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploadingImage ? 'Uploading Image...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Home className="h-4 w-4 mr-2" />
                        Create Care Home
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
