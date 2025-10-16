'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Home, FileText, AlertTriangle, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default function CarerDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening in your care homes today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Across 2 care homes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Care plans to update
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Handovers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Pending handovers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Requires follow-up
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Priority Actions</CardTitle>
            <CardDescription>
              Important tasks that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Badge variant="destructive">High</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">Medication review for John Smith</p>
                <p className="text-xs text-muted-foreground">Room 12A - Due today</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Badge variant="default">Medium</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">Care plan update for Mary Johnson</p>
                <p className="text-xs text-muted-foreground">Room 8B - Due tomorrow</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <Badge variant="secondary">Low</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">Dietary assessment for Robert Brown</p>
                <p className="text-xs text-muted-foreground">Room 15C - Due this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Handovers</CardTitle>
            <CardDescription>
              Latest handover notes from your colleagues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Night Shift - Sarah Wilson</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <p className="text-sm text-gray-600">Mrs. Thompson had a restless night. Check on her appetite at breakfast.</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">Evening Shift - Mike Davis</span>
                <span className="text-xs text-muted-foreground">12 hours ago</span>
              </div>
              <p className="text-sm text-gray-600">Mr. Roberts needs assistance with mobility today. Physio visit scheduled for 2 PM.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you work efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/clients">
                <Users className="h-6 w-6" />
                <span>View Clients</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/care-plans">
                <FileText className="h-6 w-6" />
                <span>Care Plans</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/handovers">
                <Calendar className="h-6 w-6" />
                <span>Handovers</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link href="/incidents/new">
                <AlertTriangle className="h-6 w-6" />
                <span>Report Incident</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}