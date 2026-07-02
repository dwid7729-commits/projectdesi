import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function HistoryMobile() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user, filter])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const result = []

      // 1. Ambil absensi user
      const { data: absensiData } = await supabase
        .from('absensi')
        .select('*')
        .eq('user_id', user.id)
        .order('scan_time', { ascending: false })

      if (absensiData) {
        absensiData.forEach(item => {
          result.push({
            id: item.id,
            type: 'absensi',
            title: 'Absensi',
            location: item.location_name || 'Kantor',
            time: item.scan_time,
            status: item.status,
            detail: item.permit_code || '-'
          })
        })
      }

      // 2. Ambil scans user
      const { data: scansData } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('scan_time', { ascending: false })

      if (scansData) {
        scansData.forEach(item => {
          result.push({
            id: item.id,
            type: 'scan',
            title: 'Scan QR',
            location: item.location || 'Kantor',
            time: item.scan_time,
            status: item.status,
            detail: item.device_id || '-'
          })
        })
      }

      // 3. Urutkan berdasarkan waktu
      result.sort((a, b) => new Date(b.time) - new Date(a.time))

      // 4. Filter
      let filtered = result
      if (filter === 'berhasil') {
        filtered = result.filter(item => item.status === 'approved' || item.status === 'granted')
      } else if (filter === 'gagal') {
        filtered = result.filter(item => item.status === 'denied' || item.status === 'rejected')
      }

      setActivities(filtered)

    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'granted') {
      return <span className="px-2 py-0.5 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[10px] font-bold">Berhasil</span>
    }
    if (status === 'denied' || status === 'rejected') {
      return <span className="px-2 py-0.5 rounded-full bg-[#fde9ea] text-[#e0384c] text-[10px] font-bold">Gagal</span>
    }
    return <span className="px-2 py-0.5 rounded-full bg-[#fdf3dc] text-[#c78a12] text-[10px] font-bold">Pending</span>
  }

  const getIcon = (type) => {
    if (type === 'absensi') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
          <path d="M12 6v2"/>
        </svg>
      )
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 14h3v3h-3zM14 20h3M20 14v3M17 20h4v-3"/>
      </svg>
    )
  }

  return (
    <div>
      <div className="pt-5 pb-1.5">
        <div className="text-[27px] font-extrabold tracking-[-.02em] mt-1 mb-[18px]">Riwayat</div>
      </div>

      <div className="flex gap-2 mb-[18px] overflow-x-auto">
        <button 
          onClick={() => setFilter('all')}
          className={`whitespace-nowrap px-[15px] py-2 rounded-full text-[13px] font-bold ${
            filter === 'all' ? 'bg-[#1d4fe0] text-white' : 'bg-white text-[#6b7383] shadow-sp-card'
          }`}
        >
          Semua
        </button>
        <button 
          onClick={() => setFilter('berhasil')}
          className={`whitespace-nowrap px-[15px] py-2 rounded-full text-[13px] font-bold ${
            filter === 'berhasil' ? 'bg-[#1a9a53] text-white' : 'bg-white text-[#6b7383] shadow-sp-card'
          }`}
        >
          Berhasil
        </button>
        <button 
          onClick={() => setFilter('gagal')}
          className={`whitespace-nowrap px-[15px] py-2 rounded-full text-[13px] font-bold ${
            filter === 'gagal' ? 'bg-[#e0384c] text-white' : 'bg-white text-[#6b7383] shadow-sp-card'
          }`}
        >
          Gagal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#6b7383]">Memuat...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-[#6b7383]">Belum ada riwayat</div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="bg-white rounded-[16px] p-4 shadow-sp-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#eef1fb] flex items-center justify-center flex-none">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[14px]">{item.title}</div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-[12px] text-[#6b7383] mt-1">{item.location}</div>
                  <div className="text-[11px] text-[#9aa1b0] mt-0.5">
                    {new Date(item.time).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-[#9aa1b0] mt-1">ID: {item.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}