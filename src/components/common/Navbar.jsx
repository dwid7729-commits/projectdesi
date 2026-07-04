import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5"/>
        <rect x="14" y="3" width="7" height="5" rx="1.5"/>
        <rect x="14" y="12" width="7" height="9" rx="1.5"/>
        <rect x="3" y="16" width="7" height="5" rx="1.5"/>
      </svg>
    )},
    { path: '/admin/attendance', label: 'Absensi', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
        <path d="M12 6v2"/>
      </svg>
    )},
    { path: '/admin/users', label: 'Karyawan', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )},
    { path: '/admin/reports', label: 'Laporan', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M8 16v-4M12 16V8M16 16v-6"/>
      </svg>
    )},
    { path: '/admin/qr', label: 'QR Code', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 14h3v3h-3zM14 20h3M20 14v3M17 20h4v-3"/>
      </svg>
    )},
    { path: '/admin/locations', label: 'Lokasi', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    )},
  ]

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'
  }

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await logout()
      window.location.href = '/login'
    }
  }

  return (
    <>
      <header className="topbar">
        <Link to="/admin" className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"/>
            </svg>
          </span>
          <span className="hidden sm:inline">PT Dera Manufacturing</span>
          <span className="sm:hidden text-[14px]">SP</span>
        </Link>
        
        <nav className="topbar-links hidden lg:flex">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <button 
          className="lg:hidden ml-auto text-[#6b7383] hover:text-[#1541c9] p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12"/>
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18"/>
            )}
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="avatar-circle hidden sm:flex">{getInitials(profile?.full_name)}</span>
          <span className="text-[13px] font-semibold text-[#2a3242] hidden md:block">
            {profile?.full_name || 'Admin'}
          </span>
          <button 
            onClick={handleLogout}
            className="text-[#6b7383] text-[13px] font-semibold hover:text-[#1541c9] hidden sm:block"
          >
            Keluar
          </button>
          <button 
            onClick={handleLogout}
            className="sm:hidden text-[#6b7383] hover:text-[#e0384c]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#e7e9f2] shadow-lg max-h-[70vh] overflow-y-auto">
          <nav className="px-4 py-2">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-semibold ${
                  location.pathname === item.path 
                    ? 'bg-[#eef1ff] text-[#1541c9]' 
                    : 'text-[#6b7383] hover:bg-[#f8f9fc]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-[#e7e9f2] mt-2 pt-2">
              <button 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-semibold text-[#e0384c] w-full hover:bg-[#fde9ea]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Keluar
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}