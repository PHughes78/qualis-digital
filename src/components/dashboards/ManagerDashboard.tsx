'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Home, FileText, AlertTriangle, Calendar, BarChart3, UserPlus, Plus, User } from 'lucide-react'
import Link from 'next/link'

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manager Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">Overview of your care homes and team performance.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Care Homes</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              87% average occupancy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +5 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Across all homes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              3 require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Care Homes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Care Homes Overview</CardTitle>
          <CardDescription>
            Current status of all care homes under your management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium">Sunrise Manor</h3>
                  <p className="text-sm text-muted-foreground">45 residents • CQC: Good</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">92% Occupancy</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/care-homes/1">View Details</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium">Meadowbrook Care</h3>
                  <p className="text-sm text-muted-foreground">38 residents • CQC: Outstanding</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">86% Occupancy</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/care-homes/2">View Details</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium">Oakwood Residence</h3>
                  <p className="text-sm text-muted-foreground">35 residents • CQC: Good</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">83% Occupancy</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/care-homes/3">View Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Priority Alerts</CardTitle>
            <CardDescription>
              Items requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 p-3 border rounded-lg border-red-200 bg-red-50">
              <Badge variant="destructive">Urgent</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">Incident requires investigation</p>
                <p className="text-xs text-muted-foreground">Sunrise Manor - Reported 2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border rounded-lg border-yellow-200 bg-yellow-50">
              <Badge variant="secondary">Medium</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">Staff shortage notification</p>
                <p className="text-xs text-muted-foreground">Meadowbrook Care - Night shift tomorrow</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border rounded-lg border-blue-200 bg-blue-50">
              <Badge variant="outline">Info</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">Monthly report ready</p>
                <p className="text-xs text-muted-foreground">Compliance metrics available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>
              Recent team activities and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Sarah Wilson</span>
                <Badge variant="outline">Carer</Badge>
              </div>
              <p className="text-sm text-gray-600">Completed 15 care plan updates this week</p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Mike Davis</span>
                <Badge variant="outline">Senior Carer</Badge>
              </div>
              <p className="text-sm text-gray-600">Excellent handover documentation - 100% completion rate</p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Emma Thompson</span>
                <Badge variant="outline">Carer</Badge>
              </div>
              <p className="text-sm text-gray-600">Completed mandatory training ahead of schedule</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
          <CardDescription>
            Quick access to common management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/profile">
                <User className="h-6 w-6" />
                <span>Profile</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/care-homes">
                <Home className="h-6 w-6" />
                <span>Manage Homes</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/clients/new">
                <Plus className="h-6 w-6" />
                <span>Add Client</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/reports">
                <BarChart3 className="h-6 w-6" />
                <span>View Reports</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/staff">
                <UserPlus className="h-6 w-6" />
                <span>Manage Staff</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}