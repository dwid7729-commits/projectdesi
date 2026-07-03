import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function ScanValidator() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const html5QrCodeRef = useRef(null)
  const scannerStartedRef = useRef(false)
  const processingRef = useRef(false)

  const [scanResult, setScanResult] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [isWithinRadius, setIsWithinRadius] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [distance, setDistance] = useState(0)
  const [userData, setUserData] = useState(null)
  const [qrValueDisplay, setQrValueDisplay] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [gpsRetry, setGpsRetry] = useState(0)

  const [officeLat, setOfficeLat] = useState(-6.2088)
  const [officeLng, setOfficeLng] = useState(106.8456)
  const [radius, setRadius] = useState(100)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // REFS
  const locationRef = useRef(location)
  const locationErrorRef = useRef(locationError)
  const isWithinRadiusRef = useRef(isWithinRadius)
  const distanceRef = useRef(distance)
  const radiusRef = useRef(radius)
  const userDataRef = useRef(userData)
  const scanCooldownUntilRef = useRef(0)

  useEffect(() => { locationRef.current = location }, [location])
  useEffect(() => { locationErrorRef.current = locationError }, [locationError])
  useEffect(() => { isWithinRadiusRef.current = isWithinRadius }, [isWithinRadius])
  useEffect(() => { distanceRef.current = distance }, [distance])
  useEffect(() => { radiusRef.current = radius }, [radius])
  useEffect(() => { userDataRef.current = userData }, [userData])

  // Ambil data user
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, email, employee_id, department, phone, location')
          .eq('id', user.id)
          .maybeSingle()
console.log(error)
console.log(data)
        if (!error && data) {
          setUserData(data)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
      }
    }

    fetchUserData()
  }, [user])

  // Ambil setting lokasi - PAKE YANG INI
 // ============================
// AMBIL SETTING DARI DATABASE
// ============================
useEffect(() => {
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key,value")

      if (error) throw error

      let office = {
        lat: -6.2088,
        lng: 106.8456
      }

      let radiusValue = 100

      data?.forEach(item => {
        if (item.key === "office_location") {
          office = item.value
        }

        if (item.key === "location_radius") {
          radiusValue = item.value?.value ?? 100
        }
      })

      setOfficeLat(office.lat)
      setOfficeLng(office.lng)
      setRadius(radiusValue)

      console.log("=== SETTINGS LOADED ===")
      console.log("Office :", office)
      console.log("Radius :", radiusValue)

    } catch (err) {
      console.error("Fetch settings:", err)
    } finally {
      setSettingsLoaded(true)
    }
  }

  fetchSettings()
}, [])


// ============================
// REQUEST GPS
// ============================
const requestGPS = (
  lat = officeLat,
  lng = officeLng,
  rad = radius
) => {

  if (!settingsLoaded) return

  setLocationError("")

  if (!navigator.geolocation) {
    setLocationError("Geolocation tidak didukung browser.")
    return
  }

  navigator.geolocation.getCurrentPosition(

    (pos) => {

      const { latitude, longitude } = pos.coords

      setLocation({
        latitude,
        longitude
      })

      console.log("=== GPS ===")
      console.log({
        officeLat: lat,
        officeLng: lng,
        radius: rad,
        userLat: latitude,
        userLng: longitude
      })

      const dist = getDistance(
        latitude,
        longitude,
        lat,
        lng
      )

      console.log("Distance :", dist)

      setDistance(dist)
      setIsWithinRadius(dist <= rad)

      if (dist > rad) {
        setLocationError(
          `Anda ${Math.round(dist)}m dari kantor. Maksimal ${rad}m.`
        )
      } else {
        setLocationError("")
      }

      setGpsRetry(0)
    },

    (err) => {

      console.error("GPS Error:", err)

      switch (err.code) {

        case 1:
          setLocationError(
            "GPS ditolak. Izinkan lokasi di browser."
          )
          break

        case 2:
          setLocationError(
            "GPS tidak tersedia."
          )
          break

        case 3:
          setLocationError(
            "GPS timeout."
          )

          if (gpsRetry < 3) {
            setTimeout(() => {
              setGpsRetry(prev => prev + 1)
            }, 2000)
          }

          break

        default:
          setLocationError(
            "Terjadi kesalahan GPS."
          )
      }

    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

  )
}


// ============================
// REQUEST GPS SETELAH SETTING SIAP
// ============================
useEffect(() => {

  if (!settingsLoaded) return

  requestGPS(
    officeLat,
    officeLng,
    radius
  )

}, [
  settingsLoaded,
  officeLat,
  officeLng,
  radius,
  gpsRetry
])
  // Start QR Scanner
  const startScanner = async () => {
    if (isStarting || scannerStartedRef.current) return

    setIsStarting(true)
    setCameraError('')
    processingRef.current = false

    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          await html5QrCodeRef.current.clear()
        } catch (e) {}
        html5QrCodeRef.current = null
      }

      const container = document.getElementById('qr-reader-container')
      if (!container) {
        throw new Error('Container not found')
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container')
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanError
      )

      setCameraActive(true)
      setShowScanner(true)
      setCameraError('')
      scannerStartedRef.current = true
    } catch (err) {
      console.error('Scanner Error:', err)
      setCameraError('Kamera error. Coba refresh atau izinkan kamera di browser.')
      setCameraActive(false)
      setShowScanner(false)
      scannerStartedRef.current = false
    } finally {
      setIsStarting(false)
    }
  }

  // Stop scanner
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      }
      setCameraActive(false)
      setShowScanner(false)
      scannerStartedRef.current = false
    } catch (err) {
      console.error('Stop scanner error:', err)
    }
  }

  // QR detected
  const onScanSuccess = async (decodedText) => {
    if (processingRef.current || !user) return
    if (Date.now() < scanCooldownUntilRef.current) return

    processingRef.current = true
    await stopScanner()
    await processAttendance()
  }

  const onScanError = (err) => {
    // Ignore
  }

  // Proses absensi
  const processAttendance = async () => {
    if (!user) {
      navigate('/login')
      processingRef.current = false
      return
    }

    const currentLocation = locationRef.current
    const currentLocationError = locationErrorRef.current
    const currentIsWithinRadius = isWithinRadiusRef.current
    const currentDistance = distanceRef.current
    const currentRadius = radiusRef.current
    const currentUserData = userDataRef.current

    const baseUserInfo = {
      name: currentUserData?.full_name || user.email,
      email: currentUserData?.email || user.email,
      employee_id: currentUserData?.employee_id || '-',
      department: currentUserData?.department || '-'
    }

    if (!currentLocation && !currentLocationError) {
      setScanResult({
        success: false,
        message: 'Mengambil lokasi GPS... Tunggu sebentar.',
        user: baseUserInfo
      })
      setShowPopup(true)
      processingRef.current = false
      return
    }

    if (!currentLocation) {
      setScanResult({
        success: false,
        message: 'Aktifkan GPS/Lokasi!',
        user: baseUserInfo
      })
      setShowPopup(true)
      processingRef.current = false
      return
    }

    if (!currentIsWithinRadius) {
      setScanResult({
        success: false,
        message: `Di luar radius! Jarak ${Math.round(currentDistance)}m, Maksimal ${currentRadius}m.`,
        user: baseUserInfo
      })
      setShowPopup(true)
      processingRef.current = false
      return
    }

    setScanning(true)

    try {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const qrCode = `ABSEN-${todayStr}-${user.id.substring(0, 6).toUpperCase()}`

      const { data: cekAbsenList, error: cekError } = await supabase
        .from('absensi')
        .select('id')
        .eq('user_id', user.id)
        .gte('scan_time', `${todayStr}T00:00:00`)
        .limit(1)

      if (cekError) throw cekError

      if (cekAbsenList && cekAbsenList.length > 0) {
        throw new Error('Anda sudah absen hari ini!')
      }

      const absensiData = {
        user_id: user.id,
        permit_code: qrCode,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location_name: 'Kantor',
        status: 'approved',
        device_id: `DEV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        notes: `Absen ${new Date().toLocaleString()}`
      }

      const { error: insertError } = await supabase
        .from('absensi')
        .insert([absensiData])

      if (insertError) throw insertError

      await supabase
        .from('scans')
        .insert([{
          user_id: user.id,
          status: 'granted',
          device_id: absensiData.device_id,
          location: 'Kantor'
        }])

      const qrDisplay = JSON.stringify({
        user: user.id,
        name: baseUserInfo.name,
        time: new Date().toISOString(),
        location: `${currentLocation.latitude}, ${currentLocation.longitude}`
      })
      setQrValueDisplay(qrDisplay)

      setScanResult({
        success: true,
        message: 'Absensi Berhasil!',
        time: new Date().toLocaleString('id-ID'),
        location: `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
        user: baseUserInfo
      })
      setShowPopup(true)

    } catch (error) {
      console.error('Attendance error:', error)
      setScanResult({
        success: false,
        message: error.message || 'Absensi Gagal!',
        user: baseUserInfo
      })
      setShowPopup(true)
    } finally {
      setScanning(false)
      processingRef.current = false
    }
  }

  const toggleScanner = () => {
    if (showScanner && cameraActive) {
      stopScanner()
    } else {
      startScanner()
    }
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear().catch(() => {})
      }
    }
  }, [])

  // Auto start scanner
  useEffect(() => {
    const startWithDelay = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        await startScanner()
      } catch (err) {
        console.error('Auto start failed:', err)
        setTimeout(() => {
          if (!scannerStartedRef.current) {
            startScanner()
          }
        }, 2000)
      }
    }

    startWithDelay()
  }, [])

  const closePopup = () => {
    setShowPopup(false)
    setScanResult(null)
    processingRef.current = false

    if (scanResult?.success) {
      navigate('/')
      return
    }

    scanCooldownUntilRef.current = Date.now() + 2000

    setTimeout(() => {
      startScanner()
    }, 500)
  }

  const retryGPS = () => {
    setGpsRetry(gpsRetry + 1)
    setLocation(null)
    setLocationError('')
    requestGPS()
  }

  const isCameraVisible = showScanner && cameraActive

  return (
    <div className="flex-1 bg-[#f3f5fc] min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b border-[#e7e9f2]">
        <Link to="/" className="w-[36px] h-[36px] rounded-full bg-[#eef1fb] flex items-center justify-center hover:bg-[#e6eaf9] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1541c9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-bold text-[16px] text-[#0b1220]">Absensi QR</span>
        <button
          onClick={toggleScanner}
          className={`px-3 py-1 rounded-[10px] text-[12px] font-bold ${
            isCameraVisible ? 'bg-[#fde9ea] text-[#e0384c]' : 'bg-[#1d4fe0] text-white'
          }`}
        >
          {isCameraVisible ? 'Stop' : 'Start Camera'}
        </button>
      </div>

      <div className="px-4 py-2 bg-white border-b border-[#e7e9f2]">
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <span className={location ? 'text-[#1a9a53]' : 'text-[#e0384c]'}>
            {location ? '📍 GPS On' : '📍 GPS Off'}
          </span>
          <span className={cameraActive ? 'text-[#1a9a53]' : 'text-[#e0384c]'}>
            {cameraActive ? '📷 Camera On' : '📷 Camera Off'}
          </span>
          {location && (
            <span className={isWithinRadius ? 'text-[#1a9a53]' : 'text-[#e0384c]'}>
              {isWithinRadius ? '✅ Dalam Radius' : `❌ ${Math.round(distance)}m dari kantor`}
            </span>
          )}
        </div>
        {locationError && (
          <div className="text-[#e0384c] text-[11px] mt-1 flex items-center gap-2">
            <span>⚠️ {locationError}</span>
            <button onClick={retryGPS} className="text-[#1d4fe0] font-bold underline text-[10px]">
              Retry GPS
            </button>
          </div>
        )}
        {cameraError && (
          <div className="text-[#e0384c] text-[11px] mt-1">{cameraError}</div>
        )}
        {isStarting && (
          <div className="text-[#c78a12] text-[11px] mt-1">⏳ Menyalakan kamera...</div>
        )}
        {!settingsLoaded && (
          <div className="text-[#c78a12] text-[11px] mt-1">⏳ Loading setting...</div>
        )}
      </div>

      {/* QR Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0b1220] relative min-h-[300px]">
        <div className="relative w-full max-w-[400px] aspect-square rounded-[20px] overflow-hidden bg-black">
          <div id="qr-reader-container" className="w-full h-full"></div>

          {isCameraVisible && (
            <>
              <div className="absolute inset-0 border-4 border-[#1d4fe0]/50 rounded-[20px] pointer-events-none">
                <div className="absolute -top-0.5 -left-0.5 w-[30px] h-[30px] border-t-4 border-l-4 border-[#1d4fe0]"></div>
                <div className="absolute -top-0.5 -right-0.5 w-[30px] h-[30px] border-t-4 border-r-4 border-[#1d4fe0]"></div>
                <div className="absolute -bottom-0.5 -left-0.5 w-[30px] h-[30px] border-b-4 border-l-4 border-[#1d4fe0]"></div>
                <div className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] border-b-4 border-r-4 border-[#1d4fe0]"></div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[60px] h-[60px] border-2 border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#1d4fe0] rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-[10px]">
                📸 Arahkan kamera ke QR Code
              </div>
            </>
          )}

          {!isCameraVisible && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/60 bg-[#0b1220] px-4">
              <div className="text-[64px] mb-3">📷</div>
              <div className="text-[15px] font-medium">
                {isStarting ? 'Memulai scanner...' : 'Tap "Start Camera"'}
              </div>
              <div className="text-[12px] opacity-60 mt-1">
                QR otomatis terdeteksi tanpa tombol
              </div>
              {cameraError && (
                <div className="text-[#e0384c] text-[12px] mt-3 bg-[#fde9ea] p-2 rounded-[10px] max-w-xs">
                  ⚠️ {cameraError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-[#e7e9f2]">
        {location && isWithinRadius && (
          <div className="text-[#1a9a53] text-[12px] text-center">
            ✅ Dalam radius {radius}m, jarak {Math.round(distance)}m
          </div>
        )}
        {location && !isWithinRadius && (
          <div className="text-[#e0384c] text-[12px] text-center bg-[#fde9ea] p-2 rounded-[10px]">
            ⚠️ Anda {Math.round(distance)}m dari kantor. Maksimal {radius}m.
          </div>
        )}
        {!location && !locationError && (
          <div className="text-[#c78a12] text-[12px] text-center">
            ⏳ Mengambil lokasi GPS...
          </div>
        )}
        {!location && locationError && (
          <div className="text-[#e0384c] text-[12px] text-center bg-[#fde9ea] p-2 rounded-[10px]">
            ⚠️ {locationError}
          </div>
        )}
        {cameraActive && (
          <div className="text-[#6b7383] text-[11px] text-center mt-1">
            Scan QR otomatis - cukup arahkan kamera
          </div>
        )}
      </div>

      {/* POPUP HASIL */}
      {showPopup && scanResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease]">
          <div className={`bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl ${
            scanResult.success ? 'border-t-4 border-[#1a9a53]' : 'border-t-4 border-[#e0384c]'
          }`}>
            {scanResult.success && qrValueDisplay && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-2 rounded-[12px] border border-[#e7e9f2]">
                  <QRCodeSVG value={qrValueDisplay} size={100} level="H" />
                </div>
              </div>
            )}

            <div className="text-center mb-4">
              <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto ${
                scanResult.success ? 'bg-[#e4f8ec]' : 'bg-[#fde9ea]'
              }`}>
                <span className="text-[40px]">{scanResult.success ? '✅' : '❌'}</span>
              </div>
            </div>

            <h3 className={`text-[22px] font-extrabold text-center ${
              scanResult.success ? 'text-[#1a9a53]' : 'text-[#e0384c]'
            }`}>
              {scanResult.success ? 'Absensi Berhasil!' : 'Absensi Gagal!'}
            </h3>

            <p className="text-center text-[13px] text-[#6b7383] mt-1">
              {scanResult.message}
            </p>

            <div className="mt-4 p-4 bg-[#f8f9fc] rounded-[14px] space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#e7e9f2]">
                <span className="text-[13px] text-[#6b7383]">Nama</span>
                <span className="text-[14px] font-semibold text-[#0b1220]">{scanResult.user?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e7e9f2]">
                <span className="text-[13px] text-[#6b7383]">Email</span>
                <span className="text-[14px] font-semibold text-[#0b1220]">{scanResult.user?.email || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e7e9f2]">
                <span className="text-[13px] text-[#6b7383]">ID Karyawan</span>
                <span className="text-[14px] font-semibold text-[#0b1220]">{scanResult.user?.employee_id || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e7e9f2]">
                <span className="text-[13px] text-[#6b7383]">Departemen</span>
                <span className="text-[14px] font-semibold text-[#0b1220]">{scanResult.user?.department || '-'}</span>
              </div>
              {scanResult.time && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-[13px] text-[#6b7383]">Waktu</span>
                  <span className="text-[14px] font-semibold text-[#0b1220]">{scanResult.time}</span>
                </div>
              )}
            </div>

            <button
              onClick={closePopup}
              className="w-full mt-4 py-3 rounded-[14px] font-bold text-[15px] bg-[#1d4fe0] text-white hover:bg-[#1541c9] transition-colors"
            >
              {scanResult.success ? 'Kembali ke Home' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          #qr-reader-container video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
        `
      }} />
    </div>
  )
}
