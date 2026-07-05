import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AbsensiManagement() {
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')

  React.useEffect(() => {
    fetchAbsensi()
  }, [filter])

  const fetchAbsensi = async () => {
    setLoading(true)
    try {
      // Ambil users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department')
        .neq('role', 'admin')

      // Ambil absensi dengan filter WIB
      const now = new Date()
      const nowWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000))
      const todayStr = `${nowWIB.getFullYear()}-${String(nowWIB.getMonth() + 1).padStart(2, '0')}-${String(nowWIB.getDate()).padStart(2, '0')}`

      let query = supabase
        .from('absensi')
        .select('*')
        .order('scan_time', { ascending: false })

      if (filter === 'today') {
        query = query.gte('scan_time', `${todayStr}T00:00:00`)
      } else if (filter === 'week') {
        const weekAgo = new Date(nowWIB.getTime() - (7 * 24 * 60 * 60 * 1000))
        const weekStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
        query = query.gte('scan_time', `${weekStr}T00:00:00`)
      } else if (filter === 'month') {
        const monthAgo = new Date(nowWIB.getTime() - (30 * 24 * 60 * 60 * 1000))
        const monthStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`
        query = query.gte('scan_time', `${monthStr}T00:00:00`)
      }

      const { data: absensiData } = await query

      // PAIRING IN-OUT PER SHIFT
      const pairedShifts = []
      const unpairedIns = {}

      for (const item of absensiData || []) {
        const userId = item.user_id
        const type = item.type
        const time = new Date(item.scan_time)

        if (type === 'in') {
          if (!unpairedIns[userId]) {
            unpairedIns[userId] = []
          }
          unpairedIns[userId].push(item)
        } else if (type === 'out') {
          const ins = unpairedIns[userId] || []
          let matched = null
          let matchedIndex = -1

          for (let i = ins.length - 1; i >= 0; i--) {
            const inTime = new Date(ins[i].scan_time)
            const diffMs = time - inTime
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
              pulang: item
            })
            unpairedIns[userId].splice(matchedIndex, 1)
          } else {
            pairedShifts.push({
              user_id: userId,
              masuk: null,
              pulang: item
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
            pulang: null
          })
        })
      })

      // Gabungkan dengan user
      const enriched = pairedShifts.map(shift => {
        const user = usersData?.find(u => u.id === shift.user_id)
        return {
          ...shift,
          users: user || { full_name: 'Unknown', employee_id: '-', department: '-' }
        }
      })

      setAbsensi(enriched)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'approved' || status === 'granted') {
      return <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">✅ Selesai</span>
    }
    return <span className="px-3 py-1 rounded-full bg-[#fde9ea] text-[#e0384c] text-[11px] font-bold">❌ Gagal</span>
  }

  const formatWIB = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const wib = new Date(date.getTime() + (7 * 60 * 60 * 1000))
    return wib.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const handleApprove = async (id) => {
    if (confirm('Approve this attendance?')) {
      const { error } = await supabase
        .from('absensi')
        .update({ status: 'approved' })
        .eq('id', id)
      if (!error) fetchAbsensi()
    }
  }

  const handleReject = async (id) => {
    if (confirm('Reject this attendance?')) {
      const { error } = await supabase
        .from('absensi')
        .update({ status: 'rejected' })
        .eq('id', id)
      if (!error) fetchAbsensi()
    }
  }

  const getStatusText = (shift) => {
    if (shift.masuk && shift.pulang) return '✅ Selesai'
    if (shift.masuk) return '🟡 Bekerja'
    if (shift.pulang) return '⚠️ Tanpa IN'
    return '❌ Error'
  }

  const getStatusColor = (shift) => {
    if (shift.masuk && shift.pulang) return 'bg-[#e4f8ec] text-[#1a9a53]'
    if (shift.masuk) return 'bg-[#fdf3dc] text-[#c78a12]'
    return 'bg-[#fde9ea] text-[#e0384c]'
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Manajemen Absensi</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">Data absensi shift karyawan</p>
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
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Tanggal</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Masuk</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Pulang</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lokasi</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {absensi.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-[#6b7383]">Tidak ada data shift</td>
                  </tr>
                ) : (
                  absensi.map((shift, index) => {
                    const tanggal = shift.masuk 
                      ? formatWIB(shift.masuk.scan_time).split(',')[0]
                      : shift.pulang 
                        ? formatWIB(shift.pulang.scan_time).split(',')[0]
                        : '-'
                    const masukTime = shift.masuk ? formatWIB(shift.masuk.scan_time).split(',')[1] : '-'
                    const pulangTime = shift.pulang ? formatWIB(shift.pulang.scan_time).split(',')[1] : '-'
                    const status = getStatusText(shift)
                    const statusColor = getStatusColor(shift)
                    const location = shift.masuk?.location_name || shift.pulang?.location_name || 'Kantor'
                    const user = shift.users
                    const id = shift.masuk?.id || shift.pulang?.id || `shift-${index}`

                    return (
                      <tr key={id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc] transition-colors">
                        <td className="px-6 py-3 font-semibold">{user?.full_name || 'Unknown'}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{user?.employee_id || '-'}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{tanggal}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{masukTime}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{pulangTime}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{location}</td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {shift.masuk && !shift.pulang && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleApprove(shift.masuk.id)}
                                className="px-3 py-1 rounded-[8px] bg-[#e4f8ec] text-[#1a9a53] text-[12px] font-bold hover:bg-[#d0f0dc] transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(shift.masuk.id)}
                                className="px-3 py-1 rounded-[8px] bg-[#fde9ea] text-[#e0384c] text-[12px] font-bold hover:bg-[#f8d4d4] transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {shift.masuk && shift.pulang && (
                            <span className="text-[12px] text-[#6b7383]">✅ Complete</span>
                          )}
                          {!shift.masuk && shift.pulang && (
                            <span className="text-[12px] text-[#e0384c]">⚠️ No IN</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-[#e7e9f2] text-[13px] text-[#6b7383]">
            Total: {absensi.length} shift
          </div>
        </div>
      )}
    </div>
  )
}