import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Reports() {
  const [stats, setStats] = useState({
    totalScans: 0,
    totalUsers: 0,
    totalAbsensi: 0,
    successRate: 0,
    todayAbsensi: 0,
    thisWeekAbsensi: 0,
    thisMonthAbsensi: 0
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('today')
  const [absensiList, setAbsensiList] = useState([])

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    
    try {
      // Hitung semua data
      const { count: totalScans } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin')

      const { count: totalAbsensi } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })

      // Hitung success rate
      const { data: scanData } = await supabase
        .from('scans')
        .select('status')
      
      const total = scanData?.length || 0
      const granted = scanData?.filter(s => s.status === 'granted').length || 0
      const successRate = total > 0 ? Math.round((granted / total) * 100) : 0

      // Hitung absensi berdasarkan periode
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      // Absensi hari ini
      const { count: todayAbsensi } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })
        .gte('scan_time', `${todayStr}T00:00:00`)

      // Absensi minggu ini
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: thisWeekAbsensi } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })
        .gte('scan_time', weekAgo.toISOString())

      // Absensi bulan ini
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { count: thisMonthAbsensi } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })
        .gte('scan_time', monthAgo.toISOString())

      // 1. AMBIL SEMUA USERS DULU
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department')

      // 2. AMBIL ABSENSI
      let query = supabase
        .from('absensi')
        .select('*')
        .order('scan_time', { ascending: false })

      if (dateRange === 'today') {
        query = query.gte('scan_time', `${todayStr}T00:00:00`)
      } else if (dateRange === 'week') {
        query = query.gte('scan_time', weekAgo.toISOString())
      } else if (dateRange === 'month') {
        query = query.gte('scan_time', monthAgo.toISOString())
      }

      const { data: absensiData } = await query

      // 3. GABUNGIN MANUAL
      const enriched = absensiData?.map(item => {
        const user = usersData?.find(u => u.id === item.user_id)
        return {
          ...item,
          full_name: user?.full_name || 'Unknown',
          employee_id: user?.employee_id || '-',
          department: user?.department || '-'
        }
      }) || []

      setAbsensiList(enriched)

      setStats({
        totalScans: totalScans || 0,
        totalUsers: totalUsers || 0,
        totalAbsensi: totalAbsensi || 0,
        successRate: successRate,
        todayAbsensi: todayAbsensi || 0,
        thisWeekAbsensi: thisWeekAbsensi || 0,
        thisMonthAbsensi: thisMonthAbsensi || 0
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  const getPeriodLabel = () => {
    const map = {
      'today': 'Hari Ini',
      'week': '7 Hari Terakhir',
      'month': '30 Hari Terakhir'
    }
    return map[dateRange] || 'Hari Ini'
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Laporan</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">Statistik sistem secara keseluruhan</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 rounded-[12px] bg-[#eef1fb] border border-transparent focus:border-[#3b63f0] focus:bg-white outline-none text-[14px]"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
          </select>
          <button onClick={fetchStats} className="btn btn-ghost btn-sm">
            Refresh
          </button>
          <button onClick={printReport} className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <path d="M6 14h12v8H6z"/>
            </svg>
            Cetak Laporan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Memuat data...</div>
      ) : (
        <>
          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
            <div className="stat-card">
              <div className="stat-label">Total Scan</div>
              <div className="stat-value">{stats.totalScans.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Karyawan</div>
              <div className="stat-value">{stats.totalUsers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Absensi</div>
              <div className="stat-value">{stats.totalAbsensi.toLocaleString()}</div>
              <div className="text-[11px] text-[#6b7383] mt-1">
                Hari ini: {stats.todayAbsensi} | 7 hari: {stats.thisWeekAbsensi} | 30 hari: {stats.thisMonthAbsensi}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tingkat Keberhasilan</div>
              <div className="stat-value text-[#1a9a53]">{stats.successRate}%</div>
              <div className="h-1.5 bg-[#eef1fb] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#1a9a53] rounded-full" style={{ width: `${stats.successRate}%` }}></div>
              </div>
            </div>
          </div>

          {/* Daftar Absensi */}
          <div className="card overflow-hidden">
            <div className="flex justify-between items-center px-[22px] py-[18px] border-b border-[#e7e9f2] bg-[#eef1fb]">
              <span className="text-[14px] font-extrabold text-[#0b1220]">
                Daftar Absensi ({getPeriodLabel()}) - {absensiList.length} data
              </span>
            </div>

            {absensiList.length === 0 ? (
              <div className="text-center py-12 text-[#6b7383]">Tidak ada data absensi pada periode ini</div>
            ) : (
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
                    {absensiList.map((item) => (
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
                        <td className="px-6 py-3">
                          <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">Hadir</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-6 py-4 border-t border-[#e7e9f2] text-[13px] text-[#6b7383]">
              Total: {absensiList.length} data
            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .btn, .btn-ghost, .btn-primary, button, select {
              display: none !important;
            }
            .stat-card {
              break-inside: avoid;
            }
            .card {
              break-inside: avoid;
            }
          }
        `
      }} />
    </div>
  )
}