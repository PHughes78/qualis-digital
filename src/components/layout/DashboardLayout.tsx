'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useCompanySettings } from '@/contexts/CompanySettingsContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Home, Users, FileText, AlertTriangle, BarChart3, LogOut, Menu, Bell, Search, UserCog, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth()
  const { settings } = useCompanySettings()
  const router = useRouter()
  const pathname = usePathname()

  const companyName = settings?.company_name || "Qualis Digital"
  const logoUrl = settings?.logo_url || "/vercel.svg"

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
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
      case 'carer':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
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
  ]

  const filteredNavigation = navigationItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Image src={logoUrl} alt="Logo" width={32} height={32} className="rounded-md" />
                  <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
                </div>
              </div>
              <nav className="hidden md:flex ml-10 space-x-2">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-primary text-white shadow-md' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center space-x-3">
              {/* Search Button */}
              <Button variant="ghost" size="sm" className="hidden sm:flex rounded-full hover:bg-gray-100">
                <Search className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative rounded-full hover:bg-gray-100">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Role Badge */}
              {profile && (
                <Badge className={`${getRoleColor(profile.role)} shadow-sm`}>
                  {getRoleDisplay(profile.role)}
                </Badge>
              )}
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-offset-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name} />
                      <AvatarFallback className="bg-gradient-primary text-white">
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
                  
                  {/* Users Management - Business Owner Only */}
                  {profile?.role === 'business_owner' && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/users" className="flex items-center">
                          <UserCog className="mr-2 h-4 w-4" />
                          User Management
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button variant="ghost" size="sm" className="md:hidden rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}