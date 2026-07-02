import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'

export default function QRGenerator() {
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [qrGenerated, setQrGenerated] = useState(false)

  const generateQR = async () => {
    setLoading(true)
    setMessage('')

    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const qrData = JSON.stringify({
        date: todayStr,
        type: 'attendance',
        timestamp: Date.now(),
        expired: new Date(today.setHours(23, 59, 59, 999)).toISOString()
      })

      setQrCode({
        data: qrData,
        date: todayStr
      })
      setQrGenerated(true)
      setMessage('✅ QR Code berhasil dibuat!')

    } catch (error) {
      setMessage('❌ Gagal buat QR: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (svg) {
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svg)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `QR_ABSENSI_${new Date().toISOString().split('T')[0]}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">QR Code Absensi</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">
            Generate QR untuk absensi karyawan hari ini
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-[12px] text-[13px] ${
          message.includes('✅') ? 'bg-[#e4f8ec] text-[#1a9a53]' : 'bg-[#fde9ea] text-[#e0384c]'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Section */}
        <div className="card p-6">
          <h3 className="text-[18px] font-extrabold mb-4">Buat QR Hari Ini</h3>
          
          <p className="text-[13px] text-[#6b7383] mb-4">
            QR ini berlaku untuk absensi semua karyawan hari ini.
            <br />
            <span className="text-[11px]">- Validasi lokasi otomatis sesuai setting</span>
          </p>

          <button 
            className="btn btn-primary w-full"
            onClick={generateQR}
            disabled={loading}
          >
            {loading ? 'Membuat...' : 'Buat QR Hari Ini'}
          </button>

          <div className="mt-4 p-3 bg-[#f8f9fc] rounded-[12px] text-[12px] text-[#6b7383]">
            <div>- QR berlaku untuk semua karyawan</div>
            <div>- Kadaluarsa jam 23:59 hari ini</div>
            <div>- Validasi lokasi otomatis</div>
          </div>
        </div>

        {/* QR Result */}
        <div className="card p-6">
          <h3 className="text-[18px] font-extrabold mb-4">QR Code</h3>
          
          {qrCode ? (
            <div className="text-center">
              <div className="w-[240px] h-[240px] mx-auto bg-white rounded-[16px] p-6 border-2 border-[#3b63f0]/20 shadow-lg flex items-center justify-center">
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={qrCode.data} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="mt-4 text-left space-y-1 text-[13px]">
                <div className="flex justify-between py-1 border-b border-[#e7e9f2]">
                  <span className="text-[#6b7383]">Tanggal</span>
                  <span className="font-bold">{new Date(qrCode.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#e7e9f2]">
                  <span className="text-[#6b7383]">Berlaku</span>
                  <span className="font-bold text-[#1a9a53]">Hari Ini</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6b7383]">Status</span>
                  <span className="font-bold text-[#1a9a53]">Aktif</span>
                </div>
              </div>

              <button 
                onClick={downloadQR}
                className="btn btn-primary btn-sm w-full mt-4"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download QR
              </button>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-[#6b7383]">
              <div className="text-center">
                <div className="text-[48px] mb-3"></div>
                <div className="font-medium">Klik "Buat QR Hari Ini"</div>
                <div className="text-[12px] mt-1">QR akan muncul di sini</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}