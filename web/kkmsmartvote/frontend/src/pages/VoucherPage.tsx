import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { notify } from '../utils/notify'
import { voterSession } from '../utils/voterSession'
import '../styles/pages/voting.css'

type VoucherPayload = {
    id?: number
    code?: string
    claim_token?: string | null
    claim_url?: string | null
    claim_visits?: number
    claimed_at?: string | null
    redeemed_at?: string | null
    status?: string | null
    member_nik?: string | null
    member_name?: string | null
    member_email?: string | null
    candidate_name?: string | null
}

export default function VoucherPage() {
    const navigate = useNavigate()
    const { token } = useParams<{ token: string }>()
    const [loading, setLoading] = useState(true)
    const [voucher, setVoucher] = useState<VoucherPayload | null>(null)
    const [error, setError] = useState('')

    const vote = voterSession.getLastVote<any>()
    const hasVote = Boolean(vote?.vote_id || voucher?.member_nik || voucher?.candidate_name)

    useEffect(() => {
        if (!token) {
            setError('Token voucher tidak ditemukan.')
            setLoading(false)
            return
        }

        const loadVoucher = async () => {
            setLoading(true)
            try {
                const res = await api.get(`/v/${token}`, {
                    headers: { 'x-skip-global-swal': '1' },
                })
                const data = res?.data?.data || res?.data || null
                setVoucher(data)
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Voucher tidak ditemukan atau token tidak valid.')
            } finally {
                setLoading(false)
            }
        }

        void loadVoucher()
    }, [token])

    const claimLabel = useMemo(() => {
        if (!voucher?.claim_url) return 'Claim Voucher'
        return voucher.claim_url.startsWith('http') ? 'Buka Link Claim' : 'Claim Voucher'
    }, [voucher?.claim_url])

    const handleClaim = () => {
        if (!voucher?.claim_url) {
            notify.warning('Link Claim Tidak Ada', 'Voucher ini belum punya URL claim.')
            return
        }

        if (!hasVote) {
            notify.warning('Tidak Bisa Klaim', 'Hanya yang sudah vote yang bisa mengklaim voucher.')
            return
        }

        const targetUrl = new URL(voucher.claim_url, window.location.origin)
        const currentUrl = new URL(window.location.href)

        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
            window.location.reload()
            return
        }

        if (voucher.claim_url.startsWith('http')) {
            window.location.href = voucher.claim_url
            return
        }

        navigate(voucher.claim_url)
    }

    if (loading) {
        return (
            <div className="voting-container success-page">
                <main className="voting-main success-main">
                    <div className="success-card">
                        <h2>⏳ Memuat voucher...</h2>
                    </div>
                </main>
            </div>
        )
    }

    if (error || !voucher) {
        return (
            <div className="voting-container success-page">
                <main className="voting-main success-main">
                    <div className="success-card">
                        <h2>⚠️ Voucher tidak tersedia</h2>
                        <p>{error || 'Data voucher tidak ditemukan.'}</p>
                        <button className="winners-action-button" onClick={() => navigate('/otp')}>Kembali ke OTP</button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="voting-container success-page">
            <main className="voting-main success-main">
                <div className="success-card">
                    <h2>🎟️ Voucher Pemilih</h2>
                    <p><strong>Kode:</strong> {voucher.code}</p>
                    <p><strong>Nama:</strong> {voucher.member_name || '-'}</p>
                    <p><strong>NIK:</strong> {voucher.member_nik || '-'}</p>
                    <p><strong>Claim visits:</strong> {voucher.claim_visits ?? 0}</p>
                    <p><strong>Status:</strong> {voucher.redeemed_at ? 'REDEEMED' : 'CLAIMED'}</p>

                    {hasVote ? (
                        <button className="winners-action-button" onClick={handleClaim}>
                            {claimLabel}
                        </button>
                    ) : (
                        <p>Voucher ini hanya bisa diklaim oleh pemilih yang sudah vote.</p>
                    )}
                </div>
            </main>
        </div>
    )
}
