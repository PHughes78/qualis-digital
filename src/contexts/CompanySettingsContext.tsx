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
  chatgpt_api_key_set: boolean
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

  const fallbackSettings: CompanySettings = {
    id: 'fallback',
    company_name: 'Qualis Digital',
    company_description: 'Unified UK care management platform',
    logo_url: null,
    primary_color: '#2563eb',
    updated_at: new Date().toISOString(),
    chatgpt_api_key_set: false,
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('id, company_name, company_description, logo_url, primary_color, updated_at, chatgpt_api_key')
        .maybeSingle()

      if (error) {
        console.error('Error fetching company settings:', error)
        setSettings(fallbackSettings)
      } else if (data) {
        setSettings({
          id: data.id,
          company_name: data.company_name,
          company_description: data.company_description,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          updated_at: data.updated_at,
          chatgpt_api_key_set: Boolean(data.chatgpt_api_key),
        })
      } else {
        setSettings(fallbackSettings)
      }
    } catch (err) {
      console.error('Exception fetching company settings:', err)
      setSettings(fallbackSettings)
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
