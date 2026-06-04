import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { notify } from '../../utils/notify'
import type { WinnersData, ResultItem } from '../../types'
import { getStoredAdminUser } from '../../components/admin/authStorage'

type RankedResult = ResultItem & {
    rank: number
    animated_votes: number
    animated_percentage: number
    is_leader: boolean
}

const formatPercent = (value: number) => `${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`

const animateValue = (target: number, progress: number) => Math.round(target * progress)

const PUBLIC_REVEAL_CACHE_KEY = 'kkm_public_winners_revealed'

export default function WinnersPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [animationDurationMs, setAnimationDurationMs] = useState(1800)
    const [countdownVisible, setCountdownVisible] = useState(false)
    const [countdownValue, setCountdownValue] = useState(10)
    const [congratsVisible, setCongratsVisible] = useState(false)
    const [data, setData] = useState<WinnersData | null>(null)
    const [progress, setProgress] = useState(0)
    const [publicRevealSeen, setPublicRevealSeen] = useState<boolean>(() => localStorage.getItem(PUBLIC_REVEAL_CACHE_KEY) === 'true')
    const [simulateMode, setSimulateMode] = useState(() => new URLSearchParams(window.location.search).has('simulateReveal'))
    const adminUser = getStoredAdminUser()
    const isAdminViewer = Boolean(adminUser)

    const loadWinners = async () => {
        setLoading(true)
        try {
            const res = await api.get<WinnersData>('/admin/winners')
            const nextData = res?.data ?? null
            setData(nextData)
            setAnimationDurationMs(Number(nextData?.election?.winners_animation_duration_ms || 1800))
        } catch (err: any) {
            notify.error('Gagal Memuat Winners', err?.response?.data?.message || 'Tidak bisa memuat data winners')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadWinners()
    }, [])

    const [simulatedRevealDone, setSimulatedRevealDone] = useState(false)
    const revealEnabled = (Boolean(data?.winners_revealed) || simulatedRevealDone) && !simulateMode
    const showRevealState = ((data?.winners_revealed ?? publicRevealSeen) || simulatedRevealDone) && !simulateMode

    useEffect(() => {
        if (typeof data?.winners_revealed === 'boolean') {
            setPublicRevealSeen(data.winners_revealed)
            localStorage.setItem(PUBLIC_REVEAL_CACHE_KEY, data.winners_revealed ? 'true' : 'false')
            return
        }

        localStorage.setItem(PUBLIC_REVEAL_CACHE_KEY, publicRevealSeen ? 'true' : 'false')
    }, [data?.winners_revealed, publicRevealSeen])

    useEffect(() => {
        if (simulateMode && data) {
            setCountdownValue(10)
            setCountdownVisible(true)
            
            const onKey = (e: KeyboardEvent) => {
                if (e.key === '0') {
                    window.removeEventListener('keydown', onKey)
                    setCountdownValue(0)
                    setCountdownVisible(false)
                    setSimulatedRevealDone(true)
                    setSimulateMode(false)
                }
            }
            window.addEventListener('keydown', onKey)

            const id = window.setInterval(() => {
                setCountdownValue((v) => {
                    if (v <= 1) {
                        clearInterval(id)
                        window.removeEventListener('keydown', onKey)
                        setCountdownVisible(false)
                        setSimulatedRevealDone(true)
                        setSimulateMode(false)
                        return 0
                    }
                    return v - 1
                })
            }, 1000)

            return () => {
                clearInterval(id)
                window.removeEventListener('keydown', onKey)
            }
        }
    }, [simulateMode, data])

    useEffect(() => {
        if (!showRevealState) {
            setProgress(0)
            setCongratsVisible(false)
            return undefined
        }

        let frame = 0
        const duration = Math.max(300, animationDurationMs || 1800)
        const start = performance.now()

        const step = (now: number) => {
            const elapsed = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - elapsed, 3)
            setProgress(eased)
            if (elapsed < 1) {
                frame = window.requestAnimationFrame(step)
            }
        }

        frame = window.requestAnimationFrame(step)
        return () => window.cancelAnimationFrame(frame)
    }, [showRevealState, data?.results?.length, animationDurationMs])

    const rankedResults = useMemo<RankedResult[]>(() => {
        const totalValid = Number(data?.total_valid || 0)
        const ordered = [...(data?.results || [])].sort((a, b) => {
            if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count
            if (b.percentage !== a.percentage) return b.percentage - a.percentage
            return a.name.localeCompare(b.name)
        })

        return ordered.map((item, index) => {
            const percentage = totalValid > 0 ? (item.vote_count / totalValid) * 100 : 0
            return {
                ...item,
                percentage,
                rank: index + 1,
                animated_votes: animateValue(item.vote_count, progress),
                animated_percentage: Number((percentage * progress).toFixed(2)),
                is_leader: index === 0 && totalValid > 0,
            }
        })
    }, [data, progress])

    const leader = rankedResults[0] || null
    const hiddenLeader = rankedResults.find((item) => item.is_leader) || leader
    const electionStatus = data?.status || 'NO_MAJORITY'
    const totalVotesText = Number(data?.total_valid || 0).toLocaleString('id-ID')
    const statusText = showRevealState ? 'Terbuka' : 'Terkunci'
    const revealCopy = showRevealState
        ? 'Hasil voting sedang ditampilkan lengkap dengan animasi count-up sesuai durasi yang disetel di pengaturan.'
        : 'Kandidat juara sudah dihitung, tetapi angka voting dan persentasenya masih dikunci sampai reveal dibuka.'

    const leaderImage = hiddenLeader?.photo_url || null
    const isAnimationDone = progress >= 0.999

    useEffect(() => {
        // show congrats overlay when animation completes and there is actually a winner
        const hasVotes = Number(data?.total_valid || 0) > 0
        if (showRevealState && isAnimationDone && leader && hasVotes) {
            setCongratsVisible(true)
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'WINNERS_REVEAL_DONE' }, '*');
            }
        }
    }, [isAnimationDone, showRevealState, leader, data?.total_valid])

    const toggleReveal = async (nextState: boolean) => {
        setSaving(true)
        try {
            await api.put('/admin/election/settings', {
                winners_revealed: nextState,
            })
            await loadWinners()
            notify.toast(
                nextState ? 'Reveal Aktif' : 'Unreveal Aktif',
                nextState ? 'Hasil winners sekarang tampil.' : 'Hasil winners disembunyikan lagi.',
                'success',
            )
        } catch (err: any) {
            notify.toast('Update Reveal Gagal', err?.response?.data?.message || 'Tidak bisa update status reveal', 'error')
        } finally {
            setSaving(false)
        }
    }

    const startCountdownAndReveal = () => {
        setCountdownValue(10)
        setCountdownVisible(true)
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '0') {
                // abort countdown and reveal immediately
                window.removeEventListener('keydown', onKey)
                setCountdownValue(0)
            }
        }
        window.addEventListener('keydown', onKey)

        const tick = () => {
            setCountdownValue((v) => {
                if (v <= 1) {
                    // time's up -> reveal and cleanup
                    window.removeEventListener('keydown', onKey)
                    setCountdownVisible(false)
                    toggleReveal(true)
                    return 0
                }
                return v - 1
            })
        }

        // run first tick after 1s, keep interval id to clear when overlay closed
        const id = window.setInterval(() => {
            setCountdownValue((v) => {
                if (v <= 1) {
                    clearInterval(id)
                    window.removeEventListener('keydown', onKey)
                    setCountdownVisible(false)
                    toggleReveal(true)
                    return 0
                }
                return v - 1
            })
        }, 1000)
    }

    return (
        <section className="admin-simple-card winners-page">
            <div className="winners-header">
                <div>
                    <span className="winners-eyebrow">Winners</span>
                    <h2>Reveal Hasil Pemilihan</h2>
                    <p>
                        Kontrol ini membuka atau menutup tampilan hasil kandidat ketua, lengkap dengan animasi hitung suara sesuai durasi yang disetel.
                    </p>
                </div>

                <div className="winners-controls">
                    <span className={`winners-status-pill ${showRevealState ? 'is-open' : 'is-closed'}`}>
                        {statusText}
                    </span>
                    {isAdminViewer ? (
                        <>
                            {showRevealState ? (
                                <button type="button" onClick={() => toggleReveal(false)} disabled={saving || loading} className="winners-action-button winners-action-button--small">
                                    Unreveal
                                </button>
                            ) : (
                                <button type="button" onClick={() => startCountdownAndReveal()} disabled={saving || loading} className="winners-action-button">
                                    Reveal Hasil
                                </button>
                            )}

                            <button type="button" onClick={async () => { setSaving(true); try { await api.put('/admin/election/settings', { winners_revealed: false }); notify.toast('Reset', 'Setting reset.', 'success'); await loadWinners(); } catch (err: any) { notify.toast('Reset Gagal', err?.response?.data?.message || 'Gagal reset', 'error') } finally { setSaving(false) } }} disabled={saving || loading} className="winners-reset-button winners-reset-button--small">
                                Reset
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {loading ? (
                <p>Memuat data winners...</p>
            ) : (
                <>
                    <div className={`winners-hero ${!showRevealState ? 'winners-hero--hidden' : ''}`}>
                        <div className="winners-hero-copy">
                            <span className="winners-hero-tag">Status: {electionStatus}</span>
                            <h3>{revealEnabled && hiddenLeader && isAnimationDone ? `Kandidat Ketua Terpilih: ${hiddenLeader.name}` : 'Kandidat Ketua Terpilih: Rahasia'}</h3>
                            <p>{revealEnabled ? revealCopy : 'Data kandidat tersembunyi sampai fitur reveal diaktifkan.'}</p>
                        </div>

                        <div className="winners-hero-leader">
                            <div className="winners-hero-photo-wrap">
                                {showRevealState && isAnimationDone && leaderImage ? (
                                    <img src={leaderImage} alt={hiddenLeader?.name || 'Kandidat Ketua'} className="winners-hero-photo" />
                                ) : (
                                    <div className="winners-hero-photo winners-hero-photo--masked">Rahasia</div>
                                )}
                            </div>

                            <div className="winners-hero-stat">
                                <strong>{showRevealState && leader ? `${formatPercent(leader.animated_percentage || 0)}` : '•'}</strong>
                                <span>{showRevealState && leader ? `${leader.animated_votes.toLocaleString('id-ID')} suara dari ${totalVotesText} suara masuk` : 'Tersembunyi'}</span>
                            </div>
                        </div>
                    </div>

                    {countdownVisible && (
                        <div className="winners-countdown-overlay" role="dialog" aria-modal>
                            <div>
                                <div 
                                    className="count-value"
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }))}
                                >
                                    {countdownValue}
                                </div>
                                <div style={{ textAlign: 'center', marginTop: 12 }}>Press <strong>0</strong> atau tap angka untuk reveal</div>
                            </div>
                        </div>
                    )}

                    {congratsVisible && leader && (
                        <div className="winners-congrats-overlay" role="alert">
                            <div className="winners-congrats-card">
                                {leader.photo_url ? <img src={leader.photo_url} alt={leader.name} /> : null}
                                <h2>Selamat — {leader.name}</h2>
                                <p>Kandidat Ketua Terpilih dengan {leader.animated_votes.toLocaleString('id-ID')} suara dari {totalVotesText} suara masuk ({formatPercent(leader.animated_percentage)})</p>
                                <button className="winners-congrats-close" onClick={() => setCongratsVisible(false)}>Tutup</button>
                            </div>
                        </div>
                    )}

                    {/* duration settings removed */}

                    <div className={`winners-grid ${showRevealState ? 'is-revealed' : 'is-hidden'}`}>
                        {rankedResults.map((item) => (
                            <article key={item.id} className={`winner-card ${item.is_leader ? 'winner-card--leader' : ''}`}>
                                <div className="winner-card-top">
                                    <span className="winner-rank">#{item.candidate_number ?? item.rank}</span>
                                    {item.is_leader && <span className="winner-crown">Kandidat Ketua Terpilih</span>}
                                </div>

                                <div className="winner-photo-wrap">
                                    {revealEnabled && isAnimationDone && item.photo_url ? (
                                        <img src={item.photo_url} alt={item.name} className="winner-photo" />
                                    ) : (
                                        <div className="winner-photo winner-photo--empty">Rahasia</div>
                                    )}
                                </div>

                                <h4>{revealEnabled && isAnimationDone ? item.name : 'Kandidat Rahasia'}</h4>
                                <p>{item.position || 'Kandidat Ketua'}</p>

                                <div className="winner-counter-row">
                                    <div>
                                        <span className="winner-counter-label">Votes</span>
                                        <strong>{revealEnabled ? item.animated_votes.toLocaleString('id-ID') : (item.is_leader && data?.total_valid) ? 'Terpilih' : '•••'}</strong>
                                    </div>
                                    <div>
                                        <span className="winner-counter-label">Percentage</span>
                                        <strong>{revealEnabled ? formatPercent(item.animated_percentage) : (item.is_leader && data?.total_valid) ? 'Tertinggi' : '•••'}</strong>
                                    </div>
                                </div>

                                <div className="winner-progress-track">
                                    <div
                                        className="winner-progress-bar"
                                        style={{ width: revealEnabled ? `${Math.max(4, item.animated_percentage)}%` : '4%' }}
                                    />
                                </div>

                                {!revealEnabled && <div className="winner-mask">Terkunci sampai reveal dibuka</div>}
                            </article>
                        ))}
                    </div>

                </>
            )}
        </section>
    )
}
