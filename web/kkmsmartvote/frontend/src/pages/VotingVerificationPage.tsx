import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { votingApi } from '../services/api';
import { notify } from '../utils/notify';
import { voterSession } from '../utils/voterSession';
import '../styles/pages/voting.css';

type SiteOption = {
    id: number;
    code: string;
    name: string;
};

type LookupMember = {
    id: number;
    nik: string;
    name: string;
    email: string | null;
    email_masked: string | null;
    is_eligible: boolean;
    has_voted: boolean;
    can_vote?: boolean;
    existing_vote?: ExistingVotePayload | null;
    department: { id?: number | null; code?: string | null; name: string } | string;
    site: { id?: number | null; code?: string | null; name: string } | string;
};

type OtpDraft = {
    otpId: number;
    memberNik: string;
    email: string;
    maskedEmail: string;
    selectedSiteId: number | null;
    expiresAt: number;
};

type ExistingVotePayload = {
    vote_id?: number;
    member_nik?: string;
    member_name?: string;
    voted_at?: string;
    candidate?: {
        id?: number;
        name?: string;
        position?: string;
    };
    voucher?: {
        code?: string;
        status?: string;
        created_at?: string;
        vote_id?: number;
        member_nik?: string;
        candidate_name?: string;
    };
};

export default function VotingVerificationPage() {
    const navigate = useNavigate();
    const checkedInitialSessionRef = useRef(false);
    const checkedElectionGateRef = useRef(false);
    const initialSessionRef = useRef({
        token: voterSession.getToken(),
        member: voterSession.getMember<LookupMember>(),
        site: voterSession.getSite<SiteOption>(),
        otpDraft: voterSession.getOtpDraft<OtpDraft>(),
    });
    const [sites, setSites] = useState<SiteOption[]>([]);
    const [loadingSites, setLoadingSites] = useState(false);
    const [loadingMember, setLoadingMember] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [step, setStep] = useState<'nik' | 'details' | 'otp'>('nik');
    const [nik, setNik] = useState('');
    const [member, setMember] = useState<LookupMember | null>(null);
    const [email, setEmail] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
    const [otpId, setOtpId] = useState<number | null>(null);
    const [otp, setOtp] = useState('');
    const [expiryTimestamp, setExpiryTimestamp] = useState<number>(0);
    const [otpExpiry, setOtpExpiry] = useState<number>(0);

    const handleAlreadyVoted = (errorData: any) => {
        const memberFromError = errorData?.data?.member as LookupMember | undefined;
        const existingVote = errorData?.data?.existing_vote as ExistingVotePayload | undefined;
        const votedAt = errorData?.data?.voted_at;

        const currentMember = memberFromError || member;

        if (currentMember) {
            setMember(currentMember);
            setNik(String(currentMember.nik || nik).trim());
            setEmail(String(currentMember.email || email));
            setMaskedEmail(String(currentMember.email_masked || maskedEmail));
            voterSession.setMember(currentMember);

            const matchedSite = sites.find((site) => {
                const siteName = typeof currentMember.site === 'string' ? currentMember.site : currentMember.site?.name;
                return site.name.toLowerCase() === String(siteName || '').toLowerCase();
            });
            setSelectedSiteId(matchedSite?.id ?? sites[0]?.id ?? null);
            setStep('details');
        }

        if (existingVote?.voucher?.code) {
            voterSession.setLastVote(existingVote);
            notify.info('Sudah Pernah Memilih', 'NIK ini sudah vote. Silakan login OTP untuk melihat bukti/voucher.');
        } else {
            const votedAtText = votedAt ? `\nWaktu vote: ${new Date(votedAt).toLocaleString('id-ID')}` : '';
            notify.warning(
                'Sudah Pernah Memilih',
                `NIK ini sudah pernah menggunakan hak suara.${votedAtText}\nSilakan lanjut OTP untuk login.`,
            );
        }
    };

    const departmentLabel = useMemo(() => {
        if (!member) return '-';
        return typeof member.department === 'string' ? member.department : member.department?.name || '-';
    }, [member]);

    const siteLabel = useMemo(() => {
        if (!member) return '-';
        return typeof member.site === 'string' ? member.site : member.site?.name || '-';
    }, [member]);

    const isEmailLocked = Boolean(member?.email);

    useEffect(() => {
        if (checkedElectionGateRef.current) return;
        checkedElectionGateRef.current = true;

        const enforceElectionGate = async () => {
            const hasOtpSession = Boolean(voterSession.getToken());
            const sessionMember = voterSession.getMember<any>();
            const hasVotedSession = Boolean(
                sessionMember?.has_voted || voterSession.getLastVote<any>()?.member_nik,
            );

            if (hasOtpSession || hasVotedSession) {
                return;
            }

            try {
                const res = await votingApi.electionStatus();
                const data = res?.data?.data || res?.data || {};
                const rawStatus = String(data.status || data.election_status || 'coming_soon').toLowerCase();
                const isOpen = rawStatus === 'open' || rawStatus === 'vote_progress';

                if (!isOpen) {
                    notify.info('Voting Belum Dibuka', 'Akses OTP hanya tersedia saat status OPEN / VOTE PROGRESS.');
                    navigate('/', { replace: true });
                }
            } catch {
                // Keep page accessible when status API is temporarily unavailable.
            }
        };

        enforceElectionGate();
    }, [navigate]);

    useEffect(() => {
        const loadSites = async () => {
            setLoadingSites(true);
            try {
                const res = await votingApi.sites();
                if (res.data.success) {
                    setSites(res.data.data || []);
                }
            } catch (error) {
                console.error('Failed to load site options:', error);
                notify.error('Gagal Memuat Site', 'Data site tidak bisa dimuat dari server.');
            } finally {
                setLoadingSites(false);
            }
        };

        loadSites();
    }, []);

    useEffect(() => {
        if (checkedInitialSessionRef.current) return;
        checkedInitialSessionRef.current = true;

        const { token, member: sessionMember, site, otpDraft } = initialSessionRef.current;

        // Resume vote page only from an existing full session on first page load.
        // Do not re-run this after request OTP flow to avoid skipping OTP input step.
        if (token && sessionMember && site && !otpDraft) {
            navigate('/vote', { replace: true, state: { member: sessionMember, votingToken: token, selectedSite: site } });
        }
    }, [navigate]);

    useEffect(() => {
        const { otpDraft, member: sessionMember } = initialSessionRef.current;
        if (!otpDraft || !sessionMember) return;

        if (otpDraft.expiresAt <= Date.now()) {
            voterSession.clearOtpDraft();
            return;
        }

        setMember(sessionMember);
        setNik(sessionMember.nik);
        setEmail(otpDraft.email || sessionMember.email || '');
        setMaskedEmail(otpDraft.maskedEmail || sessionMember.email_masked || '');
        setSelectedSiteId(otpDraft.selectedSiteId);
        setOtpId(otpDraft.otpId);
        setExpiryTimestamp(otpDraft.expiresAt);
        setOtpExpiry(Math.max(0, Math.floor((otpDraft.expiresAt - Date.now()) / 1000)));
        setStep('otp');
    }, []);

    useEffect(() => {
        if (expiryTimestamp <= 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiryTimestamp - now) / 1000));
            setOtpExpiry(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                setStep('details');
                setOtp('');
                voterSession.clearOtpDraft();
                notify.warning('OTP Expired', 'Silakan kirim OTP baru.');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryTimestamp]);

    const handleLookup = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!nik.trim()) {
            notify.warning('NIK Wajib', 'Masukkan NIK terlebih dahulu.');
            return;
        }

        setLoadingMember(true);
        try {
            const res = await votingApi.memberLookup(nik.trim());
            if (res.data.success) {
                const memberData = res.data.data as LookupMember;
                setMember(memberData);
                setMaskedEmail(memberData.email_masked || '');
                setEmail(memberData.email || '');

                const matchedSite = sites.find((site) => {
                    const siteName = typeof memberData.site === 'string' ? memberData.site : memberData.site?.name;
                    return site.name.toLowerCase() === String(siteName || '').toLowerCase();
                });
                setSelectedSiteId(matchedSite?.id ?? sites[0]?.id ?? null);
                setStep('details');
                voterSession.setMember(memberData);
                if (memberData.existing_vote) {
                    voterSession.setLastVote(memberData.existing_vote);
                }
                if (memberData.has_voted) {
                    notify.info('NIK Ditemukan', `Halo ${memberData.name}. Anda sudah vote, lanjut OTP untuk login.`);
                } else {
                    notify.success('NIK Ditemukan', `Halo ${memberData.name}!`);
                }
            }
        } catch (error: unknown) {
            const err = error as any;
            const errorData = err.response?.data;
            if (err.response?.status === 404) {
                notify.error('NIK Tidak Ditemukan', 'NIK tidak terdaftar di sistem.');
            } else if (err.response?.status === 403) {
                notify.error('Tidak Eligible', 'Anda tidak eligible untuk memilih.');
            } else if (err.response?.status === 409) {
                if (errorData?.error === 'ALREADY_VOTED') {
                    handleAlreadyVoted(errorData);
                } else {
                    notify.warning('Konflik Data', errorData?.message || 'Data tidak bisa diproses.');
                }
            } else {
                notify.error('Lookup Gagal', errorData?.message || 'Gagal memuat data anggota.');
            }
            console.error('Member lookup error:', error);
        } finally {
            setLoadingMember(false);
        }
    };

    const handleRequestOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!member) {
            notify.warning('NIK Belum Valid', 'Lakukan pencarian NIK terlebih dahulu.');
            return;
        }

        if (!email.includes('@')) {
            notify.warning('Email Tidak Valid', 'Masukkan alamat email yang valid.');
            return;
        }

        if (!selectedSiteId) {
            notify.warning('Site Belum Dipilih', 'Pilih site terlebih dahulu.');
            return;
        }

        setLoadingOtp(true);
        try {
            const emailToSend = isEmailLocked
                ? String(member.email || '').trim().toLowerCase()
                : email.trim().toLowerCase();

            const res = await votingApi.requestOtp({
                member_nik: member.nik,
                email: emailToSend,
                site_id: selectedSiteId,
            });

            if (res.data.success) {
                const otpData = res.data.data;
                setOtpId(otpData.otp_id);
                setMaskedEmail(otpData.masked_email || maskedEmail);
                const expiresIn = otpData.expires_in || 900;
                const expiresAt = Date.now() + expiresIn * 1000;
                setExpiryTimestamp(expiresAt);
                setOtpExpiry(expiresIn);
                setStep('otp');
                voterSession.setMember(member);
                voterSession.setSite(sites.find((site) => site.id === selectedSiteId) || null);
                voterSession.setOtpDraft({
                    otpId: otpData.otp_id,
                    memberNik: member.nik,
                    email: emailToSend,
                    maskedEmail: otpData.masked_email || maskedEmail,
                    selectedSiteId,
                    expiresAt,
                });
                notify.success('OTP Terkirim', res.data.message || 'OTP berhasil dikirim ke email Anda.');
            }
        } catch (error: unknown) {
            const err = error as any;
            const errorData = err.response?.data;

            if (err.response?.status === 409 && errorData?.error === 'EMAIL_MISMATCH') {
                notify.warning('Email Tidak Cocok', errorData?.message || 'Email tidak sesuai dengan data registrasi. Jika ini kesalahan, hubungi admin.');
            } else if (err.response?.status === 409 && errorData?.error === 'EMAIL_ALREADY_REGISTERED') {
                notify.warning('Email Sudah Terdaftar', errorData?.message || 'Email ini sudah digunakan anggota lain. Hubungi admin jika ini kesalahan.');
            } else {
                notify.error('Gagal Kirim OTP', errorData?.message || 'Terjadi kesalahan saat mengirim OTP.');
            }
            console.error('OTP Request Error:', error);
        } finally {
            setLoadingOtp(false);
        }
    };

    const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!otpId) {
            notify.warning('OTP Belum Dibuat', 'Silakan kirim OTP terlebih dahulu.');
            return;
        }

        const sanitizedOtp = otp.replace(/\D/g, '');

        if (!/^\d{6}$/.test(sanitizedOtp)) {
            notify.warning('OTP Belum Lengkap', 'Masukkan 6 digit kode OTP.');
            return;
        }

        if (otpExpiry <= 0) {
            notify.warning('OTP Expired', 'Kode OTP sudah tidak berlaku. Silakan kirim ulang OTP.');
            setStep('details');
            setOtp('');
            voterSession.clearOtpDraft();
            return;
        }

        setLoadingOtp(true);
        try {
            const res = await votingApi.verifyOtp(otpId, sanitizedOtp);
            if (res.data.success) {
                const votingData = res.data.data;
                voterSession.setToken(votingData.voting_token, email);
                voterSession.setMember(member);
                const site = sites.find((item) => item.id === selectedSiteId) || null;
                voterSession.setSite(site);
                voterSession.clearOtpDraft();

                notify.success('OTP Terverifikasi', res.data.message || 'Verifikasi OTP berhasil.');

                const memberStatus = votingData?.member_status;
                if (memberStatus?.has_voted) {
                    const existingVote = memberStatus?.existing_vote || voterSession.getLastVote<any>();
                    if (existingVote) {
                        voterSession.setLastVote(existingVote);
                    }
                    navigate('/vote-success', {
                        state: {
                            vote: existingVote,
                            member,
                            selectedSite: site,
                        },
                    });
                    return;
                }

                navigate('/vote', {
                    state: {
                        member,
                        votingToken: votingData.voting_token,
                        selectedSite: site,
                    },
                });
            }
        } catch (error: unknown) {
            const err = error as any;
            const errorData = err.response?.data;
            if (err.response?.status === 429) {
                notify.warning('Terlalu Banyak Percobaan', 'Silakan coba lagi beberapa saat lagi.');
            } else if (err.response?.status === 401 && errorData?.error === 'INVALID_OTP') {
                notify.error('OTP Salah', errorData?.message || 'Kode OTP yang Anda masukkan salah.');
                setOtp('');
                return;
            } else if (err.response?.status === 410) {
                notify.error('OTP Tidak Valid', errorData?.message || 'OTP sudah expired atau sudah digunakan.');
                setStep('details');
                setOtp('');
                voterSession.clearOtpDraft();
            } else {
                notify.error('Verifikasi Gagal', errorData?.message || 'Verifikasi OTP gagal.');
            }
            console.error('OTP Verify Error:', error);
        } finally {
            setLoadingOtp(false);
        }
    };

    const handleReset = () => {
        setStep('nik');
        setNik('');
        setMember(null);
        setEmail('');
        setMaskedEmail('');
        setSelectedSiteId(null);
        setOtpId(null);
        setOtp('');
        setExpiryTimestamp(0);
        setOtpExpiry(0);
        voterSession.clearOtpDraft();
        voterSession.clearMember();
        voterSession.clearSite();
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="voting-container">
            <header className="voting-header">
                <h1>🗳️ KKM VOTING 2026</h1>
                <h2>NIK, Site, lalu OTP</h2>
            </header>

            <main className="voting-main">
                {step === 'nik' && (
                    <form onSubmit={handleLookup} className="form-card">
                        <div className="form-step">
                            <div className="step-indicator">
                                <span className="step-number active">1</span>
                                <span className="step-label">NIK</span>
                            </div>

                            <h3>Masukkan NIK Anda</h3>
                            <p className="hint">Cari data anggota terlebih dahulu.</p>

                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Masukkan NIK (contoh: 1001000001)"
                                    value={nik}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNik(e.target.value)}
                                    maxLength={20}
                                    disabled={loadingMember}
                                    className="input-field"
                                    autoFocus
                                />
                            </div>

                            <button type="submit" disabled={loadingMember} className="btn btn-primary btn-lg">
                                {loadingMember ? 'Mencari...' : 'Cari Data'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'details' && member && (
                    <form onSubmit={handleRequestOtp} className="form-card">
                        <div className="form-step">
                            <div className="step-indicator">
                                <span className="step-number active">2</span>
                                <span className="step-label">Site & Email</span>
                            </div>

                            <h3>Data Anda Ditemukan</h3>

                            <div className="email-info">
                                <p><strong>🪪 NIK:</strong> {member.nik}</p>
                                <p><strong>👤 Nama:</strong> {member.name}</p>
                                <p><strong>🏢 Departemen:</strong> {departmentLabel}</p>
                                <p><strong>📍 Site Saat Ini:</strong> {siteLabel}</p>
                                {maskedEmail ? (
                                    <p><strong>📧 Email Terdaftar:</strong> {maskedEmail} <br />🔔 Jika ini salah, hubungi admin.</p>
                                ) : null}
                            </div>

                            <div className="form-group">
                                <label>Site Pemilih</label>
                                <select
                                    className="input-field"
                                    value={selectedSiteId ?? ''}
                                    onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : null)}
                                    disabled={loadingSites || loadingOtp}
                                >
                                    <option value="">Pilih Site</option>
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="hint">{loadingSites ? 'Memuat daftar site...' : 'Pilih site dari master site.'}</p>
                            </div>

                            <div className="form-group">
                                <label>Email OTP</label>
                                <input
                                    type="email"
                                    placeholder={maskedEmail || 'nama@example.com'}
                                    value={email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value.toLowerCase())}
                                    disabled={loadingOtp || isEmailLocked}
                                    className="input-field"
                                />
                                {isEmailLocked ? (
                                    <p className="hint">Email dikunci sesuai data anggota dan hanya OTP ke email ini yang diizinkan.</p>
                                ) : (
                                    <p className="hint">Masukkan email aktif untuk menerima OTP.</p>
                                )}
                            </div>

                            <div className="button-group">
                                <button type="submit" disabled={loadingOtp || loadingSites} className="btn btn-primary btn-lg">
                                    {loadingOtp ? 'Mengirim OTP...' : 'Kirim OTP'}
                                </button>
                                <button type="button" onClick={handleReset} className="btn btn-secondary" disabled={loadingOtp}>
                                    Ganti NIK
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {step === 'otp' && member && (
                    <form onSubmit={handleVerifyOtp} className="form-card">
                        <div className="form-step">
                            <div className="step-indicator">
                                <span className="step-number active">3</span>
                                <span className="step-label">OTP</span>
                            </div>

                            <h3>Masukkan Kode OTP</h3>

                            <div className="email-info">
                                <p><strong>Nama:</strong> {member.name}</p>
                                <p><strong>Email OTP:</strong> {maskedEmail}</p>
                                <p className="timer-text">
                                    ⏱️ Berlaku: {formatTime(otpExpiry || 0)}
                                    {(otpExpiry || 0) < 300 && <span className="timer-warning"> (Segera!)</span>}
                                </p>
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                    }}
                                    maxLength={6}
                                    required
                                    disabled={loadingOtp}
                                    autoFocus
                                    className="input-field otp-input"
                                />
                            </div>

                            <div className="button-group">
                                <button type="submit" disabled={loadingOtp || otp.length !== 6} className="btn btn-primary btn-lg">
                                    {loadingOtp ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('details');
                                        setOtp('');
                                        voterSession.clearOtpDraft();
                                    }}
                                    className="btn btn-secondary"
                                    disabled={loadingOtp}
                                >
                                    ← Ubah Data
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </main>

            <footer className="voting-footer">
                <p>❓ Kesulitan? Hubungi panitia KKM</p>
                <p className="help-contact">Email: panitia@kkm.or.id | Telepon: 08xx-xxxx-xxxx</p>
            </footer>
        </div>
    );
}
