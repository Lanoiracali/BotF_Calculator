import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../viewer.css';
import './Map.css';

// Intro sequence: played once ever, then persisted in localStorage
type IntroStep = 'intro' | 'ptc' | 'lore1' | 'loading_wait' | 'done';

function getLocalState() {
    try {
        const raw = localStorage.getItem('botf_game_state');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

const BASE = import.meta.env.BASE_URL;

const BOSS_IMAGE_MAP: Record<string, string> = {
    Bathala:  `${BASE}asset/ANIMATION ON CARDS/Bathala.gif`,
    Mayari:   `${BASE}asset/ANIMATION ON CARDS/Mayari.gif`,
    Apolaki:  `${BASE}asset/ANIMATION ON CARDS/Apolak.gif`,
    Bakunawa: `${BASE}asset/ANIMATION ON CARDS/Bakunawa.gif`,
};

const LOADING_MAP: Record<string, string> = {
    daragangmagayon: `${BASE}asset/LOADINGSCREEN/loadingApolaki.mp4`,
    dagatkabisayaan: `${BASE}asset/LOADINGSCREEN/loadingBakunawa.mp4`,
    bundokpulag:     `${BASE}asset/LOADINGSCREEN/loadingMayari.mp4`,
    kaluwalhatian:   `${BASE}asset/LOADINGSCREEN/loadingBathala.mp4`,
};

const INTRO_SRCS: Record<IntroStep, string> = {
    intro:        'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171147/intro_ge5xk1.mp4',
    ptc:          'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171149/presstocontinue_dxwgkj.mp4',
    lore1:        'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171156/game_lore1_uvbnha.mp4',
    loading_wait: 'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171146/loading_o9epy8.mp4',
    done:         '',
};

const REGIONS = [
    {
        id: 'daragangmagayon',
        boss: 'Apolaki',
        overlay: `${BASE}asset/MAPS/1.png`,
        style: { left: '170px', top: '205px', width: '310px', height: '400px' },
    },
    {
        id: 'dagatkabisayaan',
        boss: 'Bakunawa',
        overlay: `${BASE}asset/MAPS/3.png`,
        style: { left: '489px', top: '458px', width: '180px', height: '160px' },
    },
    {
        id: 'kaluwalhatian',
        boss: 'Bathala',
        overlay: `${BASE}asset/MAPS/4.png`,
        style: { left: '789px', top: '222px', width: '380px', height: '190px' },
    },
    {
        id: 'bundokpulag',
        boss: 'Mayari',
        overlay: `${BASE}asset/MAPS/2.png`,
        style: { left: '243px', top: '680px', width: '540px', height: '210px' },
    },
];

export function Map() {
    const navigate = useNavigate();

    const [localState, setLocalState] = useState<any>(getLocalState);

    // ---- Intro sequence state machine ----
    // Persisted: once the sequence completes it never replays across sessions.
    const [introStep, setIntroStep] = useState<IntroStep>(() =>
        localStorage.getItem('botf_intro_done') === '1' ? 'done' : 'intro'
    );
    const advanceIntro = (next: IntroStep) => {
        if (next === 'loading_wait') localStorage.setItem('botf_intro_done', '1');
        setIntroStep(next);
    };
    const handleIntroOverlayClick = () => {
        if (introStep === 'intro')  advanceIntro('ptc');
        else if (introStep === 'ptc')   advanceIntro('lore1');
        else if (introStep === 'lore1') advanceIntro('loading_wait');
        // loading_wait: no click advance — wait for setup confirmed
    };

    // Poll localStorage so the map stays in sync with the Admin window
    useEffect(() => {
        const id = setInterval(() => {
            const s = getLocalState();
            if (s) setLocalState(s);
        }, 300);
        return () => clearInterval(id);
    }, []);

    const gamePhase: string  = localState?.gamePhase ?? 'setup';
    const deadBossesArr: string[] = Array.isArray(localState?.deadBosses) ? localState.deadBosses : [];
    const deadBosses = new Set<string>(deadBossesArr);

    // Advance loading_wait → done once setup is confirmed (gamePhase leaves 'setup')
    useEffect(() => {
        if (introStep === 'loading_wait' && gamePhase !== 'setup') {
            setIntroStep('done');
        }
    }, [gamePhase, introStep]);

    // React to hard reset: when Admin removes botf_intro_done, restart intro from this window too
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'botf_intro_done' && e.newValue === null) {
                setIntroStep('intro');
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const [scale, setScale]           = useState(1);
    const [hoveredId, setHoveredId]   = useState<string | null>(null);
    const [loadingVideo, setLoadingVideo] = useState<string | null>(null);
    const [pendingRegion, setPendingRegion] = useState<string | null>(null);

    useEffect(() => {
        const resize = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Kaluwalhatian unlocks only after the other 3 main bosses are defeated
    const kaluOpen = deadBosses?.has('Apolaki') && deadBosses?.has('Bakunawa') && deadBosses?.has('Mayari');

    const isRegionLocked = (r: typeof REGIONS[0]) => {
        if (r.id === 'kaluwalhatian') return !kaluOpen;
        return deadBosses?.has(r.boss) ?? false;
    };

    const handleRegionClick = (regionId: string) => {
        if (loadingVideo) return;
        const src = LOADING_MAP[regionId];
        setPendingRegion(regionId);
        setLoadingVideo(src);
    };

    const handleVideoEnd = () => {
        if (pendingRegion) {
            // Signal the Admin window to call enterRegion on its own store
            localStorage.setItem('botf_pending_region', JSON.stringify({ regionId: pendingRegion, ts: Date.now() }));

            // Optimistically mark gamePhase as 'battle' in the shared state so
            // the Viewer doesn't redirect back to /map before the Admin processes
            // the pending region (Admin poll runs every 200ms, this prevents the
            // race where Viewer mounts and sees gamePhase='map').
            try {
                const raw = localStorage.getItem('botf_game_state');
                if (raw) {
                    const s = JSON.parse(raw);
                    s.gamePhase = 'battle';
                    s.selectedRegion = pendingRegion;
                    localStorage.setItem('botf_game_state', JSON.stringify(s));
                }
            } catch (_) {}
        }
        setLoadingVideo(null);
        setPendingRegion(null);
        navigate('/');
    };

    const hovered = REGIONS.find(r => r.id === hoveredId);
    const introActive = introStep !== 'done';

    return (
        <div className="resolution-scaler">
            <div
                className="fixed-layout"
                style={{
                    backgroundImage: `url(${BASE}asset/MAPS/MAP.png)`,
                    transform: `scale(${scale})`,
                }}
            >
                <div className="stream-container">
                    <div className="battle-field">
                        {/* Left: map with invisible hover hotspots — disabled during intro */}
                        <div className="map-section" style={introActive ? { pointerEvents: 'none' } : {}}>
                            {REGIONS.map(r => {
                                const locked = isRegionLocked(r);
                                return (
                                    <div
                                        key={r.id}
                                        className={`map-hotspot${locked ? ' map-hotspot--locked-hidden' : ''}`}
                                        style={r.style}
                                        onMouseEnter={() => { if (!locked) setHoveredId(r.id); }}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => { if (!locked) handleRegionClick(r.id); }}
                                    />
                                );
                            })}
                        </div>

                        {/* Right: boss portrait column */}
                        <div className="boss-section">
                            {!introActive && hovered && !isRegionLocked(hovered) && (
                                <div className="boss-card" id="boss-card">
                                    <div className="boss-portrait">
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={BOSS_IMAGE_MAP[hovered.boss]}
                                                alt={hovered.boss}
                                                className="boss-image"
                                                id="boss-image"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Full-screen overlay on hover — hidden during intro */}
                    {!introActive && hovered && !isRegionLocked(hovered) && (
                        <img
                            src={hovered.overlay}
                            alt={hovered.id}
                            className="map-overlay-fullscreen"
                        />
                    )}
                    {/* Setup text overlay removed — looped loading.mp4 in intro sequence handles it */}
                </div>
            </div>

            {/* Region selection loading video — fullscreen, outside scaled container */}
            {loadingVideo && (
                <div className="loading-video-overlay">
                    <video
                        src={loadingVideo}
                        autoPlay
                        muted
                        onEnded={handleVideoEnd}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

            {/* ---- Intro sequence overlay (Flow 0) ----
                Sits above everything. Skippable by click except loading_wait.
                Not shown once localStorage botf_intro_done is '1'. */}
            {introActive && (
                <div
                    className="loading-video-overlay"
                    style={{ cursor: introStep !== 'loading_wait' ? 'pointer' : 'default', zIndex: 10000 }}
                    onClick={handleIntroOverlayClick}
                >
                    {introStep === 'intro' && (
                        <video
                            src={INTRO_SRCS.intro}
                            autoPlay muted
                            onEnded={() => advanceIntro('ptc')}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                    {introStep === 'ptc' && (
                        <video
                            src={INTRO_SRCS.ptc}
                            autoPlay muted loop
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                    {introStep === 'lore1' && (
                        <video
                            src={INTRO_SRCS.lore1}
                            autoPlay
                            onEnded={() => advanceIntro('loading_wait')}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                    {introStep === 'loading_wait' && (
                        <video
                            src={INTRO_SRCS.loading_wait}
                            autoPlay muted loop
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
