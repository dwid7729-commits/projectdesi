import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function LocationSettings() {
  const [formData, setFormData] = useState({
    office_lat: '-6.2088',
    office_lng: '106.8456',
    radius: '100'
  })
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')

      if (error) throw error

      const settingsMap = {}
      data?.forEach(item => {
        try {
          settingsMap[item.key] = typeof item.value === 'string' 
            ? JSON.parse(item.value) 
            : item.value
        } catch {
          settingsMap[item.key] = item.value
        }
      })

      if (settingsMap.office_location) {
        setFormData({
          office_lat: settingsMap.office_location.lat?.toString() || '-6.2088',
          office_lng: settingsMap.office_location.lng?.toString() || '106.8456',
          radius: settingsMap.location_radius?.value?.toString() || '100'
        })
        // Ambil nama lokasi dari koordinat
        fetchLocationName(settingsMap.office_location.lat, settingsMap.office_location.lng)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationName = async (lat, lng) => {
    try {
      // Pake Nominatim (OpenStreetMap) gratis
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data?.display_name) {
        setLocationName(data.display_name.split(',').slice(0, 3).join(','))
      } else {
        setLocationName('Lokasi tidak diketahui')
      }
    } catch (error) {
      console.error('Error fetching location name:', error)
      setLocationName('Lokasi tidak diketahui')
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setFormData(prev => ({
            ...prev,
            office_lat: latitude.toString(),
            office_lng: longitude.toString()
          }))
          fetchLocationName(latitude, longitude)
          setMessage('✅ Lokasi terkini berhasil diambil!')
          setTimeout(() => setMessage(''), 3000)
        },
        (err) => {
          setMessage('❌ Gagal mengambil lokasi: ' + err.message)
          setTimeout(() => setMessage(''), 3000)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setMessage('❌ Geolocation tidak didukung')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const lat = parseFloat(formData.office_lat)
      const lng = parseFloat(formData.office_lng)
      const radius = parseFloat(formData.radius)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Koordinat tidak valid')
      }
      if (isNaN(radius) || radius < 1) {
        throw new Error('Radius minimal 1 meter')
      }

      await supabase
        .from('settings')
        .upsert([
          { key: 'office_location', value: JSON.stringify({ lat, lng }) },
          { key: 'location_radius', value: JSON.stringify({ value: radius, unit: 'meters' }) }
        ], { onConflict: 'key' })

      setMessage('✅ Pengaturan berhasil disimpan!')
      fetchLocationName(lat, lng)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ ' + error.message)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Maps URL
  const mapsUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.office_lng) - 0.01},${parseFloat(formData.office_lat) - 0.01},${parseFloat(formData.office_lng) + 0.01},${parseFloat(formData.office_lat) + 0.01}&layer=mapnik&marker=${formData.office_lat},${formData.office_lng}`

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">Pengaturan Lokasi</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">Set lokasi kantor untuk validasi absensi</p>
        </div>
        <button 
          onClick={getCurrentLocation}
          className="btn btn-ghost btn-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Gunakan Lokasi Saya
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Memuat pengaturan...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-[18px] font-extrabold mb-4">Koordinat Kantor</h3>
            
            {message && (
              <div className={`mb-4 p-3 rounded-[12px] text-[13px] ${
                message.includes('✅') ? 'bg-[#e4f8ec] text-[#1a9a53]' : 'bg-[#fde9ea] text-[#e0384c]'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label text-[13px]">Latitude</label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="any"
                      placeholder="-6.2088"
                      value={formData.office_lat}
                      onChange={(e) => setFormData({...formData, office_lat: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label text-[13px]">Longitude</label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="any"
                      placeholder="106.8456"
                      value={formData.office_lng}
                      onChange={(e) => setFormData({...formData, office_lng: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="field-label text-[13px]">Radius (meter)</label>
                <div className="input-group">
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.radius}
                    onChange={(e) => setFormData({...formData, radius: e.target.value})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="btn btn-primary w-full"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-[#f8f9fc] rounded-[12px]">
              <div className="text-[12px] text-[#6b7383]">
                <span className="font-bold">Nama Lokasi:</span> {locationName || 'Mengambil data...'}
              </div>
              {userLocation && (
                <div className="text-[11px] text-[#6b7383] mt-1">
                  📍 Lokasi terkini: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>

          {/* Map Preview */}
          <div className="card p-6">
            <h3 className="text-[18px] font-extrabold mb-4">Peta Lokasi</h3>
            <div className="rounded-[16px] overflow-hidden h-[350px] bg-[#e8ecf1]">
              <iframe
                title="Location Map"
                src={mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                loading="lazy"
              />
            </div>
            <div className="mt-3 flex justify-between text-[12px] text-[#6b7383]">
              <span>📍 {formData.office_lat}, {formData.office_lng}</span>
              <span>📏 Radius: {formData.radius}m</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}