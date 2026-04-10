import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { votingApi } from '../services/api';
import { notify } from '../utils/notify';
import { voterSession } from '../utils/voterSession';
import '../styles/pages/voting.css';

export default function MemberLookupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [nik, setNik] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [memberData, setMemberData] = useState<any>(null);

    const votingToken = location.state?.votingToken || voterSession.getToken();

    useEffect(() => {
        const savedMember = voterSession.getMember<any>();
        if (savedMember && votingToken) {
            setMemberData(savedMember);
            setNik(savedMember.nik || '');
        }
    }, [votingToken]);

    const getDepartmentName = (member: any) => member?.department?.name || member?.department || '-';
    const getSiteName = (member: any) => member?.site?.name || member?.site || '-';

    if (!votingToken) {
        return (
            <div className="voting-container">
                <div className="error-card">
                    <h2>⚠️ Akses Ditolak</h2>
                    <p>Silakan verifikasi email Anda terlebih dahulu.</p>
                    <button onClick={() => navigate('/otp')}>← Kembali ke OTP</button>
                </div>
            </div>
        );
    }

    /**
     * Layer 2: Lookup member by NIK
     */
    const handleSearchMember = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!nik.trim()) {
            notify.warning('NIK Wajib', 'Masukkan NIK Anda terlebih dahulu.');
            return;
        }

        setLoading(true);

        try {
            const res = await votingApi.memberLookup(nik);

            if (res.data.success) {
                const member = res.data.data;
                setMemberData(member);
                voterSession.setMember(member);
                notify.success('Verifikasi Berhasil', `Halo ${member.name}!`);
            }
        } catch (error: unknown) {
            const err = error as any;
            const errorData = err.response?.data;

            if (err.response?.status === 404) {
                notify.error('NIK Tidak Ditemukan', 'NIK tidak ditemukan di sistem.');
            } else if (err.response?.status === 409) {
                notify.warning('Sudah Pernah Memilih', 'Anda sudah pernah memilih di pemilihan ini.');
            } else if (err.response?.status === 403) {
                notify.error('Tidak Eligible', 'Anda tidak eligible untuk memilih.');
            } else {
                notify.error('Verifikasi NIK Gagal', errorData?.message || 'Verifikasi NIK gagal.');
            }
            console.error('Member lookup error:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Proceed to voting page
     */
    const handleProceedToVoting = () => {
        if (memberData) {
            voterSession.setMember(memberData);
            navigate('/vote', {
                state: {
                    member: memberData,
                    votingToken: votingToken
                }
            });
        }
    };

    const handleLogoutSession = () => {
        voterSession.clearAll();
        notify.info('Session Dihapus', 'Silakan login OTP kembali.');
        navigate('/otp', { replace: true });
    };

    return (
        <div className="voting-container">
            <header className="voting-header">
                <h1>🗳️ KKM VOTING 2026</h1>
                <h2>Verifikasi Anggota</h2>
            </header>

            <main className="voting-main">
                {!memberData ? (
                    // Step 1: Search member by NIK
                    <form onSubmit={handleSearchMember} className="form-card">
                        <div className="form-step">
                            <div className="step-indicator">
                                <span className="step-number active">2</span>
                                <span className="step-label">Verifikasi NIK</span>
                            </div>

                            <h3>Masukkan NIK Anda</h3>
                            <p className="hint">Nomor Induk Koperasi</p>

                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Masukkan NIK (contoh: 1001000001)"
                                    value={nik}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNik(e.target.value)}
                                    maxLength={20}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? '⏳ Mencari...' : '🔍 Cari'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/otp')}
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                ← Kembali
                            </button>

                            <button
                                type="button"
                                onClick={handleLogoutSession}
                                className="btn btn-outline"
                                disabled={loading}
                            >
                                Logout Session
                            </button>
                        </div>
                    </form>
                ) : (
                    // Step 2: Confirm member data
                    <div className="form-card success-card">
                        <div className="member-info">
                            <h3>✅ Data Anda Terverifikasi</h3>

                            <div className="info-block">
                                <div className="info-row">
                                    <span className="label">Nama:</span>
                                    <span className="value">{memberData.name}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">NIK:</span>
                                    <span className="value">{memberData.nik}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Email:</span>
                                    <span className="value">{memberData.email_masked || '—'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Departemen:</span>
                                    <span className="value">{getDepartmentName(memberData)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Lokasi:</span>
                                    <span className="value">{getSiteName(memberData)}</span>
                                </div>
                                <div className="info-row status">
                                    <span className="label">Status:</span>
                                    <span className="value">
                                        {memberData.is_eligible ? '✅ Eligible' : '❌ Tidak Eligible'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleProceedToVoting}
                                className="btn btn-primary btn-large"
                            >
                                ► Lanjut ke Pemilihan
                            </button>

                            <button
                                onClick={() => {
                                    setMemberData(null);
                                    setNik('');
                                    voterSession.setMember(null);
                                }}
                                className="btn btn-secondary"
                            >
                                🔄 Cari Member Lain
                            </button>

                            <button
                                onClick={handleLogoutSession}
                                className="btn btn-outline"
                            >
                                Logout Session
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
