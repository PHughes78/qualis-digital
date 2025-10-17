'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCog, Plus, Mail, Users, Shield, Eye, EyeOff, Copy, Check, Trash2, AlertCircle, Building2, Edit } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
}

interface CareHome {
  id: string
  name: string
  address: string
}

interface ManagerAssignment {
  manager_id: string
  care_home_id: string
}

export default function UsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [careHomes, setCareHomes] = useState<CareHome[]>([])
  const [managerAssignments, setManagerAssignments] = useState<ManagerAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'carer',
    password: '',
    assignedCareHomes: [] as string[]
  })
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'carer',
    assignedCareHomes: [] as string[]
  })
  
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (profile?.role === 'business_owner') {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        setError('Failed to load users')
        return
      }

      // Fetch care homes
      const { data: homesData, error: homesError } = await supabase
        .from('care_homes')
        .select('id, name, address')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (homesError) {
        console.error('Error fetching care homes:', homesError)
      }

      // Fetch manager assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('manager_care_homes')
        .select('manager_id, care_home_id')

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
      }

      setUsers(usersData || [])
      setCareHomes(homesData || [])
      setManagerAssignments(assignmentsData || [])
    } catch (err) {
      console.error('Exception fetching data:', err)
      setError('An error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    // Generate a secure password: 12 characters with letters, numbers, and symbols
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    
    setFormData({ ...formData, password })
    setGeneratedPassword(password)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const validateForm = () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setFormError('Please fill in all required fields')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address')
      return false
    }

    // Password validation
    if (!formData.password) {
      setFormError('Please generate or enter a password')
      return false
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long')
      return false
    }

    return true
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Create the user account using Supabase Admin API via Edge Function
      // For now, we'll use the auth.signUp method
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      })

      if (authError) {
        console.error('Error creating user:', authError)
        setFormError(authError.message || 'Failed to create user account')
        setSubmitting(false)
        return
      }

      // Success!
      setFormSuccess(`User created successfully! Email: ${formData.email}, Password: ${formData.password}`)
      
      // Store the credentials temporarily for copying
      setGeneratedPassword(formData.password)

      // If this is a manager, save care home assignments
      if (formData.role === 'manager' && formData.assignedCareHomes.length > 0 && authData.user) {
        const assignments = formData.assignedCareHomes.map(homeId => ({
          manager_id: authData.user!.id,
          care_home_id: homeId,
          assigned_by: profile?.id
        }))

        const { error: assignmentError } = await supabase
          .from('manager_care_homes')
          .insert(assignments)

        if (assignmentError) {
          console.error('Error assigning care homes:', assignmentError)
          setFormError('User created but failed to assign care homes')
        }
      }
      
      // Refresh the data
      await fetchData()

      // Reset form after a delay to allow copying credentials
      setTimeout(() => {
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'carer',
          password: '',
          assignedCareHomes: []
        })
        setGeneratedPassword(null)
        setFormSuccess(null)
      }, 30000) // Clear after 30 seconds

    } catch (err) {
      console.error('Exception creating user:', err)
      setFormError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEditDialog = (user: User) => {
    const userAssignments = managerAssignments
      .filter(a => a.manager_id === user.id)
      .map(a => a.care_home_id)

    setEditingUser(user)
    setEditFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      assignedCareHomes: userAssignments
    })
    setFormError(null)
    setFormSuccess(null)
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!editingUser) return

    if (!editFormData.firstName || !editFormData.lastName) {
      setFormError('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          role: editFormData.role,
        })
        .eq('id', editingUser.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        setFormError('Failed to update user profile')
        setSubmitting(false)
        return
      }

      // Update care home assignments if role is manager
      if (editFormData.role === 'manager') {
        // Delete existing assignments
        await supabase
          .from('manager_care_homes')
          .delete()
          .eq('manager_id', editingUser.id)

        // Insert new assignments
        if (editFormData.assignedCareHomes.length > 0) {
          const assignments = editFormData.assignedCareHomes.map(homeId => ({
            manager_id: editingUser.id,
            care_home_id: homeId,
            assigned_by: profile?.id
          }))

          const { error: assignmentError } = await supabase
            .from('manager_care_homes')
            .insert(assignments)

          if (assignmentError) {
            console.error('Error updating care home assignments:', assignmentError)
            setFormError('User updated but failed to update care home assignments')
          }
        }
      } else {
        // If role changed from manager to something else, remove all assignments
        await supabase
          .from('manager_care_homes')
          .delete()
          .eq('manager_id', editingUser.id)
      }

      setFormSuccess('User updated successfully!')
      
      // Refresh the data
      await fetchData()

      // Close dialog after a short delay
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setEditingUser(null)
        setFormSuccess(null)
      }, 1500)

    } catch (err) {
      console.error('Exception updating user:', err)
      setFormError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      // Note: Deleting users requires Admin API - this is a placeholder
      // In production, you'd need a server-side function to delete users
      setError('User deletion requires admin privileges. Please contact support.')
      
      // For now, we can only deactivate by updating the profile
      // const { error } = await supabase
      //   .from('profiles')
      //   .update({ is_active: false })
      //   .eq('id', userId)

    } catch (err) {
      console.error('Exception deleting user:', err)
      setError('Failed to delete user')
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute allowedRoles={['business_owner']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="h-8 w-8 text-blue-600" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage user accounts and permissions
              </p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and assign a role. Share the generated credentials with the user.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddUser} className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  {formSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="font-medium mb-2">User created successfully!</div>
                        <div className="text-sm space-y-1">
                          <div>Email: <strong>{formData.email}</strong></div>
                          <div className="flex items-center gap-2">
                            Password: <strong>{generatedPassword}</strong>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(generatedPassword || '')}
                              className="h-6 px-2"
                            >
                              {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs mt-2 text-green-700">
                          ⚠️ Save these credentials now! This message will disappear in 30 seconds.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => {
                        setFormData({ ...formData, role: value, assignedCareHomes: [] })
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carer">Carer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="business_owner">Business Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Care Home Assignments - Only for Managers */}
                  {formData.role === 'manager' && careHomes.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <Label>Assign Care Homes (Optional)</Label>
                      </div>
                      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                        {careHomes.map((home) => (
                          <div key={home.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`home-${home.id}`}
                              checked={formData.assignedCareHomes.includes(home.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    assignedCareHomes: [...formData.assignedCareHomes, home.id]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    assignedCareHomes: formData.assignedCareHomes.filter(id => id !== home.id)
                                  })
                                }
                              }}
                              disabled={submitting}
                            />
                            <label
                              htmlFor={`home-${home.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <div>{home.name}</div>
                              <div className="text-xs text-gray-500">{home.address}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Select which care homes this manager will oversee. Managers will only see data for their assigned homes.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter or generate password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          disabled={submitting}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          disabled={submitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePassword}
                        disabled={submitting}
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum 8 characters. Use the Generate button for a secure password.
                    </p>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        setFormError(null)
                        setFormSuccess(null)
                        setFormData({
                          email: '',
                          firstName: '',
                          lastName: '',
                          role: 'carer',
                          password: '',
                          assignedCareHomes: []
                        })
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user details, role, and care home assignments.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdateUser} className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  {formSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {formSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={editingUser?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">First Name *</Label>
                      <Input
                        id="editFirstName"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editLastName">Last Name *</Label>
                      <Input
                        id="editLastName"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editRole">Role *</Label>
                    <Select
                      value={editFormData.role}
                      onValueChange={(value) => {
                        setEditFormData({ ...editFormData, role: value, assignedCareHomes: [] })
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger id="editRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carer">Carer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="business_owner">Business Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Care Home Assignments - Only for Managers */}
                  {editFormData.role === 'manager' && careHomes.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <Label>Assign Care Homes (Optional)</Label>
                      </div>
                      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                        {careHomes.map((home) => (
                          <div key={home.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`edit-home-${home.id}`}
                              checked={editFormData.assignedCareHomes.includes(home.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEditFormData({
                                    ...editFormData,
                                    assignedCareHomes: [...editFormData.assignedCareHomes, home.id]
                                  })
                                } else {
                                  setEditFormData({
                                    ...editFormData,
                                    assignedCareHomes: editFormData.assignedCareHomes.filter(id => id !== home.id)
                                  })
                                }
                              }}
                              disabled={submitting}
                            />
                            <label
                              htmlFor={`edit-home-${home.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <div>{home.name}</div>
                              <div className="text-xs text-gray-500">{home.address}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Select which care homes this manager will oversee.
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        setEditingUser(null)
                        setFormError(null)
                        setFormSuccess(null)
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Updating...' : 'Update User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Business Owners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'business_owner').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Managers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'manager').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Carers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'carer').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users List */}
          {!loading && !error && (
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user accounts and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => {
                    const userAssignments = managerAssignments
                      .filter(a => a.manager_id === user.id)
                      .map(a => careHomes.find(h => h.id === a.care_home_id))
                      .filter(Boolean)
                    
                    return (
                    <div
                      key={user.id}
                      className="flex flex-col p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.last_sign_in_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              Last login: {formatDate(user.last_sign_in_at)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleDisplay(user.role)}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            {/* Edit Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDialog(user)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Delete Button - Can't delete yourself */}
                            {user.id !== profile?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Show assigned care homes for managers */}
                      {user.role === 'manager' && userAssignments.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <Building2 className="h-3 w-3" />
                            <span className="font-medium">Manages {userAssignments.length} care home{userAssignments.length !== 1 ? 's' : ''}:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {userAssignments.map((home: any) => (
                              <Badge key={home.id} variant="outline" className="text-xs">
                                {home.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )})}

                  {users.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                      <p className="text-gray-600">Add your first user to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
