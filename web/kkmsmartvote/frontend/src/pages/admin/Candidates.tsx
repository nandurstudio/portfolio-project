// ── Candidates ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { Avatar, EmptyState, Modal, PageHeader, Spinner, Alert } from '../../components/shared/UI'
import { useAuthStore } from '../../hooks/useAuth'
import type { Candidate, Member, Vote, AuditLog, User, ElectionSetting, ResultsData } from '../../types'

// ═══════════════════════════════════════════════════════════════════════════
export function Candidates() {
  const { user } = useAuthStore()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Candidate | null>(null)
  const [form, setForm] = useState({ name: '', position: '', bio: '' })
  const [err, setErr] = useState('')

  const load = () => adminApi.candidates().then(r => setCandidates(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function save() {
    setErr('')
    try {
      if (editing) await adminApi.updateCandidate(editing.id, form)
      else await adminApi.addCandidate(form)
      setModal(null); load()
    } catch (e: any) { setErr(e.response?.data?.message ?? 'Gagal menyimpan.') }
  }

  async function del(id: number) {
    if (!confirm('Hapus kandidat ini?')) return
    try { await adminApi.deleteCandidate(id); load() } catch (e: any) { alert(e.response?.data?.message) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Kandidat" action={user?.role === 'admin' ? <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm({ name: '', position: '', bio: '' }); setModal('add') }}>+ Tambah Kandidat</button> : undefined} />
      <div style={{ display: 'grid', gap: 12 }}>
        {candidates.map((c, i) => (
          <div key={c.id} className="card card-sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar name={c.name} size={52} index={i} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</p>
                  <span className="badge badge-blue">{c.position}</span>
                  <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>{c.bio}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--blue)' }}>{c.valid_votes_count ?? 0}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>suara</p>
              </div>
              {user?.role === 'admin' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => { setEditing(c); setForm({ name: c.name, position: c.position, bio: c.bio ?? '' }); setModal('edit') }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => del(c.id)}>Hapus</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {candidates.length === 0 && <EmptyState message="Belum ada kandidat." />}
      </div>

      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Kandidat' : 'Tambah Kandidat'} onClose={() => setModal(null)}>
          {err && <Alert type="error" message={err} />}
          {['name', 'position', 'bio'].map(f => (
            <div key={f} className="form-group">
              <label className="field-label">{f === 'name' ? 'Nama Lengkap' : f === 'position' ? 'Posisi / Nomor Urut' : 'Biografi'}</label>
              <input type="text" value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} placeholder={f === 'name' ? 'Nama kandidat' : f === 'position' ? 'Kandidat No. X' : 'Pengalaman...'} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setModal(null)}>Batal</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Simpan</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function Members() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nik: '', name: '', site: '' })
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')

  const load = (q?: object) => adminApi.members(q).then(r => setMembers(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function save() {
    setErr('')
    try { await adminApi.addMember(form); setModal(false); load() }
    catch (e: any) { setErr(e.response?.data?.message ?? 'Gagal menyimpan.') }
  }

  if (loading) return <Spinner />

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.nik.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title={`Daftar Anggota (${members.length})`} action={user?.role === 'admin' ? <button className="btn btn-primary btn-sm" onClick={() => { setForm({ nik: '', name: '', site: '' }); setModal(true) }}>+ Tambah Anggota</button> : undefined} />
      <div className="card card-sm" style={{ marginBottom: 14 }}>
        <input type="text" placeholder="Cari nama atau NIK..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>NIK</th><th>Nama</th><th>Site</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.nik}>
                  <td><span className="mono">{m.nik}</span></td>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td><span className="badge badge-purple">{m.site}</span></td>
                  <td><span className={`badge ${m.has_voted ? 'badge-green' : 'badge-amber'}`}>{m.has_voted ? '✓ Sudah Memilih' : 'Belum Memilih'}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4}><EmptyState message="Tidak ada data." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="Tambah Anggota" onClose={() => setModal(false)}>
          {err && <Alert type="error" message={err} />}
          {[['nik', 'NIK', 'KRY009'], ['name', 'Nama Lengkap', 'Nama anggota']].map(([f, lbl, ph]) => (
            <div key={f} className="form-group">
              <label className="field-label">{lbl}</label>
              <input type="text" placeholder={ph} value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="field-label">Site</label>
            <select value={form.site} onChange={e => setForm(p => ({ ...p, site: e.target.value }))}>
              <option value="">— Pilih Site —</option>
              <option>Site A</option><option>Site B</option><option>Site C</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setModal(false)}>Batal</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Tambah</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function Votes() {
  const { user } = useAuthStore()
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => adminApi.votes().then(r => setVotes(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function invalidate(id: number) {
    const reason = prompt('Alasan invalidasi (opsional):') ?? ''
    if (!confirm('Invalidasi suara ini?')) return
    try { await adminApi.invalidateVote(id, reason); load() }
    catch (e: any) { alert(e.response?.data?.message) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title={`Rekap Suara (${votes.length})`} />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {votes.length === 0 ? <EmptyState message="Belum ada suara masuk." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>NIK</th><th>Nama</th><th>Site</th><th>Kandidat</th><th>Waktu</th><th>Status</th>{user?.role === 'admin' && <th></th>}</tr></thead>
              <tbody>
                {votes.map(v => (
                  <tr key={v.id}>
                    <td><span className="mono">{v.member_nik}</span></td>
                    <td style={{ fontWeight: 500 }}>{v.member_name}</td>
                    <td><span className="badge badge-purple">{v.site}</span></td>
                    <td style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Dirahasiakan</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(v.created_at).toLocaleString('id-ID')}</td>
                    <td><span className={`badge ${v.is_valid ? 'badge-green' : 'badge-red'}`}>{v.is_valid ? 'Sah' : 'Tidak Sah'}</span></td>
                    {user?.role === 'admin' && <td>{v.is_valid && <button className="btn btn-sm btn-danger" onClick={() => invalidate(v.id)}>Invalidasi</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function Results() {
  const { user } = useAuthStore()
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const load = () => adminApi.results().then(r => setData(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function finalize() {
    setFinalizing(true)
    try { await adminApi.finalize(); setConfirm(false); load() }
    catch (e: any) { alert(e.response?.data?.message) }
    finally { setFinalizing(false) }
  }

  if (loading) return <Spinner />
  const d = data!

  return (
    <div>
      <PageHeader title="Hasil Pemilihan" action={user?.role === 'admin' ? <button className="btn btn-success btn-sm" onClick={() => setConfirm(true)}>Finalisasi Hasil</button> : undefined} />
      <div className="card" style={{ marginBottom: 16 }}>
        {d.status === 'WINNER' && d.winner && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            🏆 Pemenang: <strong>{d.winner.name}</strong> — {d.winner.vote_count} suara ({d.winner.percentage}%)
          </div>
        )}
        {d.status === 'TIE' && <div className="alert alert-warning">⚠️ Terjadi seri! Diperlukan pemilihan ulang.</div>}
        {d.status === 'NO_MAJORITY' && <div className="alert alert-info">Belum ada kandidat mencapai 50%.</div>}
        <table>
          <thead><tr><th>#</th><th>Kandidat</th><th>Suara</th><th>Persentase</th><th>Status</th></tr></thead>
          <tbody>
            {d.results.map((r, i) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: 'var(--text3)' }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td><span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 16 }}>{r.vote_count}</span></td>
                <td>{r.percentage}%</td>
                <td>{r.is_winner ? <span className="badge badge-green">✓ Menang</span> : <span className="badge badge-gray">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr />
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>Total suara sah: <strong>{d.total_valid}</strong></p>
      </div>

      {confirm && (
        <Modal title="Finalisasi Hasil Pemilihan" onClose={() => setConfirm(false)}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Hasil akan dikunci dan tidak dapat diubah. Lanjutkan?</p>
          {d.winner && (
            <div className="card card-sm" style={{ marginBottom: 16, borderColor: '#C0DD97' }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Kandidat Terpilih</p>
              <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{d.winner.name}</p>
              <p style={{ fontSize: 13, color: 'var(--green)' }}>{d.winner.vote_count} suara · {d.winner.percentage}%</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setConfirm(false)}>Batal</button>
            <button className="btn btn-success" style={{ flex: 1 }} onClick={finalize} disabled={finalizing}>
              {finalizing ? 'Memproses...' : 'Finalisasi'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminApi.auditLog().then(r => setLogs(r.data.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <Spinner />
  return (
    <div>
      <PageHeader title="Audit Trail" />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Detail</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td><span className="mono" style={{ fontSize: 11 }}>{new Date(l.logged_at).toLocaleString('id-ID')}</span></td>
                  <td style={{ fontWeight: 600 }}>{l.actor}</td>
                  <td>{l.action}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{typeof l.detail === 'object' ? JSON.stringify(l.detail) : l.detail}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4}><EmptyState message="Belum ada log." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function Users() {
  const { user: me } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: '' })
  const [err, setErr] = useState('')

  const load = () => adminApi.users().then(r => setUsers(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function save() {
    setErr('')
    try { await adminApi.addUser(form); setModal(false); load() }
    catch (e: any) { setErr(e.response?.data?.message ?? 'Gagal.') }
  }

  async function del(id: number) {
    if (!confirm('Hapus user ini?')) return
    try { await adminApi.deleteUser(id); load() }
    catch (e: any) { alert(e.response?.data?.message) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Manajemen Pengguna" action={<button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: '', username: '', password: '', role: '' }); setModal(true) }}>+ Tambah User</button>} />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td><span className="mono">{u.username}</span></td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span></td>
                  <td>{u.id !== me?.id && <button className="btn btn-sm btn-danger" onClick={() => del(u.id)}>Hapus</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="Tambah Pengguna" onClose={() => setModal(false)}>
          {err && <Alert type="error" message={err} />}
          {[['name', 'Nama Lengkap', 'text'], ['username', 'Username', 'text'], ['password', 'Password', 'password']].map(([f, lbl, t]) => (
            <div key={f} className="form-group">
              <label className="field-label">{lbl}</label>
              <input type={t} value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="field-label">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="">— Pilih Role —</option>
              <option value="admin">Admin</option>
              <option value="panitia">Panitia</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setModal(false)}>Batal</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Tambah</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function Settings() {
  const [setting, setSetting] = useState<ElectionSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    import('../../services/api').then(({ publicApi }) =>
      publicApi.electionInfo().then(r => setSetting(r.data)).finally(() => setLoading(false))
    )
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setSaved(false)
    try { await adminApi.updateSettings(setting!); setSaved(true) }
    catch (e: any) { setErr(e.response?.data?.message ?? 'Gagal.') }
  }

  if (loading || !setting) return <Spinner />

  return (
    <div>
      <PageHeader title="Pengaturan Pemilihan" />
      {saved && <Alert type="success" message="Pengaturan berhasil disimpan." />}
      {err && <Alert type="error" message={err} />}
      <div className="card">
        <form onSubmit={save}>
          <div className="form-group">
            <label className="field-label">Nama Pemilihan</label>
            <input type="text" value={setting.election_name} onChange={e => setSetting(s => s ? { ...s, election_name: e.target.value } : s)} />
          </div>
          <div className="form-group">
            <label className="field-label">Periode</label>
            <input type="text" value={setting.period} onChange={e => setSetting(s => s ? { ...s, period: e.target.value } : s)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="field-label">Tanggal Mulai</label>
              <input type="date" value={setting.start_date} onChange={e => setSetting(s => s ? { ...s, start_date: e.target.value } : s)} />
            </div>
            <div className="form-group">
              <label className="field-label">Tanggal Selesai</label>
              <input type="date" value={setting.end_date} onChange={e => setSetting(s => s ? { ...s, end_date: e.target.value } : s)} />
            </div>
            <div className="form-group">
              <label className="field-label">Jam Tutup (WIB)</label>
              <input type="time" value={setting.end_time.slice(0, 5)} onChange={e => setSetting(s => s ? { ...s, end_time: e.target.value } : s)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Simpan Pengaturan</button>
        </form>
      </div>
    </div>
  )
}

export default Candidates
