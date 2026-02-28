import { useGameStore } from '../store/gameStore';
import { calculateDamage } from '../utils/damageCalc';
import { playerSkills } from '../data/playerSkills';
import { bossSkills } from '../data/bossSkills';

export function useCombat() {
    // ----------------------------------------------------------------
    // PLAYER ATTACK
    // ----------------------------------------------------------------
    const attackEnemy = (player, skillIndex, enemyTarget, allyTarget, bonecrackedActive = false) => {
        const store = useGameStore.getState();

        if (store.deadEntities.has(player)) {
            store.logAction(`${player} cannot act: entity is dead.`);
            return;
        }

        // Block ALL actions when the current boss is dead — agos-oras does not bypass this
        const bossDead = store.deadEntities.has('boss') || (store.playersStats?.boss?.hp ?? 1) <= 0;
        if (bossDead) {
            store.logAction(`${player} cannot act: the boss is dead. Select the next boss or mini-boss.`);
            return;
        }

        const skillKey = `idx-${skillIndex}`;
        if (!store.dungeonBuff3Active && (store.cooldowns[player]?.[skillKey] || 0) > 0) {
            store.logAction(`${player} skill ${skillIndex + 1} is on cooldown (${store.cooldowns[player][skillKey]} rounds left).`);
            return;
        }

        if (!store.dungeonBuff3Active && store.actedThisTurn?.has(player)) {
            store.logAction(`${player} has already acted this turn.`);
            return;
        }

        const skill = playerSkills[player][skillIndex];
        const s = useGameStore.getState(); // fresh state

        // --- Focus Aim (self-buff) ---
        if (skill.focused_aim) {
            store.setFocusAimBuff(player, skill.duration || 2, skill.defIgnore_buff || 0.2);
            store.logAction(`${player} used ${skill.name}: For ${skill.duration || 2} turns ignore ${(skill.defIgnore_buff || 0.2) * 100}% DEF.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 4);
            store.markActed(player);
            return;
        }

        // --- Rest (Mandirigma) - cleanse self debuffs ---
        if (player === 'player1' && skill.remove_debuff && !skill.hitsAll) {
            store.cleansePlayerDebuffs(player);
            store.logAction(`${player} used ${skill.name}: Self debuffs removed.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 3);
            store.markActed(player);
            return;
        }

        // --- Berserk (Mandirigma) ---
        if (player === 'player1' && skill.mandirigma_rage) {
            const currentHp = s.playersStats[player]?.hp || 0;
            const maxHp = s.playersStats[player]?.maxHp || 1;
            if (currentHp / maxHp > (skill.HP_requirement_from_maxHP_below || 0.51)) {
                store.logAction(`${player} cannot use ${skill.name}: HP must be ≤50%.`);
                return;
            }
            store.setMandirigmaRage(skill.duration || 3, skill.dmgMultiplier_increase || 0.5, skill.defIgnore || 0.2);
            store.logAction(`${player} used ${skill.name}: +${(skill.dmgMultiplier_increase || 0.5) * 100}% DMG, ignore ${(skill.defIgnore || 0.2) * 100}% DEF for ${skill.duration || 3} turns.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 4);
            store.markActed(player);
            return;
        }

        // --- Last Stand (Bagani) ---
        if (player === 'player2' && skill.last_stand) {
            const currentHp = s.playersStats[player]?.hp || 0;
            const maxHp = s.playersStats[player]?.maxHp || 1;
            if (currentHp / maxHp > (skill.HP_requirement_from_maxHP_below || 0.2)) {
                store.logAction(`${player} cannot use ${skill.name}: HP must be ≤20%.`);
                return;
            }
            store.setBaganiLastStand(skill.duration || 3, skill.defIncrease || 0.5);
            store.logAction(`${player} used ${skill.name}: +${(skill.defIncrease || 0.5) * 100}% DEF for ${skill.duration || 3} turns.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 4);
            store.markActed(player);
            return;
        }

        // --- Purify (Babaylan) ---
        if (player === 'player3' && skill.remove_debuff && skill.hitsAll) {
            store.cleanseAllPlayersDebuffs();
            store.logAction(`${player} used ${skill.name}: All player debuffs removed.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 2);
            store.markActed(player);
            return;
        }

        // --- Blessing (Babaylan) ---
        if (skill.blessing) {
            store.setBlessingBuff(allyTarget || 'player1', skill.duration || 2);
            store.logAction(`${player} used ${skill.name} on ${allyTarget}: +20% DMG for ${skill.duration || 2} turns.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 3);
            store.markActed(player);
            return;
        }

        // --- Fortify (Bagani) ---
        if (player === 'player2' && typeof skill.maxHp_perc === 'number') {
            const fresh = useGameStore.getState();
            const maxHp = fresh.playersStats.player2?.maxHp || 1;
            const shieldAmt = Math.round(maxHp * skill.maxHp_perc);
            store.addShield('player2', shieldAmt, 2, false);
            store.logAction(`${player} used ${skill.name}: Gained ${shieldAmt} shield.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 4);
            store.markActed(player);
            return;
        }

        // --- Taunt (Bagani) ---
        if (skill.boss_taunted) {
            store.setTaunt(skill.taunted_turns || 2);
            store.logAction(`${player} used ${skill.name}: Boss will target Bagani for ${skill.taunted_turns || 2} turns.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 2);
            store.markActed(player);
            return;
        }

        // --- Guardian's Oath (Bagani) ---
        if (player === 'player2' && typeof skill.currHP_sac === 'number' && typeof skill.currHP_shield === 'number') {
            const fresh = useGameStore.getState();
            const currHp = fresh.playersStats.player2?.hp || 0;
            const sacAmt = Math.round(currHp * skill.currHP_sac);
            const shieldPerAlly = Math.round(currHp * skill.currHP_shield);
            if (sacAmt <= 0) { store.logAction('Not enough HP for Guardian\'s Oath.'); return; }
            store.reduceHPIgnoringShield('player2', sacAmt);
            ['player1', 'player3', 'player4'].forEach(p => {
                if (!useGameStore.getState().deadEntities.has(p))
                    store.addShield(p, shieldPerAlly, 2, true);
            });
            store.logAction(`${player} used ${skill.name}: Sacrificed ${sacAmt} HP, shielded allies for ${shieldPerAlly}.`);
            store.startCooldown(player, skillKey, skill.cooldown ?? 4);
            store.markActed(player);
            return;
        }

        // --- Heal / Sacrifice (Babaylan) ---
        if (skill.heal_flat || typeof skill.magPercent_heal === 'number' || skill.Hpflat_sac) {
            const fresh = useGameStore.getState();
            const casterStat = fresh.playersStats[player]?.mag || fresh.playersStats[player]?.atk || 0;
            const healAmt = Math.round((skill.heal_flat || 0) + casterStat * (skill.magPercent_heal || 0));

            if (skill.self_heal) {
                const selfHeal = Math.round(Number(skill.self_heal) * healAmt);
                store.adjustHP(player, selfHeal);
                store.logAction(`${player} used ${skill.name}: Healed self for ${selfHeal}.`);
            }

            if (skill.Hpflat_sac) {
                store.reduceHPIgnoringShield(player, skill.Hpflat_sac);
                ['player1', 'player2', 'player3', 'player4'].forEach(p => store.adjustHP(p, healAmt));
                store.logAction(`${player} used ${skill.name}: Sacrificed ${skill.Hpflat_sac} HP, healed all allies for ${healAmt}.`);
            } else {
                store.adjustHP(allyTarget || player, healAmt);
                store.logAction(`${player} used ${skill.name}: Healed ${allyTarget} for ${healAmt}.`);
            }

            store.startCooldown(player, skillKey, skill.cooldown ?? 2);
            store.markActed(player);
            return;
        }

        // --- Damage skills ---
        if (!skill.damagePercent && !skill.flatdamage) return;

        const fresh = useGameStore.getState();
        const target = enemyTarget || 'boss';

        // Block damage if the target boss is already dead
        if (fresh.deadEntities.has(target) || (fresh.playersStats[target]?.hp ?? 1) <= 0) {
            store.logAction(`${player} cannot attack: ${target} is already dead.`);
            return;
        }

        // Bone Cracked (Heavy Attack) - apply before damage
        if (player === 'player1' && skillIndex === 1 && bonecrackedActive) {
            store.setBonecracked(target, 1, 0.1);
            store.logAction(`Bone Cracked applied to ${target}: -10% DEF for 1 turn.`);
        }

        const isAoE = skill.hitsAll || skill.name?.includes('Volley') || skill.name?.includes('Explosive');

        const doHit = (tgt) => {
            const dmg = calculateDamage(player, tgt, skill.damagePercent || 0, skill.flatdamage || 0, 0, skill.defIgnore || 0, {}, useGameStore.getState());
            store.adjustHP(tgt, -dmg);
            store.logAction(`${player} used ${skill.name} on ${tgt}: Dealt ${dmg}`);
        };

        if (isAoE) {
            // Player AoE skills (Volley, Explosive Arrow) hit boss(es) only
            doHit('boss');
            if (fresh.bakunawaPhase2Active && (fresh.playersStats.boss2?.hp || 0) > 0)
                doHit('boss2');
        } else {
            doHit(target);
        }

        if (!store.dungeonBuff3Active)
            store.startCooldown(player, skillKey, skill.cooldown ?? 2);
        store.markActed(player);
    };

    // ----------------------------------------------------------------
    // BOSS ATTACK
    // ----------------------------------------------------------------
    const entityAttack = (skillIndex, target) => {
        const store = useGameStore.getState();
        if (store.deadEntities.has('boss')) {
            store.logAction('Boss cannot act: entity is dead.');
            return;
        }

        // Taunt override: redirect single-target attacks to player2 if alive
        const taunted = (store.tauntBuff?.turnsLeft || 0) > 0 && !store.deadEntities.has('player2');
        const effectiveTarget = taunted ? 'player2' : (target || 'player1');

        const preset = store.currentBoss;
        const skills = bossSkills[preset];
        if (!skills || !skills[skillIndex]) return;
        const skill = skills[skillIndex];
        const s = useGameStore.getState();

        // Mayari: Moonlight Grace
        if (skill.healPercent_maxHp) {
            const maxHp = s.playersStats.boss.maxHp || 1;
            const heal = Math.round(maxHp * skill.healPercent_maxHp);
            store.adjustHP('boss', heal);
            store.logAction(`${preset} used ${skill.name}: Healed self for ${heal} HP.`);
            return;
        }

        // Bathala: Heaven's Mandate
        if (skill.heavens_mandate) {
            store.setBathalaMandateBuff(skill.duration || 3, skill.def_increase || 0.3);
            if (skill.remove_debuff) store.cleanseBossDebuffs();
            store.logAction(`${preset} used ${skill.name}: +${(skill.def_increase || 0.3) * 100}% DEF for ${skill.duration || 3} turns.`);
            return;
        }

        // Mayari: Tide of Night
        if (skill.enemyDamage_currHp) {
            ['player1','player2','player3','player4'].forEach(p => {
                const curr = useGameStore.getState().playersStats[p]?.hp || 0;
                const dmg = Math.max(1, Math.round(curr * skill.enemyDamage_currHp));
                store.adjustHP(p, -dmg);
                store.logAction(`${preset} used ${skill.name} on ${p}: ${Math.round(skill.enemyDamage_currHp * 100)}% current HP (Dealt ${dmg})`);
            });
            if (skill.invulnerable_turn) store.setBossInvulnerable(skill.invulnerable_turn);
            if (skill.remove_debuff) store.cleanseBossDebuffs();
            return;
        }

        // Apolaki: Daybreak Fury
        if (skill.daybreak_fury) {
            const curr = useGameStore.getState().playersStats.boss?.hp || 0;
            const sac = Math.round(curr * (skill.currHP_sac || 0));
            if (sac > 0) store.reduceHPIgnoringShield('boss', sac);
            store.setDaybreakFuryBuff((skill.duration || 1) + 1, skill.atk_increase || 0, skill.defIgnore_buff || 0);
            store.logAction(`${preset} used ${skill.name}: Sacrificed ${sac} HP. Next turn +${(skill.atk_increase || 0) * 100}% ATK, ignore ${(skill.defIgnore_buff || 0) * 100}% DEF.`);
            return;
        }

        // Bakunawa: Eclipse Fang
        if (skill.healFrom_mag || skill.healFrom_magPerc) {
            const dmg = calculateDamage('boss', effectiveTarget, skill.damagePercent || 0, skill.flatdamage || 0, skill.magPercentDamage || 0, 0, {}, useGameStore.getState());
            store.consumeStrengthened('boss');
            store.adjustHP(effectiveTarget, -dmg);
            const bossMag = useGameStore.getState().playersStats.boss?.mag || 0;
            const heal = (skill.healFrom_mag || 0) + Math.round(bossMag * (skill.healFrom_magPerc || 0));
            store.adjustHP('boss', heal);
            store.logAction(`${preset} used ${skill.name} on ${effectiveTarget}: Dealt ${dmg}, healed self for ${heal}.`);
            return;
        }

        // Bakunawa: Serpent's Coil
        if (skill.bind_debuff) {
            const dmg = calculateDamage('boss', effectiveTarget, skill.damagePercent || 0, skill.flatdamage || 0, 0, 0, {}, useGameStore.getState());
            store.consumeStrengthened('boss');
            store.adjustHP(effectiveTarget, -dmg);
            store.setBindDebuff(effectiveTarget, skill.duration || 2, skill.reduce_enemyDEF || 0.15);
            store.logAction(`${preset} used ${skill.name} on ${effectiveTarget}: Dealt ${dmg}, applied Bind (-${(skill.reduce_enemyDEF || 0.15) * 100}% DEF) for ${skill.duration || 2} turns.`);
            return;
        }

        // Bakunawa: Lunar Devour
        if (skill.devoured_debuff) {
            ['player1','player2','player3','player4'].forEach(p => {
                const dmg = calculateDamage('boss', p, skill.damagePercent || 0, 0, skill.magPercentDamage || 0, 0, {}, useGameStore.getState());
                store.adjustHP(p, -dmg);
                store.setDevouredDebuff(p, skill.duration || 2, skill.devoured_dot_magperc || 0.2);
                store.logAction(`${preset} used ${skill.name} on ${p}: Dealt ${dmg}, applied Devoured.`);
            });
            store.consumeStrengthened('boss');
            return;
        }

        // Bakunawa: Shadow Dive
        if (skill.strengthened) {
            store.setStrengthenedBuff('boss', skill.strengthened_attack_num || 1, skill.strengthened_attack_mult || 2);
            store.logAction(`${preset} used ${skill.name}: Next ${skill.strengthened_attack_num || 1} attack(s) deal ${skill.strengthened_attack_mult || 2}x damage.`);
            return;
        }

        // Generic damage
        const applyDmg = (victim) => {
            const fresh = useGameStore.getState();
            const dmg = calculateDamage('boss', victim, skill.damagePercent || 0, skill.flatdamage || 0, skill.magPercentDamage || 0, skill.defIgnore || 0, { dmgMultiplier: skill.dmgMultiplier || 1 }, fresh);
            store.adjustHP(victim, -dmg);
            store.logAction(`${preset} used ${skill.name} on ${victim}: ${skill.description} (Dealt ${dmg})`);
        };

        if (skill.hitsAll) {
            ['player1','player2','player3','player4'].forEach(applyDmg);
        } else {
            applyDmg(effectiveTarget);
        }
        store.consumeStrengthened('boss');

        // Post-damage: Moonfall
        if (skill.moonfall_debuff) {
            store.setMoonfallDebuff(effectiveTarget, skill.duration || 2, skill.reduce_enemyDEF || 0.2);
            store.logAction(`Applied Moonfall to ${effectiveTarget}: -${(skill.reduce_enemyDEF || 0.2) * 100}% DEF for ${skill.duration || 2} turns.`);
        }
    };

    // ----------------------------------------------------------------
    // MINOKAWA ATTACK
    // ----------------------------------------------------------------
    const minokawaAttack = (skillIndex, target) => {
        const store = useGameStore.getState();
        if (store.deadEntities.has('boss2')) {
            store.logAction('Minokawa cannot act: entity is dead.');
            return;
        }

        // Taunt override: redirect single-target attacks to player2 if alive
        const taunted = (store.tauntBuff?.turnsLeft || 0) > 0 && !store.deadEntities.has('player2');
        const effectiveTarget = taunted ? 'player2' : (target || 'player1');

        const skills = bossSkills['Minokawa'];
        if (!skills || !skills[skillIndex]) return;
        const skill = skills[skillIndex];

        // Wing Tempest - AoE + Eye of the Dragon
        if (skill.eye_dragon) {
            ['player1','player2','player3','player4'].forEach(p => {
                const dmg = calculateDamage('boss2', p, skill.damagePercent || 0, 0, 0, 0, {}, useGameStore.getState());
                store.adjustHP(p, -dmg);
                store.setEyeDragonDebuff(p, skill.duration || 2, skill.reduce_enemyDEF || 0.1);
                store.logAction(`Minokawa used ${skill.name} on ${p}: Dealt ${dmg}, applied Eye of Dragon.`);
            });
            return;
        }

        // Sky's Wrath - damage + heal if target dies
        if (skill.maxHp_heal_if_defeatedhero) {
            const origHp = useGameStore.getState().playersStats[effectiveTarget]?.hp || 0;
            const dmg = calculateDamage('boss2', effectiveTarget, skill.damagePercent || 0, 0, 0, 0, {}, useGameStore.getState());
            store.consumeStrengthened('boss2');
            store.adjustHP(effectiveTarget, -dmg);
            store.logAction(`Minokawa used ${skill.name} on ${effectiveTarget}: Dealt ${dmg}.`);
            if (origHp > 0 && (useGameStore.getState().playersStats[effectiveTarget]?.hp || 0) <= 0) {
                const maxHp = useGameStore.getState().playersStats.boss2?.maxHp || 1;
                const heal = Math.round(maxHp * skill.maxHp_heal_if_defeatedhero);
                store.adjustHP('boss2', heal);
                store.logAction(`${effectiveTarget} defeated! Minokawa healed for ${heal}.`);
            }
            return;
        }

        // Generic
        const applyDmg = (victim) => {
            const dmg = calculateDamage('boss2', victim, skill.damagePercent || 0, 0, skill.magPercentDamage || 0, skill.defIgnore || 0, {}, useGameStore.getState());
            store.adjustHP(victim, -dmg);
            store.logAction(`Minokawa used ${skill.name} on ${victim}: Dealt ${dmg}.`);
        };

        if (skill.hitsAll) ['player1','player2','player3','player4'].forEach(applyDmg);
        else applyDmg(effectiveTarget);
        store.consumeStrengthened('boss2');
    };

    return { attackEnemy, entityAttack, minokawaAttack };
}