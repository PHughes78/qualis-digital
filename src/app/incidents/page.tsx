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
import { AlertTriangle, Plus, Search, User, Home, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Incident {
  id: string
  title: string
  description: string
  incident_type: string
  severity: string
  status: string
  location: string | null
  incident_date: string
  immediate_action_taken: string | null
  follow_up_required: boolean
  resolved_date: string | null
  created_at: string
  care_homes: {
    id: string
    name: string
  } | null
  clients: {
    id: string
    first_name: string
    last_name: string
  } | null
  profiles: {
    first_name: string
    last_name: string
  } | null
}

export default function IncidentsPage() {
  const { profile } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchIncidents()
    }
  }, [profile])

  useEffect(() => {
    filterIncidents()
  }, [incidents, searchTerm, severityFilter, statusFilter])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          care_homes (
            id,
            name
          ),
          clients (
            id,
            first_name,
            last_name
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order('incident_date', { ascending: false })

      if (error) {
        console.error('Error fetching incidents:', error)
        setError('Failed to load incidents')
        return
      }

      setIncidents(data || [])
    } catch (err) {
      console.error('Exception fetching incidents:', err)
      setError('An error occurred while loading incidents')
    } finally {
      setLoading(false)
    }
  }

  const filterIncidents = () => {
    let filtered = [...incidents]

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(i => i.severity === severityFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.incident_type.toLowerCase().includes(term) ||
        i.clients?.first_name.toLowerCase().includes(term) ||
        i.clients?.last_name.toLowerCase().includes(term)
      )
    }

    setFilteredIncidents(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'investigating':
        return 'bg-blue-100 text-blue-800'
      case 'open':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed':
      case 'resolved':
        return <CheckCircle className="h-3 w-3" />
      case 'investigating':
        return <Clock className="h-3 w-3" />
      case 'open':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const openIncidents = incidents.filter(i => i.status === 'open').length
  const investigatingIncidents = incidents.filter(i => i.status === 'investigating').length
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length
  const followUpRequired = incidents.filter(i => i.follow_up_required && i.status !== 'closed').length

  return (
    <ProtectedRoute allowedRoles={['business_owner', 'manager', 'carer']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
              <p className="text-gray-600 mt-1">Incident reporting and management system</p>
            </div>
            <Button asChild>
              <Link href="/incidents/new">
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Open Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{openIncidents}</div>
                <p className="text-xs text-red-600">require attention</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Investigating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{investigatingIncidents}</div>
                <p className="text-xs text-blue-600">under review</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{criticalIncidents}</div>
                <p className="text-xs text-orange-600">high priority</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700">Follow-up</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{followUpRequired}</div>
                <p className="text-xs text-yellow-600">actions needed</p>
              </CardContent>
            </Card>
          </div>

          {/* CQC Compliance Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">CQC Safe Care Standards - Incident Reporting</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    All incidents must be reported immediately and investigated thoroughly. Document actions taken, 
                    lessons learned, and preventive measures. Serious incidents must be reported to CQC within required timeframes. 
                    Maintain transparency with service users and families.
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
                      placeholder="Search incidents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Severity</label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
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
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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
          {!loading && !error && incidents.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents reported</h3>
                  <p className="text-gray-600 mb-4">Report and track incidents to maintain safe care standards.</p>
                  <Button asChild>
                    <Link href="/incidents/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Report First Incident
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incidents List */}
          {!loading && !error && filteredIncidents.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredIncidents.map((incident) => (
                <Card key={incident.id} className={`hover:shadow-lg transition-shadow ${
                  incident.severity === 'critical' && incident.status !== 'closed' ? 'border-red-300' : ''
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          {incident.title}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div className="flex flex-wrap gap-2">
                            {incident.clients && (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                <span>{incident.clients.first_name} {incident.clients.last_name}</span>
                              </div>
                            )}
                            {incident.care_homes && (
                              <div className="flex items-center gap-1 text-sm">
                                <Home className="h-3 w-3" />
                                <span>{incident.care_homes.name}</span>
                              </div>
                            )}
                            {incident.location && (
                              <div className="text-sm text-gray-600">
                                • {incident.location}
                              </div>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(incident.status)}
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </span>
                        </Badge>
                        {incident.follow_up_required && (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                            Follow-up Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Incident Details */}
                    <div className="text-sm">
                      <p className="text-gray-700">{incident.description}</p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t">
                      <div>
                        <p className="text-gray-600 text-xs">Incident Type</p>
                        <p className="font-medium">{incident.incident_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Incident Date
                        </p>
                        <p className="font-medium">{formatDate(incident.incident_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Reported By</p>
                        <p className="font-medium">
                          {incident.profiles 
                            ? `${incident.profiles.first_name} ${incident.profiles.last_name}` 
                            : 'Unknown'}
                        </p>
                      </div>
                      {incident.resolved_date && (
                        <div>
                          <p className="text-gray-600 text-xs">Resolved Date</p>
                          <p className="font-medium">{formatDate(incident.resolved_date)}</p>
                        </div>
                      )}
                    </div>

                    {/* Immediate Action */}
                    {incident.immediate_action_taken && (
                      <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded-r">
                        <p className="text-xs font-semibold text-green-900 mb-1">Immediate Action Taken</p>
                        <p className="text-sm text-green-800">{incident.immediate_action_taken}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/incidents/${incident.id}`}>
                          View Full Details
                        </Link>
                      </Button>
                      {incident.clients && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/clients/${incident.clients.id}`}>
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
          {!loading && !error && incidents.length > 0 && filteredIncidents.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
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
