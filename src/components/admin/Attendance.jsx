import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Attendance() {
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')

  useEffect(() => {
    fetchAbsensi()
  }, [filter])

  const fetchAbsensi = async () => {
    setLoading(true)
    try {
      // Ambil users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email, employee_id, department')

      // Ambil absensi
      let query = supabase
        .from('absensi')
        .select('*')
        .order('scan_time', { ascending: false })

      if (filter === 'today') {
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        query = query.gte('scan_time', `${todayStr}T00:00:00`)
      } else if (filter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('scan_time', weekAgo.toISOString())
      } else if (filter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('scan_time', monthAgo.toISOString())
      }

      const { data: absensiData } = await query

      // Gabungkan manual
      const enrichedData = absensiData?.map(item => {
        const user = usersData?.find(u => u.id === item.user_id)
        return {
          ...item,
          full_name: user?.full_name || 'Unknown',
          employee_id: user?.employee_id || '-',
          department: user?.department || '-'
        }
      }) || []

      setAbsensi(enrichedData)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'granted') {
      return <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">Berhasil</span>
    }
    return <span className="px-3 py-1 rounded-full bg-[#fde9ea] text-[#e0384c] text-[11px] font-bold">Gagal</span>
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Manajemen Absensi</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">Data absensi semua karyawan</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 rounded-[12px] bg-[#eef1fb] border border-transparent focus:border-[#3b63f0] focus:bg-white outline-none text-[14px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
            <option value="all">Semua</option>
          </select>
          <button onClick={fetchAbsensi} className="btn btn-ghost btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Memuat data...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8f9fc] border-b border-[#e7e9f2]">
                <tr>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Karyawan</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Departemen</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Tanggal</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Waktu</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lokasi</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {absensi.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-[#6b7383]">Tidak ada data absensi</td>
                  </tr>
                ) : (
                  absensi.map((item) => (
                    <tr key={item.id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc]">
                      <td className="px-6 py-3 font-semibold">{item.full_name}</td>
                      <td className="px-6 py-3 text-[#6b7383]">{item.employee_id}</td>
                      <td className="px-6 py-3 text-[#6b7383]">{item.department}</td>
                      <td className="px-6 py-3 text-[#6b7383]">
                        {item.scan_time ? new Date(item.scan_time).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-3 text-[#6b7383]">
                        {item.scan_time ? new Date(item.scan_time).toLocaleTimeString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-3 text-[#6b7383]">{item.location_name || 'Kantor'}</td>
                      <td className="px-6 py-3">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-[#e7e9f2] text-[13px] text-[#6b7383]">
            Total: {absensi.length} data
          </div>
        </div>
      )}
    </div>
  )
}