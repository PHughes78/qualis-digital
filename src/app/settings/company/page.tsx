"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCompanySettings } from "@/contexts/CompanySettingsContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function CompanySettingsPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { settings, refreshSettings } = useCompanySettings()
  const supabase = useMemo(() => createClient(), [])

  const [companyName, setCompanyName] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#2563eb")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Check authorization
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'business_owner')) {
      router.push('/unauthorized')
    }
  }, [profile, authLoading, router])

  // Load current settings
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name)
      setCompanyDescription(settings.company_description || "")
      setPrimaryColor(settings.primary_color || "#2563eb")
      if (settings.logo_url) {
        setLogoPreview(settings.logo_url)
      }
    }
  }, [settings])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setLogoFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError("")
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null

    const fileExt = logoFile.name.split('.').pop()
    const fileName = `logo-${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      let logoUrl = settings?.logo_url

      // Upload new logo if selected
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      // Update company settings
      const { error: updateError } = await supabase
        .from('company_settings')
        .update({
          company_name: companyName,
          company_description: companyDescription,
          primary_color: primaryColor,
          logo_url: logoUrl,
        })
        .eq('id', settings?.id)

      if (updateError) throw updateError

      setMessage("Company settings updated successfully!")
      await refreshSettings()
      setLogoFile(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!profile || profile.role !== 'business_owner') {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your company branding and information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
          <CardDescription>
            Update your company logo, name, and description. Changes will appear across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-start gap-4">
                {logoPreview && (
                  <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, or SVG. Max 2MB. Recommended: Square format, minimum 200x200px.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Qualis Digital"
              />
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Company Description</Label>
              <Textarea
                id="companyDescription"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Brief description of your care organization"
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This appears on the login page and public-facing areas.
              </p>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Brand Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Future feature: Will customize button and accent colors throughout the app.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>How your branding appears to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
            <div className="flex items-center gap-3 mb-4">
              {logoPreview && (
                <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-contain p-1"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold">{companyName || "Company Name"}</h2>
            </div>
            <p className="text-white/90">
              {companyDescription || "Company description will appear here"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
