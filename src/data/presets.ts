export const presets = {
    player1: {
        glassCanon: { hp: 650, atk: 120, def: 60 }, // Glass Canon
        bruiser: { hp: 800, atk: 90, def: 90 },     // Bruiser
        berserker: { hp: 700, atk: 100, def: 75 }   // Berserker
    },
    player2: {
        wall: { hp: 1050, atk: 30, def: 250 },          // Wall
        juggernaut: { hp: 1000, atk: 60, def: 190 },    // Juggernaut
        damageSoaker: { hp: 1200, atk: 40, def: 160 }   // Damage Soaker
    },
    player3: {
        pureHealer: { hp: 500, mag: 220, def: 70 },       // Pure Healer
        supportCleric: { hp: 650, mag: 200, def: 80 },    // Support Cleric
        battlePriest: { hp: 800, mag: 180, def: 130 }     // Battle Priest
    },
    player4: {
        sniper: { hp: 600, atk: 110, def: 50 },       // Sniper
        ranger: { hp: 700, atk: 90, def: 100 },       // Ranger
        hunter: { hp: 750, atk: 100, def: 80 }        // Hunter
    },
    boss: {
        Bathala: { hp: 2800, atk: 110, mag: 250, def: 200 },
        Mayari: { hp: 2100, atk: 300, mag: 120, def: 180 },
        Apolaki: { hp: 1700, atk: 360, mag: 70, def: 150 },
        Bakunawa: { hp: 2000, atk: 40, mag: 300, def: 190 },
        Minokawa: { hp: 2000, atk: 300, mag: 40, def: 190 }, // Total HP: Inherit from Bakunawa (See Bakunawa: Eat the Sun and Moon)
        Manananggal: { hp: 900, atk: 230, mag: 35, def: 100 },      // Assassin Type
        Tiyanak: { hp: 1150, atk: 50, mag: 195, def: 125 },         // Trickster
        Siren: { hp: 1000, atk: 20, mag: 240, def: 80 },            // Mage
        Kapre: { hp: 1300, atk: 200, mag: 0, def: 150 },            // Tank
    }
};