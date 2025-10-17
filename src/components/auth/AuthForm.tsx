"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useCompanySettings } from "@/contexts/CompanySettingsContext"

export default function AuthForm() {
  const router = useRouter()
  const { signIn, signUp, profile } = useAuth()
  const { settings } = useCompanySettings()
  const supabase = useMemo(() => createClient(), [])

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      router.replace("/dashboard")
    }
  }, [profile, router])

  const [tab, setTab] = useState("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const resetFeedback = () => {
    setError("")
    setMessage("")
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetFeedback()
    setLoading(true)
    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  const validatePassword = (pw: string) => {
    const lengthOk = pw.length >= 8
    const numberOk = /\d/.test(pw)
    const letterOk = /[A-Za-z]/.test(pw)
    if (!lengthOk || !numberOk || !letterOk) {
      return "Password must be at least 8 characters and include a number and a letter"
    }
    return null
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetFeedback()
    setLoading(true)
    if (!role) {
      setError("Please select a role")
      setLoading(false)
      return
    }
    if (!accepted) {
      setError("You must accept the Terms & Privacy Policy")
      setLoading(false)
      return
    }
    const pwErr = validatePassword(password)
    if (pwErr) {
      setError(pwErr)
      setLoading(false)
      return
    }
    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: role,
      })
      setMessage("Account created! Check your email to confirm.")
      setTab("signin")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetFeedback()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
      })
      if (error) throw error
      setResetSent(true)
      setMessage("If the email exists, a reset link has been sent.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate password reset")
    } finally {
      setLoading(false)
    }
  }

  const companyName = settings?.company_name || "Qualis Digital"
  const companyDescription = settings?.company_description || "Unified UK care management platform"
  const logoUrl = settings?.logo_url || "/vercel.svg"

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-gray-950">
      {/* Left branding / hero panel */}
      <div className="hidden lg:flex relative w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/globe.svg')] bg-cover bg-center opacity-10" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <Image src={logoUrl} alt="Logo" width={42} height={42} />
              <h1 className="text-4xl font-extrabold tracking-tight">{companyName}</h1>
            </div>
            <p className="mt-6 text-lg max-w-md leading-relaxed text-white/90">
              {companyDescription}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><span className="h-6 w-6 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-xs">1</span> Role-based secure access</li>
            <li className="flex items-start gap-2"><span className="h-6 w-6 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-xs">2</span> Centralised client care plans</li>
            <li className="flex items-start gap-2"><span className="h-6 w-6 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-xs">3</span> Real-time handover continuity</li>
            <li className="flex items-start gap-2"><span className="h-6 w-6 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-xs">4</span> Incident reporting & tracking</li>
          </ul>
          <div className="mt-4 text-xs text-white/70">CQC-ready. GDPR compliant. Built for frontline efficiency.</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/25 to-transparent" aria-hidden="true" />
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <Image src={logoUrl} alt="Logo" width={32} height={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{companyName}</h1>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{companyDescription}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <Card className="shadow-lg border-gray-200/60 dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="space-y-1 pb-4 relative">
              {!resetMode && (
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="text-sm">Create Account</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {resetMode ? "Reset your password" : tab === "signin" ? "Welcome back" : "Create your account"}
              </CardTitle>
              <CardDescription>
                {resetMode
                  ? "Enter your email to receive a password reset link"
                  : tab === "signin"
                    ? "Access your care management dashboard"
                    : "Start streamlining your care operations"}
              </CardDescription>
              <div className="absolute top-2 right-2 hidden lg:block"><ThemeToggle /></div>
            </CardHeader>
            <CardContent>
              {!resetMode && (
                <Tabs value={tab} className="w-full">
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@carehome.co.uk" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                      </div>
                      <div className="flex justify-between items-center">
                        <button type="button" onClick={() => { setResetMode(true); resetFeedback(); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</button>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400">Need an account? <button type="button" className="underline" onClick={() => setTab("signup")}>Create one</button></div>
                    </form>
                  </TabsContent>
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Smith" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup_email">Email</Label>
                        <Input id="signup_email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@carehome.co.uk" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup_password">Password</Label>
                        <Input id="signup_password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 chars, include a number" />
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Use at least 8 characters including a number and a letter.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="carer">Carer</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="business_owner">Business Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-start gap-2">
                        <input id="accept" type="checkbox" className="mt-1 h-4 w-4" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
                        <label htmlFor="accept" className="text-xs text-gray-600 dark:text-gray-400">I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</label>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400">Already have an account? <button type="button" className="underline" onClick={() => setTab("signin")}>Sign in</button></div>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
              {resetMode && (
                <form onSubmit={handlePasswordReset} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset_email">Email</Label>
                    <Input id="reset_email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@carehome.co.uk" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : resetSent ? "Resend Link" : "Send Reset Link"}</Button>
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400">Remembered password? <button type="button" className="underline" onClick={() => { setResetMode(false); resetFeedback(); }}>Back to sign in</button></div>
                </form>
              )}
              {error && (
                <Alert className="mt-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
              )}
              {message && (
                <Alert className="mt-4" variant="default"><AlertDescription>{message}</AlertDescription></Alert>
              )}
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">© {new Date().getFullYear()} Qualis Digital. All rights reserved. · <a href="/terms" className="underline">Terms</a> · <a href="/privacy" className="underline">Privacy</a></p>
        </div>
      </div>
    </div>
  )
}