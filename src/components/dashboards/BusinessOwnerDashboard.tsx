'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Home, Building, UserPlus, Plus, Loader2, FileText, ClipboardList, AlertTriangle, CheckCircle, Clock, Settings, User } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalCareHomes: number
  activeCareHomes: number
  totalCapacity: number
  currentOccupancy: number
  occupancyRate: number
  totalClients: number
  activeClients: number
  totalStaff: number
  activeCarePlans: number
  carePlansReviewDue: number
  pendingHandovers: number
  todayHandovers: number
  openIncidents: number
  criticalIncidents: number
}

export default function BusinessOwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCareHomes: 0,
    activeCareHomes: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
    occupancyRate: 0,
    totalClients: 0,
    activeClients: 0,
    totalStaff: 0,
    activeCarePlans: 0,
    carePlansReviewDue: 0,
    pendingHandovers: 0,
    todayHandovers: 0,
    openIncidents: 0,
    criticalIncidents: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      // Fetch care homes stats
      const { data: careHomes } = await supabase
        .from('care_homes')
        .select('capacity, current_occupancy, is_active')

      // Fetch clients stats
      const { data: clients } = await supabase
        .from('clients')
        .select('id, is_active')

      // Fetch staff stats (carers and managers only)
      const { data: staff } = await supabase
        .from('profiles')
        .select('id, is_active, role')
        .in('role', ['carer', 'manager'])

      // Fetch care plans stats
      const { data: carePlans } = await supabase
        .from('care_plans')
        .select('id, is_active, review_date')

      // Fetch handovers stats
      const { data: handovers } = await supabase
        .from('handovers')
        .select('id, is_completed, shift_date')

      // Fetch incidents stats
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id, status, severity')

      const totalCareHomes = careHomes?.length || 0
      const activeCareHomes = careHomes?.filter(h => h.is_active).length || 0
      const totalCapacity = careHomes?.reduce((sum, home) => sum + (home.capacity || 0), 0) || 0
      const currentOccupancy = careHomes?.reduce((sum, home) => sum + (home.current_occupancy || 0), 0) || 0
      const occupancyRate = totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0
      
      const totalClients = clients?.length || 0
      const activeClients = clients?.filter(c => c.is_active).length || 0
      const totalStaff = staff?.filter(s => s.is_active).length || 0

      const activeCarePlans = carePlans?.filter(p => p.is_active).length || 0
      const carePlansReviewDue = carePlans?.filter(p => {
        if (!p.review_date || !p.is_active) return false
        return new Date(p.review_date) <= new Date()
      }).length || 0

      const pendingHandovers = handovers?.filter(h => !h.is_completed).length || 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayHandovers = handovers?.filter(h => {
        const shiftDate = new Date(h.shift_date)
        shiftDate.setHours(0, 0, 0, 0)
        return shiftDate.getTime() === today.getTime()
      }).length || 0

      const openIncidents = incidents?.filter(i => i.status === 'open').length || 0
      const criticalIncidents = incidents?.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length || 0

      setStats({
        totalCareHomes,
        activeCareHomes,
        totalCapacity,
        currentOccupancy,
        occupancyRate,
        totalClients,
        activeClients,
        totalStaff,
        activeCarePlans,
        carePlansReviewDue,
        pendingHandovers,
        todayHandovers,
        openIncidents,
        criticalIncidents,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Business Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Your care business at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Care Homes</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCareHomes}</div>
            <p className="text-sm text-gray-600">{stats.activeCareHomes} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-sm text-gray-600">{stats.activeClients} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStaff}</div>
            <p className="text-sm text-gray-600">active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Home className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">{stats.currentOccupancy} / {stats.totalCapacity} beds</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bed Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Capacity:</span>
              <span className="font-semibold">{stats.totalCapacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Occupied:</span>
              <span className="font-semibold text-blue-600">{stats.currentOccupancy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available:</span>
              <span className="font-semibold text-green-600">{stats.totalCapacity - stats.currentOccupancy}</span>
            </div>
            <div className="pt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Clients:</span>
              <span className="font-semibold">{stats.totalClients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-green-600">{stats.activeClients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inactive:</span>
              <span className="font-semibold text-gray-500">{stats.totalClients - stats.activeClients}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Facilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Homes:</span>
              <span className="font-semibold">{stats.totalCareHomes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-green-600">{stats.activeCareHomes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Capacity:</span>
              <span className="font-semibold">
                {stats.totalCareHomes > 0 ? Math.round(stats.totalCapacity / stats.totalCareHomes) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Care Operations Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Care Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Plans:</span>
              <span className="font-semibold text-green-600">{stats.activeCarePlans}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reviews Due:</span>
              <span className={`font-semibold ${stats.carePlansReviewDue > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {stats.carePlansReviewDue}
              </span>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/care-plans">
                  View All Care Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Handovers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Today:</span>
              <span className="font-semibold text-blue-600">{stats.todayHandovers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className={`font-semibold ${stats.pendingHandovers > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {stats.pendingHandovers}
              </span>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/handovers">
                  View All Handovers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Open:</span>
              <span className={`font-semibold ${stats.openIncidents > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {stats.openIncidents}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Critical:</span>
              <span className={`font-semibold ${stats.criticalIncidents > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {stats.criticalIncidents}
              </span>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/incidents">
                  View All Incidents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CQC Compliance Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            CQC Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Care Plan Reviews</span>
                {stats.carePlansReviewDue === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold mt-2">
                {stats.activeCarePlans > 0 
                  ? Math.round(((stats.activeCarePlans - stats.carePlansReviewDue) / stats.activeCarePlans) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Up to date</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Handover Completion</span>
                {stats.pendingHandovers === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <p className="text-2xl font-bold mt-2">
                {stats.todayHandovers > 0 
                  ? Math.round(((stats.todayHandovers - stats.pendingHandovers) / stats.todayHandovers) * 100)
                  : 100}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Completed today</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Incident Management</span>
                {stats.openIncidents === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{stats.openIncidents}</p>
              <p className="text-xs text-gray-600 mt-1">Open incidents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/company">
              <Settings className="h-4 w-4 mr-2" />
              Company Settings
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/care-homes/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Care Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/care-homes">
              <Building className="h-4 w-4 mr-2" />
              View All Homes
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients">
              <Users className="h-4 w-4 mr-2" />
              View All Clients
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/care-plans">
              <FileText className="h-4 w-4 mr-2" />
              Care Plans
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/handovers">
              <ClipboardList className="h-4 w-4 mr-2" />
              Handovers
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/incidents">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Incidents
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
