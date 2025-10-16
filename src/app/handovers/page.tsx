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
import { ClipboardList, Plus, Calendar, Home, User, Sun, Moon, Sunset, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Handover {
  id: string
  shift_date: string
  shift_type: string
  general_notes: string | null
  key_points: string | null
  follow_up_actions: string | null
  is_completed: boolean
  created_at: string
  care_homes: {
    id: string
    name: string
  } | null
  handover_from_profile: {
    first_name: string
    last_name: string
  } | null
  handover_to_profile: {
    first_name: string
    last_name: string
  } | null
}

export default function HandoversPage() {
  const { profile } = useAuth()
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [filteredHandovers, setFilteredHandovers] = useState<Handover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [shiftFilter, setShiftFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchHandovers()
    }
  }, [profile])

  useEffect(() => {
    filterHandovers()
  }, [handovers, dateFilter, shiftFilter, statusFilter])

  const fetchHandovers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('handovers')
        .select(`
          *,
          care_homes (
            id,
            name
          ),
          handover_from_profile:profiles!handovers_handover_from_fkey (
            first_name,
            last_name
          ),
          handover_to_profile:profiles!handovers_handover_to_fkey (
            first_name,
            last_name
          )
        `)
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching handovers:', error)
        setError('Failed to load handovers')
        return
      }

      setHandovers(data || [])
    } catch (err) {
      console.error('Exception fetching handovers:', err)
      setError('An error occurred while loading handovers')
    } finally {
      setLoading(false)
    }
  }

  const filterHandovers = () => {
    let filtered = [...handovers]
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Filter by date
    if (dateFilter === 'today') {
      filtered = filtered.filter(h => {
        const shiftDate = new Date(h.shift_date)
        shiftDate.setHours(0, 0, 0, 0)
        return shiftDate.getTime() === today.getTime()
      })
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(h => new Date(h.shift_date) >= weekAgo)
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      filtered = filtered.filter(h => new Date(h.shift_date) >= monthAgo)
    }

    // Filter by shift type
    if (shiftFilter !== 'all') {
      filtered = filtered.filter(h => h.shift_type === shiftFilter)
    }

    // Filter by status
    if (statusFilter === 'completed') {
      filtered = filtered.filter(h => h.is_completed)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(h => !h.is_completed)
    }

    setFilteredHandovers(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getShiftIcon = (shiftType: string) => {
    switch (shiftType) {
      case 'day':
        return <Sun className="h-4 w-4" />
      case 'evening':
        return <Sunset className="h-4 w-4" />
      case 'night':
        return <Moon className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'day':
        return 'bg-yellow-100 text-yellow-800'
      case 'evening':
        return 'bg-orange-100 text-orange-800'
      case 'night':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const completedHandovers = handovers.filter(h => h.is_completed).length
  const pendingHandovers = handovers.filter(h => !h.is_completed).length
  const todayHandovers = handovers.filter(h => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const shiftDate = new Date(h.shift_date)
    shiftDate.setHours(0, 0, 0, 0)
    return shiftDate.getTime() === today.getTime()
  }).length

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Handovers</h1>
              <p className="text-gray-600 mt-1">Shift handover management and communication</p>
            </div>
            {(profile?.role === 'business_owner' || profile?.role === 'manager' || profile?.role === 'carer') && (
              <Button asChild>
                <Link href="/handovers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Handover
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today's Handovers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{todayHandovers}</div>
                <p className="text-xs text-gray-500">for current date</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Handovers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{handovers.length}</div>
                <p className="text-xs text-gray-500">all records</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{completedHandovers}</div>
                <p className="text-xs text-green-600">handovers complete</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{pendingHandovers}</div>
                <p className="text-xs text-yellow-600">awaiting completion</p>
              </CardContent>
            </Card>
          </div>

          {/* CQC Compliance Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">CQC Safe Care & Treatment Standards</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Effective handovers are essential for continuity of care. Document key information, changes in condition, 
                    actions taken, and follow-up required. All handovers must be clear, accurate, and timely.
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
                  <label className="text-sm font-medium text-gray-700">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Shift Type</label>
                  <Select value={shiftFilter} onValueChange={setShiftFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shifts</SelectItem>
                      <SelectItem value="day">Day Shift</SelectItem>
                      <SelectItem value="evening">Evening Shift</SelectItem>
                      <SelectItem value="night">Night Shift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
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
          {!loading && !error && handovers.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No handovers yet</h3>
                  <p className="text-gray-600 mb-4">Start documenting shift handovers for better care continuity.</p>
                  <Button asChild>
                    <Link href="/handovers/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Handover
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Handovers List */}
          {!loading && !error && filteredHandovers.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredHandovers.map((handover) => (
                <Card key={handover.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-blue-600" />
                          {formatDate(handover.shift_date)}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          {handover.care_homes && (
                            <div className="flex items-center gap-2">
                              <Home className="h-3 w-3" />
                              <span>{handover.care_homes.name}</span>
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getShiftColor(handover.shift_type)}>
                          <span className="flex items-center gap-1">
                            {getShiftIcon(handover.shift_type)}
                            {handover.shift_type.charAt(0).toUpperCase() + handover.shift_type.slice(1)}
                          </span>
                        </Badge>
                        <Badge variant={handover.is_completed ? "default" : "outline"}>
                          {handover.is_completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Staff Information */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Handover From
                        </p>
                        <p className="font-medium">
                          {handover.handover_from_profile 
                            ? `${handover.handover_from_profile.first_name} ${handover.handover_from_profile.last_name}` 
                            : 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Handover To
                        </p>
                        <p className="font-medium">
                          {handover.handover_to_profile 
                            ? `${handover.handover_to_profile.first_name} ${handover.handover_to_profile.last_name}` 
                            : 'Not assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Key Points Preview */}
                    {handover.key_points && (
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded-r">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Key Points</p>
                        <p className="text-sm text-blue-800 line-clamp-2">{handover.key_points}</p>
                      </div>
                    )}

                    {/* Follow-up Actions */}
                    {handover.follow_up_actions && (
                      <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-3 rounded-r">
                        <p className="text-xs font-semibold text-yellow-900 mb-1">Follow-up Required</p>
                        <p className="text-sm text-yellow-800 line-clamp-2">{handover.follow_up_actions}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/handovers/${handover.id}`}>
                          View Full Handover
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && handovers.length > 0 && filteredHandovers.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No handovers found</h3>
                  <p className="text-gray-600">Try adjusting your filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
