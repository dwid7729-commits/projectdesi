import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUsers } from '../../hooks/useUsers'
import { supabase } from '../../lib/supabase'
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const { login, isAdmin } = useAuth()
  const { addUser } = useUsers()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data, error } = await login(email, password)
      if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!fullName.trim()) throw new Error('Full name is required')
      if (!email.trim()) throw new Error('Email is required')
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
      if (!employeeId.trim()) throw new Error('Employee ID is required')
      if (!department.trim()) throw new Error('Department is required')

      // PAKE ADDUSER DARI HOOK - PAKE SERVICE ROLE, GA KENA RATE LIMIT!
      await addUser({
        email: email.trim(),
        password: password,
        full_name: fullName.trim(),
        employee_id: employeeId.trim(),
        department: department.trim(),
        phone: phone.trim() || '',
        location: location.trim() || ''
      })

      setSuccess('Registration successful! You can now login.')
      
      // Reset form
      setFullName('')
      setEmail('')
      setPassword('')
      setEmployeeId('')
      setDepartment('')
      setPhone('')
      setLocation('')
      
      setTimeout(() => {
        setIsRegister(false)
        setSuccess('')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      })

      if (error) throw error

      setSuccess('Password reset email sent! Please check your inbox.')
      setIsForgotPassword(false)
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const resetForms = () => {
    setError('')
    setSuccess('')
    setIsRegister(false)
    setIsForgotPassword(false)
    setFullName('')
    setPassword('')
    setEmployeeId('')
    setDepartment('')
    setPhone('')
    setLocation('')
  }

  // Login Form
  if (!isRegister && !isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5fc] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="brand justify-center">
              <span className="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"/>
                </svg>
              </span>
              joki desi
            </div>
            <p className="text-[#6b7383] mt-2">absensi lebih mudah</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="field-label">Email Address</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 6-10 7L2 6"/>
                  </svg>
                  <input 
                    type="email" 
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="field-label mb-0">Password</label>
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[12px] text-[#1541c9] font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-[#e0384c] text-sm mb-4 p-3 bg-[#fde9ea] rounded-[12px]">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-[#1a9a53] text-sm mb-4 p-3 bg-[#e4f8ec] rounded-[12px]">
                  {success}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#6b7383] text-[14px]">
                Don't have an account?{' '}
                <button 
                  onClick={() => setIsRegister(true)}
                  className="text-[#1541c9] font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>

          <div className="text-center text-[#9aa1b0] text-[12px] leading-relaxed mt-8">
            © 2026 joki desi. All rights reserved.
          </div>
        </div>
      </div>
    )
  }

  // Register Form
  if (isRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5fc] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="brand justify-center">
              <span className="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"/>
                </svg>
              </span>
              joki desi
            </div>
            <p className="text-[#6b7383] mt-2">Create your account</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="field-label">Full Name *</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M20 21a8 8 0 0 0-16 0"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="field-label">Email Address *</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 6-10 7L2 6"/>
                  </svg>
                  <input 
                    type="email" 
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="field-label">Password *</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
                <p className="text-[11px] text-[#6b7383] mt-1">Password must be at least 6 characters</p>
              </div>

              {/* Employee ID */}
              <div>
                <label className="field-label">Employee ID *</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M8 7h8M8 12h8M8 17h4"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="EMP-001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="field-label">Department *</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 8h6M9 12h6M9 16h4"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="field-label">Phone</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.36 1.78.7 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.27a2 2 0 0 1 2.11-.45c.82.34 1.7.58 2.6.7A2 2 0 0 1 22 16.92Z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="+62 812 3456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="field-label">Location</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Jakarta, Indonesia"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-[#e0384c] text-sm p-3 bg-[#fde9ea] rounded-[12px]">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-[#1a9a53] text-sm p-3 bg-[#e4f8ec] rounded-[12px]">
                  {success}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#6b7383] text-[14px]">
                Already have an account?{' '}
                <button 
                  onClick={resetForms}
                  className="text-[#1541c9] font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>

          <div className="text-center text-[#9aa1b0] text-[12px] leading-relaxed mt-6">
            © 2024 joki desi. All rights reserved.
          </div>
        </div>
      </div>
    )
  }

  // Forgot Password Form
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5fc] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="brand justify-center">
              <span className="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"/>
                </svg>
              </span>
              joki desi
            </div>
            <p className="text-[#6b7383] mt-2">Reset your password</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className="field-label">Email Address</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 6-10 7L2 6"/>
                  </svg>
                  <input 
                    type="email" 
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-[#e0384c] text-sm mb-4 p-3 bg-[#fde9ea] rounded-[12px]">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-[#1a9a53] text-sm mb-4 p-3 bg-[#e4f8ec] rounded-[12px]">
                  {success}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={resetForms}
                className="text-[#1541c9] font-bold text-[14px] hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>

          <div className="text-center text-[#9aa1b0] text-[12px] leading-relaxed mt-8">
            © 2024 joki desi. All rights reserved.
          </div>
        </div>
      </div>
    )
  }
}