import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Timezone WIB
const APP_TIMEZONE = 'Asia/Jakarta'

const parseDbTimestamp = (input) => {
  if (input instanceof Date) return input
  if (!input) return new Date(NaN)
  const hasTZ = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(input.trim())
  if (hasTZ) return new Date(input)
  const isoLike = input.trim().replace(' ', 'T')
  return new Date(isoLike + 'Z')
}

const formatTimeWIB = (input) => {
  if (!input) return null
  return parseDbTimestamp(input).toLocaleTimeString('id-ID', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDurasi = (totalMenit) => {
  const jam = Math.floor(totalMenit / 60)
  const menit = totalMenit % 60
  if (menit === 0) return `${jam} jam`
  return `${jam} jam ${menit} menit`
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalAbsensi: 0,
    totalUsers: 0,
    totalNodes: 0,
    successRate: 0,
    totalLembur: 0
  })
  const [todayRows, setTodayRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department')
        .neq('role', 'admin')

      // Ambil semua absensi (7 hari terakhir biar ga terlalu banyak)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekStr = weekAgo.toISOString().slice(0, 19).replace('T', ' ')

      const { data: absensiData } = await supabase
        .from('absensi')
        .select('*')
        .gte('scan_time', weekStr)
        .order('scan_time', { ascending: true })

      // === PAIRING IN-OUT PER SHIFT ===
      const pairedShifts = []
      const unpairedIns = {}

      for (const item of absensiData || []) {
        const userId = item.user_id
        const type = item.type
        const time = parseDbTimestamp(item.scan_time)

        if (type === 'in') {
          // Simpan IN buat di-pair nanti
          if (!unpairedIns[userId]) {
            unpairedIns[userId] = []
          }
          unpairedIns[userId].push(item)
        } else if (type === 'out') {
          // Cari IN terakhir yang belum punya OUT
          const ins = unpairedIns[userId] || []
          let matched = null
          let matchedIndex = -1

          // Cari IN terakhir (yang paling dekat dengan OUT)
          for (let i = ins.length - 1; i >= 0; i--) {
            const inTime = parseDbTimestamp(ins[i].scan_time)
            const outTime = time
            const diffMs = outTime - inTime
            // Maksimal 24 jam (biar ga salah pair)
            if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
              matched = ins[i]
              matchedIndex = i
              break
            }
          }

          if (matched) {
            pairedShifts.push({
              user_id: userId,
              masuk: matched,
              pulang: item,
              inTime: parseDbTimestamp(matched.scan_time),
              outTime: time
            })
            // Hapus IN yang udah dipair
            unpairedIns[userId].splice(matchedIndex, 1)
          } else {
            // OUT tanpa IN (kalo ada)
            pairedShifts.push({
              user_id: userId,
              masuk: null,
              pulang: item,
              inTime: null,
              outTime: time
            })
          }
        }
      }

      // Tambah sisa IN yang belum punya OUT
      Object.keys(unpairedIns).forEach(userId => {
        unpairedIns[userId].forEach(item => {
          pairedShifts.push({
            user_id: userId,
            masuk: item,
            pulang: null,
            inTime: parseDbTimestamp(item.scan_time),
            outTime: null
          })
        })
      })

      // Urutkan berdasarkan waktu IN (terbaru dulu)
      pairedShifts.sort((a, b) => {
        const aTime = a.inTime || a.outTime
        const bTime = b.inTime || b.outTime
        return bTime - aTime
      })

      // Ambil 10 shift terakhir buat ditampilin
      const recentShifts = pairedShifts.slice(0, 10)

      // Build rows
      const rows = recentShifts.map(shift => {
        const user = usersData?.find(u => u.id === shift.user_id)

        const masukTime = shift.inTime ? formatTimeWIB(shift.inTime.toISOString()) : '-'
        const pulangTime = shift.outTime ? formatTimeWIB(shift.outTime.toISOString()) : '-'

        let totalLabel = '-'
        let lemburLabel = '-'
        let status = '🟡 Bekerja'

        if (shift.inTime && shift.outTime) {
          const menitKerja = Math.round((shift.outTime - shift.inTime) / 60000)
          totalLabel = formatDurasi(menitKerja)

          const STANDAR_MENIT = 8 * 60
          if (menitKerja > STANDAR_MENIT) {
            lemburLabel = `+${formatDurasi(menitKerja - STANDAR_MENIT)}`
          }

          status = '✅ Selesai'
        } else if (shift.inTime) {
          status = '🟡 Bekerja'
        } else if (shift.outTime) {
          status = '⚠️ Tanpa IN'
        }

        // Tanggal masuk buat display
        const tanggal = shift.inTime 
          ? shift.inTime.toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'numeric', 
              year: 'numeric',
              timeZone: APP_TIMEZONE 
            })
          : shift.outTime?.toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'numeric', 
              year: 'numeric',
              timeZone: APP_TIMEZONE 
            }) || '-'

        return {
          id: shift.user_id + (shift.inTime?.getTime() || shift.outTime?.getTime() || ''),
          user_id: shift.user_id,
          full_name: user?.full_name || 'Unknown',
          employee_id: user?.employee_id || '-',
          department: user?.department || '-',
          tanggal: tanggal,
          masuk: masukTime,
          pulang: pulangTime,
          total: totalLabel,
          lembur: lemburLabel,
          status: status,
          sortKey: shift.inTime || shift.outTime || new Date(0)
        }
      })

      setTodayRows(rows)

      // Stats
      const { count: totalAbsensi } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin')

      const { count: totalNodes } = await supabase
        .from('nodes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online')

      const { data: scanData } = await supabase
        .from('scans')
        .select('status')

      const total = scanData?.length || 0
      const granted = scanData?.filter(s => s.status === 'granted').length || 0
      const successRate = total > 0 ? Math.round((granted / total) * 100) : 0

      // Hitung total lembur dari paired shifts
      let totalLembur = 0
      pairedShifts.forEach(shift => {
        if (shift.inTime && shift.outTime) {
          const menitKerja = Math.round((shift.outTime - shift.inTime) / 60000)
          const STANDAR_MENIT = 8 * 60
          if (menitKerja > STANDAR_MENIT) {
            totalLembur += (menitKerja - STANDAR_MENIT)
          }
        }
      })

      setStats({
        totalAbsensi: totalAbsensi || 0,
        totalUsers: totalUsers || 0,
        totalNodes: totalNodes || 0,
        successRate: successRate,
        totalLembur: Math.round((totalLembur / 60) * 10) / 10
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon, label, value, color = 'text-[#1541c9]', subText }) => (
    <div className="stat-card">
      <span className={`icon-tile bg-[#eef1fb] ${color}`}>
        {icon}
      </span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {subText && <div className="text-[11px] text-[#6b7383] mt-1">{subText}</div>}
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Dashboard</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">
            Selamat datang, {profile?.full_name || 'Admin'}
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost btn-sm">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Memuat data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM14 20h3M20 14v3M17 20h4v-3"/></svg>}
              label="Total Shift"
              value={stats.totalAbsensi}
              subText={`${todayRows.length} shift terakhir`}
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              label="Total Karyawan"
              value={stats.totalUsers}
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5 12a10 10 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/></svg>}
              label="Node Aktif"
              value={stats.totalNodes}
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"/></svg>}
              label="Total Lembur"
              value={`${stats.totalLembur} jam`}
              color="text-[#e0384c]"
            />
          </div>

          <div className="card overflow-hidden">
            <div className="flex justify-between items-center px-[22px] py-[18px] border-b border-[#e7e9f2] bg-[#eef1fb]">
              <span className="text-[14px] font-extrabold text-[#0b1220]">
                Shift Kerja Terakhir ({todayRows.length})
              </span>
            </div>

            {todayRows.length === 0 ? (
              <div className="text-center py-12 text-[#6b7383]">Belum ada data shift</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8f9fc] border-b border-[#e7e9f2]">
                    <tr>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Karyawan</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">ID</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Tanggal</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Masuk</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Pulang</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Total</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lembur</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayRows.map((row) => (
                      <tr key={row.id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc]">
                        <td className="px-6 py-3 font-semibold">{row.full_name}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{row.employee_id}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{row.tanggal}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{row.masuk}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{row.pulang}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{row.total}</td>
                        <td className={`px-6 py-3 ${row.lembur !== '-' ? 'text-[#c78a12] font-semibold' : 'text-[#6b7383]'}`}>
                          {row.lembur}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                            row.status === '✅ Selesai'
                              ? 'bg-[#e4f8ec] text-[#1a9a53]'
                              : row.status === '🟡 Bekerja'
                              ? 'bg-[#fdf3e0] text-[#c78a12]'
                              : 'bg-[#fde9ea] text-[#e0384c]'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}