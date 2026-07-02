import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAbsensi() {
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAbsensi = useCallback(async (limit = 100) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('absensi')
        .select(`
          *,
          users:user_id (id, full_name, email, employee_id, department),
          nodes:node_id (id, name, location, node_id)
        `)
        .order('scan_time', { ascending: false })
        .limit(limit)

      if (error) throw error
      setAbsensi(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAbsensi()

    const channel = supabase
      .channel('absensi_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'absensi' 
        },
        () => {
          fetchAbsensi()
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [fetchAbsensi])

  const createAbsensi = useCallback(async (data) => {
    const { data: result, error } = await supabase
      .from('absensi')
      .insert([{
        user_id: data.user_id,
        node_id: data.node_id,
        permit_code: data.permit_code,
        latitude: data.latitude,
        longitude: data.longitude,
        location_name: data.location_name,
        status: data.status || 'pending',
        device_id: data.device_id,
        photo_url: data.photo_url,
        notes: data.notes
      }])
      .select()
      .single()

    if (error) throw error
    return result
  }, [])

  const updateAbsensiStatus = useCallback(async (id, status) => {
    const { data, error } = await supabase
      .from('absensi')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  return { absensi, loading, error, refetch: fetchAbsensi, createAbsensi, updateAbsensiStatus }
}