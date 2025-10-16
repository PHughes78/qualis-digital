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
import { FileText, Plus, Search, User, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface CarePlan {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  review_date: string | null
  is_active: boolean
  created_at: string
  clients: {
    id: string
    first_name: string
    last_name: string
    care_home_id: string
    care_homes: {
      name: string
    } | null
  } | null
  profiles: {
    first_name: string
    last_name: string
  } | null
}

export default function CarePlansPage() {
  const { profile } = useAuth()
  const [carePlans, setCarePlans] = useState<CarePlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<CarePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [reviewFilter, setReviewFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchCarePlans()
    }
  }, [profile])

  useEffect(() => {
    filterPlans()
  }, [carePlans, searchTerm, statusFilter, reviewFilter])

  const fetchCarePlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('care_plans')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            care_home_id,
            care_homes (
              name
            )
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching care plans:', error)
        setError('Failed to load care plans')
        return
      }

      setCarePlans(data || [])
    } catch (err) {
      console.error('Exception fetching care plans:', err)
      setError('An error occurred while loading care plans')
    } finally {
      setLoading(false)
    }
  }

  const filterPlans = () => {
    let filtered = [...carePlans]

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(plan => plan.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(plan => !plan.is_active)
    }

    // Filter by review status
    if (reviewFilter === 'due') {
      const today = new Date()
      filtered = filtered.filter(plan => {
        if (!plan.review_date) return false
        return new Date(plan.review_date) <= today
      })
    } else if (reviewFilter === 'upcoming') {
      const today = new Date()
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() + 30)
      filtered = filtered.filter(plan => {
        if (!plan.review_date) return false
        const reviewDate = new Date(plan.review_date)
        return reviewDate > today && reviewDate <= thirtyDays
      })
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(plan => 
        plan.title.toLowerCase().includes(term) ||
        plan.clients?.first_name.toLowerCase().includes(term) ||
        plan.clients?.last_name.toLowerCase().includes(term)
      )
    }

    setFilteredPlans(filtered)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const isReviewDue = (reviewDate: string | null) => {
    if (!reviewDate) return false
    return new Date(reviewDate) <= new Date()
  }

  const isReviewUpcoming = (reviewDate: string | null) => {
    if (!reviewDate) return false
    const today = new Date()
    const review = new Date(reviewDate)
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    return review > today && review <= thirtyDays
  }

  const activePlans = carePlans.filter(p => p.is_active).length
  const reviewsDue = carePlans.filter(p => p.is_active && isReviewDue(p.review_date)).length
  const reviewsUpcoming = carePlans.filter(p => p.is_active && isReviewUpcoming(p.review_date)).length

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Care Plans</h1>
              <p className="text-gray-600 mt-1">Person-centred care planning and management</p>
            </div>
            {(profile?.role === 'business_owner' || profile?.role === 'manager') && (
              <Button asChild>
                <Link href="/care-plans/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Care Plan
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Care Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activePlans}</div>
                <p className="text-xs text-gray-500">of {carePlans.length} total</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Reviews Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{reviewsDue}</div>
                <p className="text-xs text-red-600">require immediate review</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700">Reviews Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{reviewsUpcoming}</div>
                <p className="text-xs text-yellow-600">due within 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {activePlans > 0 ? Math.round(((activePlans - reviewsDue) / activePlans) * 100) : 0}%
                </div>
                <p className="text-xs text-gray-500">plans up to date</p>
              </CardContent>
            </Card>
          </div>

          {/* CQC Compliance Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">CQC Person-Centred Care Standards</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    All care plans must be reviewed at least every 6 months or when needs change. 
                    Plans should involve the person, their family, and healthcare professionals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Client name or care plan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Review Status</label>
                  <Select value={reviewFilter} onValueChange={setReviewFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="due">Due Now</SelectItem>
                      <SelectItem value="upcoming">Upcoming (30 days)</SelectItem>
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
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && carePlans.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No care plans yet</h3>
                  <p className="text-gray-600 mb-4">Start creating person-centred care plans for your clients.</p>
                  {(profile?.role === 'business_owner' || profile?.role === 'manager') && (
                    <Button asChild>
                      <Link href="/care-plans/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Care Plan
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Care Plans List */}
          {!loading && !error && filteredPlans.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className={`hover:shadow-lg transition-shadow ${
                  isReviewDue(plan.review_date) ? 'border-red-300 bg-red-50' : 
                  isReviewUpcoming(plan.review_date) ? 'border-yellow-300 bg-yellow-50' : ''
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          {plan.title}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          {plan.clients && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>{plan.clients.first_name} {plan.clients.last_name}</span>
                              {plan.clients.care_homes && (
                                <span className="text-xs">• {plan.clients.care_homes.name}</span>
                              )}
                            </div>
                          )}
                          {plan.description && (
                            <p className="text-sm mt-1">{plan.description}</p>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={plan.is_active ? "default" : "outline"}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {isReviewDue(plan.review_date) && (
                          <Badge className="bg-red-600">Review Due</Badge>
                        )}
                        {isReviewUpcoming(plan.review_date) && !isReviewDue(plan.review_date) && (
                          <Badge className="bg-yellow-600">Review Soon</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Start Date</p>
                        <p className="font-medium">{formatDate(plan.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">End Date</p>
                        <p className="font-medium">{formatDate(plan.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Review Date</p>
                        <p className={`font-medium ${
                          isReviewDue(plan.review_date) ? 'text-red-600' : 
                          isReviewUpcoming(plan.review_date) ? 'text-yellow-600' : ''
                        }`}>
                          {formatDate(plan.review_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Created By</p>
                        <p className="font-medium">
                          {plan.profiles ? `${plan.profiles.first_name} ${plan.profiles.last_name}` : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/care-plans/${plan.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {plan.clients && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/clients/${plan.clients.id}`}>
                            View Client
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && carePlans.length > 0 && filteredPlans.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No care plans found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
