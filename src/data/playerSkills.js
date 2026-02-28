export const playerSkills = {
    player1: [
        { name: "Attack", flatdamage: 50, damagePercent: 1.5, cooldown: 1, description: "Deals fair damage." },
        { name: "Heavy Attack", damagePercent: 3.34, cooldown: 2, bonecracked_if_active: true, duration: 1, reduce_enemyDEF: 0.1, description: "Deals heavy damage." },
        { name: "All-in Attack", damagePercent: 8.34, cooldown: 3, description: "Deals massive damage." },
        { name: "Rest", remove_debuff: true, cooldown: 3, description: "Removes negative status effects for self." },
        { name: "Berserk", HP_requirement_from_maxHP_below: 0.51, mandirigma_rage: true, dmgMultiplier_increase: 0.5, defIgnore: 0.2, duration: 3, cooldown: 4, description: "Increases damage for 2 turns." }
    ],
    player2: [
        { name: "Shield Bash", flatdamage: 50, damagePercent: 1, cooldown: 1, description: "Deals small damage to the boss." },
        { name: "Fortify", maxHp_perc: 0.3, cooldown: 4, description: "Gain shield for himself for 2 turns." },
        { name: "Last Stand", HP_requirement_from_maxHP_below: 0.2, last_stand: true, defIncrease: 0.5, cooldown: 4, description: "Gain defense, if low HP for 3 turns." },
        { name: "Guardian’s Oath", currHP_sac: 0.25, currHP_shield: 0.25, cooldown: 4, description: "Sacrifice HP, shield all allies, unstackable." },
        { name: "Taunt", boss_taunted: true, taunted_turns: 2, cooldown: 2, description: "Boss targets you." }
    ],
    player3: [
        { name: "Heal", heal_flat: 100, magPercent_heal: 0.5, self_heal: 0.5, cooldown: 2, description: "Restore HP to ally, and heals self." },
        { name: "Blessing", blessing: true, duration: 2, dmgMultiplier_increase: 0.5, cooldown: 3, description: "Buffs ally dmg (2 turns)." },
        { name: "Mana Surge", damagePercent: 1, cooldown: 2, description: "Deals damage to the enemy." },
        { name: "Purify", remove_debuff: true, hitsAll: true, cooldown: 2, description: "Removes all debuff to all players." },
        { name: "Sacrifice", Hpflat_sac: 200, heal_flat: 50, magPercent_heal: 1, cooldown: 3, description: "Lose HP, heal all allies HP" },
    ],
    player4: [
        { name: "Quick Shot", flatdamage: 150, damagePercent: 1.5, cooldown: 1, description: "Deals fair damage." },
        { name: "Piercing Arrow", damagePercent: 2.25, defIgnore: 1, cooldown: 3, description: "Deals big damage, ignores defense." },
        { name: "Volley", flatdamage: 50, damagePercent: 1, cooldown: 1, description: "Deals fair damage to all enemies." },
        { name: "Focus Aim", focused_aim: true, duration: 2, defIgnore_buff: 0.2, cooldown: 4, description: "Next 2 attacks ignore some DEF." },
        { name: "Explosive Arrow", flatdamage: 300, damagePercent: 5, cooldown: 3, description: "Deals massive damage to all enemies." }
    ]
};