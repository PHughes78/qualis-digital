"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/contexts/ThemeProvider"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Moon, Sun, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { profile } = useAuth()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your profile and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Account Information</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</Label>
                <p className="text-base text-gray-900 dark:text-gray-100 mt-1">{profile?.first_name || '—'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</Label>
                <p className="text-base text-gray-900 dark:text-gray-100 mt-1">{profile?.last_name || '—'}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</Label>
              <p className="text-base text-gray-900 dark:text-gray-100 mt-1">{profile?.email || '—'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</Label>
              <p className="text-base text-gray-900 dark:text-gray-100 mt-1 capitalize">
                {profile?.role?.replace('_', ' ') || '—'}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t dark:border-gray-700">
              To update your account information, please contact your system administrator.
            </p>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Appearance</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Customize how the application looks to you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="dark:text-gray-200">Theme</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-sm font-medium dark:text-gray-200">Light</span>
                </button>
                
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-sm font-medium dark:text-gray-200">Dark</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Choose your preferred color scheme
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
