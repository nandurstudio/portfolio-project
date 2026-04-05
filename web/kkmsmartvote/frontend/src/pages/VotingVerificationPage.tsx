import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import '../styles/pages/voting.css';

export default function VotingVerificationPage() {
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState<boolean>(false);
    const [maskedEmail, setMaskedEmail] = useState<string>('');
    const [otpExpiry, setOtpExpiry] = useState<number>(0);
    const [expiryTimestamp, setExpiryTimestamp] = useState<number>(0); // Server timestamp
    const navigate = useNavigate();

    /**
     * Step 1: Request OTP
     */
    const handleRequestOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate email
        if (!email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/voting/request-otp', { email });

            setMaskedEmail(res.data.masked_email);

            // Use expires_in from response (default to 900 = 15 minutes if missing)
            const expiresIn = res.data.expires_in || 900;
            const timestamp = Date.now() + (expiresIn * 1000); // Convert to milliseconds
            setExpiryTimestamp(timestamp);
            setOtpExpiry(expiresIn);
            setStep('otp');

            toast.success('OTP sent to your email!');

            // Start countdown timer - update every second
            const timer = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((timestamp - now) / 1000));

                setOtpExpiry(remaining);

                if (remaining <= 0) {
                    clearInterval(timer);
                    setStep('email');
                    toast.error('OTP expired. Please request a new one.');
                }
            }, 1000);

        } catch (error: unknown) {
            const err = error as any;
            toast.error(err.response?.data?.error || 'Failed to send OTP');
            console.error('OTP Request Error:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Step 2: Verify OTP
     */
    const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('Please enter 6-digit OTP');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/voting/verify-otp', {
                email,
                otp
            });

            // Save voting token
            localStorage.setItem('voting_token', res.data.voting_token);
            localStorage.setItem('voter_email', email);

            // Get member name (may be null if not registered)
            const memberName = res.data.member?.name || email;

            // Redirect to voting page
            toast.success(`Welcome ${memberName}!`);
            navigate('/vote', {
                state: { member: res.data.member, email: email }
            });

        } catch (error: unknown) {
            const err = error as any;
            const errorMsg = err.response?.data?.error;

            if (err.response?.status === 429) {
                toast.error('Too many attempts. Please try again later.');
            } else if (errorMsg?.includes('attempts_left')) {
                toast.error(`${errorMsg} - Attempts left: ${err.response.data.attempts_left}`);
            } else {
                toast.error(errorMsg || 'OTP verification failed');
            }
            console.error('OTP Verify Error:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Format countdown timer
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="voting-container">
            <header className="voting-header">
                <h1>🗳️ KKM VOTING 2026</h1>
                <h2>Calon Ketua Koperasi Karya Mandiri</h2>
            </header>

            <main className="voting-main">
                {step === 'email' ? (
                    // Step 1: Email Input
                    <form onSubmit={handleRequestOtp} className="form-card">
                        <div className="form-step">
                            <div className="step-indicator">
                                <span className="step-number active">1</span>
                                <span className="step-label">Email</span>
                            </div>

                            <h3>Masukkan Email Anda</h3>

                            <div className="form-group">
                                <input
                                    type="email"
                                    placeholder="nama@example.com"
                                    value={email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value.toLowerCase())}
                                    required
                                    disabled={loading}
                                    autoFocus
                                    className="input-field"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary btn-lg"
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                            </button>

                            <div className="help-text">
                                <p>💡 Masukkan email Anda untuk menerima kode OTP</p>
                                <p>✅ Cek folder email Anda (termasuk spam)</p>
                            </div>
                        </div>
                    </form>

                ) : (
                    // Step 2: OTP Verification
                    <form onSubmit={handleVerifyOtp} className="form-card">
                        <div className="form-step">
                            <div className="step-indicator">
                                <span className="step-number active">2</span>
                                <span className="step-label">Verifikasi</span>
                            </div>

                            <h3>Masukkan Kode OTP</h3>

                            <div className="email-info">
                                <p>Kode OTP dikirim ke:<br /><strong>{maskedEmail}</strong></p>
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
                                    disabled={loading}
                                    autoFocus
                                    className="input-field otp-input"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="btn btn-primary btn-lg"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('');
                                    setOtp('');
                                    setStep('email');
                                }}
                                className="btn btn-secondary"
                            >
                                ← Kembali (Ubah Email)
                            </button>

                            <div className="help-text">
                                <p>❓ Tidak menerima OTP?</p>
                                <ul>
                                    <li>Cek folder Spam atau Promotions</li>
                                    <li>Tunggu 1-2 detik pengiriman email</li>
                                    <li>Klik "Kembali" untuk kirim ulang</li>
                                </ul>
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
