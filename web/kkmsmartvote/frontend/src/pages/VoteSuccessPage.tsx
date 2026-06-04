import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { electionApi, votingApi } from '../services/api';
import { notify } from '../utils/notify';
import { voterSession } from '../utils/voterSession';
import '../styles/pages/voting.css';

type VoteStatus = 'available' | 'redeemed';

type VoucherState = {
    code: string;
    status?: string | null;
    gopay_number?: string | null;
    gopay_owner_name?: string | null;
    gopay_is_owner_self?: boolean | null;
    gopay_submitted_at?: string | null;
    url_redeem?: string | null;
    claim_url?: string | null;
};

type VoteData = {
    member_nik?: string;
    member_name?: string;
    voted_at?: string;
    voucher?: VoucherState;
};

function resolveSiteName(source: any): string {
    if (!source) return '';
    if (typeof source === 'string') return source.trim();
    if (typeof source?.name === 'string') return source.name.trim();
    return '';
}

function normalizeVoucherStatus(rawStatus?: string | null): VoteStatus {
    const normalized = String(rawStatus || '').trim().toLowerCase();
    if (normalized === 'redeemed') return 'redeemed';
    return 'available';
}

export default function VoteSuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [rewardText, setRewardText] = useState<string>('Voucher GoPay senilai Rp25.000');
    const [currentVote, setCurrentVote] = useState<VoteData | null>(null);
    const [showGopayModal, setShowGopayModal] = useState(false);
    const [savingGopay, setSavingGopay] = useState(false);
    const [gopayNumber, setGopayNumber] = useState('');
    const [gopayOwnerSelf, setGopayOwnerSelf] = useState(true);
    const [gopayOwnerName, setGopayOwnerName] = useState('');

    const vote = location.state?.vote || voterSession.getLastVote<any>();
    const member = location.state?.member || voterSession.getMember<any>();
    const selectedSite = location.state?.selectedSite || voterSession.getSite<any>();
    const memberDepartment = typeof member?.department === 'string' ? member.department : member?.department?.name;
    const memberSite =
        resolveSiteName(selectedSite) ||
        resolveSiteName(member?.site) ||
        resolveSiteName(voterSession.getSite<any>());
    const memberEmail = member?.email || voterSession.getEmail() || '-';
    const voucherStatus = normalizeVoucherStatus(currentVote?.voucher?.status || vote?.voucher?.status);
    const isVoucherLocked = voucherStatus === 'redeemed';
    const voucherCode = currentVote?.voucher?.code || vote?.voucher?.code || '';

    useEffect(() => {
        if (!vote || !member) return;

        setCurrentVote(vote as VoteData);

        const source = (vote?.voucher || {}) as VoucherState;
        const hasSavedGopay = Boolean(source.gopay_number);

        console.log('📋 VoteSuccessPage Data:', {
            vote_id: vote.member_nik,
            voucher: source,
            voucherCode: source.code,
            memberNik: member.nik,
        });

        setGopayNumber(String(source.gopay_number || member?.gopay_number || ''));
        const ownerSelf = typeof source.gopay_is_owner_self === 'boolean' ? source.gopay_is_owner_self : true;
        setGopayOwnerSelf(ownerSelf);
        setGopayOwnerName(String(source.gopay_owner_name || (ownerSelf ? member?.name || '' : '')));

        if (!hasSavedGopay && !isVoucherLocked) {
            setShowGopayModal(true);
        }
    }, [vote, member, isVoucherLocked]);

    useEffect(() => {
        const loadReward = async () => {
            try {
                const res = await electionApi.current();
                const data = res?.data?.data || res?.data || {};
                const rewardLabel = data.reward_text || data.gift_text || data.prize_text;
                if (typeof rewardLabel === 'string' && rewardLabel.trim()) {
                    setRewardText(rewardLabel.trim());
                }
            } catch {
                // Keep default reward text if election info is unavailable.
            }
        };

        loadReward();
    }, []);

    if (!vote || !member) {
        return (
            <div className="voting-container">
                <div className="error-card">
                    <h2>⚠️ Data tidak lengkap</h2>
                    <button onClick={() => navigate('/')}>← Kembali</button>
                </div>
            </div>
        );
    }

    /**
     * Copy voucher code to clipboard
     */
    const copyToClipboard = () => {
        navigator.clipboard.writeText(voucherCode);
        notify.success('Berhasil', 'Kode voucher disalin!');
    };

    const handleRedeemClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isVoucherLocked) return;
        
        try {
            const res = await votingApi.redeemVoucher({ code: voucherCode, member_nik: member.nik });
            if (res.data.success) {
                const updated = {
                    ...(currentVote || vote),
                    voucher: {
                        ...(currentVote?.voucher || vote.voucher),
                        status: 'redeemed'
                    }
                } as VoteData;
                setCurrentVote(updated);
                voterSession.setLastVote(updated);
                notify.success('Voucher Diklaim', 'Status voucher otomatis diubah menjadi redeemed.');
            }
        } catch (error) {
            console.error('Redeem error:', error);
        }
    };

    /**
     * Download voucher as image/PDF (optional)
     */
    const downloadVoucher = () => {
        const element = document.getElementById('voucher-card');
        if (!element) {
            notify.error('Voucher Tidak Ditemukan', 'Kartu voucher tidak bisa ditemukan.');
            return;
        }

        html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
        }).then((canvas) => {
            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `voucher-${member.nik}-${voucherCode}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            notify.success('Voucher Diunduh', 'File voucher PNG berhasil diunduh.');
        }).catch((error) => {
            console.error('Voucher download error:', error);
            notify.error('Gagal Unduh', 'Voucher tidak bisa diunduh sebagai PNG.');
        });
    };

    const handleLogoutSession = () => {
        voterSession.clearAll();
        notify.info('Session Dihapus', 'Session voter sudah dihapus.');
        navigate('/otp', { replace: true });
    };

    const handleOpenGopayModal = () => {
        if (isVoucherLocked) {
            notify.warning('Voucher Terkunci', 'Voucher sudah redeemed, data GoPay tidak bisa diubah lagi.');
            return;
        }
        setShowGopayModal(true);
    };

    const handleSaveGopay = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isVoucherLocked) {
            notify.warning('Voucher Terkunci', 'Data GoPay sudah dikunci karena voucher sudah redeemed.');
            return;
        }

        const sanitizedNumber = gopayNumber.replace(/\D/g, '');
        if (sanitizedNumber.length < 10) {
            notify.warning('Nomor GoPay Tidak Valid', 'Nomor GoPay/HP harus diisi dengan benar.');
            return;
        }

        if (!gopayOwnerSelf && !gopayOwnerName.trim()) {
            notify.warning('Nama Pemilik Wajib', 'Nama pemilik GoPay wajib diisi jika bukan nama sendiri.');
            return;
        }

        setSavingGopay(true);

        const payload = {
            code: voucherCode,
            member_nik: member.nik,
            gopay_number: sanitizedNumber,
            gopay_is_owner_self: gopayOwnerSelf,
            gopay_owner_name: gopayOwnerSelf ? member.name : gopayOwnerName.trim(),
        };

        console.log('💾 Saving Gopay with payload:', payload);

        try {
            const res = await votingApi.updateVoucherGopay(payload);

            if (res.data.success) {
                const updated = {
                    ...(currentVote || vote),
                    voucher: {
                        ...(currentVote?.voucher || vote.voucher),
                        ...res.data.data,
                    },
                } as VoteData;

                setCurrentVote(updated);
                voterSession.setLastVote(updated);
                setShowGopayModal(false);
                notify.success('Data GoPay Tersimpan', 'Nomor GoPay berhasil disimpan dan bisa diubah lagi sebelum redeemed.');
            }
        } catch (error: any) {
            const errorData = error?.response?.data;
            console.error('❌ Gopay save error:', errorData || error);
            notify.error('Simpan GoPay Gagal', errorData?.message || 'Gagal menyimpan data GoPay.');
        } finally {
            setSavingGopay(false);
        }
    };

    const voucherData = (currentVote || vote) as VoteData;
    const isCodeUrl = voucherCode.startsWith('http');
    const actualRedeemUrl = voucherData.voucher?.url_redeem || voucherData.voucher?.claim_url || (isCodeUrl ? voucherCode : null);

    return (
        <div className="voting-container success-page">
            <header className="voting-header success-header">
                <h1>✅ PEMILIHAN BERHASIL</h1>
                <h2>Terima kasih Telah Memilih</h2>
            </header>

            <main className="voting-main success-main">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2>Suara Anda Telah Disimpan</h2>
                    <p className="success-lead">Terima kasih {member.name} telah berpartisipasi dalam pemilihan ini.</p>

                    <div className="info-box">
                        <h4>Data Pemilih:</h4>
                        <div className="info-grid">
                            <p><strong>👤 Nama:</strong> {member.name}</p>
                            <p><strong>🆔 NIK:</strong> {member.nik}</p>
                            <p><strong>🏢 Departemen:</strong> {memberDepartment || '-'}</p>
                            <p><strong>📍 Site:</strong> {memberSite || '-'}</p>
                            <p><strong>📧 Email:</strong> {memberEmail}</p>
                        </div>
                    </div>

                    <div id="voucher-card" className="voucher-card">
                        <div className="voucher-header">
                            <div className="voucher-header-row">
                                <h3>🎟️ VOUCHER PEMILIHAN</h3>
                                <span className={`voucher-status-badge status-${voucherStatus}`}>
                                    {voucherStatus === 'redeemed' ? 'REDEEMED' : 'AVAILABLE'}
                                </span>
                            </div>
                        </div>

                        <div className="voucher-content">
                            <p className="voucher-label">Kode Voucher / Link Redeem:</p>
                            <p className="voucher-code" style={{ wordBreak: 'break-all' }}>
                                {actualRedeemUrl ? (
                                    <a 
                                        href={actualRedeemUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        onClick={handleRedeemClick}
                                        style={{ color: '#0ea5e9', textDecoration: 'underline' }}
                                        title="Klik untuk membuka URL klaim"
                                    >
                                        {isCodeUrl ? 'Buka Link Klaim' : voucherCode}
                                    </a>
                                ) : (
                                    voucherCode
                                )}
                            </p>

                            <div className="voucher-details">
                                <div className="detail-row">
                                    <span className="detail-label">👤 Pemilih</span>
                                    <span className="detail-value">{voucherData.member_name || member.name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">⏰ Waktu</span>
                                    <span className="detail-value">{new Date(voucherData.voted_at || '').toLocaleString('id-ID')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">💳 Nominal Voucher</span>
                                    <span className="detail-value">{rewardText}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">📱 GoPay</span>
                                    <span className="detail-value">{currentVote?.voucher?.gopay_number || member.gopay_number || 'Belum diisi'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">👥 Nama Pemilik</span>
                                    <span className="detail-value">
                                        {currentVote?.voucher?.gopay_owner_name || (currentVote?.voucher?.gopay_is_owner_self ? member.name : 'Belum diisi')}
                                    </span>
                                </div>
                            </div>

                            {actualRedeemUrl ? (
                                <p className="voucher-note">
                                    📝 Silakan klik tombol/link Klaim Voucher untuk mendapatkan reward Anda
                                </p>
                            ) : (
                                <p className="voucher-note">
                                    📝 Simpan kode ini untuk verifikasi dengan panitia pemilihan
                                </p>
                            )}
                            
                            {!isVoucherLocked ? (
                                <p className="voucher-note voucher-note--highlight">
                                    {actualRedeemUrl 
                                        ? "✏️ Data GoPay masih bisa diubah sampai Anda mengklaim voucher melalui link di atas."
                                        : "✏️ Data GoPay masih bisa diubah sampai voucher diubah menjadi redeemed oleh admin."}
                                </p>
                            ) : (
                                <p className="voucher-note voucher-note--locked">
                                    🔒 Voucher sudah redeemed, data GoPay dikunci.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="voucher-actions">
                        {actualRedeemUrl ? (
                            <a
                                href={actualRedeemUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleRedeemClick}
                                className="btn btn-primary success-action-primary"
                                style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
                            >
                                🎁 Klaim Voucher Sekarang
                            </a>
                        ) : (
                            <button
                                onClick={copyToClipboard}
                                className="btn btn-primary success-action-primary"
                            >
                                📋 Salin Kode Voucher
                            </button>
                        )}

                        <div className="voucher-actions-row">
                            <button
                                onClick={downloadVoucher}
                                className="btn btn-secondary"
                            >
                                📥 Unduh Voucher
                            </button>

                            <button
                                onClick={handleOpenGopayModal}
                                className="btn btn-secondary"
                            >
                                {isVoucherLocked ? '🔒 GoPay Terkunci' : '📱 Ubah GoPay'}
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="btn btn-outline"
                            >
                                🖨️ Cetak
                            </button>
                        </div>
                    </div>

                    <div className="notes-box">
                        <h4>ℹ️ Informasi Penting:</h4>
                        <ul>
                            <li>✅ Suara Anda sudah tercatat dengan aman</li>
                            <li>📋 Simpan voucher untuk verifikasi dengan panitia</li>
                            <li>❌ Suara Anda tidak dapat diubah setelah ini</li>
                            <li>🔒 Privasi pilihan Anda terjamin</li>
                            <li>💳 Status voucher saat ini: {voucherStatus === 'redeemed' ? 'redeemed' : 'available'}</li>
                        </ul>
                    </div>

                    <div className="success-footer-actions">
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-primary success-home-btn"
                        >
                            ← Kembali ke Awal
                        </button>

                        <button
                            onClick={handleLogoutSession}
                            className="btn btn-outline success-logout-btn"
                        >
                            Logout Session
                        </button>
                    </div>
                </div>
            </main>

            {showGopayModal ? (
                <div className="gopay-modal-backdrop" role="dialog" aria-modal="true" aria-label="Form GoPay">
                    <div className="gopay-modal">
                        <div className="gopay-modal-header">
                            <h3>📱 Data GoPay Pemilih</h3>
                            <p>Isi nomor GoPay/HP untuk voucher ini. Selama belum redeemed, data bisa diubah lagi.</p>
                        </div>

                        <form className="gopay-modal-body" onSubmit={handleSaveGopay}>
                            <label className="form-group">
                                <span>Nomor GoPay / HP</span>
                                <input
                                    className="input-field"
                                    value={gopayNumber}
                                    onChange={(e) => setGopayNumber(e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    inputMode="numeric"
                                    disabled={savingGopay || isVoucherLocked}
                                    required
                                />
                            </label>

                            <label className="gopay-check-row">
                                <input
                                    type="checkbox"
                                    checked={gopayOwnerSelf}
                                    onChange={(e) => {
                                        const nextValue = e.target.checked;
                                        setGopayOwnerSelf(nextValue);
                                        if (nextValue) {
                                            setGopayOwnerName(member.name);
                                        } else if (gopayOwnerName.trim() === member.name) {
                                            setGopayOwnerName('');
                                        }
                                    }}
                                    disabled={savingGopay || isVoucherLocked}
                                />
                                <span>Nama pemilik GoPay sama dengan nama saya</span>
                            </label>

                            {!gopayOwnerSelf ? (
                                <label className="form-group">
                                    <span>Nama pemilik GoPay</span>
                                    <input
                                        className="input-field"
                                        value={gopayOwnerName}
                                        onChange={(e) => setGopayOwnerName(e.target.value)}
                                        placeholder="Nama pemilik GoPay"
                                        disabled={savingGopay || isVoucherLocked}
                                        required
                                    />
                                </label>
                            ) : null}

                            <p className="gopay-help">
                                ✨ Jika memakai GoPay keluarga, hilangkan centang lalu isi nama pemiliknya.
                            </p>

                            <div className="gopay-modal-actions">
                                <button type="submit" className="btn btn-primary" disabled={savingGopay || isVoucherLocked}>
                                    {savingGopay ? 'Menyimpan...' : 'Simpan Data GoPay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
