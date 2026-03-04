import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerCard } from './PlayerCard';
import { BossPanel } from './BossPanel';
import { ConfigPanel } from './ConfigPanel';

const PLAYER_NAMES = { player1: 'Mandirigma', player2: 'Bagani', player3: 'Babaylan', player4: 'Mangangayaw' };
const ORDINAL = ['1st', '2nd', '3rd', '4th'];

export function AdminPanel() {
    const currentRound   = useGameStore(s => s.currentRound);
    const softReset      = useGameStore(s => s.softReset);
    const hardReset      = useGameStore(s => s.hardReset);
    const setCrit        = useGameStore(s => s.setCrit);
    const setDungeonBuff = useGameStore(s => s.setDungeonBuff);
    const critActive     = useGameStore(s => s.critActive);
    const db1            = useGameStore(s => s.dungeonBuff1Active);
    const db2            = useGameStore(s => s.dungeonBuff2Active);
    const db3            = useGameStore(s => s.dungeonBuff3Active);
    const setupLocked    = useGameStore(s => s.setupLocked);
    const currentTurnIndex = useGameStore(s => s.currentTurnIndex);
    const turnSequence   = useGameStore(s => s.turnSequence);
    const phase2         = useGameStore(s => s.bakunawaPhase2Active);
    const gamePhase      = useGameStore(s => s.gamePhase);
    const onMap = gamePhase === 'map';

    // Track whether the viewer has finished the intro sequence (Flow 0)
    const [introComplete, setIntroComplete] = useState(
        () => localStorage.getItem('botf_intro_done') === '1'
    );
    useEffect(() => {
        if (introComplete) return;
        const check = () => {
            if (localStorage.getItem('botf_intro_done') === '1') setIntroComplete(true);
        };
        window.addEventListener('storage', check);
        const id = setInterval(check, 300);
        return () => { window.removeEventListener('storage', check); clearInterval(id); };
    }, [introComplete]);

    // Poll for a region selection made in the Map window
    useEffect(() => {
        const check = () => {
            try {
                const raw = localStorage.getItem('botf_pending_region');
                if (!raw) return;
                const { regionId } = JSON.parse(raw);
                if (!regionId) return;
                localStorage.removeItem('botf_pending_region');
                useGameStore.getState().enterRegion(regionId);
            } catch (_) {}
        };
        const id = setInterval(check, 200);
        return () => clearInterval(id);
    }, []);

    const handleDungeon3 = (checked) => {
        setDungeonBuff(3, checked);
        if (checked) useGameStore.getState().clearAllCooldowns();
    };

    // Build turn indicator label
    let turnLabel = '';
    if (setupLocked) {
        if (currentTurnIndex >= 0 && currentTurnIndex < 4) {
            const actor = turnSequence[currentTurnIndex];
            turnLabel = `${ORDINAL[currentTurnIndex]} turn — ${PLAYER_NAMES[actor] || actor}`;
        } else if (currentTurnIndex === 4) {
            turnLabel = phase2 ? 'Boss Turn — Minokawa (Attack 1/2)' : 'Boss Turn (Attack 1/2)';
        } else if (currentTurnIndex === 5) {
            turnLabel = phase2 ? 'Boss Turn — Bakunawa (Attack 2/2)' : 'Boss Turn (Attack 2/2)';
        }
    }

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
            {/* Flow 0: block everything until the viewer finishes the intro sequence */}
            {!introComplete && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.72)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    pointerEvents: 'all',
                }}>
                    <span style={{ color: '#ffd700', fontSize: 28, fontWeight: 'bold', textAlign: 'center', textShadow: '0 2px 8px #000' }}>
                        Waiting for intro sequence to complete...
                    </span>
                    <span style={{ color: '#aaa', fontSize: 14 }}>
                        The setup panel will unlock once the viewer finishes the intro.
                    </span>
                </div>
            )}
            {/* Left: players */}
            <div className="players-container">
                <h1 align="center">Balangay of the Forgotten (BotF) Calculator</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h2 style={{ margin: 0 }}>Round: {currentRound}</h2>
                    {setupLocked && turnLabel && (
                        <span style={{
                            background: 'goldenrod', color: '#000',
                            borderRadius: 6, padding: '3px 12px',
                            fontWeight: 'bold', fontSize: 14,
                        }}>{turnLabel}</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0' }}>
                    <button onClick={softReset}
                        style={{ background: '#4a7c59', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                        Reset All
                    </button>
                    <button onClick={() => { if (window.confirm('Hard Reset: return to configuration screen and wipe all progress?')) { hardReset(); setIntroComplete(false); } }}
                        style={{ background: '#8b1a1a', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                        Hard Reset
                    </button>
                    <span style={{ fontSize: 12, color: '#aaa' }}>Cooldowns reduce by 1 each round.</span>
                </div>

                {/* Map phase indicator */}
                {onMap && (
                    <div style={{
                        background: '#1a3a5c', color: '#7ec8e3',
                        border: '1px solid #7ec8e3', borderRadius: 6,
                        padding: '8px 16px', marginBottom: 10,
                        fontWeight: 'bold', fontSize: 14, textAlign: 'center',
                    }}>
                        Waiting for region selection on the map...
                    </div>
                )}

                {/* Global buff controls */}
                <div style={{ marginBottom: 10 }}>
                    <div className="buff-controls">
                        <label>
                            <input type="checkbox" checked={critActive}
                                onChange={e => setCrit(e.target.checked)} />
                            Critical Hit (+50% DMG)
                        </label><br />
                        <label>
                            <input type="checkbox" checked={db1}
                                onChange={e => setDungeonBuff(1, e.target.checked)} />
                            Balaraw (+15% DMG to all)
                        </label><br />
                        <label>
                            <input type="checkbox" checked={db2}
                                onChange={e => setDungeonBuff(2, e.target.checked)} />
                            Kalasag (+25% DEF to all players)
                        </label><br />
                        <label>
                            <input type="checkbox" checked={db3}
                                onChange={e => handleDungeon3(e.target.checked)} />
                            Agos-Oras (No Cooldown for all skills)
                        </label>
                    </div>
                </div>

                <ConfigPanel />
                <div style={onMap ? { opacity: 0.35, pointerEvents: 'none' } : {}}>
                    <PlayerCard playerId="player1" />
                    <PlayerCard playerId="player2" />
                    <PlayerCard playerId="player3" />
                    <PlayerCard playerId="player4" />
                </div>
            </div>

            {/* Right: boss */}
            <BossPanel />
        </div>
    );
}
