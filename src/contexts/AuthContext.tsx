'use client'

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; role: string }) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const fetchingProfile = useRef(false)

  const fetchProfile = async (userId: string) => {
    // Prevent concurrent fetches
    if (fetchingProfile.current) {
      console.log('AuthContext: Profile fetch already in progress, skipping...')
      return
    }
    
    fetchingProfile.current = true
    console.log('AuthContext: Starting profile fetch for user:', userId)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('AuthContext: Profile query completed', { data: !!data, error: !!error })

      if (error) {
        console.error('AuthContext: Error fetching profile:', error)
        console.error('AuthContext: Error code:', error.code)
        console.error('AuthContext: Error message:', error.message)
        
        // If profile doesn't exist, we might need to create one
        if (error.code === 'PGRST116') {
          console.error('AuthContext: Profile not found for user. User may need to complete registration.')
        }
        
        console.log('AuthContext: Setting loading to false due to error')
        setLoading(false)
        fetchingProfile.current = false
        return
      }

      console.log('AuthContext: Profile fetched successfully:', data)
      console.log('AuthContext: Setting profile and loading to false')
      setProfile(data)
      setLoading(false)
      fetchingProfile.current = false
    } catch (error) {
      console.error('AuthContext: Exception fetching profile:', error)
      console.log('AuthContext: Setting loading to false due to exception')
      setLoading(false)
      fetchingProfile.current = false
    }
  }

  useEffect(() => {
    console.log('AuthContext: Initializing...')
    let mounted = true
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('AuthContext: Error getting session:', error)
          setLoading(false)
          return
        }
        
        console.log('AuthContext: Session:', session?.user ? 'User found' : 'No user')
        setUser(session?.user ?? null)
        
        // Don't fetch profile here, let the separate effect handle it
        if (!session?.user) {
          setLoading(false)
        }
      } catch (error) {
        console.error('AuthContext: Exception getting session:', error)
        if (mounted) setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('AuthContext: Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        console.log('AuthContext: Handling SIGNED_OUT')
        setUser(null)
        setProfile(null)
        setLoading(false)
        fetchingProfile.current = false
      } else if (event === 'SIGNED_IN') {
        console.log('AuthContext: Handling SIGNED_IN')
        setUser(session?.user ?? null)
        // Profile will be fetched by the separate useEffect
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('AuthContext: Handling TOKEN_REFRESHED')
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Separate effect to fetch profile when user changes
  useEffect(() => {
    if (user && !profile && !fetchingProfile.current) {
      console.log('AuthContext: User exists but no profile, fetching...')
      fetchProfile(user.id)
    } else if (!user && !loading) {
      console.log('AuthContext: No user and not loading')
    }
  }, [user, profile])

  const signUp = async (email: string, password: string, userData: { first_name: string; last_name: string; role: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}