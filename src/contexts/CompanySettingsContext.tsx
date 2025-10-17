"use client"

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CompanySettings {
  id: string
  company_name: string
  company_description: string | null
  logo_url: string | null
  primary_color: string | null
  updated_at: string
}

interface CompanySettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  refreshSettings: () => Promise<void>
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined)

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching company settings:', error)
      } else {
        setSettings(data)
      }
    } catch (err) {
      console.error('Exception fetching company settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('company_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings'
        },
        () => {
          fetchSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <CompanySettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  )
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext)
  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider')
  }
  return context
}
