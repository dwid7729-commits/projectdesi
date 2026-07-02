import React, { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../context/AuthContext'

export default function Users() {
  const { users, loading, updateUser } = useUsers()
  const { profile } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user',
    department: '',
    access_level: 1,
    employee_id: '',
    phone: '',
    location: ''
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'user',
      department: '',
      access_level: 1,
      employee_id: '',
      phone: '',
      location: ''
    })
    setEditingUser(null)
    setFormError('')
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'user',
      department: user.department || '',
      access_level: user.access_level || 1,
      employee_id: user.employee_id || '',
      phone: user.phone || '',
      location: user.location || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required')
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }

      const updateData = {
        full_name: formData.full_name.trim(),
        role: formData.role,
        department: formData.department.trim(),
        access_level: parseInt(formData.access_level),
        employee_id: formData.employee_id.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim()
      }
      await updateUser(editingUser.id, updateData)

      setShowModal(false)
      resetForm()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className="pill bg-[#eef1ff] text-[#1541c9]">Admin</span>
    }
    return <span className="pill bg-[#eef1fb] text-[#6b7383]">User</span>
  }

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-.02em]">User Management</h1>
          <p className="text-[#6b7383] text-[14.5px] mt-1.5">
            Manage all users and their access levels ({users?.length || 0} users)
          </p>
        </div>
        <div className="text-[13px] text-[#6b7383]">
          <span className="bg-[#eef1fb] px-3 py-1 rounded-full text-[11px]">
            🔗 Register baru via halaman Sign Up
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b7383]">Loading users...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8f9fc] border-b border-[#e7e9f2]">
                <tr>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">User</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Email</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Role</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Department</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Level</th>
                  <th className="text-left px-6 py-4 text-[12px] font-extrabold text-[#9aa1b0] uppercase tracking-[.06em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-[#6b7383]">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-[#e7e9f2] hover:bg-[#f8f9fc] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-[36px] h-[36px] rounded-full bg-[#eef1fb] flex items-center justify-center text-[#1541c9] font-bold text-[13px] flex-none">
                            {getInitials(user.full_name)}
                          </span>
                          <span className="font-bold text-[14px]">{user.full_name}</span>
                          {user.id === profile?.id && (
                            <span className="text-[10px] text-[#6b7383] font-medium bg-[#f8f9fc] px-2 py-1 rounded">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#6b7383]">{user.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-[14px] text-[#6b7383]">{user.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#eef1ff] text-[#1541c9] text-[12px] font-bold">
                          Level {user.access_level || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-[8px] hover:bg-[#eef1fb] text-[#6b7383] hover:text-[#1541c9] transition-colors"
                            title="Edit user"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          {user.id === profile?.id && (
                            <span className="text-[10px] text-[#6b7383] font-medium">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-[#e7e9f2] text-[13px] text-[#6b7383]">
            Total: {users.length} users
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-[#e7e9f2] sticky top-0 bg-white z-10">
              <h3 className="text-[20px] font-extrabold">Edit User</h3>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 rounded-full hover:bg-[#f8f9fc] text-[#6b7383]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-[#fde9ea] text-[#e0384c] rounded-[12px] text-[13px]">
                  {formError}
                </div>
              )}

              <div>
                <label className="field-label">Full Name *</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Email</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 6-10 7L2 6"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="user@company.com"
                    value={formData.email}
                    disabled
                  />
                </div>
                <p className="text-[11px] text-[#6b7383] mt-1">Email tidak bisa diubah</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label text-[12px]">Role</label>
                  <select
                    className="w-full p-3 rounded-[14px] bg-[#eef1fb] border border-transparent focus:border-[#3b63f0] focus:bg-white outline-none text-[14px]"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="field-label text-[12px]">Access Level</label>
                  <select
                    className="w-full p-3 rounded-[14px] bg-[#eef1fb] border border-transparent focus:border-[#3b63f0] focus:bg-white outline-none text-[14px]"
                    value={formData.access_level}
                    onChange={(e) => setFormData({...formData, access_level: parseInt(e.target.value)})}
                  >
                    {[1,2,3,4,5].map(level => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Department</label>
                <div className="input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 8h6M9 12h6M9 16h4"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label text-[12px]">Employee ID</label>
                  <div className="input-group">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M8 7h8M8 12h8M8 17h4"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="EMP-001"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label text-[12px]">Phone</label>
                  <div className="input-group">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.36 1.78.7 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.27a2 2 0 0 1 2.11-.45c.82.34 1.7.58 2.6.7A2 2 0 0 1 22 16.92Z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="+62 812 3456 7890"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

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
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#e7e9f2]">
                <button 
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}