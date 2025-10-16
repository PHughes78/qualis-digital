'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Home, Users, FileText, AlertTriangle, BarChart3, Settings, LogOut, Menu } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'business_owner':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'carer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'business_owner':
        return 'Business Owner'
      case 'manager':
        return 'Manager'
      case 'carer':
        return 'Carer'
      default:
        return role
    }
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['carer', 'manager', 'business_owner'] },
    { name: 'Care Homes', href: '/care-homes', icon: Home, roles: ['manager', 'business_owner'] },
    { name: 'Clients', href: '/clients', icon: Users, roles: ['carer', 'manager', 'business_owner'] },
    { name: 'Care Plans', href: '/care-plans', icon: FileText, roles: ['carer', 'manager', 'business_owner'] },
    { name: 'Handovers', href: '/handovers', icon: FileText, roles: ['carer', 'manager', 'business_owner'] },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle, roles: ['carer', 'manager', 'business_owner'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['manager', 'business_owner'] },
  ]

  const filteredNavigation = navigationItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Qualis <span className="text-blue-600">Digital</span></h1>
              </div>
              <nav className="hidden md:flex ml-10 space-x-8">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              {profile && (
                <Badge variant="outline" className={getRoleColor(profile.role)}>
                  {getRoleDisplay(profile.role)}
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name} />
                      <AvatarFallback>
                        {profile ? getInitials(profile.first_name, profile.last_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}