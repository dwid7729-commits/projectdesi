import React, { useState } from 'react'
import { useAbsensi } from '../../hooks/useAbsensi'
import { useAuth } from '../../context/AuthContext'

export default function AbsensiManagement() {
  const { absensi, loading, updateAbsensiStatus } = useAbsensi()
  const { profile } = useAuth()

  const getStatusBadge = (status) => {
    const map = {
      'approved': 'bg-[#e4f8ec] text-[#1a9a53]',
      'rejected': 'bg-[#fde9ea] text-[#e0384c]',
      'pending': 'bg-[#fdf3dc] text-[#c78a12]'
    }
    return `px-2 py-1 rounded-full text-[11px] font-bold ${map[status] || map.pending}`
  }

  const handleApprove = async (id) => {
    if (confirm('Approve this attendance?')) {
      await updateAbsensiStatus(id, 'approved')
    }
  }

  const handleReject = async (id) => {
    if (confirm('Reject this attendance?')) {
      await updateAbsensiStatus(id, 'rejected')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Attendance Management</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">Manage all employee attendance with location verification</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export Report
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8f9fc] border-b border-[#e7e9f2]">
                <tr>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Employee</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Location</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Time</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Status</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {absensi.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#6b7383]">No attendance records</td>
                  </tr>
                ) : (
                  absensi.map((item) => (
                    <tr key={item.id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-[36px] h-[36px] rounded-full bg-[#eef1fb] flex items-center justify-center text-[#1541c9] font-bold text-[13px] flex-none">
                            {item.users?.full_name?.charAt(0) || '?'}
                          </span>
                          <div>
                            <div className="font-bold text-[14px]">{item.users?.full_name || 'Unknown'}</div>
                            <div className="text-[11px] text-[#6b7383]">{item.users?.employee_id || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-[14px]">{item.nodes?.name || item.location_name || 'Unknown'}</div>
                          {item.latitude && item.longitude && (
                            <div className="text-[11px] text-[#6b7383]">
                              📍 {item.latitude}, {item.longitude}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#6b7383]">
                        {new Date(item.scan_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(item.status)}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleApprove(item.id)}
                              className="px-3 py-1 rounded-[8px] bg-[#e4f8ec] text-[#1a9a53] text-[12px] font-bold hover:bg-[#d0f0dc] transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="px-3 py-1 rounded-[8px] bg-[#fde9ea] text-[#e0384c] text-[12px] font-bold hover:bg-[#f8d4d4] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status !== 'pending' && (
                          <span className="text-[12px] text-[#6b7383]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-[#e7e9f2] text-[13px] text-[#6b7383]">
            Total: {absensi.length} records
          </div>
        </div>
      )}
    </div>
  )
}