import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../store/gameStore';
import { useCombat } from '../../hooks/useCombat';
import { useEntityEffects } from '../../hooks/useBuffs';
import { playerSkills, presets } from '../../data';
import { HPBar } from '../shared/HPBar';
import { StatusEffects } from '../shared/StatusEffects';
import { SkillButton } from './SkillButton';

const PLAYER_NAMES: Record<string, string> = {
    player1: 'Mandirigma',
    player2: 'Bagani',
    player3: 'Babaylan',
    player4: 'Mangangayaw',
};

const PRESET_LABELS: Record<string, Record<string, string>> = {
    player1: { glassCanon: 'Glass Canon', bruiser: 'Bruiser', berserker: 'Berserker' },
    player2: { wall: 'Wall', juggernaut: 'Juggernaut', damageSoaker: 'Damage Soaker' },
    player3: { pureHealer: 'Pure Healer', supportCleric: 'Support Cleric', battlePriest: 'Battle Priest' },
    player4: { sniper: 'Sniper', ranger: 'Ranger', hunter: 'Hunter' },
};

export function PlayerCard({ playerId }: { playerId: string }) {
    // Select only primitives via useShallow — avoids shieldStacks:[] new-ref loop
    const stats = useGameStore(useShallow((s: any) => {
        const p = s.playersStats[playerId];
        return { hp: p?.hp ?? 0, maxHp: p?.maxHp ?? 1, atk: p?.atk ?? 0, def: p?.def ?? 0, mag: p?.mag ?? 0, shield: p?.shield ?? 0 };
    }));
    const cooldowns         = useGameStore(useShallow((s: any) => s.cooldowns[playerId] ?? {}));
    const dungeonBuff3      = useGameStore((s: any) => s.dungeonBuff3Active);
    const bakunawaPhase2    = useGameStore((s: any) => s.bakunawaPhase2Active);
    const applyPreset       = useGameStore((s: any) => s.applyPreset);
    const isDead            = useGameStore((s: any) => s.deadEntities.has(playerId));
    const hasActed          = useGameStore((s: any) => !s.dungeonBuff3Active && s.actedThisTurn?.has(playerId));
    const bossDead          = useGameStore((s: any) => s.deadEntities.has('boss') || (s.playersStats?.boss?.hp ?? 1) <= 0);
    const effects           = useEntityEffects(playerId);

    const { attackEnemy } = useCombat();

    const [enemyTarget, setEnemyTarget]  = useState('boss');
    const [allyTarget, setAllyTarget]    = useState(playerId);
    const [bonecrackedOn, setBonecracked] = useState(false);

    const skills        = (playerSkills as any)[playerId] ?? [];
    const playerPresets = (presets as any)[playerId] ?? {};
    const defaultPreset = (Object.keys(playerPresets)[0] ?? '') as string;
    const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
    const name          = PLAYER_NAMES[playerId];
    const showMag       = playerId === 'player3';

    return (
        <div className={`player-container${isDead ? ' dead' : ''}${hasActed ? ' acted' : ''}${bossDead ? ' boss-dead' : ''}`}
            style={bossDead
                ? { opacity: 0.4, filter: 'grayscale(1)', pointerEvents: 'none' }
                : hasActed ? { opacity: 0.5, filter: 'grayscale(0.8)', pointerEvents: 'none' } : undefined}>
            <h2>{name}{bossDead && <span style={{ marginLeft: 8, fontSize: '0.7em', color: '#ff4444' }}>⚔ Boss Dead — Select Next</span>}</h2>

            {/* Preset */}
            <div className="controls">
                <label>Select Preset:
                    <select value={selectedPreset}
                        onChange={e => { setSelectedPreset(e.target.value); applyPreset(playerId, e.target.value); }}>
                        {Object.entries(PRESET_LABELS[playerId]).map(([k, label]) => (
                            <option key={k} value={k}>{label as string}</option>
                        ))}
                    </select>
                </label>

                {/* Attack target */}
                <label>Attack Target:
                    <select value={enemyTarget} onChange={e => setEnemyTarget(e.target.value)}>
                        <option value="boss">Boss</option>
                        {bakunawaPhase2 && <option value="boss2">Minokawa</option>}
                    </select>
                </label>

                {/* Support target (Bagani & Babaylan) */}
                {(playerId === 'player2' || playerId === 'player3') && (
                    <label>Support Target:
                        <select value={allyTarget} onChange={e => setAllyTarget(e.target.value)}>
                            <option value="player1">Mandirigma</option>
                            <option value="player2">Bagani</option>
                            <option value="player3">Babaylan</option>
                            <option value="player4">Mangangayaw</option>
                        </select>
                    </label>
                )}

                {/* Bone Cracked toggle (Mandirigma only) */}
                {playerId === 'player1' && (
                    <label>
                        <input type="checkbox" checked={bonecrackedOn}
                            onChange={e => setBonecracked(e.target.checked)} />
                        Inflict Bone Cracked (-10% DEF for 1 turn)
                    </label>
                )}
            </div>

            {/* HP Bar */}
            <HPBar current={stats?.hp ?? 0} max={stats?.maxHp ?? 1} shield={stats?.shield ?? 0} id={playerId} />

            {/* Stats */}
            <div className="stats">
                <div className="stat">HP: <span>{isDead ? '0 (DEAD)' : stats?.hp ?? 0}</span></div>
                <div className="stat">{showMag ? 'MAG' : 'ATK'}: <span>{showMag ? stats?.mag ?? 0 : stats?.atk ?? 0}</span></div>
                <div className="stat">DEF: <span>{stats?.def ?? 0}</span></div>
            </div>

            {/* Status effects */}
            <StatusEffects effects={effects} />

            {/* Skills */}
            <div className="skills">
                {skills.map((skill: any, idx: number) => {
                    const key = `idx-${idx}`;
                    const cd  = cooldowns?.[key] || 0;
                    return (
                        <SkillButton
                            key={idx}
                            skill={skill}
                            cooldown={cd}
                            dungeonBuff3Active={dungeonBuff3}
                            onClick={() => attackEnemy(playerId, idx, enemyTarget, allyTarget, bonecrackedOn)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
