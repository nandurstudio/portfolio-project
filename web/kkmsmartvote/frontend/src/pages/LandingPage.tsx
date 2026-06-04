import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesApi, electionApi, votingApi } from '../services/api';
import { notify } from '../utils/notify';
import '../styles/pages/voting.css';

type ElectionState = 'coming_soon' | 'open' | 'closed';

export type LandingCandidate = {
    key: number;
    id: number;
    orderNo: number;
    name: string;
    nik: string;
    position: string;
    department: string;
    site: string;
    vision: string;
    mission: string;
    motto: string;
    photo: string;
    voteCount: number;
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

    // For plain multiline content, render each line as its own paragraph.
    if (lines.length > 1) {
        return (
            <>
                {lines.map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </>
        );
    }

    return <p>{raw}</p>;
}

export default function LandingPage() {
    const navigate = useNavigate();
    const loadedOnceRef = useRef(false);
    const [status, setStatus] = useState<ElectionState>('coming_soon');
    const [heroTitle, setHeroTitle] = useState<string>('SUARAKAN ASPIRASIMU!');
    const [heroDescription, setHeroDescription] = useState<string>('Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029. Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota. Kami menunggu partisipasi dan suara terbaik Anda semua.');
    const [ctaText, setCtaText] = useState<string>('Lanjut Verifikasi OTP');
    const [agendaTitle, setAgendaTitle] = useState<string>('');
    const [agendaDescription, setAgendaDescription] = useState<string>('');
    const [agendaLocation, setAgendaLocation] = useState<string>('');
    const [showCountdown, setShowCountdown] = useState<boolean>(true);
    const [startAt, setStartAt] = useState<string | null>(null);
    const [endAt, setEndAt] = useState<string | null>(null);
    const [announcementAt, setAnnouncementAt] = useState<string | null>(null);
    const [rewardEnabled, setRewardEnabled] = useState<boolean>(true);
    const [rewardText, setRewardText] = useState<string>('Voucher GoPay senilai Rp25.000');
    const [totalMembers, setTotalMembers] = useState<number>(0);
    const [totalVoters, setTotalVoters] = useState<number>(0);
    const [participationPct, setParticipationPct] = useState<number>(0);
    const [animatedPct, setAnimatedPct] = useState<number>(0);
    const [seoTitle, setSeoTitle] = useState<string>('');
    const [seoDescription, setSeoDescription] = useState<string>('');
    const [ogTitle, setOgTitle] = useState<string>('');
    const [ogDescription, setOgDescription] = useState<string>('');
    const [ogImageUrl, setOgImageUrl] = useState<string>('');
    const [canonicalUrl, setCanonicalUrl] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(0);
    const [dbCandidates, setDbCandidates] = useState<LandingCandidate[]>([]);
    const [imageFallback, setImageFallback] = useState<Record<number, boolean>>({});
    const [isRevealOpen, setIsRevealOpen] = useState<boolean>(false);
    const [isRevealDone, setIsRevealDone] = useState<boolean>(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'WINNERS_REVEAL_DONE') {
                setIsRevealDone(true);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (loadedOnceRef.current) return;
        loadedOnceRef.current = true;

        const loadData = async () => {
            try {
                // Use election info as single source for admin-configurable landing content.
                // Fallback to voting status endpoint if needed.
                let electionRes;
                try {
                    electionRes = await electionApi.current();
                } catch {
                    electionRes = await votingApi.electionStatus();
                }

                const electionData = electionRes?.data?.data || electionRes?.data || {};
                const rawStatus = String(electionData.status || electionData.election_status || 'coming_soon').toLowerCase();
                const isFinalized = Boolean(electionData.is_finalized);
                const isActive = Boolean(electionData.is_active);
                const hasExpired = Boolean(electionData.has_expired);
                const currentStatus = (isActive && !hasExpired)
                    ? 'open'
                    : isFinalized || rawStatus === 'closed'
                        ? 'closed'
                        : rawStatus === 'open' || rawStatus === 'vote_progress'
                            ? 'open'
                            : rawStatus === 'draft'
                                ? 'coming_soon'
                                : rawStatus;
                if (currentStatus === 'open' || currentStatus === 'closed' || currentStatus === 'coming_soon') {
                    setStatus(currentStatus);
                }

                setHeroTitle(
                    electionData.election_name ||
                    electionData.hero_title ||
                    'SUARAKAN ASPIRASIMU!'
                );
                setHeroDescription(
                    electionData.hero_description ||
                    'Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029. Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota. Kami menunggu partisipasi dan suara terbaik Anda semua.',
                );
                setCtaText(electionData.cta_text || 'Lanjut Verifikasi OTP');

                setAgendaTitle(
                    electionData.agenda_title ||
                    electionData.election_name ||
                    electionData.title ||
                    ''
                );
                setAgendaDescription(electionData.agenda_description || '');
                setAgendaLocation(electionData.agenda_location || '');

                if (typeof electionData.show_countdown === 'boolean') {
                    setShowCountdown(electionData.show_countdown);
                }
                setStartAt(electionData.start_at || electionData.started_at || null);
                setEndAt(electionData.end_at || electionData.ended_at || null);
                setAnnouncementAt(electionData.announcement_at || electionData.ended_at || null);

                // Prepared for admin settings (checkbox + reward text input)
                const rewardFlag =
                    electionData.reward_enabled ??
                    electionData.gift_enabled ??
                    electionData.prize_enabled;
                if (typeof rewardFlag === 'boolean') {
                    setRewardEnabled(rewardFlag);
                }

                const rewardLabel =
                    electionData.reward_text ||
                    electionData.gift_text ||
                    electionData.prize_text;
                if (typeof rewardLabel === 'string' && rewardLabel.trim()) {
                    setRewardText(rewardLabel.trim());
                }

                setSeoTitle(String(electionData.seo_title || '').trim());
                setSeoDescription(String(electionData.seo_description || '').trim());
                setOgTitle(String(electionData.og_title || '').trim());
                setOgDescription(String(electionData.og_description || '').trim());
                setOgImageUrl(String(electionData.og_image_url || '').trim());
                setCanonicalUrl(String(electionData.canonical_url || '').trim());

                try {
                    const statsRes = await electionApi.stats();
                    const statsData = statsRes?.data?.data || {};
                    const members = Number(statsData.total_members || 0);
                    const voters = Number(statsData.total_voters || 0);
                    const pct = Number(statsData.participation_percentage || 0);

                    setTotalMembers(Number.isFinite(members) ? members : 0);
                    setTotalVoters(Number.isFinite(voters) ? voters : 0);
                    setParticipationPct(Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0);
                } catch {
                    setTotalMembers(0);
                    setTotalVoters(0);
                    setParticipationPct(0);
                }

                // Candidate cards on landing should come from DB (admin configurable).
                try {
                    const candidatesRes = await candidatesApi.index();
                    const list = Array.isArray(candidatesRes?.data?.data) ? candidatesRes.data.data : [];

                    const mapped: LandingCandidate[] = list.map((candidate: any, index: number) => {
                        const rawId = Number(candidate.id ?? index + 1);
                        const rawOrderNo = Number(candidate.order_display);
                        const orderNo = Number.isFinite(rawOrderNo) && rawOrderNo > 0
                            ? rawOrderNo
                            : rawId;

                        return {
                            key: rawId,
                            id: rawId,
                            orderNo,
                            name: String(candidate.name || '-'),
                            nik: String(candidate.nik || '-'),
                            position: String(candidate.position || '-'),
                            department: String(
                                candidate.department_name ||
                                candidate.department?.name ||
                                '-',
                            ),
                            site: String(
                                candidate.site_name ||
                                candidate.site?.name ||
                                '-',
                            ),
                            vision: String(candidate.vision || '-'),
                            mission: String(candidate.mission || '-'),
                            motto: String(candidate.motto || '-'),
                            photo: String(candidate.full_photo_url || candidate.photo_url || ''),
                            voteCount: Number(candidate.vote_count || 0),
                        };
                    });

                    const ordered = [...mapped].sort((a, b) => {
                        if (a.orderNo !== b.orderNo) return a.orderNo - b.orderNo;
                        return a.id - b.id;
                    });

                    setDbCandidates(ordered);
                } catch {
                    setDbCandidates([]);
                    notify.error('Load Kandidat Gagal', 'Gagal mengambil kandidat dari database. Coba refresh atau cek API.');
                }
            } catch {
                // Keep fallback UI if API is not ready yet.
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const defaultTitle = 'Pemilihan Ketua Koperasi Karya Mandiri';
        const nextTitle = seoTitle || defaultTitle;
        document.title = nextTitle;

        const upsertMetaByName = (name: string, content: string) => {
            let node = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
            if (!node) {
                node = document.createElement('meta');
                node.setAttribute('name', name);
                document.head.appendChild(node);
            }
            node.setAttribute('content', content);
        };

        const upsertMetaByProperty = (property: string, content: string) => {
            let node = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
            if (!node) {
                node = document.createElement('meta');
                node.setAttribute('property', property);
                document.head.appendChild(node);
            }
            node.setAttribute('content', content);
        };

        const nextDescription = seoDescription || heroDescription || defaultTitle;
        const nextOgTitle = ogTitle || nextTitle;
        const nextOgDescription = ogDescription || nextDescription;

        upsertMetaByName('description', nextDescription);
        upsertMetaByProperty('og:title', nextOgTitle);
        upsertMetaByProperty('og:description', nextOgDescription);

        if (ogImageUrl) {
            upsertMetaByProperty('og:image', ogImageUrl);
        }

        if (canonicalUrl) {
            let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', canonicalUrl);
            upsertMetaByProperty('og:url', canonicalUrl);
        }
    }, [seoTitle, seoDescription, ogTitle, ogDescription, ogImageUrl, canonicalUrl, heroDescription]);

    useEffect(() => {
        setAnimatedPct(0);
        const timer = window.setTimeout(() => {
            setAnimatedPct(participationPct);
        }, 120);

        return () => window.clearTimeout(timer);
    }, [participationPct]);

    const targetDate = useMemo(() => {
        if (status === 'open') return endAt;
        if (status === 'closed') return endAt; // Menggunakan Tanggal Selesai (endAt) untuk masa claim voucher
        return startAt;
    }, [status, startAt, endAt, announcementAt]);

    useEffect(() => {
        if (!targetDate) {
            setCountdown(0);
            return;
        }

        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000));
            setCountdown(diff);
        };

        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const countdownParts = {
        days: Math.floor(countdown / 86400),
        hours: Math.floor((countdown % 86400) / 3600),
        minutes: Math.floor((countdown % 3600) / 60),
        seconds: countdown % 60,
    };

    const statusLabel =
        status === 'open'
            ? 'Voting Sedang Berlangsung'
            : status === 'closed'
                ? 'Masa Claim Voucher Berlangsung'
                : 'Menuju Pembukaan Voting';

    const statusBadge =
        status === 'open'
            ? 'OPEN / VOTE PROGRESS'
            : status === 'closed'
                ? 'VOUCHER CLAIM OPEN'
                : 'COMING SOON';

    const countdownLabel =
        status === 'open'
            ? 'Periode voting berakhir dalam'
            : status === 'closed'
                ? 'Batas waktu claim voucher berakhir dalam'
                : 'Voting dimulai dalam';

    const participationTone =
        participationPct < 25
            ? 'danger'
            : participationPct < 50
                ? 'warning'
                : participationPct < 75
                    ? 'success'
                    : 'primary';

    const canStartOtp = status !== 'coming_soon';
    const dynamicYear = startAt ? new Date(startAt).getFullYear() : new Date().getFullYear();
    const landingCandidates: LandingCandidate[] = dbCandidates;

    return (
        <div className="voting-container landing-page">
            <header className="voting-header landing-header">
                <h1>🗳️ KKM Smart Vote {dynamicYear}</h1>
                    <div className={`landing-status-badge status-${status}`}>{statusBadge}</div>
                <h2>{statusLabel}</h2>
            </header>

            <main className="voting-main landing-main">
                <section className="landing-hero form-card">
                    <h3>{heroTitle}</h3>
                    <p>{heroDescription}</p>

                    {showCountdown ? (
                        <div className="landing-countdown-box">
                            <p className="landing-countdown-label">{countdownLabel}</p>
                            <div className="landing-countdown-grid">
                                <div className="countdown-item"><strong>{countdownParts.days}</strong><span>Hari</span></div>
                                <div className="countdown-item"><strong>{countdownParts.hours}</strong><span>Jam</span></div>
                                <div className="countdown-item"><strong>{countdownParts.minutes}</strong><span>Menit</span></div>
                                <div className="countdown-item"><strong>{countdownParts.seconds}</strong><span>Detik</span></div>
                            </div>
                        </div>
                    ) : null}

                    <div className={`landing-participation-box tone-${participationTone}`}>
                        <div className="landing-participation-head">
                            <h4>Partisipasi Pemilih</h4>
                            <span className="landing-participation-percentage heartbeat-pill">{participationPct.toFixed(2)}%</span>
                        </div>

                        <p className="landing-participation-caption">
                            {totalVoters} pemilih dari {totalMembers} anggota eligible
                        </p>

                        <div className="landing-progress-track" role="progressbar" aria-valuenow={Math.round(participationPct)} aria-valuemin={0} aria-valuemax={100}>
                            <div
                                className={`landing-progress-fill tone-${participationTone}`}
                                style={{ width: `${animatedPct}%` }}
                            />
                        </div>
                    </div>

                    <div className="landing-agenda">
                        <h4>{agendaTitle}</h4>
                        <p>{agendaDescription}</p>
                        {status === 'closed' ? (
                            <div className="landing-local-reveal" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                <button 
                                    className="btn" 
                                    style={{ 
                                        width: '100%', 
                                        marginBottom: '1rem', 
                                        padding: '1.2rem',
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(245, 158, 11, 0.6)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.4)'; }}
                                    onClick={() => { setIsRevealOpen(true); setIsRevealDone(false); }}
                                >
                                    🏆 Lihat Hasil Rekapitulasi Suara 🏆
                                </button>
                                
                                {isRevealOpen && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, background: 'var(--bg, #000)' }}>
                                        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 100000, display: 'flex', gap: '1rem', width: 'max-content', maxWidth: '90vw', flexWrap: 'nowrap', justifyContent: 'center', opacity: isRevealDone ? 1 : 0, pointerEvents: isRevealDone ? 'auto' : 'none', transition: 'opacity 1s ease' }}>
                                            <button 
                                                onClick={() => setIsRevealOpen(false)}
                                                style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontSize: '1.1rem', flex: '1 1 auto', whiteSpace: 'nowrap' }}
                                            >
                                                Tutup Hasil (X)
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setIsRevealOpen(false);
                                                    navigate('/otp');
                                                }}
                                                className="btn btn-primary btn-lg landing-otp-button"
                                                title="Masuk ke verifikasi OTP"
                                                style={{ padding: '12px 30px', borderRadius: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontSize: '1.1rem', margin: 0, flex: '1 1 auto', whiteSpace: 'nowrap' }}
                                            >
                                                {ctaText}
                                            </button>
                                        </div>
                                        <iframe src="/admin/winners?simulateReveal=1" style={{ width: '100%', height: '100%', border: 'none', background: 'var(--bg)' }} title="Winner Reveal" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {agendaLocation ? <p><strong>Lokasi:</strong> {agendaLocation}</p> : null}
                                {startAt && <p><strong>Mulai:</strong> {new Date(startAt).toLocaleString('id-ID')}</p>}
                            </>
                        )}
                    </div>

                    <div className={`landing-reward-box ${rewardEnabled ? 'reward-on' : 'reward-off'}`}>
                        <h4>🎁 Bonus Untuk Pemilih</h4>
                        {rewardEnabled ? (
                            <p>
                                Anggota yang sudah vote akan mendapatkan hadiah berupa:
                                <strong> {rewardText}</strong>
                            </p>
                        ) : (
                            <p>
                                Saat ini tidak ada hadiah tambahan. Tetap gunakan hak suara Anda untuk masa depan koperasi.
                            </p>
                        )}
                    </div>
                </section>

                <section className="landing-hero-candidates">
                    <h3>Kandidat Calon Ketua KKM 2026-2029</h3>
                    <p className="landing-hero-candidates-subtitle">
                        Yuk kenalan dengan kandidat Ketua Koperasi Karya Mandiri yang siap membawa koperasi kita lebih maju!
                    </p>

                    <div className="landing-hero-candidate-grid">
                        {landingCandidates.map((candidate) => (
                            <article key={candidate.key} className="landing-hero-candidate-card">
                                {candidate.photo && !imageFallback[candidate.id] ? (
                                    <img
                                        src={candidate.photo}
                                        alt={candidate.name}
                                        className="landing-hero-candidate-photo"
                                        onError={() => setImageFallback((prev) => ({ ...prev, [candidate.id]: true }))}
                                    />
                                ) : (
                                    <div className="candidate-photo-placeholder candidate-photo-placeholder--text">Foto kandidat belum tersedia</div>
                                )}

                                <div className="landing-hero-candidate-body">
                                    <p className="landing-candidate-number">No. {candidate.orderNo}</p>
                                    <h4 className="landing-candidate-name">{candidate.name}</h4>
                                    <p><strong>Posisi Pencalonan:</strong> Ketua KKM</p>

                                    <div className="landing-hero-candidate-meta">
                                        <p><strong>NIK:</strong> {candidate.nik}</p>
                                        <p><strong>Department:</strong> {candidate.department}</p>
                                        <p><strong>Site:</strong> {candidate.site}</p>
                                    </div>

                                    <p><strong>Visi:</strong> {candidate.vision}</p>
                                    <div>
                                        <p><strong>Misi:</strong></p>
                                        {renderMissionContent(candidate.mission, 'landing-mission-list')}
                                    </div>
                                    <p><strong>Motto:</strong> {candidate.motto}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    {landingCandidates.length === 0 ? (
                        <p className="landing-hero-candidates-subtitle" style={{ marginTop: '0.85rem' }}>
                            Belum ada kandidat aktif di database.
                        </p>
                    ) : null}

                    <div className="landing-cta-group" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                            className="btn btn-primary btn-lg landing-otp-button"
                            onClick={() => navigate('/otp')}
                            disabled={!canStartOtp}
                            title={canStartOtp ? 'Masuk ke verifikasi OTP' : 'Verifikasi OTP belum dibuka.'}
                        >
                            {ctaText}
                        </button>
                        {!canStartOtp ? (
                            <p className="landing-hero-candidates-subtitle" style={{ marginTop: '0.35rem' }}>
                                Verifikasi OTP belum dibuka.
                            </p>
                        ) : null}
                    </div>

                </section>
            </main>

            <footer className="voting-footer landing-footer">
                <p>
                    <a href="https://nandurstudio.com" target="_blank" rel="noreferrer">©2026 Nandur Studio</a>
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                    <button 
                        onClick={() => navigate('/admin')}
                        style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.8 }}
                    >
                        Akses Admin
                    </button>
                </p>
            </footer>
        </div>
    );
}
