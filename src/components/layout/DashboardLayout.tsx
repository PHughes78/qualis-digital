'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCompanySettings } from '@/contexts/CompanySettingsContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  LogOut,
  Menu,
  Bell,
  Search,
  UserCog,
  User,
  Sparkles,
  Calendar,
  TrendingUp,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react'
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const companyName = settings?.company_name || 'Qualis Digital'
  const logoUrl = settings?.logo_url || '/vercel.svg'

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'business_owner':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
      case 'carer':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
      default:
        return 'bg-muted text-foreground'
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
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['carer', 'manager', 'business_owner'] },
    { name: 'Activity', href: '/activity', icon: Clock, roles: ['manager', 'business_owner'] },
  ]

  const filteredNavigation = navigationItems.filter((item) => profile?.role && item.roles.includes(profile.role))

  const closeMobileNav = () => setMobileNavOpen(false)

  const renderNavigation = (onNavigate?: () => void) =>
    filteredNavigation.map((item) => {
      const Icon = item.icon
      const isActive = pathname === item.href
      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={onNavigate}
          className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-smooth ${
            isActive
              ? 'bg-gradient-primary text-white shadow-argon'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/45 dark:hover:bg-white/10'
          }`}
        >
          <span
            className={`flex size-9 items-center justify-center rounded-xl transition-smooth ${
              isActive
                ? 'bg-white/25 text-white'
                : 'bg-white/40 text-primary group-hover:bg-white/60 dark:bg-white/10 dark:text-white'
            }`}
          >
            <Icon className="size-4" />
          </span>
          {item.name}
        </Link>
      )
    })

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-primary opacity-40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 lg:py-10">
        {/* Sidebar */}
        <aside className="hidden w-full max-w-xs flex-col gap-8 rounded-3xl border border-white/30 bg-card/80 p-6 shadow-argon supports-[backdrop-filter]:backdrop-blur-2xl lg:flex">
          <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/40 p-4 shadow-soft dark:bg-white/10">
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-argon">
              <Image src={logoUrl} alt="Company logo" width={36} height={36} className="rounded-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Company</p>
              <p className="text-lg font-semibold text-foreground">{companyName}</p>
            </div>
          </div>

          <div className="space-y-2">{renderNavigation()}</div>

          <div className="mt-auto rounded-2xl border border-white/30 bg-gradient-to-br from-primary/10 via-white/30 to-secondary/10 p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/20 p-2 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Need a hand?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Explore the resource center for rollout playbooks and branding kits.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-between rounded-xl border-white/50">
              <Link href="/help">
                Visit help center
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </aside>

        {/* Mobile navigation */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileNav}
              aria-hidden="true"
            />
            <div className="relative ml-auto flex w-80 flex-col gap-6 overflow-y-auto rounded-l-3xl border border-white/20 bg-card/95 p-6 shadow-argon supports-[backdrop-filter]:backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src={logoUrl} alt="Company logo" width={32} height={32} className="rounded-xl" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{companyName}</p>
                    <p className="text-xs text-muted-foreground">{getRoleDisplay(profile?.role ?? '')}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={closeMobileNav}>
                  <X className="size-4" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <div className="space-y-2">{renderNavigation(closeMobileNav)}</div>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-6">
          <header className="rounded-3xl border border-white/30 bg-card/90 p-6 shadow-argon supports-[backdrop-filter]:backdrop-blur-2xl lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="mr-1 rounded-2xl border-white/40 bg-white/40 shadow-soft hover:bg-white/60 dark:bg-white/10 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
                <div className="flex flex-col gap-3">
                  <Badge variant="outline" className="w-fit border-white/40 bg-white/40 text-xs uppercase tracking-[0.3em]">
                    Dashboard
                  </Badge>
                  <div>
                    <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                      {profile ? `Welcome back, ${profile.first_name}` : 'Welcome back'}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Here is a real time pulse across your care network and the people you support.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-4 py-2 text-sm text-muted-foreground shadow-soft transition-smooth focus-within:ring-2 focus-within:ring-primary/40 dark:bg-white/10 sm:min-w-[220px]">
                  <Search className="size-4" />
                  <input
                    type="search"
                    placeholder="Search dashboard"
                    className="w-full border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    className="relative rounded-2xl border border-white/30"
                  >
                    <Link href="/notifications" className="flex size-full items-center justify-center rounded-2xl">
                      <Bell className="size-4" />
                      <span className="absolute right-1 top-1 block size-2 rounded-full bg-destructive" />
                    </Link>
                  </Button>

                  {profile && (
                    <Badge className={`${getRoleBadgeClass(profile.role)} hidden sm:inline-flex`}>
                      {getRoleDisplay(profile.role)}
                    </Badge>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-11 w-11 rounded-2xl border border-white/40 bg-white/40 p-0 shadow-soft hover:bg-white/60 dark:bg-white/10"
                      >
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name} />
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {profile ? getInitials(profile.first_name, profile.last_name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {profile?.role === 'business_owner' && (
                        <>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/users" className="flex items-center">
                              <UserCog className="mr-2 size-4" />
                              User management
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 size-4" />
                          Profile settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 size-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/30 bg-white/40 p-5 shadow-soft transition-smooth hover:-translate-y-0.5 dark:bg-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Care tasks</span>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    +12%
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-3xl font-semibold text-foreground">18</p>
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Completed since yesterday</p>
              </div>

              <div className="rounded-2xl border border-white/30 bg-white/40 p-5 shadow-soft transition-smooth hover:-translate-y-0.5 dark:bg-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Upcoming shift</span>
                  <Clock className="size-4 text-primary" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">6:30 PM</p>
                <p className="mt-2 text-xs text-muted-foreground">Next team handover window</p>
              </div>

              <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-secondary/20 via-white/40 to-primary/10 p-5 shadow-soft transition-smooth hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Schedule
                  </span>
                  <Calendar className="size-4 text-primary" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">14</p>
                <p className="mt-2 text-xs text-muted-foreground">Care plans due this week</p>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="rounded-3xl border border-white/30 bg-card/90 p-6 shadow-soft supports-[backdrop-filter]:backdrop-blur-2xl lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
