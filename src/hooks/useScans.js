import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useScans(limit = 50) {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('scans')
        .select(`
          *,
          users:user_id (id, full_name, email),
          nodes:node_id (id, name, location, node_id)
        `)
        .order('scan_time', { ascending: false })
        .limit(limit)

      if (error) throw error
      setScans(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchScans()

    const channel = supabase
      .channel('scans_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'scans' 
        },
        () => {
          fetchScans()
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [fetchScans, limit])

  const addScan = useCallback(async (scanData) => {
    const { data, error } = await supabase
      .from('scans')
      .insert([scanData])
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  return { scans, loading, error, refetch: fetchScans, addScan }
}