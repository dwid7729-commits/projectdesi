import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNodes() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .order('name')

      if (error) throw error
      setNodes(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNodes()

    // Real-time subscription
    const channel = supabase
      .channel('nodes_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'nodes' 
        },
        () => {
          fetchNodes()
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [fetchNodes])

  const updateNodeStatus = useCallback(async (nodeId, status) => {
    const { data, error } = await supabase
      .from('nodes')
      .update({ 
        status, 
        last_ping: new Date().toISOString() 
      })
      .eq('id', nodeId)
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  const addNode = useCallback(async (nodeData) => {
    const { data, error } = await supabase
      .from('nodes')
      .insert([nodeData])
      .select()
      .single()

    if (error) throw error
    return data
  }, [])

  return { nodes, loading, error, refetch: fetchNodes, updateNodeStatus, addNode }
}