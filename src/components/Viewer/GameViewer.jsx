import { useEffect, useRef, useState } from 'react';
import { HeroCard } from './HeroCard';
import { BossCard } from './BossCard';

const MUSIC_MAP = {
    Bathala:     'KALUWALHATIAN.mp3',
    Mayari:      'BUNDOK_PULAG.mp3',
    Apolaki:     'DARAGANG_MAGAYON.mp3',
    Bakunawa:    'DAGAT_KABISAYAAN.mp3',
    Minokawa:    'DAGAT_KABISAYAAN.mp3',
    Manananggal: 'BUNDOK_PULAG.mp3',
    Tiyanak:     'DARAGANG_MAGAYON.mp3',
    Siren:       'DAGAT_KABISAYAAN.mp3',
    Kapre:       'KALUWALHATIAN.mp3',
};

const BASE = import.meta.env.BASE_URL;

const DUNGEON_BUFFS = [
    { id: 1, name: 'Balaraw',   desc: '+15% DMG', img: `${BASE}asset/ALL CARDS/SPECIAL ITEM CARDS/Balaraw.jpg` },
    { id: 2, name: 'Kalasag',   desc: '+25% DEF', img: `${BASE}asset/ALL CARDS/SPECIAL ITEM CARDS/Kalasag.jpg` },
    { id: 3, name: 'Agos-Oras', desc: 'No CD',    img: `${BASE}asset/ALL CARDS/SPECIAL ITEM CARDS/Agos-Oras.jpg` },
];

export function GameViewer() {
    const [gameState, setGameState] = useState(null);
    const audioRef = useRef(null);
    const currentBossRef = useRef(null);

    // Poll localStorage
    useEffect(() => {
        const poll = () => {
            try {
                const raw = localStorage.getItem('botf_game_state');
                if (raw) setGameState(JSON.parse(raw));
            } catch (_) {}
        };
        poll();
        const id = setInterval(poll, 500);
        return () => clearInterval(id);
    }, []);

    // Audio init
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        const enableOnInteraction = () => {
            if (audioRef.current?.paused && audioRef.current.src) {
                audioRef.current.play().catch(() => {});
            }
            // Clean up all three listeners after first interaction (matches vanilla)
            document.removeEventListener('click',      enableOnInteraction);
            document.removeEventListener('keydown',    enableOnInteraction);
            document.removeEventListener('touchstart', enableOnInteraction);
        };
        document.addEventListener('click',      enableOnInteraction);
        document.addEventListener('keydown',    enableOnInteraction);
        document.addEventListener('touchstart', enableOnInteraction);
        return () => {
            document.removeEventListener('click',      enableOnInteraction);
            document.removeEventListener('keydown',    enableOnInteraction);
            document.removeEventListener('touchstart', enableOnInteraction);
            audioRef.current?.pause();
        };
    }, []);

    // Music changes on boss change
    useEffect(() => {
        if (!gameState || !audioRef.current) return;
        const boss = gameState.bakunawaPhase2Active ? 'Minokawa' : gameState.currentBoss;
        if (boss === currentBossRef.current) return;
        currentBossRef.current = boss;
        const file = MUSIC_MAP[boss];
        if (!file) return;
        const path = `${BASE}asset/BGMUSIC/NEW MAP OST/${file}`;
        audioRef.current.pause();
        audioRef.current.src = path;
        audioRef.current.play().catch(() => {});
    }, [gameState?.currentBoss, gameState?.bakunawaPhase2Active]);

    // Scale to fit viewport
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const resize = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const bg = gameState?.bakunawaPhase2Active
        ? `${BASE}asset/Background_Mino.png`
        : `${BASE}asset/Background.png`;

    if (!gameState) {
        return (
            <div className="resolution-scaler">
                <div style={{ color: '#fff', fontSize: 32, fontFamily: 'Arial' }}>
                    Waiting for game state...
                </div>
            </div>
        );
    }

    return (
        <div className="resolution-scaler">
            <div className="fixed-layout"
                style={{
                    backgroundImage: `url(${bg})`,
                    transform: `scale(${scale})`,
                }}>
                <div className="stream-container">
                    <div className="battle-field">
                        {/* === HEROES SECTION === */}
                        <div className="heroes-section">
                            {/* Special Items / Dungeon Buffs */}
                            <div className="special-items-container">
                                {[1, 2, 3, 4].map(slot => {
                                    const buff = DUNGEON_BUFFS.find(b => b.id === slot);
                                    const active = buff
                                        ? (slot === 1 ? gameState.dungeonBuff1Active
                                            : slot === 2 ? gameState.dungeonBuff2Active
                                            : gameState.dungeonBuff3Active)
                                        : false;
                                    return (
                                        <div className="special-items-section" key={slot}>
                                            {active && buff ? (
                                                <>
                                                    <div className="special-item">
                                                        <img src={buff.img} alt={buff.name} />
                                                    </div>
                                                    <div className="special-item-text">{buff.desc}</div>
                                                </>
                                            ) : (
                                                <div className="special-item-text empty" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hero Cards */}
                            <div className="heroes-container">
                                {['player1', 'player2', 'player3', 'player4'].map(pid => (
                                    <HeroCard key={pid} playerId={pid} gameState={gameState} />
                                ))}
                            </div>
                        </div>

                        {/* === BOSS SECTION === */}
                        <div className={`boss-section${gameState.bakunawaPhase2Active ? ' boss-section--dual' : ''}`}>
                            <BossCard gameState={gameState} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
