import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProfileMobile() {
  const { profile, user, logout } = useAuth()

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await logout()
    }
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="pt-4 pb-6">
        <div className="text-[20px] font-extrabold text-[#0b1220]">Profil</div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_20px_rgba(20,40,120,0.08)] border border-[#e7e9f2] text-center">
        <div className="w-[80px] h-[80px] rounded-full bg-[#1d4fe0] flex items-center justify-center text-white font-bold text-[32px] mx-auto">
          {getInitials(profile?.full_name)}
        </div>
        <div className="mt-3">
          <div className="text-[18px] font-bold text-[#0b1220]">{profile?.full_name || 'User'}</div>
          <div className="text-[13px] text-[#6b7383]">{profile?.email || user?.email || 'No email'}</div>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[11px] font-bold">Aktif</span>
          <span className="px-3 py-1 rounded-full bg-[#eef1fb] text-[#1541c9] text-[11px] font-bold">
            Level {profile?.access_level || 1}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[14px] p-4 border border-[#e7e9f2]">
          <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">ID Karyawan</div>
          <div className="text-[14px] font-bold text-[#0b1220] mt-1">{profile?.employee_id || 'Not Set'}</div>
        </div>
        <div className="bg-white rounded-[14px] p-4 border border-[#e7e9f2]">
          <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Departemen</div>
          <div className="text-[14px] font-bold text-[#0b1220] mt-1">{profile?.department || 'Not Set'}</div>
        </div>
        <div className="bg-white rounded-[14px] p-4 border border-[#e7e9f2]">
          <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Telepon</div>
          <div className="text-[14px] font-bold text-[#0b1220] mt-1">{profile?.phone || 'Not Set'}</div>
        </div>
        <div className="bg-white rounded-[14px] p-4 border border-[#e7e9f2]">
          <div className="text-[10px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em]">Lokasi</div>
          <div className="text-[14px] font-bold text-[#0b1220] mt-1">{profile?.location || 'Not Set'}</div>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full mt-6 py-3 rounded-[14px] bg-[#fde9ea] text-[#e0384c] font-bold text-[14px] hover:bg-[#f8d4d4] transition-colors"
      >
        Keluar
      </button>

      <div className="mt-4 text-center text-[11px] text-[#9aa1b0]">
        PT Dera Manufacturing v1.0.0
      </div>
    </div>
  )
}