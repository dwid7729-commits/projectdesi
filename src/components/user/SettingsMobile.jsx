import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function SettingsMobile() {
  const { t, i18n } = useTranslation()
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [language, setLanguage] = useState(i18n.language || 'en')

  const handleLogout = async () => {
    if (confirm(t('settings.logout_confirm'))) {
      await logout()
      navigate('/login')
    }
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ]

  const handleLanguageChange = (code) => {
    setLanguage(code)
    i18n.changeLanguage(code)
    localStorage.setItem('preferred_language', code)
  }

  return (
    <div className="pb-4">
      <div className="pt-4 pb-6">
        <div className="text-[20px] font-extrabold text-[#0b1220]">{t('settings.title')}</div>
      </div>

      <div className="bg-white rounded-[16px] p-4 border border-[#e7e9f2] flex items-center gap-4">
        <div className="w-[50px] h-[50px] rounded-full bg-[#1d4fe0] flex items-center justify-center text-white font-bold text-[20px] flex-none">
          {getInitials(profile?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-[#0b1220] truncate">{profile?.full_name || 'User'}</div>
          <div className="text-[12px] text-[#6b7383] truncate">{profile?.email || 'No email'}</div>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#e4f8ec] text-[#1a9a53] text-[10px] font-bold">{t('home.active')}</span>
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em] mb-2">{t('settings.language')}</div>
        <div className="bg-white rounded-[16px] border border-[#e7e9f2] overflow-hidden">
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8f9fc] transition-colors ${
                index !== languages.length - 1 ? 'border-b border-[#e7e9f2]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{lang.flag}</span>
                <span className="text-[14px] text-[#0b1220]">{lang.name}</span>
              </div>
              {language === lang.code && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#1d4fe0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-bold text-[#9aa1b0] uppercase tracking-[0.05em] mb-2">{t('settings.account')}</div>
        <div className="bg-white rounded-[16px] border border-[#e7e9f2] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e7e9f2] flex justify-between">
            <span className="text-[13px] text-[#6b7383]">{t('settings.employee_id')}</span>
            <span className="text-[13px] font-semibold text-[#0b1220]">{profile?.employee_id || 'Not Set'}</span>
          </div>
          <div className="px-4 py-3 border-b border-[#e7e9f2] flex justify-between">
            <span className="text-[13px] text-[#6b7383]">{t('settings.department')}</span>
            <span className="text-[13px] font-semibold text-[#0b1220]">{profile?.department || 'Not Set'}</span>
          </div>
          <div className="px-4 py-3 border-b border-[#e7e9f2] flex justify-between">
            <span className="text-[13px] text-[#6b7383]">{t('settings.access_level')}</span>
            <span className="text-[13px] font-semibold text-[#0b1220]">Level {profile?.access_level || 1}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-[13px] text-[#6b7383]">{t('settings.email')}</span>
            <span className="text-[13px] font-semibold text-[#0b1220]">{profile?.email || 'Not Set'}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full mt-6 py-3 rounded-[14px] bg-[#fde9ea] text-[#e0384c] font-bold text-[15px] hover:bg-[#f8d4d4] transition-colors"
      >
        {t('settings.logout')}
      </button>

      <div className="mt-6 text-center text-[11px] text-[#9aa1b0]">
        {t('app.version')}
      </div>
    </div>
  )
}