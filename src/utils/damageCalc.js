// Full damage formula ported from script.js
export function calculateDamage(attacker, target, damagePercent, flatdamage = 0, magPercentDamage = 0, defIgnore = 0, options = {}, state) {
    const {
        playersStats, bossInvulnerable, bathalaMandateBuff, baganiLastStandBuff,
        dungeonBuff2Active, dungeonBuff1Active, bonecrackedDebuffs, eyeDragonDebuffs,
        bindDebuffs, moonfallDebuffs, focusAimBuff, mandirigmaRageBuff,
        daybreakFuryBuff, strengthenedBuff, critActive
    } = state;

    // Boss invulnerability check
    if (target === 'boss' && bossInvulnerable?.turnsLeft > 0 && attacker !== 'boss') return 0;

    const dmgMultiplier = options.dmgMultiplier || 1;
    let def = playersStats[target]?.def || 0;

    // --- 1. DEF buffs ---
    if (target === 'boss' && bathalaMandateBuff?.turnsLeft > 0)
        def = Math.round(def * (1 + (bathalaMandateBuff.defIncrease || 0)));
    if (target === 'player2' && baganiLastStandBuff?.turnsLeft > 0)
        def = Math.round(def * (1 + (baganiLastStandBuff.defIncrease || 0)));
    if (target !== 'boss' && target !== 'boss2' && dungeonBuff2Active)
        def = Math.round(def * 1.25);

    // --- 2. DEF reductions ---
    if (bonecrackedDebuffs?.[target])
        def *= (1 - (bonecrackedDebuffs[target].defReduce || 0));
    // Eye of the Dragon only reduces player/non-boss DEF
    if (target !== 'boss' && target !== 'boss2' && eyeDragonDebuffs?.[target])
        def *= (1 - (eyeDragonDebuffs[target].defReduce || 0));
    // Bind debuff only reduces non-boss DEF
    if (target !== 'boss' && bindDebuffs?.[target])
        def *= (1 - (bindDebuffs[target].defReduce || 0));
    // Moonfall only reduces non-boss DEF
    if (target !== 'boss' && moonfallDebuffs?.[target])
        def *= (1 - (moonfallDebuffs[target].defReduce || 0));

    // --- 3. DEF ignore ---
    // Focus Aim (first pass)
    if (attacker !== 'boss' && focusAimBuff?.[attacker]?.turnsLeft > 0)
        def *= (1 - (focusAimBuff[attacker].defIgnore || 0));

    // Mandirigma Rage
    let rageActive = false;
    if (attacker === 'player1' && mandirigmaRageBuff?.turnsLeft > 0) {
        def *= (1 - (mandirigmaRageBuff.defIgnore || 0));
        rageActive = true;
    }

    // Daybreak Fury DEF ignore (boss attacker only)
    const daybreakActive = attacker === 'boss' &&
        daybreakFuryBuff?.turnsLeft > 0 &&
        ((daybreakFuryBuff.atkIncrease || 0) > 0 || (daybreakFuryBuff.defIgnore || 0) > 0);
    if (daybreakActive && (daybreakFuryBuff.defIgnore || 0) > 0)
        def *= (1 - daybreakFuryBuff.defIgnore);

    // Focus Aim (second pass — matches vanilla behaviour)
    if (attacker !== 'boss' && focusAimBuff?.[attacker]?.turnsLeft > 0)
        def *= (1 - (focusAimBuff[attacker].defIgnore || 0));

    // Skill-level DEF ignore
    def *= (1 - defIgnore);

    // --- 4. Damage calculation ---
    let dmg = 0;
    const attackerStats = playersStats[attacker];

    if (attacker === 'boss' || attacker === 'boss2') {
        let atk = attackerStats.atk || 0;
        const mag = attackerStats.mag || 0;

        if (dmgMultiplier !== 1) {
            // Special combined multiplier (e.g. Celestial Judgement)
            const combined = (atk * (damagePercent || 0)) + (mag * (magPercentDamage || 0));
            dmg = (combined * dmgMultiplier) / (1.5 * (1 + def * 0.01));
        } else {
            const atkDamage = ((flatdamage || 0) + (atk * (damagePercent || 0))) / (1.5 * (1 + def * 0.01));
            const magDamage = ((flatdamage || 0) + (mag * (magPercentDamage || 0))) / (1.5 * (1 + def * 0.01));
            dmg = atkDamage + magDamage;
        }

        // Enraged (Daybreak Fury) — final DMG multiplier for boss
        if (daybreakActive && (daybreakFuryBuff.atkIncrease || 0) > 0)
            dmg = dmg * (1 + daybreakFuryBuff.atkIncrease);

        // Strengthened buff multiplier (consumption handled by caller via consumeStrengthened)
        if (strengthenedBuff?.[attacker]?.attacksLeft > 0)
            dmg *= (strengthenedBuff[attacker].multiplier || 1);

        dmg = Math.max(1, Math.round(dmg));

    } else {
        // Player damage formula
        const attackerATK = attackerStats.mag || attackerStats.atk || 0;
        let numerator = (flatdamage || 0) + attackerATK * (damagePercent || 0);

        if (state.blessingBuff?.[attacker] > 0) numerator *= 1.2;
        if (rageActive) numerator *= (1 + (mandirigmaRageBuff.dmgIncrease || 0));
        if (dungeonBuff1Active) numerator *= 1.15;

        dmg = Math.max(1, Math.round(numerator / (1 + def * 0.01)));
    }

    // Crit — applied post-rounding (matches vanilla)
    if (critActive) dmg = Math.round(dmg * 1.5);

    return dmg;
}