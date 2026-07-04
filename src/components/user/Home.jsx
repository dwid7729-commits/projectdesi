import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Home() {
  const { user, profile } = useAuth()
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    totalAbsensi: 0,
    totalScans: 0
  })

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // 1. Ambil data absensi user
      const { data: absensiData, error: absensiError } = await supabase
        .from('absensi')
        .select('*')
        .eq('user_id', user.id)
        .order('scan_time', { ascending: false })
        .limit(5)

      if (absensiError) console.error('Error absensi:', absensiError)

      // 2. Ambil data scan user
      const { data: scansData, error: scansError } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('scan_time', { ascending: false })
        .limit(5)

      if (scansError) console.error('Error scans:', scansError)

      // 3. Gabungkan aktivitas
      const activities = []

      absensiData?.forEach(item => {
        const typeLabel = item.type === 'in' ? 'Masuk' : 'Pulang'
        activities.push({
          id: item.id,
          type: 'absensi',
          title: `Absen ${typeLabel}`,
          location: item.location_name || 'Kantor',
          time: item.scan_time,
          status: item.status,
          icon: 'check'
        })
      })

      scansData?.forEach(item => {
        activities.push({
          id: item.id,
          type: 'scan',
          title: 'Scan QR',
          location: item.location || 'Kantor',
          time: item.scan_time,
          status: item.status,
          icon: 'scan'
        })
      })

      // Urutkan berdasarkan waktu terbaru
      activities.sort((a, b) => new Date(b.time) - new Date(a.time))
      
      setRecentActivity(activities.slice(0, 5))

      // 4. Hitung statistik user
      const { count: totalAbsensi } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: totalScans } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setUserStats({
        totalAbsensi: totalAbsensi || 0,
        totalScans: totalScans || 0
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'granted') {
      return <span className="px-2 py-0.5 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[10px] font-bold">Berhasil</span>
    }
    return <span className="px-2 py-0.5 rounded-full bg-[#fde9ea] text-[#e0384c] text-[10px] font-bold">Gagal</span>
  }

  const getActivityIcon = (type) => {
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

  // FORMAT WAKTU WIB (UTC+7)
  const formatWIB = (dateString) => {
    const date = new Date(dateString)
    // Tambah 7 jam
    const wibDate = new Date(date.getTime() + (7 * 60 * 60 * 1000))
    return wibDate.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-6">
        <div>
          <div className="text-[#6b7383] text-[14px]">Selamat datang,</div>
          <div className="text-[22px] font-extrabold text-[#0b1220]">{profile?.full_name || 'User'}</div>
        </div>
        <div className="w-[44px] h-[44px] rounded-full bg-[#1d4fe0] flex items-center justify-center text-white font-bold text-[18px]">
          {getInitials(profile?.full_name)}
        </div>
      </div>

      {/* Statistik User */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-[14px] p-4 border border-[#e7e9f2] text-center">
          <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Total Absensi</div>
          <div className="text-[24px] font-extrabold text-[#0b1220] mt-1">{userStats.totalAbsensi}</div>
        </div>
        <div className="bg-white rounded-[14px] p-4 border border-[#e7e9f2] text-center">
          <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Total Scan</div>
          <div className="text-[24px] font-extrabold text-[#0b1220] mt-1">{userStats.totalScans}</div>
        </div>
      </div>

      {/* ID Card */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(20,40,120,0.08)] border border-[#e7e9f2]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">ID Karyawan</div>
            <div className="text-[16px] font-bold text-[#0b1220] mt-0.5">{profile?.employee_id || 'Not Assigned'}</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">Aktif</span>
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#e7e9f2]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Departemen</div>
              <div className="text-[13px] font-semibold text-[#0b1220] mt-0.5">{profile?.department || 'Not Assigned'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Level Akses</div>
              <div className="text-[13px] font-semibold text-[#0b1220] mt-0.5">Level {profile?.access_level || 1}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#e7e9f2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1a9a53]"></div>
              <span className="text-[12px] text-[#6b7383]">Izin Aktif</span>
            </div>
            <span className="text-[12px] text-[#1a9a53] font-bold">Aktif</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link to="/scan" className="bg-[#1d4fe0] text-white rounded-[16px] p-4 text-center hover:bg-[#1541c9] transition-colors">
          <div className="flex flex-col items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h3v3h-3zM14 20h3M20 14v3M17 20h4v-3"/>
            </svg>
            <span className="text-[12px] font-bold">Scan QR</span>
          </div>
        </Link>
        <Link to="/history" className="bg-white rounded-[16px] p-4 text-center border border-[#e7e9f2] hover:bg-[#f8f9fc] transition-colors">
          <div className="flex flex-col items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1d4fe0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 3"/>
            </svg>
            <span className="text-[12px] font-bold text-[#0b1220]">Riwayat</span>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[15px] font-bold text-[#0b1220]">Aktivitas Terbaru</h3>
          <Link to="/history" className="text-[12px] text-[#1d4fe0] font-semibold">Lihat Semua</Link>
        </div>

        {loading ? (
          <div className="text-center py-6 text-[#6b7383] text-[13px]">Memuat...</div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div key={item.id} className="bg-white rounded-[14px] p-4 border border-[#e7e9f2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#eef1fb] flex items-center justify-center">
                    {getActivityIcon(item.type)}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0b1220]">
                      {item.title}
                      <span className="text-[11px] font-normal text-[#6b7383] ml-1">- {item.location}</span>
                    </div>
                    <div className="text-[11px] text-[#6b7383]">
                      {formatWIB(item.time)}
                    </div>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[14px] p-8 border border-[#e7e9f2] text-center">
            <div className="text-[#9aa1b0] text-[13px]">Belum ada aktivitas</div>
          </div>
        )}
      </div>
    </div>
  )
}