import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { publicApi, voterApi } from '../services/api'
import { Alert, Countdown, ProgressBar } from '../components/shared/UI'
import type { Candidate, ElectionSetting } from '../types'

type Step = 'verify' | 'select' | 'success'

const AVATAR_COLORS = [
  ['#E6F1FB', '#0C447C'], ['#EAF3DE', '#3B6D11'],
  ['#FAEEDA', '#854F0B'], ['#EEEDFE', '#534AB7'],
]

export default function VoterPage() {
  const location = useLocation()
  const [step, setStep] = useState<Step>('verify')
  const [election, setElection] = useState<ElectionSetting | null>(null)
  const [stats, setStats] = useState({ total_members: 0, total_votes: 0, participation_pct: 0 })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [voterToken, setVoterToken] = useState('')
  const [verifiedMember, setVerifiedMember] = useState<{ name: string; nik: string; site: string } | null>(null)
  const [selectedCand, setSelectedCand] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState({ name: '', nik: '', site: '' })
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'info' | 'warning'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [voteTime, setVoteTime] = useState('')

  // Get member data from OTP verification or other sources
  useEffect(() => {
    if (location.state?.member) {
      setVerifiedMember(location.state.member)
      setStep('select')
    }
    // Get voting token from localStorage if available (set by OTP verification)
    const token = localStorage.getItem('voting_token')
    if (token) {
      setVoterToken(token)
    }
  }, [location.state])

  useEffect(() => {
    publicApi.electionInfo().then(r => setElection(r.data)).catch(() => { })
    publicApi.electionStats().then(r => setStats(r.data)).catch(() => { })
    publicApi.candidates().then(r => setCandidates(r.data)).catch(() => { })
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.nik || !form.site) { setAlert({ type: 'error', msg: 'Semua field wajib diisi!' }); return }
    setLoading(true); setAlert(null)
    try {
      const res = await voterApi.verify(form.name, form.nik, form.site)
      setVoterToken(res.data.voter_token)
      setVerifiedMember(res.data.member)
      setStep('select')
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.response?.data?.message ?? 'Terjadi kesalahan.' })
    } finally { setLoading(false) }
  }

  async function handleCast() {
    if (!selectedCand) return
    setLoading(true); setAlert(null)
    try {
      const res = await voterApi.cast(voterToken, selectedCand)
      setVoteTime(res.data.time)
      setStep('success')
      setConfirmOpen(false)
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.response?.data?.message ?? 'Terjadi kesalahan.' })
      setConfirmOpen(false)
    } finally { setLoading(false) }
  }

  function reset() {
    setStep('verify'); setForm({ name: '', nik: '', site: '' })
    setVoterToken(''); setVerifiedMember(null); setSelectedCand(null); setAlert(null)
    publicApi.electionStats().then(r => setStats(r.data)).catch(() => { })
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }} className="fade-in">
        <div style={{ width: 72, height: 72, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 30 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>Suara Berhasil Dicatat!</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
          Terima kasih, <strong>{verifiedMember?.name}</strong>. Suara Anda dirahasiakan dan telah tercatat dengan aman.
        </p>
        <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['Nama', verifiedMember?.name], ['NIK', verifiedMember?.nik], ['Site', verifiedMember?.site], ['Waktu', voteTime]].map(([lbl, val]) => (
              <div key={lbl}>
                <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 2 }}>{lbl}</p>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={reset}>Selesai</button>
      </div>
    </div>
  )

  // ── Select Candidate ─────────────────────────────────────────────────────
  if (step === 'select') return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }} className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 20 }}>
        <span className="badge badge-green" style={{ marginBottom: 10 }}>✓ Terverifikasi</span>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Pilih Kandidat Anda</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Halo <strong>{verifiedMember?.name}</strong>, silakan pilih 1 kandidat</p>
      </div>
      {alert && <Alert type={alert.type} message={alert.msg} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {candidates.map((c, i) => {
          const [bg, fg] = AVATAR_COLORS[i % AVATAR_COLORS.length]
          const sel = selectedCand === c.id
          return (
            <div key={c.id}
              onClick={() => setSelectedCand(c.id)}
              style={{
                border: `2px solid ${sel ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 'var(--r2)', padding: 20, cursor: 'pointer',
                background: sel ? 'var(--blue-light)' : 'var(--surface)',
                textAlign: 'center', transition: 'all 0.15s', position: 'relative',
              }}>
              {sel && <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, background: 'var(--blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>✓</div>}
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: sel ? 'var(--blue)' : bg, color: sel ? '#E6F1FB' : fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, margin: '0 auto 12px' }}>
                {c.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.name}</p>
              <p style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, marginBottom: 8 }}>{c.position}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{c.bio}</p>
            </div>
          )
        })}
      </div>
      <button className="btn btn-primary btn-block" disabled={!selectedCand} onClick={() => setConfirmOpen(true)}>
        Konfirmasi Pilihan →
      </button>
      <button className="btn btn-block" style={{ marginTop: 8 }} onClick={() => { setStep('verify'); setSelectedCand(null); setAlert(null) }}>
        ← Kembali
      </button>

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmOpen(false)}>
          <div className="modal-box fade-in">
            <p className="modal-title">Konfirmasi Pilihan Anda</p>
            <div className="alert alert-info">
              Anda akan memilih <strong>{candidates.find(c => c.id === selectedCand)?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmOpen(false)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCast} disabled={loading}>
                {loading ? 'Memproses...' : 'Ya, Konfirmasi →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Verify ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }} className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 20 }}>
        <div style={{ width: 48, height: 48, background: 'var(--blue)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#E6F1FB', fontSize: 20, fontWeight: 800 }}>K</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{election?.election_name ?? 'Pemilihan Ketua Koperasi'}</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Periode {election?.period}</p>
        <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>KKM Smart Vote v1.0.0</p>
        {election && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Sisa Waktu Voting</p>
            <Countdown endDate={election.end_date} endTime={election.end_time} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Partisipasi Anggota</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{stats.participation_pct}%</p>
        </div>
        <ProgressBar pct={stats.participation_pct} />
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
          {stats.total_votes} dari {stats.total_members} anggota telah memilih
        </p>
      </div>

      <div className="card">
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Verifikasi Identitas</p>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Masukkan data sesuai keanggotaan koperasi Anda</p>
        {alert && <Alert type={alert.type} message={alert.msg} />}
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="field-label">Nama Lengkap</label>
            <input type="text" placeholder="Nama sesuai data keanggotaan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="field-label">NIK (Nomor Induk Karyawan)</label>
            <input type="text" placeholder="Contoh: KRY001" value={form.nik} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="field-label">Site</label>
            <select value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
              <option value="">— Pilih Site —</option>
              <option>Site A</option><option>Site B</option><option>Site C</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Memverifikasi...' : 'Verifikasi & Lanjutkan →'}
          </button>
        </form>
        <hr />
        <div style={{ textAlign: 'center' }}>
          <a href="/admin/login" className="btn btn-sm">🔐 Masuk sebagai Admin / Panitia</a>
        </div>
      </div>
    </div>
  )
}
