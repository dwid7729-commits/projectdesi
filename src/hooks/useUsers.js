import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()

    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [fetchUsers])

  const updateUser = useCallback(async (id, userData) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department,
        access_level: userData.access_level,
        employee_id: userData.employee_id,
        phone: userData.phone,
        location: userData.location
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  return { 
    users, 
    loading, 
    error, 
    refetch: fetchUsers, 
    updateUser
  }
}
