import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [monthlyReport, setMonthlyReport] = useState([])
  const [summary, setSummary] = useState({
    totalHadir: 0,
    totalLembur: 0,
    totalAbsensi: 0
  })
  const [selectedMonth, setSelectedMonth] = useState('')
  const [users, setUsers] = useState([])

  useEffect(() => {
    const now = new Date()
    const nowWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    const defaultMonth = `${nowWIB.getFullYear()}-${String(nowWIB.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(defaultMonth)
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchData()
    }
  }, [selectedMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, employee_id, department')
        .neq('role', 'admin')
      setUsers(usersData || [])

      const { data: absensiData } = await supabase
        .from('absensi')
        .select('*')
        .order('scan_time', { ascending: true })

      const [year, month] = selectedMonth.split('-')
      
      // Filter absensi bulan ini (WIB)
      const monthAbsensi = absensiData?.filter(item => {
        if (!item.scan_time) return false
        const itemWIB = new Date(new Date(item.scan_time).getTime() + (7 * 60 * 60 * 1000))
        const itemYear = itemWIB.getFullYear()
        const itemMonth = itemWIB.getMonth() + 1
        return itemYear === parseInt(year) && itemMonth === parseInt(month)
      }) || []

      // PAIRING IN-OUT PER SHIFT (BEDA HARI BOLEH)
      const report = (usersData || []).map(user => {
        const userAbsensi = monthAbsensi.filter(a => a.user_id === user.id)
        
        // Pair IN-OUT (manual pairing)
        const shifts = []
        const usedIds = new Set()
        
        // Cari IN dan OUT terdekat
        for (const outItem of userAbsensi) {
          if (outItem.type === 'out' && !usedIds.has(outItem.id)) {
            // Cari IN terakhir sebelum OUT ini
            let matchedIn = null
            for (const inItem of userAbsensi) {
              if (inItem.type === 'in' && !usedIds.has(inItem.id)) {
                const inTime = new Date(inItem.scan_time)
                const outTime = new Date(outItem.scan_time)
                const diffMs = outTime - inTime
                // Boleh beda hari, asal < 24 jam
                if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
                  matchedIn = inItem
                  break
                }
              }
            }
            
            if (matchedIn) {
              usedIds.add(matchedIn.id)
              usedIds.add(outItem.id)
              shifts.push({ in: matchedIn, out: outItem })
            }
          }
        }
        
        // Tambah IN yang belum punya OUT
        for (const inItem of userAbsensi) {
          if (inItem.type === 'in' && !usedIds.has(inItem.id)) {
            shifts.push({ in: inItem, out: null })
          }
        }

        // Hitung total hadir dan lembur
        let totalHadir = 0
        let totalLembur = 0

        shifts.forEach(shift => {
          if (shift.in && shift.out) {
            const inWIB = new Date(new Date(shift.in.scan_time).getTime() + (7 * 60 * 60 * 1000))
            const outWIB = new Date(new Date(shift.out.scan_time).getTime() + (7 * 60 * 60 * 1000))
            const diffMs = outWIB.getTime() - inWIB.getTime()
            const diffJam = diffMs / (1000 * 60 * 60)
            
            if (diffJam >= 8) {
              totalHadir++
              if (diffJam > 8) {
                totalLembur += (diffJam - 8)
              }
            }
          }
        })

        return {
          ...user,
          totalHadir,
          totalLembur: Math.round(totalLembur * 10) / 10,
          totalShifts: shifts.length
        }
      })

      report.sort((a, b) => b.totalHadir - a.totalHadir)

      const totalHadir = report.reduce((sum, r) => sum + r.totalHadir, 0)
      const totalLembur = report.reduce((sum, r) => sum + r.totalLembur, 0)
      const totalAbsensi = report.reduce((sum, r) => sum + r.totalShifts, 0)

      setMonthlyReport(report)
      setSummary({
        totalHadir,
        totalLembur: Math.round(totalLembur * 10) / 10,
        totalAbsensi
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

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    const nowWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    for (let i = 0; i < 12; i++) {
      const date = new Date(nowWIB.getFullYear(), nowWIB.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push(monthStr)
    }
    return options
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Laporan Bulanan</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">Rekap absensi dan lembur per karyawan</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 rounded-[12px] bg-[#eef1fb] border border-transparent focus:border-[#3b63f0] focus:bg-white outline-none text-[14px]"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {getMonthOptions().map(month => (
              <option key={month} value={month}>{formatMonth(month)}</option>
            ))}
          </select>
          <button onClick={fetchData} className="btn btn-ghost btn-sm">
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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
        <div className="stat-card">
          <div className="stat-label">Total Kehadiran</div>
          <div className="stat-value">{summary.totalHadir}</div>
          <div className="text-[11px] text-[#6b7383] mt-1">shift kerja</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Lembur</div>
          <div className="stat-value text-[#e0384c]">{summary.totalLembur} jam</div>
          <div className="text-[11px] text-[#6b7383] mt-1">dari {summary.totalAbsensi} shift</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Periode</div>
          <div className="stat-value text-[14px] font-bold">{formatMonth(selectedMonth)}</div>
          <div className="text-[11px] text-[#6b7383] mt-1">{users.length} karyawan aktif</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Memuat data...</div>
      ) : monthlyReport.length === 0 || monthlyReport.every(r => r.totalHadir === 0) ? (
        <div className="text-center py-12 text-[#6b7383]">
          Belum ada data absensi pada periode ini
          <div className="text-[11px] mt-1">Pastikan karyawan sudah melakukan absensi masuk dan pulang</div>
          <button onClick={fetchData} className="btn btn-primary btn-sm mt-4">
            Refresh Data
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8f9fc] border-b border-[#e7e9f2]">
                <tr>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Karyawan</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Departemen</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Hadir</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Lembur</th>
                  <th className="text-left px-6 py-3 text-[12px] font-bold text-[#9aa1b0] uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.map((item) => (
                  <tr key={item.id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc]">
                    <td className="px-6 py-3 font-semibold">{item.full_name}</td>
                    <td className="px-6 py-3 text-[#6b7383]">{item.employee_id}</td>
                    <td className="px-6 py-3 text-[#6b7383]">{item.department}</td>
                    <td className="px-6 py-3">
                      <span className="font-bold text-[#1a9a53]">{item.totalHadir}</span>
                      <span className="text-[#6b7383] text-[11px]"> shift</span>
                    </td>
                    <td className="px-6 py-3">
                      {item.totalLembur > 0 ? (
                        <span className="text-[#e0384c] font-bold">+{item.totalLembur} jam</span>
                      ) : (
                        <span className="text-[#6b7383]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        item.totalHadir >= 20 ? 'bg-[#e4f8ec] text-[#1a9a53]' :
                        item.totalHadir >= 10 ? 'bg-[#fdf3dc] text-[#c78a12]' :
                        'bg-[#fde9ea] text-[#e0384c]'
                      }`}>
                        {item.totalHadir >= 20 ? 'Baik' :
                         item.totalHadir >= 10 ? 'Cukup' :
                         'Kurang'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-[#e7e9f2] text-[13px] text-[#6b7383]">
            Total: {monthlyReport.length} karyawan
          </div>
        </div>
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