import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState({
    location_radius: { value: 100, unit: 'meters' },
    office_location: { lat: -7.05235730, lng: 110.42768660 },
    allow_selfie: { enabled: true },
    qr_expiry: { minutes: 5 }
  })
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')

      if (error) throw error

      const settingsMap = {}
      data?.forEach(item => {
        try {
          settingsMap[item.key] = typeof item.value === 'string' 
            ? JSON.parse(item.value) 
            : item.value
        } catch {
          settingsMap[item.key] = item.value
        }
      })

      setSettings(prev => ({
        ...prev,
        ...settingsMap
      }))

      console.log('Settings loaded:', settingsMap)

    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSetting = useCallback(async (key, value) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (error) throw error
      
      setSettings(prev => ({
        ...prev,
        [key]: value
      }))
      
      return true
    } catch (err) {
      console.error('Error updating setting:', err)
      throw err
    }
  }, [])

  return { settings, loading, fetchSettings, updateSetting }
}