export const bossSkills = {
    Bathala: [
        { name: "Heaven's Mandate (Buff)", heavens_mandate: true, def_increase: 0.3, remove_debuff: true, duration: 3, description: "Increase DEF 30% for 3 turns, removes debuff, unstackable" },
        { name: "Skyhammer (Single Target)", magPercentDamage: 1.75, description: "175% MAG on a player, 30% chance to stun 1p" },
        { name: "Thunderous Decree (AoE)", magPercentDamage: 1.25, hitsAll: true, description: "125% MAG on all players, 30% stun 2p" },
        { name: "Celestial Judgement (Ultimate)", damagePercent: 1, magPercentDamage: 1, dmgMultiplier: 3, description: "combine ATK and MAG with a multiplier of 3.0, rest 1 turn" }
    ],
    Mayari: [
        { name: "Moonlight Grace (Heal)", healPercent_maxHp: 0.25, description: "Heals self for 25% of max HP." },
        { name: "Lunar Strike (Single Target)", damagePercent: 1.15, magPercentDamage: 0.2, description: "115% ATK + 20% MAG." },
        { name: "Moonfall Spear (Single Target, Debuff)", damagePercent: 1.05, moonfall_debuff: true, reduce_enemyDEF: 0.2, duration: 2, description: "Deals 105% ATK + Moonfall to a player." },
        { name: "Tide of Night (Buff, Low AoE Damage)", enemyDamage_currHp: 0.3, invulnerable_turn: 1, remove_debuff: true, hitsAll: true, description: "Creates a mist that will damage all its opponent 30% to its current HP, remove debuff" }
    ],
    Apolaki: [
        { name: "Solar Flare Slash (Damage)", damagePercent: 1.75, description: "Deals 175% ATK to a player." },
        { name: "Radiant Charge (Dash Attack)", damagePercent: 0.8, magPercentDamage: 1, hitsAll: true, description: "Deals 80% ATK + 100% MAG to all players." },
        { name: "Daybreak Fury (Self Buff)", daybreak_fury: true, atk_increase: 0.4, defIgnore_buff: 0.2, currHP_sac: 0.3, duration: 1, description: "Increase 40% of its ATK and ignores 20% DEF for the next turn. Sacrifice 30% current HP" },
        { name: "Sunburst Nova (AoE Burst)", damagePercent: 1, magPercentDamage: 1.25, dmgMultiplier: 1.2, hitsAll: true, description: "Deals 1.2x(100% ATK + 125% MAG), dealing AOE damage to all enemies." }
    ],
    Bakunawa: [
        { name: "Eclipse Fang (Damage, Lifesteal)", healFrom_mag: 50, healFrom_magPerc: 1, magPercentDamage: 1.10, description: "Deals 110% MAG as damage to a single target, heals itself for 50 (+100%) MAG." },
        { name: "Serpent’s Coil (Debuff, Slight Damage)", bind_debuff: true, reduce_enemyDEF: 0.15, duration: 2, flatdamage: 50, damagePercent: 1.5, description: "Deal 50 (+150%) ATK damage, binds enemy" },
        { name: "Lunar Devour (AoE, Debuff)", magPercentDamage: 0.8, hitsAll: true, devoured_debuff: true, devoured_dot_magperc: 0.2, duration: 2, description: "Deal 80% MAG to all enemies. Each enemy hit gets Devoured." },
        { name: "Shadow Dive (Counter)", strengthened: true, strengthened_attack_num: 1, strengthened_attack_mult: 2, description: "Bakunawa will recharge its inner magical power, next attack deals double damage." }
    ],
    Minokawa: [
        { name: "Solar Devour (Single Damage)", damagePercent: 0.9, defIgnore: 0.1, description: "Deal 90% ATK, ignore 10% DEF." },
        { name: "Wing Tempest (AOE Damage)", damagePercent: 0.8, hitsAll: true, eye_dragon: true, duration: 2, reduce_enemyDEF: 0.1, description: "Deals 80% ATK damage to all enemies. Each target that are hit by this gets inflicted by Eye of the Dragon" },
        { name: "Brave Slash (Magic AOE)", damagePercent: 0.8, magPercentDamage: 1, hitsAll: true, description: "Create a powerful air slash, dealing 80% ATK + 100% MAG." },
        { name: "Sky’s Wrath (Single Damage, Heal)", damagePercent: 1.8, maxHp_heal_if_defeatedhero: 0.2, description: "Deals 180% ATK to one target, if the target is defeated, it heals itself 20% of its max HP" }
    ],
    Manananggal: [
        { name: "Batwing Slash", damagePercent: 1.2, description: "Deals 1.2x ATK to one enemy." },
        { name: "Blood Splash", damagePercent: 1.5, description: "Deals 1.5x ATK to single enemies." },
        { name: "Split Body", damagePercent: 1.6, hitsAll: true, description: "Deals 1.6x ATK to all enemies." }
    ],
    Tiyanak: [
        { name: "Claw Latch", magPercentDamage: 1.2, description: "Deals 1.2x MAG to one enemy." },
        { name: "Blood Hex", magPercentDamage: 1.5, description: "Deals 1.5x MAG to single enemies." },
        { name: "Demonic Wail", magPercentDamage: 1.6, hitsAll: true, description: "Deals 1.6x MAG to all enemies." }
    ],
    Siren: [
        { name: "Drowning Current", magPercentDamage: 1.2, description: "Deals 1.2x MAG to one enemy." },
        { name: "Tidal Surge", magPercentDamage: 1.5, description: "Deals 1.5x MAG to single enemies." },
        { name: "Moonlight Hymn", magPercentDamage: 1.6, hitsAll: true, description: "Deals 1.6x MAG to all enemies." }
    ],
    Kapre: [
        { name: "Tree Smash", damagePercent: 1.2, description: "Deals 1.2x ATK to one enemy." },
        { name: "Uproot Smash", damagePercent: 1.5, description: "Deals 1.5x ATK to single enemies." },
        { name: "Forest Wrath", damagePercent: 1.6, hitsAll: true, description: "Deals 1.6x ATK to all enemies." }
    ]

};