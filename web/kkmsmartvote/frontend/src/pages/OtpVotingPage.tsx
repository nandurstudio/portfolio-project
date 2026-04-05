import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { votingApi } from '../services/api'
import type { ElectionSetting } from '../types'
import { publicApi } from '../services/api'

export default function OtpVotingPage() {
    const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [election, setElection] = useState<ElectionSetting | null>(null)
    const [otpData, setOtpData] = useState<any>(null)
    const [quotaInfo, setQuotaInfo] = useState<any>(null)

    useEffect(() => {
        publicApi.electionInfo().then(r => setElection(r.data)).catch(() => { })
    }, [])

    async function handleRequestOtp(e: React.FormEvent) {
        e.preventDefault()

        // Form validation
        if (!email || !email.trim()) {
            await Swal.fire({
                icon: 'error',
                title: 'Email Diperlukan',
                text: 'Mohon masukkan email Anda untuk melanjutkan.',
                confirmButtonColor: '#3085d6'
            })
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            await Swal.fire({
                icon: 'error',
                title: 'Email Tidak Valid',
                text: 'Mohon masukkan email yang valid.',
                confirmButtonColor: '#3085d6'
            })
            return
        }

        setLoading(true)
        try {
            const res = await votingApi.requestOtp(email)
            setOtpData(res.data)
            setQuotaInfo(res.data.quota)
            setStep('otp')

            const quotaMsg = res.data.quota
                ? `\n\n[${res.data.quota.sent_today}/${res.data.quota.limit} kuota terpakai hari ini]`
                : ''

            await Swal.fire({
                icon: 'success',
                title: 'OTP Terkirim!',
                text: `OTP telah dikirim ke ${res.data.masked_email}. Silakan cek email Anda.${quotaMsg}`,
                confirmButtonColor: '#3085d6',
                timer: 3000,
                timerProgressBar: true
            })
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.'
            const quotaFull = err.response?.status === 429 && err.response?.data?.quota_limit

            await Swal.fire({
                icon: 'error',
                title: quotaFull ? 'Kuota Penuh' : 'Gagal Mengirim OTP',
                text: errorMsg,
                confirmButtonColor: '#dc3545'
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault()

        // Form validation
        if (!otp || otp.length !== 6) {
            await Swal.fire({
                icon: 'warning',
                title: 'OTP Tidak Valid',
                text: 'OTP harus terdiri dari 6 digit.',
                confirmButtonColor: '#ffc107'
            })
            return
        }

        setLoading(true)
        try {
            const res = await votingApi.verifyOtp(email, otp)
            setStep('success')

            // Store token
            localStorage.setItem('voter_token', res.data.voter_token)
            localStorage.setItem('voter_email', email)

            await Swal.fire({
                icon: 'success',
                title: 'Verifikasi Berhasil!',
                text: 'Token voting Anda telah digenerate. Silakan lanjut untuk memberikan suara.',
                confirmButtonColor: '#28a745',
                timer: 2000,
                timerProgressBar: true
            })
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'OTP tidak valid atau sudah kadaluarsa.'

            await Swal.fire({
                icon: 'error',
                title: 'OTP Tidak Valid',
                text: errorMsg,
                confirmButtonColor: '#dc3545'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div style={{ maxWidth: '600px', margin: '60px auto', padding: '20px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                    {election?.election_name || 'Sistem Voting OTP'}
                </h1>

                {/* Quota Status Bar */}
                {quotaInfo && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Kuota Voting Hari Ini</span>
                            <span style={{ fontSize: '14px' }}>{quotaInfo.sent_today}/{quotaInfo.limit}</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${quotaInfo.percentage}%`,
                                backgroundColor: quotaInfo.percentage > 90 ? '#dc3545' : '#28a745',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            {quotaInfo.available > 0
                                ? `Sisa: ${quotaInfo.available} kuota`
                                : 'Kuota penuh, coba lagi besok'
                            }
                        </div>
                    </div>
                )}

                {step === 'email' && (
                    <form onSubmit={handleRequestOtp} style={{
                        border: '1px solid #ddd',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Langkah 1: Masukkan Email</h3>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Email Terdaftar:
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="contoh@example.com"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                }}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: loading ? '#999' : '#3085d6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            {loading ? 'Mengirim OTP...' : 'Kirim OTP'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} style={{
                        border: '1px solid #ddd',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Langkah 2: Masukkan Kode OTP</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Kode OTP telah dikirim ke: <strong>{otpData?.masked_email}</strong>
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Kode OTP (6 digit):
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '18px',
                                    textAlign: 'center',
                                    letterSpacing: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'monospace'
                                }}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: loading ? '#999' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                        </button>
                    </form>
                )}

                {step === 'success' && (
                    <div style={{
                        border: '1px solid #ddd',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        textAlign: 'center',
                        backgroundColor: '#f0f9ff'
                    }}>
                        <h3 style={{ color: '#28a745', marginBottom: '20px', fontSize: '24px' }}>
                            ✓ Verifikasi Berhasil!
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#333', lineHeight: '1.6' }}>
                            Email Anda telah diverifikasi. Silakan lanjut untuk memberikan suara.
                        </p>
                        <button
                            onClick={() => window.location.href = '/vote'}
                            style={{
                                padding: '12px 30px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                        >
                            Lanjut ke Voting →
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
