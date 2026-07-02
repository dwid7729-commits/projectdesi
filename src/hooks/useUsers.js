import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      // Ambil SEMUA user (termasuk admin)
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

  const addUser = useCallback(async (userData) => {
    try {
      if (!supabaseAdmin) {
        throw new Error('Service role key not configured')
      }

      // Cek email sudah dipake
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .maybeSingle()

      if (existingUser) {
        throw new Error('Email already registered')
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      })

      if (authError) throw authError

      // Insert ke users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          employee_id: userData.employee_id || `EMP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          department: userData.department || '',
          phone: userData.phone || '',
          location: userData.location || '',
          role: userData.role || 'user',
          access_level: userData.access_level || 1
        })

      if (insertError) {
        // Rollback: hapus auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw insertError
      }

      return authData.user
    } catch (err) {
      throw err
    }
  }, [])

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

  const deleteUser = useCallback(async (id) => {
    try {
      if (!supabaseAdmin) {
        throw new Error('Service role key not configured')
      }

      // Delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (authError) throw authError

      // Delete from users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      throw err
    }
  }, [])

  return { 
    users, 
    loading, 
    error, 
    refetch: fetchUsers, 
    addUser, 
    updateUser, 
    deleteUser 
  }
}