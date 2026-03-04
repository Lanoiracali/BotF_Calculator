import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../store/gameStore';
import { useCombat } from '../../hooks/useCombat';
import { useEntityEffects } from '../../hooks/useBuffs';
import { bossSkills } from '../../data';
import { HPBar } from '../shared/HPBar';
import { StatusEffects } from '../shared/StatusEffects';

const REGION_BOSSES: Record<string, { mini: string; main: string }> = {
    daragangmagayon: { mini: 'Tiyanak',      main: 'Apolaki'  },
    dagatkabisayaan: { mini: 'Siren',         main: 'Bakunawa' },
    bundokpulag:     { mini: 'Manananggal',   main: 'Mayari'   },
    kaluwalhatian:   { mini: 'Kapre',         main: 'Bathala'  },
};

function SingleBoss({ bossId, title, skills, target, setTarget, isTurnActive = true, onSkill }: any) {
    const stats = useGameStore(useShallow((s: any) => {
        const p = s.playersStats[bossId];
        return { hp: p?.hp ?? 0, maxHp: p?.maxHp ?? 1, atk: p?.atk ?? 0, def: p?.def ?? 0, mag: p?.mag ?? 0, shield: p?.shield ?? 0 };
    }));
    const isDead  = useGameStore((s: any) => s.deadEntities.has(bossId));
    const effects = useEntityEffects(bossId);

    return (
        <>
            <h2 style={{ color: '#ff0000', textAlign: 'center' }}>{title}</h2>
            <HPBar current={stats?.hp ?? 0} max={stats?.maxHp ?? 1} shield={stats?.shield ?? 0} id={bossId} />
            <div className="stats">
                <div className="stat">HP:  <span>{isDead ? '0 (DEAD)' : stats?.hp ?? 0}</span></div>
                <div className="stat">ATK: <span>{stats?.atk ?? 0}</span></div>
                <div className="stat">MAG: <span>{stats?.mag ?? 0}</span></div>
                <div className="stat">DEF: <span>{stats?.def ?? 0}</span></div>
            </div>
            <StatusEffects effects={effects} />

            <label>Select Target:
                <select value={target} onChange={e => setTarget(e.target.value)}>
                    <option value="player1">Mandirigma</option>
                    <option value="player2">Bagani</option>
                    <option value="player3">Babaylan</option>
                    <option value="player4">Mangangayaw</option>
                </select>
            </label>

            <div className="boss-skills" style={!isTurnActive ? { opacity: 0.4, filter: 'grayscale(0.8)', pointerEvents: 'none' } : undefined}>
                {(skills || []).map((skill: any, idx: number) => (
                    <div key={idx} className="skill">
                        <button onClick={() => onSkill(idx, target)}>{skill.name}</button>
                        <div className="skill-description">{skill.description}</div>
                    </div>
                ))}
            </div>
        </>
    );
}

export function BossPanel() {
    const currentBoss       = useGameStore((s: any) => s.currentBoss);
    const phase2            = useGameStore((s: any) => s.bakunawaPhase2Active);
    const applyPreset       = useGameStore((s: any) => s.applyPreset);
    const actionLog         = useGameStore((s: any) => s.actionLog);
    const setupLocked       = useGameStore((s: any) => s.setupLocked);
    const currentTurnIndex  = useGameStore((s: any) => s.currentTurnIndex);
    const gamePhase         = useGameStore((s: any) => s.gamePhase);
    const selectedRegion    = useGameStore((s: any) => s.selectedRegion);
    const onMap             = gamePhase === 'map';

    // Build the boss options scoped to the active region.
    // Outside of battle (no region yet), fall back to showing all bosses.
    const regionCfg = selectedRegion ? REGION_BOSSES[selectedRegion] : null;
    const bossOptions: string[] = regionCfg
        ? [regionCfg.mini, regionCfg.main]
        : Object.values(REGION_BOSSES).flatMap(r => [r.mini, r.main]);

    // Determine whose boss turn it is
    const isBossActiveTurn    = setupLocked ? (phase2 ? currentTurnIndex === 5 : (currentTurnIndex === 4 || currentTurnIndex === 5)) : false;
    const isMinokawaActiveTurn = setupLocked ? currentTurnIndex === 4 : false;

    const { entityAttack, minokawaAttack } = useCombat();

    const [bossTarget, setBossTarget]         = useState('player1');
    const [minokawaTarget, setMinokawaTarget] = useState('player1');

    const bossSkillList     = (bossSkills as any)[currentBoss] ?? [];
    const minokawaSkillList = (bossSkills as any)['Minokawa'] ?? [];

    return (
        <div className="boss-container" style={onMap ? { opacity: 0.35, pointerEvents: 'none' } : undefined}>
            {/* Preset selector */}
            <label>Select Preset:
                <select value={currentBoss}
                    onChange={e => applyPreset('boss', e.target.value)}>
                    {bossOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </label>

            {/* Main boss */}
            <SingleBoss
                bossId="boss"
                title={phase2 ? 'Bakunawa' : 'Boss'}
                skills={bossSkillList}
                target={bossTarget}
                setTarget={setBossTarget}
                isTurnActive={isBossActiveTurn}
                onSkill={(idx: number, tgt: string) => entityAttack(idx, tgt)}
            />

            {/* Phase 2: Minokawa */}
            {phase2 && (
                <>
                    <hr style={{ borderColor: '#ff4444', margin: '12px 0' }} />
                    <SingleBoss
                        bossId="boss2"
                        title="Minokawa"
                        skills={minokawaSkillList}
                        target={minokawaTarget}
                        setTarget={setMinokawaTarget}
                        isTurnActive={isMinokawaActiveTurn}
                        onSkill={(idx: number, tgt: string) => minokawaAttack(idx, tgt)}
                    />
                </>
            )}

            {/* Damage log */}
            <div id="damage-log">
                {[...actionLog].reverse().slice(0, 20).map((msg: string, i: number) => (
                    <div key={i} style={{ marginBottom: 2 }}>{msg}</div>
                ))}
            </div>

            {/* Logo */}
            <div className="logo-container">
                <img src="/asset/Balangay of the Forgotten.png"
                    alt="Balangay of the Forgotten" className="game-logo" />
            </div>
        </div>
    );
}
