import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Returns a stable array of status effects for any entity.
 * Uses JSON.stringify in the selector (returns a primitive string) so Zustand 5
 * never sees a new reference — no infinite update loop.
 */
export function useEntityEffects(entity) {
    const effectsJson = useGameStore(s => JSON.stringify(collectEffects(entity, s)));
    return useMemo(() => {
        try { return JSON.parse(effectsJson); } catch { return []; }
    }, [effectsJson]);
}

export function collectEffects(entity, s) {
    const effects = [];

    const push = (name, type, turns, description) => effects.push({ name, type, turns, description });

    // Player buffs
    if (entity === 'player1' && s.mandirigmaRageBuff?.turnsLeft > 0)
        push('Enraged', 'buff', s.mandirigmaRageBuff.turnsLeft, 'dmg+50%, defIgnore+20%, hit+20%');

    if (entity === 'player2' && s.baganiLastStandBuff?.turnsLeft > 0)
        push('On Guard', 'buff', s.baganiLastStandBuff.turnsLeft, 'def+40%');

    if (entity === 'player2' && s.tauntBuff?.turnsLeft > 0)
        push('Taunt', 'buff', s.tauntBuff.turnsLeft, 'boss targets Bagani');

    if (s.blessingBuff?.[entity] > 0)
        push('Blessing', 'buff', s.blessingBuff[entity], 'dmg+20%');

    if (s.focusAimBuff?.[entity]?.turnsLeft > 0)
        push('Focused Aim', 'buff', s.focusAimBuff[entity].turnsLeft, 'defignore+20%');

    // Boss buffs
    if (entity === 'boss' && s.bathalaMandateBuff?.turnsLeft > 0)
        push('On Guard', 'buff', s.bathalaMandateBuff.turnsLeft, 'def+40%');

    if (entity === 'boss' && s.daybreakFuryBuff?.turnsLeft > 0)
        push('Enraged', 'buff', s.daybreakFuryBuff.turnsLeft, 'dmg+50%, defIgnore+20%, hit+20%');

    if ((entity === 'boss' || entity === 'boss2') && s.strengthenedBuff?.[entity]?.attacksLeft > 0)
        push('Strengthened', 'buff', s.strengthenedBuff[entity].attacksLeft, 'next dmg x2');

    if (entity === 'boss' && s.bossInvulnerable?.turnsLeft > 0)
        push('Invulnerable', 'buff', s.bossInvulnerable.turnsLeft, 'immune to damage');

    // Taunted debuff on boss/boss2
    if ((entity === 'boss' || entity === 'boss2') && s.tauntBuff?.turnsLeft > 0)
        push('Taunted', 'debuff', s.tauntBuff.turnsLeft, 'forced to target Bagani');
    if (s.bonecrackedDebuffs?.[entity])
        push('Bonecracked', 'debuff', s.bonecrackedDebuffs[entity].turnsLeft, 'def-10%');

    if (s.bindDebuffs?.[entity])
        push('Bind', 'debuff', s.bindDebuffs[entity].turnsLeft, 'def-15%');

    if (s.moonfallDebuffs?.[entity])
        push('Moonfall', 'debuff', s.moonfallDebuffs[entity].turnsLeft, 'def-20%');

    if (s.eyeDragonDebuffs?.[entity])
        push('Eye of the Dragon', 'debuff', s.eyeDragonDebuffs[entity].turnsLeft, 'def-10%');

    if (s.devouredDebuffs?.[entity])
        push('Devoured', 'debuff', s.devouredDebuffs[entity].turnsLeft, 'DoT 20%MAG');

    // Dungeon buffs (players only)
    if (entity !== 'boss' && entity !== 'boss2') {
        if (s.dungeonBuff1Active) push('Balaraw Buff',    'buff', '∞', 'dmg+15%');
        if (s.dungeonBuff2Active) push('Kalasag Buff',   'buff', '∞', 'def+25%');
        if (s.dungeonBuff3Active) push('Agos-Oras Buff', 'buff', '∞', 'no cooldown');
    }

    return effects;
}
