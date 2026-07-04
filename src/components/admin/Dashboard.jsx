import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Timezone yang dipakai untuk SEMUA tampilan & perhitungan waktu di halaman ini.
const APP_TIMEZONE = 'Asia/Jakarta'

// Parse timestamp dari database dengan benar sebagai UTC.
// Kolom `scan_time` kemungkinan bertipe `timestamp without time zone`, jadi
// Supabase mengirim string TANPA info zona (mis. "2026-07-04 15:47:05").
// `new Date(...)` biasa akan membaca string tanpa offset sebagai WAKTU LOKAL
// BROWSER, padahal nilainya sebenarnya UTC — ini menggeser epoch 7 jam kalau
// browser ada di WIB. Fungsi ini memaksa string tanpa offset dibaca sebagai UTC.
const parseDbTimestamp = (input) => {
  if (input instanceof Date) return input
  if (!input) return new Date(NaN)

  const hasTZ = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(input.trim())
  if (hasTZ) return new Date(input)

  const isoLike = input.trim().replace(' ', 'T')
  return new Date(isoLike + 'Z')
}

// Format jam:menit dalam WIB, mis. "20:00"
const formatTimeWIB = (input) => {
  if (!input) return null
  return parseDbTimestamp(input).toLocaleTimeString('id-ID', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format durasi menit -> "8 jam" / "8 jam 30 menit"
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
    successRate: 0
  })
  const [todayRows, setTodayRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()

    // Refresh otomatis tiap 30 detik supaya status "🟡 Bekerja" -> "✅ Selesai"
    // dan total jam kerja karyawan yang masih aktif ikut ter-update tanpa reload manual.
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department')

      // === Tentukan rentang "hari ini" berdasarkan WIB, bukan tanggal browser ===
      // scan_time di DB tersimpan sebagai teks UTC tanpa offset, jadi untuk
      // memfilter "hari ini (WIB)" kita harus hitung batas awal/akhir hari WIB,
      // lalu ubah jadi teks UTC yang formatnya sama persis dengan yang ada di DB.
      const wibDateStr = new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE }) // "YYYY-MM-DD"
      const startOfDayWIB = new Date(`${wibDateStr}T00:00:00+07:00`)
      const endOfDayWIB = new Date(startOfDayWIB.getTime() + 24 * 60 * 60 * 1000)

      const toDbUtcText = (d) => d.toISOString().slice(0, 19).replace('T', ' ')

      const { data: absensiData } = await supabase
        .from('absensi')
        .select('*')
        .gte('scan_time', toDbUtcText(startOfDayWIB))
        .lt('scan_time', toDbUtcText(endOfDayWIB))
        .order('scan_time', { ascending: true })

      // === Gabungkan record 'in' & 'out' jadi satu baris per karyawan ===
      const grouped = {}

      for (const item of absensiData || []) {
        const key = item.user_id
        if (!grouped[key]) {
          grouped[key] = { user_id: key, masukRaw: null, pulangRaw: null }
        }
        if (item.type === 'in' && !grouped[key].masukRaw) {
          grouped[key].masukRaw = item.scan_time
        } else if (item.type === 'out') {
          // Kalau ada beberapa 'out' (seharusnya tidak, tapi jaga-jaga), pakai yang terakhir.
          grouped[key].pulangRaw = item.scan_time
        }
      }

      const rows = Object.values(grouped).map((row) => {
        const user = usersData?.find((u) => u.id === row.user_id)

        const masukTime = formatTimeWIB(row.masukRaw)
        const pulangTime = formatTimeWIB(row.pulangRaw)

        let totalLabel = '-'
        let lemburLabel = '-'
        let status = '🟡 Bekerja'
        let sortKey = row.masukRaw || ''

        if (row.masukRaw && row.pulangRaw) {
          const menitKerja = Math.round(
            (parseDbTimestamp(row.pulangRaw).getTime() - parseDbTimestamp(row.masukRaw).getTime()) / 60000
          )
          totalLabel = formatDurasi(menitKerja)

          const STANDAR_MENIT = 8 * 60
          if (menitKerja > STANDAR_MENIT) {
            lemburLabel = `+${formatDurasi(menitKerja - STANDAR_MENIT)}`
          }

          status = '✅ Selesai'
        }

        return {
          user_id: row.user_id,
          full_name: user?.full_name || 'Unknown',
          employee_id: user?.employee_id || '-',
          department: user?.department || '-',
          masuk: masukTime || '-',
          pulang: pulangTime || '-',
          total: totalLabel,
          lembur: lemburLabel,
          status,
          sortKey
        }
      }).sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1)) // terbaru masuk duluan

      setTodayRows(rows)

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
      const granted = scanData?.filter((s) => s.status === 'granted').length || 0
      const successRate = total > 0 ? Math.round((granted / total) * 100) : 0

      setStats({
        totalAbsensi: totalAbsensi || 0,
        totalUsers: totalUsers || 0,
        totalNodes: totalNodes || 0,
        successRate: successRate
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
              label="Total Absensi"
              value={stats.totalAbsensi.toLocaleString()}
              subText={`${todayRows.length} karyawan hari ini`}
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
              label="Tingkat Keberhasilan"
              value={`${stats.successRate}%`}
              color="text-[#1a9a53]"
            />
          </div>

          <div className="card overflow-hidden">
            <div className="flex justify-between items-center px-[22px] py-[18px] border-b border-[#e7e9f2] bg-[#eef1fb]">
              <span className="text-[14px] font-extrabold text-[#0b1220]">
                Absensi Hari Ini ({todayRows.length})
              </span>
            </div>

            {todayRows.length === 0 ? (
              <div className="text-center py-12 text-[#6b7383]">Belum ada absensi hari ini</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8f9fc] border-b border-[#e7e9f2]">
                    <tr>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Karyawan</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">ID</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Masuk</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Pulang</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Total</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lembur</th>
                      <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayRows.map((row) => (
                      <tr key={row.user_id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc]">
                        <td className="px-6 py-3 font-semibold">{row.full_name}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{row.employee_id}</td>
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
                              : 'bg-[#fdf3e0] text-[#c78a12]'
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
