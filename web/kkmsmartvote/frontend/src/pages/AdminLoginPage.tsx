import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../hooks/useAuth'
import { Alert } from '../components/shared/UI'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [alert, setAlert] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('✓ Form submitted, preventing default')
    setLoading(true); setAlert('')
    try {
      console.log('🔐 Logging in with:', { username: form.username })
      
      // Test with fetch directly
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password })
      })
      
      console.log('📥 Response status:', response.status)
      const data = await response.json()
      console.log('📥 Response data:', data)
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }
      
      console.log('✅ Login success:', data)
      setAuth(data.token, data.user)
      console.log('📝 Auth store updated, navigating to /admin')
      navigate('/admin')
    } catch (err: any) {
      console.error('❌ Login error:', err.message)
      setAlert(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'var(--blue)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#E6F1FB', fontSize: 22, fontWeight: 800 }}>K</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Panel Admin</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Koperasi Karya Mandiri</p>
        </div>
        <div className="card">
          {alert && <Alert type="error" message={alert} />}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="field-label">Username</label>
              <input type="text" placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label className="field-label">Password</label>
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
          <hr />
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r)', padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 600 }}>AKUN DEMO</p>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>admin / admin123 · panitia1 / panitia123</p>
          </div>
          <hr />
          <a href="/" className="btn btn-sm btn-block" style={{ textAlign: 'center', display: 'block' }}>← Kembali ke Halaman Voting</a>
        </div>
      </div>
    </div>
  )
}
