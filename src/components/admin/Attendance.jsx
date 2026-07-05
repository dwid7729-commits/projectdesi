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
        .select('id, full_name, employee_id, department')
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

      // PAIRING IN-OUT PER SHIFT (VERSI SIMPEL)
      const pairedShifts = []
      const usedIns = new Set()

      // 1. Pair OUT dengan IN terdekat
      for (const item of filteredData || []) {
        if (item.type === 'out') {
          // Cari IN terdekat dari user yang sama (belum dipair)
          const inItem = filteredData.find(inItem => 
            inItem.user_id === item.user_id && 
            inItem.type === 'in' &&
            !usedIns.has(inItem.id) &&
            new Date(inItem.scan_time) < new Date(item.scan_time)
          )
          
          if (inItem) {
            usedIns.add(inItem.id)
            // Hitung total jam dan lembur
            const inTime = new Date(inItem.scan_time)
            const outTime = new Date(item.scan_time)
            const diffMs = outTime - inTime
            const totalMenit = Math.round(diffMs / 60000)
            const totalJam = Math.floor(totalMenit / 60)
            const sisaMenit = totalMenit % 60
            const STANDAR_MENIT = 8 * 60
            const lemburMenit = totalMenit > STANDAR_MENIT ? totalMenit - STANDAR_MENIT : 0
            const lemburJam = Math.floor(lemburMenit / 60)
            const lemburSisaMenit = lemburMenit % 60

            pairedShifts.push({
              user_id: item.user_id,
              masuk: inItem,
              pulang: item,
              totalJam: totalJam,
              totalMenit: totalMenit,
              sisaMenit: sisaMenit,
              lemburJam: lemburJam,
              lemburSisaMenit: lemburSisaMenit,
              lemburMenit: lemburMenit,
              status: 'selesai'
            })
          } else {
            // OUT tanpa IN
            pairedShifts.push({
              user_id: item.user_id,
              masuk: null,
              pulang: item,
              totalJam: 0,
              totalMenit: 0,
              sisaMenit: 0,
              lemburJam: 0,
              lemburSisaMenit: 0,
              lemburMenit: 0,
              status: 'tanpa_in'
            })
          }
        }
      }

      // 2. Tambah IN yang belum punya OUT
      for (const item of filteredData || []) {
        if (item.type === 'in' && !usedIns.has(item.id)) {
          pairedShifts.push({
            user_id: item.user_id,
            masuk: item,
            pulang: null,
            totalJam: 0,
            totalMenit: 0,
            sisaMenit: 0,
            lemburJam: 0,
            lemburSisaMenit: 0,
            lemburMenit: 0,
            status: 'bekerja'
          })
        }
      }

      // Gabungkan dengan user
      const enriched = pairedShifts.map(shift => {
        const user = users?.find(u => u.id === shift.user_id)
        return {
          ...shift,
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
    if (!dateString) return { tanggal: '-', waktu: '-' }
    const date = new Date(dateString)
    const wib = new Date(date.getTime() + (7 * 60 * 60 * 1000))
    return {
      tanggal: wib.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }),
      waktu: wib.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }

  const formatJam = (jam, menit) => {
    if (jam === 0 && menit === 0) return '-'
    if (menit === 0) return `${jam} jam`
    return `${jam} jam ${menit} menit`
  }

  const getStatusBadge = (status) => {
    if (status === 'selesai') {
      return <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">Selesai</span>
    }
    if (status === 'bekerja') {
      return <span className="px-3 py-1 rounded-full bg-[#fdf3dc] text-[#c78a12] text-[11px] font-bold">Bekerja</span>
    }
    return <span className="px-3 py-1 rounded-full bg-[#fde9ea] text-[#e0384c] text-[11px] font-bold">Tanpa IN</span>
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
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Tanggal</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Masuk</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Pulang</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Total</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lembur</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lokasi</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {absensi.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-[#6b7383]">Tidak ada data shift</td>
                  </tr>
                ) : (
                  absensi.map((shift, index) => {
                    const masukData = shift.masuk ? formatWIB(shift.masuk.scan_time) : null
                    const pulangData = shift.pulang ? formatWIB(shift.pulang.scan_time) : null
                    const tanggal = masukData?.tanggal || pulangData?.tanggal || '-'
                    const masuk = masukData?.waktu || '-'
                    const pulang = pulangData?.waktu || '-'
                    const total = shift.totalJam > 0 ? formatJam(shift.totalJam, shift.sisaMenit) : '-'
                    const lembur = shift.lemburMenit > 0 ? formatJam(shift.lemburJam, shift.lemburSisaMenit) : '-'
                    const location = shift.masuk?.location_name || shift.pulang?.location_name || 'Kantor'

                    return (
                      <tr key={shift.masuk?.id || shift.pulang?.id || index} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc]">
                        <td className="px-6 py-3 font-semibold">{shift.full_name}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{shift.employee_id}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{tanggal}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{masuk}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{pulang}</td>
                        <td className="px-6 py-3 text-[#6b7383]">{total}</td>
                        <td className={`px-6 py-3 ${shift.lemburMenit > 0 ? 'text-[#e0384c] font-bold' : 'text-[#6b7383]'}`}>
                          {lembur}
                        </td>
                        <td className="px-6 py-3 text-[#6b7383]">{location}</td>
                        <td className="px-6 py-3">{getStatusBadge(shift.status)}</td>
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