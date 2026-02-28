import { useGameStore } from '../../store/gameStore';
import { PlayerCard } from './PlayerCard';
import { BossPanel } from './BossPanel';

export function AdminPanel() {
    const currentRound  = useGameStore(s => s.currentRound);
    const endRound      = useGameStore(s => s.endRound);
    const resetAll      = useGameStore(s => s.resetAll);
    const setCrit       = useGameStore(s => s.setCrit);
    const setDungeonBuff = useGameStore(s => s.setDungeonBuff);
    const critActive    = useGameStore(s => s.critActive);
    const db1           = useGameStore(s => s.dungeonBuff1Active);
    const db2           = useGameStore(s => s.dungeonBuff2Active);
    const db3           = useGameStore(s => s.dungeonBuff3Active);

    const handleDungeon3 = (checked) => {
        setDungeonBuff(3, checked);
        if (checked) {
            // Clear all cooldowns immediately
            useGameStore.getState().clearAllCooldowns();
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Left: players */}
            <div className="players-container">
                <h1 align="center">Balangay of the Forgotten (BotF) Calculator</h1>
                <h2 style={{ margin: 0 }}>Round: {currentRound}</h2>
                <button onClick={endRound}>End Round</button>
                <button onClick={resetAll}>Reset All</button>
                <span>Cooldowns reduce by 1 each round.</span>

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

                <PlayerCard playerId="player1" />
                <PlayerCard playerId="player2" />
                <PlayerCard playerId="player3" />
                <PlayerCard playerId="player4" />
            </div>

            {/* Right: boss */}
            <BossPanel />
        </div>
    );
}
