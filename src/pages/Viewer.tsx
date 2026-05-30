import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../viewer.css';
import { GameViewer } from '../components/Viewer/GameViewer';

const BASE = import.meta.env.BASE_URL;

const LOADING_MAP: Record<string, string> = {
    daragangmagayon: 'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171143/loadingApolaki_y6pydy.mp4',
    dagatkabisayaan: 'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171142/loadingBakunawa_zoz9jf.mp4',
    bundokpulag:     'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171147/loadingMayari_sxxhdq.mp4',
    kaluwalhatian:   'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171149/loadingBathala_srn5t6.mp4',
};

const RETURN_LOADING = 'https://res.cloudinary.com/dsjgm3swn/video/upload/v1780171146/loading_o9epy8.mp4';

const BANNER_IMG: Record<string, string> = {
    miniboss:     `${BASE}asset/BANNERS/minibossbattlebanner.png`,
    mainboss:     `${BASE}asset/BANNERS/mainbossbattlebanner.png`,
    minivictory:  `${BASE}asset/BANNERS/victorybanner.png`,
    victory:      `${BASE}asset/BANNERS/victorybanner.png`,
    defeat:       `${BASE}asset/BANNERS/defeatbanner.png`,
};

export function Viewer() {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<any>(null);
    const prevPhaseRef = useRef<string | null>(null);

    // ---- region→battle loading video ----
    const [showLoading, setShowLoading] = useState(false);
    const [loadingRegion, setLoadingRegion] = useState<string | null>(null);
    const navigateAfterLoadRef = useRef(false);
    const showLoadingRef = useRef(false);
    useEffect(() => { showLoadingRef.current = showLoading; }, [showLoading]);

    // ---- Flow 5: ending sequence ----
    const [showEnding, setShowEnding] = useState(false);
    const [endingDone, setEndingDone]  = useState(false);

    // ---- banner animation state machine ----
    const [displayedBanner, setDisplayedBanner] = useState<string | null>(null);
    const [isHiding, setIsHiding] = useState(false);
    const displayedRef = useRef<string | null>(null);
    const hidingRef    = useRef(false);
    const pendingRef   = useRef<string | null>(null);

    const applyBanner = (next: string | null) => {
        displayedRef.current = next;
        setDisplayedBanner(next);
        hidingRef.current = false;
        setIsHiding(false);
    };
    const handleBannerAnimationEnd = () => {
        if (!hidingRef.current) return; // ignore fadein
        hidingRef.current = false;
        setIsHiding(false);
        const next = pendingRef.current;
        pendingRef.current = null;
        displayedRef.current = next;
        setDisplayedBanner(next);
    };

    // Poll localStorage
    useEffect(() => {
        const poll = () => {
            try {
                const raw = localStorage.getItem('botf_game_state');
                if (!raw) return;
                const parsed = JSON.parse(raw);
                const newPhase: string = parsed?.gamePhase ?? null;
                // Detect map→battle
                if (prevPhaseRef.current === 'map' && newPhase === 'battle') {
                    setLoadingRegion(parsed.selectedRegion ?? null);
                    setShowLoading(true);
                }
                // NOTE: 'ending' phase is intentionally NOT auto-triggering showEnding here.
                // The ending sequence starts only when the viewer clicks the victory banner (handleBannerClick).
                prevPhaseRef.current = newPhase;
                setGameState(parsed);
            } catch (_) {}
        };
        poll();
        const id = setInterval(poll, 300);
        return () => clearInterval(id);
    }, []);

    // Phase-based redirect: go to /map while not in battle
    // Guards: don't redirect while loading video plays, or during/after ending sequence
    useEffect(() => {
        if (!gameState) return;
        if (showLoadingRef.current) return;
        if (showEnding || endingDone) return;
        const { gamePhase, activeBanner } = gameState;
        if (gamePhase === 'ending') return;
        if (gamePhase !== 'battle' && !activeBanner) {
            navigate('/map');
        }
    }, [gameState?.gamePhase, gameState?.activeBanner, showLoading, showEnding, endingDone]);

    const handleLoadingEnd = () => {
        setShowLoading(false);
        setLoadingRegion(null);
        if (navigateAfterLoadRef.current) {
            navigateAfterLoadRef.current = false;
            navigate('/map');
        }
    };

    const activeBanner: string | null = gameState?.activeBanner ?? null;

    // Sync store activeBanner → local displayedBanner with animate-out
    useEffect(() => {
        const next    = activeBanner;
        const current = displayedRef.current;
        const hiding  = hidingRef.current;
        if (next === current && !hiding) return;
        if (hiding) { pendingRef.current = next; return; }
        // Skip hide animation: nothing shown, loading active, or victory/defeat
        // (loading video takes over immediately on those)
        const skipHide = !current || showLoadingRef.current
            || current === 'victory' || current === 'defeat';
        if (skipHide) {
            applyBanner(next);
        } else {
            pendingRef.current = next;
            hidingRef.current  = true;
            setIsHiding(true);
        }
    }, [activeBanner]);

    // Clear banner immediately when loading video starts
    useEffect(() => {
        if (showLoading) {
            pendingRef.current = null; hidingRef.current = false;
            displayedRef.current = null;
            setIsHiding(false); setDisplayedBanner(null);
        }
    }, [showLoading]);

    const handleBannerClick = () => {
        if (activeBanner === 'victory' || activeBanner === 'defeat') {
            // Clear banner from localStorage so it doesn't re-appear
            try {
                const raw = localStorage.getItem('botf_game_state');
                if (raw) { const s = JSON.parse(raw); s.activeBanner = null; localStorage.setItem('botf_game_state', JSON.stringify(s)); }
            } catch (_) {}
            // Flow 5: Bathala victory → trigger ending sequence instead of return-to-map
            if (gameState?.gamePhase === 'ending') {
                setShowEnding(true);
                return;
            }
            navigateAfterLoadRef.current = true;
            setLoadingRegion('__return__');
            setShowLoading(true);
        }
    };

    return (
        <div className="viewer-root">
            {/* Flow 5: ending sequence — highest priority overlay */}
            {showEnding && !endingDone && (
                <div className="loading-video-overlay">
                    <video
                        src="https://res.cloudinary.com/dsjgm3swn/video/upload/v1780174146/ending_f3kq2r.mp4"
                        autoPlay
                        onEnded={() => { setShowEnding(false); setEndingDone(true); }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}
            {endingDone && (
                <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 10000 }} />
            )}

            {/* Region→battle loading video */}
            {!showEnding && !endingDone && showLoading && loadingRegion && (
                <div className="loading-video-overlay">
                    <video
                        src={loadingRegion === '__return__' ? RETURN_LOADING : LOADING_MAP[loadingRegion]}
                        autoPlay muted
                        onEnded={handleLoadingEnd}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

            {/* Battle content */}
            {!showEnding && !endingDone && !showLoading && <GameViewer />}

            {/* Banner overlay — hidden during loading / ending */}
            {!showEnding && !endingDone && displayedBanner && BANNER_IMG[displayedBanner] && (
                <div
                    className={`banner-overlay${isHiding ? ' banner-overlay--hiding' : ''}${
                        displayedBanner === 'victory' || displayedBanner === 'defeat'
                            ? ' banner-overlay--clickable' : ''
                    }`}
                    onClick={handleBannerClick}
                    onAnimationEnd={handleBannerAnimationEnd}
                >
                    <img
                        src={BANNER_IMG[displayedBanner]}
                        alt={displayedBanner}
                        className={`banner-img${
                            displayedBanner === 'victory' || displayedBanner === 'defeat' || displayedBanner === 'minivictory'
                                ? ' banner-img--half' : ''
                        }`}
                    />
                </div>
            )}
        </div>
    );
}
