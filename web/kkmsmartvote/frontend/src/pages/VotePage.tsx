import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { votingApi } from '../services/api';
import { notify } from '../utils/notify';
import { voterSession } from '../utils/voterSession';
import '../styles/pages/voting.css';

interface Candidate {
    id: number;
    orderNo?: number;
    name: string;
    position: string;
    vision_mission: string;
    nik?: string;
    department?: { name?: string } | string;
    site?: { name?: string } | string;
    motto?: string;
    photo_url?: string;
    full_photo_url?: string;
    order_display?: number;
    displayPhoto?: string;
    displayDepartment?: string;
    displaySite?: string;
    displayNik?: string;
    displayVision?: string;
    displayMission?: string;
    displayVisionMission?: string;
    displayMotto?: string;
}

type SiteRef = {
    id?: number;
    name?: string;
    code?: string;
}

type LastVote = {
    member_nik?: string;
    candidate?: {
        id?: number;
        name?: string;
        position?: string;
    };
    voucher?: {
        code?: string;
    };
    member_name?: string;
    voted_at?: string;
};

function stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
}

function renderMissionContent(rawValue: string, listClassName: string) {
    const raw = String(rawValue || '').replace(/\r\n/g, '\n').trim();
    if (!raw) return <p>-</p>;

    const htmlListMatches = Array.from(raw.matchAll(/<li[^>]*>(.*?)<\/li>/gis));
    if (htmlListMatches.length > 0) {
        const items = htmlListMatches
            .map((match) => stripHtml(match[1] || ''))
            .filter(Boolean);

        if (items.length > 0) {
            const useOrderedList = /<ol[\s>]/i.test(raw) && !/<ul[\s>]/i.test(raw);
            if (useOrderedList) {
                return <ol className={listClassName}>{items.map((item, index) => <li key={index}>{item}</li>)}</ol>;
            }
            return <ul className={listClassName}>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
        }
    }

    const lines = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const orderedItems = lines
        .map((line) => line.match(/^\d+[.)]\s+(.+)$/)?.[1]?.trim() || null)
        .filter((line): line is string => Boolean(line));
    if (lines.length > 1 && orderedItems.length === lines.length) {
        return <ol className={listClassName}>{orderedItems.map((item, index) => <li key={index}>{item}</li>)}</ol>;
    }

    const unorderedItems = lines
        .map((line) => line.match(/^[-*•]\s+(.+)$/)?.[1]?.trim() || null)
        .filter((line): line is string => Boolean(line));
    if (lines.length > 1 && unorderedItems.length === lines.length) {
        return <ul className={listClassName}>{unorderedItems.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    }

    return <p>{raw}</p>;
}

export default function VotePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const member = location.state?.member || voterSession.getMember<any>();
    const votingToken = location.state?.votingToken || voterSession.getToken();
    const selectedSite = location.state?.selectedSite || voterSession.getSite<SiteRef>();
    const sessionEmail = location.state?.email || member?.email || voterSession.getEmail();

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [imageFallback, setImageFallback] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [lockedVote, setLockedVote] = useState<LastVote | null>(null);
    const [redirectCountdown, setRedirectCountdown] = useState<number>(8);

    /**
     * Load candidates on mount
     */
    useEffect(() => {
        if (!member || !votingToken) {
            setLoading(false);
            return;
        }
        // Always start with no preselected candidate on page load.
        setSelectedCandidate(null);
        voterSession.clearSelectedCandidate();
        voterSession.setMember(member);
        if (selectedSite) voterSession.setSite(selectedSite);

        const persistedVote = voterSession.getLastVote<LastVote>();
        if (persistedVote && persistedVote.member_nik === member.nik) {
            setLockedVote(persistedVote);
        }

        fetchCandidates();
    }, [member, votingToken, selectedSite]);

    useEffect(() => {
        if (selectedCandidate) {
            voterSession.setSelectedCandidate(selectedCandidate);
        }
    }, [selectedCandidate]);

    useEffect(() => {
        if (member && votingToken) return;

        const timer = setInterval(() => {
            setRedirectCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [member, votingToken]);

    useEffect(() => {
        if (!member && !votingToken && redirectCountdown === 0) {
            navigate('/otp');
        }
    }, [member, votingToken, redirectCountdown, navigate]);

    if (!member || !votingToken) {
        return (
            <div className="voting-container">
                <main className="voting-main">
                    <section className="access-denied-card" role="alert" aria-live="polite">
                        <div className="access-denied-icon">⚠️</div>
                        <h2>Akses Ditolak</h2>
                        <p>Silakan verifikasi data Anda terlebih dahulu sebelum masuk ke halaman voting.</p>
                        <p className="access-denied-meta">Anda akan diarahkan ke halaman OTP dalam {redirectCountdown} detik.</p>

                        <div className="access-denied-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/otp')}>← Kembali ke OTP</button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    const fetchCandidates = async () => {
        try {
            const res = await votingApi.candidatesWithDetails();
            if (res.data.success) {
                const payload = Array.isArray(res.data.data) ? res.data.data : [];

                const normalized = payload.map((candidate: Candidate) => {
                    const rawOrderNo = Number(candidate.order_display);
                    const orderNo = Number.isFinite(rawOrderNo) && rawOrderNo > 0
                        ? rawOrderNo
                        : candidate.id;

                    const departmentName =
                        (candidate as any).department_name ||
                        (typeof candidate.department === 'string'
                            ? candidate.department
                            : candidate.department?.name);

                    const siteName =
                        (candidate as any).site_name ||
                        (typeof candidate.site === 'string'
                            ? candidate.site
                            : candidate.site?.name);

                    const displayVisionMission =
                        candidate.vision_mission ||
                        [((candidate as any).vision || '').trim(), ((candidate as any).mission || '').trim()]
                            .filter(Boolean)
                            .join('\n');

                    const displayVision = String((candidate as any).vision || '').trim();
                    const displayMission = String((candidate as any).mission || '').trim();

                    return {
                        ...candidate,
                        orderNo,
                        displayPhoto: candidate.full_photo_url || candidate.photo_url || '',
                        displayDepartment: departmentName || '-',
                        displaySite: siteName || '-',
                        displayNik: candidate.nik || '-',
                        displayVision,
                        displayMission,
                        displayVisionMission,
                        displayMotto: candidate.motto || '-',
                    };
                });

                setCandidates(normalized);
            }
        } catch (error) {
            console.error('Failed to load candidates:', error);
            setCandidates([]);
            notify.error('Data Kandidat', 'Gagal memuat kandidat dari database.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Sign out?',
            html: 'Jika lanjut, token login voting akan dihapus. Anda harus login OTP lagi untuk kembali memilih.',
            showCancelButton: true,
            confirmButtonText: 'Ya, Sign out',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#c0392b',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        voterSession.clearAll();
        navigate('/otp');
    };

    const handleViewVoucher = () => {
        if (!lockedVote?.voucher?.code) {
            notify.info('Voucher Dipulihkan', 'Kode voucher belum terisi di session lama. Sistem akan coba memulihkan dari server.');
        }

        navigate('/vote-success', {
            state: {
                vote: lockedVote,
                member,
                selectedSite: selectedSite || member.site || null,
            },
        });
    };

    /**
     * Submit vote (final step - triple check)
     */
    const handleSubmitVote = async (candidateToSubmit?: Candidate) => {
        const candidate = candidateToSubmit || selectedCandidate;
        if (!candidate) {
            notify.warning('Kandidat Belum Dipilih', 'Pilih kandidat terlebih dahulu.');
            return;
        }

        setSubmitting(true);

        try {
            const res = await votingApi.submitVote(
                member.nik,
                candidate.id,
                selectedSite?.id || member.site?.id
            );

            if (res.data.success) {
                const voteData = res.data.data;

                // Save vote record
                localStorage.setItem('vote_id', voteData.vote_id);
                localStorage.setItem('voucher_code', voteData.voucher.code);
                voterSession.setLastVote(voteData);
                voterSession.clearSelectedCandidate();

                notify.success('Vote Berhasil', 'Suara Anda berhasil disimpan!');

                const updatedMember = {
                    ...member,
                    has_voted: true,
                };
                voterSession.setMember(updatedMember);
                setLockedVote(voteData);

                const claimToken = voteData?.voucher?.claim_token;

                // Show voucher page if claim token exists, otherwise fallback to legacy success page.
                navigate(claimToken ? `/v/${claimToken}` : '/vote-success', {
                    state: {
                        vote: voteData,
                        member: updatedMember,
                        selectedSite: selectedSite || member.site || null,
                    }
                });
            }
        } catch (error: unknown) {
            const err = error as any;
            const errorData = err.response?.data;

            if (err.response?.status === 409) {
                notify.warning('Sudah Pernah Memilih', 'Anda sudah pernah memilih.');
            } else if (err.response?.status === 403) {
                notify.error('Tidak Eligible', 'Anda tidak eligible untuk memilih.');
            } else {
                notify.error('Vote Gagal', errorData?.message || 'Gagal menyimpan suara.');
            }
            console.error('Vote submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCandidatePick = async (candidate: Candidate) => {
        if (submitting) return;

        if (lockedVote) {
            await Swal.fire({
                icon: 'info',
                title: 'Vote Sudah Terkunci',
                html: `Anda sudah memilih <strong>${lockedVote.candidate?.name || '-'}</strong>. Pilihan tidak dapat diubah.`,
                confirmButtonText: 'Mengerti',
                confirmButtonColor: '#1d709f',
            });
            return;
        }

        setSelectedCandidate(candidate);

        const result = await Swal.fire({
            icon: 'question',
            title: 'Konfirmasi Pilihan',
            html: `Anda memilih <strong>No. ${candidate.orderNo ?? candidate.id} - ${candidate.name}</strong><br/>Pilihan tidak dapat diubah setelah dikonfirmasi.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan Pilihan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#1d709f',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            await handleSubmitVote(candidate);
        }
    };

    if (loading) {
        return (
            <div className="voting-container">
                <div className="loading-card">
                    <h2>⏳ Memuat Kandidat...</h2>
                </div>
            </div>
        );
    }

    const memberDepartmentName = typeof member.department === 'string' ? member.department : member.department?.name;
    const memberSiteName = selectedSite?.name || (typeof member.site === 'string' ? member.site : member.site?.name);

    return (
        <div className="voting-container">
            <header className="voting-header">
                <h1>🗳️ KKM VOTING 2026</h1>
                <h2>Pilih Calon Ketua Koperasi</h2>
            </header>

            <main className="voting-main vote-main">
                {/* Member Info Banner */}
                <div className="member-banner">
                    <p>👤 {member.name} | 📍 {memberDepartmentName || '-'} | 🏢 {memberSiteName || '-'} | 📧 {sessionEmail || '-'}</p>
                    <div className="member-banner-actions">
                        <button
                            type="button"
                            className="btn btn-danger-inline"
                            onClick={handleSignOut}
                            disabled={submitting}
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                {lockedVote ? (
                    <div className="vote-locked-banner" role="status" aria-live="polite">
                        <p className="vote-locked-message">
                            🔒 Vote Anda sudah terkunci di kandidat <strong>{lockedVote.candidate?.name || '-'}</strong>
                            {lockedVote.voted_at ? ` (${new Date(lockedVote.voted_at).toLocaleString('id-ID')})` : ''}
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary vote-locked-voucher-btn"
                            onClick={handleViewVoucher}
                        >
                            Lihat Kode Voucher
                        </button>
                    </div>
                ) : null}

                <div className="vote-layout">
                    <section className="vote-candidates-panel">
                        <h3 className="vote-section-title">Pilih Kandidat</h3>
                        <p className="vote-section-subtitle">Klik salah satu kartu kandidat untuk melanjutkan konfirmasi.</p>

                        <div className="candidates-grid">
                            {candidates.map((candidate) => {
                                const hasImage = Boolean(candidate.displayPhoto || candidate.full_photo_url || candidate.photo_url) && !imageFallback[candidate.id];
                                return (
                                    <article
                                        key={candidate.id}
                                        className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''} ${lockedVote ? 'locked' : ''}`}
                                        onClick={() => handleCandidatePick(candidate)}
                                    >
                                        {hasImage ? (
                                            <img
                                                src={candidate.displayPhoto || candidate.full_photo_url || candidate.photo_url}
                                                alt={candidate.name}
                                                className="candidate-photo"
                                                onError={() => {
                                                    setImageFallback((prev) => ({ ...prev, [candidate.id]: true }));
                                                }}
                                            />
                                        ) : (
                                            <div className="candidate-photo-placeholder candidate-photo-placeholder--text">Foto kandidat belum tersedia</div>
                                        )}

                                        <div className="candidate-number">No. {candidate.orderNo ?? candidate.id}</div>

                                        <div className="candidate-info">
                                            <h3 className="candidate-name">{candidate.name}</h3>
                                            <p className="candidate-position">{candidate.position}</p>

                                            <div className="landing-hero-candidate-meta candidate-meta-inline">
                                                <p><strong>NIK:</strong> {candidate.displayNik || '-'}</p>
                                                <p><strong>Department:</strong> {candidate.displayDepartment || '-'}</p>
                                                <p><strong>Site:</strong> {candidate.displaySite || '-'}</p>
                                            </div>

                                            {candidate.displayVision ? (
                                                <p><strong>Visi:</strong> {candidate.displayVision}</p>
                                            ) : null}

                                            {candidate.displayMission ? (
                                                <div className="candidate-vision">
                                                    <p><strong>Misi:</strong></p>
                                                    {renderMissionContent(candidate.displayMission, 'candidate-mission-list')}
                                                </div>
                                            ) : null}

                                            {!candidate.displayMission && (candidate.displayVisionMission || candidate.vision_mission) && (
                                                <div className="candidate-vision">
                                                    <p>{candidate.displayVisionMission || candidate.vision_mission}</p>
                                                </div>
                                            )}

                                            {candidate.displayMotto ? (
                                                <p className="candidate-motto"><strong>Motto:</strong> {candidate.displayMotto}</p>
                                            ) : null}

                                            {(selectedCandidate?.id === candidate.id || lockedVote?.candidate?.id === candidate.id) && (
                                                <div className="selection-badge">TERPILIH {lockedVote ? '(TERKUNCI)' : ''}</div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {candidates.length === 0 ? (
                            <div className="no-selection">
                                <p>Belum ada kandidat aktif dari database.</p>
                            </div>
                        ) : null}
                    </section>

                </div>

                {!selectedCandidate && (
                    <div className="no-selection">
                        <p>Klik kandidat untuk membuka popup konfirmasi.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
