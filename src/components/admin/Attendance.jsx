import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Attendance() {
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchAbsensi()
  }, [filter, users])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, employee_id, department')
        .neq('role', 'admin')
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAbsensi = async () => {
    setLoading(true)
    try {
      // Ambil semua absensi
      const { data: absensiData } = await supabase
        .from('absensi')
        .select('*')
        .order('scan_time', { ascending: false })

      // Filter berdasarkan WIB
      const now = new Date()
      const nowWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000))
      const todayStr = `${nowWIB.getFullYear()}-${String(nowWIB.getMonth() + 1).padStart(2, '0')}-${String(nowWIB.getDate()).padStart(2, '0')}`

      let filteredData = absensiData || []

      if (filter === 'today') {
        filteredData = filteredData.filter(item => {
          const itemWIB = new Date(new Date(item.scan_time).getTime() + (7 * 60 * 60 * 1000))
          const itemDate = `${itemWIB.getFullYear()}-${String(itemWIB.getMonth() + 1).padStart(2, '0')}-${String(itemWIB.getDate()).padStart(2, '0')}`
          return itemDate === todayStr
        })
      } else if (filter === 'week') {
        const weekAgo = new Date(nowWIB.getTime() - (7 * 24 * 60 * 60 * 1000))
        filteredData = filteredData.filter(item => {
          const itemWIB = new Date(new Date(item.scan_time).getTime() + (7 * 60 * 60 * 1000))
          return itemWIB >= weekAgo
        })
      } else if (filter === 'month') {
        const monthAgo = new Date(nowWIB.getTime() - (30 * 24 * 60 * 60 * 1000))
        filteredData = filteredData.filter(item => {
          const itemWIB = new Date(new Date(item.scan_time).getTime() + (7 * 60 * 60 * 1000))
          return itemWIB >= monthAgo
        })
      }

      // Gabungkan dengan user
      const enriched = filteredData.map(item => {
        const user = users?.find(u => u.id === item.user_id)
        return {
          ...item,
          full_name: user?.full_name || 'Unknown',
          employee_id: user?.employee_id || '-',
          department: user?.department || '-'
        }
      })

      setAbsensi(enriched)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatWIB = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const wib = new Date(date.getTime() + (7 * 60 * 60 * 1000))
    return wib.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getStatusBadge = (status, type) => {
    if (status === 'approved' || status === 'granted') {
      return <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">
        {type === 'in' ? '✅ Masuk' : '✅ Pulang'}
      </span>
    }
    return <span className="px-3 py-1 rounded-full bg-[#fde9ea] text-[#e0384c] text-[11px] font-bold">❌ Gagal</span>
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
            🔄 Refresh
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
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {absensi.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-[#6b7383]">Tidak ada data absensi</td>
                  </tr>
                ) : (
                  absensi.map((item) => (
                    <tr key={item.id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc]">
                      <td className="px-6 py-3 font-semibold">{item.full_name}</td>
                      <td className="px-6 py-3 text-[#6b7383]">{item.employee_id}</td>
                      <td className="px-6 py-3 text-[#6b7383]">{item.department}</td>
                      <td className="px-6 py-3 text-[#6b7383]">
                        {formatWIB(item.scan_time).split(',')[0]}
                      </td>
                      <td className="px-6 py-3 text-[#6b7383]">
                        {formatWIB(item.scan_time).split(',')[1]}
                      </td>
                      <td className="px-6 py-3 text-[#6b7383]">{item.location_name || 'Kantor'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          item.type === 'in' ? 'bg-[#eef1ff] text-[#1541c9]' : 'bg-[#fdf3dc] text-[#c78a12]'
                        }`}>
                          {item.type === 'in' ? 'Masuk' : 'Pulang'}
                        </span>
                      </td>
                      <td className="px-6 py-3">{getStatusBadge(item.status, item.type)}</td>
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