import { create } from 'zustand';
import { presets } from '../data/presets';

// ---------- helper tick functions ----------
function tickBuff(buff: any) {
    if (!buff || buff.turnsLeft <= 0) return buff;
    return { ...buff, turnsLeft: Math.max(0, buff.turnsLeft - 1) };
}
function tickBuffMap(map: any) {
    const result: any = {};
    Object.entries(map || {}).forEach(([k, v]: any) => {
        const newV = typeof v === 'number' ? v - 1 : { ...v, turnsLeft: (v.turnsLeft || 0) - 1 };
        const left = typeof newV === 'number' ? newV : newV.turnsLeft;
        if (left > 0) result[k] = newV;
    });
    return result;
}
function tickDebuffMap(map: any) {
    const result: any = {};
    Object.entries(map || {}).forEach(([k, v]: any) => {
        const newTurns = (v.turnsLeft || 0) - 1;
        if (newTurns > 0) result[k] = { ...v, turnsLeft: newTurns };
    });
    return result;
}

// ---------- store ----------
export const useGameStore = create((set, get: any) => ({
    // Stats
    playersStats: {
        player1: { hp: 100, atk: 20, def: 10, maxHp: 100, shield: 0, shieldStacks: [] as any[] },
        player2: { hp: 100, atk: 25, def: 15, maxHp: 100, shield: 0, shieldStacks: [] as any[] },
        player3: { hp: 100, atk: 30, def: 20, maxHp: 100, shield: 0, shieldStacks: [] as any[] },
        player4: { hp: 100, atk: 35, def: 25, maxHp: 100, shield: 0, shieldStacks: [] as any[] },
        boss:  { hp: 200, atk: 50, mag: 50, def: 30, maxHp: 200, shield: 0, shieldStacks: [] as any[] },
        boss2: { hp: 0,   atk: 0,  mag: 0,  def: 0,  maxHp: 0,   shield: 0, shieldStacks: [] as any[] },
    } as Record<string, any>,

    // Round
    currentRound: 1,
    currentBoss: 'Bathala',
    bakunawaPhase2Active: false,

    // Cooldowns
    cooldowns: { player1: {}, player2: {}, player3: {}, player4: {} } as Record<string, Record<string, number>>,

    // Buffs
    critActive: false,
    mandirigmaRageBuff: { turnsLeft: 0, dmgIncrease: 0, defIgnore: 0 },
    baganiLastStandBuff: { turnsLeft: 0, defIncrease: 0 },
    bathalaMandateBuff:  { turnsLeft: 0, defIncrease: 0 },
    daybreakFuryBuff:    { turnsLeft: 0, atkIncrease: 0, defIgnore: 0 },
    blessingBuff:  {} as Record<string, number>,
    focusAimBuff:  {} as Record<string, any>,
    strengthenedBuff: {} as Record<string, any>,
    bossInvulnerable: { turnsLeft: 0 },

    // Debuffs
    bonecrackedDebuffs: {} as Record<string, any>,
    bindDebuffs:        {} as Record<string, any>,
    moonfallDebuffs:    {} as Record<string, any>,
    eyeDragonDebuffs:   {} as Record<string, any>,
    devouredDebuffs:    {} as Record<string, any>,

    // Dungeon buffs
    dungeonBuff1Active: false,
    dungeonBuff2Active: false,
    dungeonBuff3Active: false,

    // Taunt
    tauntBuff: { turnsLeft: 0 },

    // Turn tracking
    actedThisTurn: new Set<string>(),

    // Dead tracking
    deadEntities: new Set<string>(),
    deadBosses:   new Set<string>(),
    deadPlayers:  new Set<string>(),

    // Turn order / setup
    setupLocked: false,
    turnOrderConfig: {
        player1: { preset: 'glassCanon', order: 1 },
        player2: { preset: 'wall',       order: 2 },
        player3: { preset: 'pureHealer', order: 3 },
        player4: { preset: 'sniper',     order: 4 },
    } as Record<string, { preset: string; order: number }>,
    turnSequence: ['player1','player2','player3','player4'] as string[],
    currentTurnIndex: -1,

    // Action log
    actionLog: [] as string[],

    // Game flow
    gamePhase: 'setup' as 'setup' | 'map' | 'battle' | 'ending',
    selectedRegion: null as string | null,
    activeBanner: null as string | null,

    // ---- actions ----

    logAction: (message: string) => set((state: any) => ({
        actionLog: [...state.actionLog.slice(-99), message]
    })),

    markActed: (player: string) => set((state: any) => ({
        actedThisTurn: new Set([...state.actedThisTurn, player])
    })),

    clearActedThisTurn: () => set({ actedThisTurn: new Set<string>() }),

    setTaunt: (turns: number) => set({ tauntBuff: { turnsLeft: turns } }),

    isDead: (entity: string) => {
        const s = get();
        return s.deadEntities.has(entity) || (s.playersStats[entity]?.hp || 0) <= 0;
    },

    adjustHP: (entity: string, change: number) => {
      set((state: any) => {
        const stats = { ...state.playersStats };
        const es = { ...stats[entity] };
        const maxHp = es.maxHp || es.hp || 1;

        if (change > 0 && state.deadEntities.has(entity)) return {};

        const newDead = new Set(state.deadEntities);
        const newDeadPlayers = new Set(state.deadPlayers);
        const newDeadBosses = new Set(state.deadBosses);

        if (change < 0) {
            let remaining = Math.abs(change);
            const shield = es.shield || 0;
            if (shield > 0 && remaining > 0) {
                // Consume from shieldStacks oldest-first (matches vanilla consumeShieldStacks)
                let stacks = [...(es.shieldStacks || [])];
                let toAbsorb = Math.min(shield, remaining);
                let absorbed = 0;
                for (let i = 0; i < stacks.length && toAbsorb > 0;) {
                    const take = Math.min(stacks[i].amount || 0, toAbsorb);
                    stacks[i] = { ...stacks[i], amount: stacks[i].amount - take };
                    toAbsorb -= take;
                    absorbed += take;
                    if (stacks[i].amount <= 0) stacks.splice(i, 1);
                    else i++;
                }
                es.shieldStacks = stacks;
                es.shield = stacks.reduce((s: number, sk: any) => s + (sk.amount || 0), 0);
                remaining -= absorbed;
            }
            es.hp = Math.max(0, (es.hp || 0) - remaining);
        } else {
            es.hp = Math.min(maxHp, (es.hp || 0) + change);
        }

        stats[entity] = es;

        if (es.hp <= 0 && !newDead.has(entity)) {
            newDead.add(entity);
            if (entity.startsWith('player')) newDeadPlayers.add(entity);
            if (entity === 'boss') newDeadBosses.add(state.currentBoss);
        }

        // Bakunawa phase check
        let bakunawaPhase2Active = state.bakunawaPhase2Active;
        let boss2Stats = { ...stats.boss2 };
        let actionLog = state.actionLog;

        if (entity === 'boss' && !bakunawaPhase2Active && state.currentBoss === 'Bakunawa') {
            const maxHP = stats.boss?.maxHp || 1;
            if (es.hp <= maxHP * 0.5 && es.hp > 0) {
                bakunawaPhase2Active = true;
                const minokawaHp = Math.round(es.hp * 0.5);
                const healAmount = Math.round(maxHP * 0.2);
                es.hp = Math.min(maxHP, es.hp + healAmount);
                stats.boss = { ...es };
                boss2Stats = {
                    hp: Math.min(maxHP, minokawaHp + healAmount),
                    maxHp: maxHP,
                    atk: presets.boss.Minokawa.atk, mag: presets.boss.Minokawa.mag, def: presets.boss.Minokawa.def,
                    shield: 0, shieldStacks: []
                };
                stats.boss2 = boss2Stats;
                actionLog = [...actionLog, `Phase 2: Minokawa spawned! Both bosses healed for ${healAmount}.`];
            }
        }

        return { playersStats: stats, deadEntities: newDead, deadPlayers: newDeadPlayers, deadBosses: newDeadBosses, bakunawaPhase2Active, actionLog };
      });
      // ---- post-update: auto boss-switch, victory, defeat triggers ----
      const MINI_BOSSES = new Set(['Tiyanak', 'Siren', 'Manananggal', 'Kapre']);
      const MAIN_BOSSES = new Set(['Apolaki', 'Bakunawa', 'Mayari', 'Bathala']);
      const PLAYERS = ['player1','player2','player3','player4'];
      const s = get();
      if (s.gamePhase !== 'battle') return;
      // Mini boss died → show victory banner and wait.
      // Admin manually switches preset to main boss to continue.
      if (entity === 'boss' && s.deadEntities.has('boss') && MINI_BOSSES.has(s.currentBoss) && s.selectedRegion) {
          set({ activeBanner: 'minivictory' });
          return;
      }
      // Main boss victory
      if (entity === 'boss' || entity === 'boss2') {
          const b1Dead = s.deadEntities.has('boss') || (s.playersStats?.boss?.hp ?? 1) <= 0;
          const b2Dead = (s.playersStats?.boss2?.hp ?? 0) <= 0;
          const allBossesDead = s.bakunawaPhase2Active ? (b1Dead && b2Dead) : b1Dead;
          if (allBossesDead && MAIN_BOSSES.has(s.currentBoss)) {
              if (s.currentBoss === 'Bathala') {
                  // Flow 5: show victory banner first; when viewer clicks it, ending.mp4 plays
                  set({ activeBanner: 'victory', gamePhase: 'ending' });
              } else {
                  (get() as any)._returnToMapWithBanner('victory');
              }
              return;
          }
      }
      // All players dead → defeat
      if (PLAYERS.every(p => s.deadEntities.has(p))) {
          (get() as any)._returnToMapWithBanner('defeat');
      }
    },

    _returnToMapWithBanner: (banner: string) => set((state: any) => {
        const players = ['player1','player2','player3','player4'];
        const newStats = { ...state.playersStats };
        players.forEach(p => {
            const es = { ...newStats[p] };
            es.hp = es.maxHp || es.hp;
            es.shield = 0; es.shieldStacks = [];
            newStats[p] = es;
        });
        const newDead = new Set([...state.deadEntities].filter((e: string) => !players.includes(e)));
        return {
            playersStats: newStats,
            deadEntities: newDead,
            deadPlayers: new Set<string>(),
            cooldowns: { player1: {}, player2: {}, player3: {}, player4: {} },
            mandirigmaRageBuff: { turnsLeft: 0, dmgIncrease: 0, defIgnore: 0 },
            baganiLastStandBuff: { turnsLeft: 0, defIncrease: 0 },
            bathalaMandateBuff:  { turnsLeft: 0, defIncrease: 0 },
            daybreakFuryBuff:    { turnsLeft: 0, atkIncrease: 0, defIgnore: 0 },
            blessingBuff: {}, focusAimBuff: {}, strengthenedBuff: {},
            bossInvulnerable: { turnsLeft: 0 },
            bonecrackedDebuffs: {}, bindDebuffs: {}, moonfallDebuffs: {},
            eyeDragonDebuffs: {}, devouredDebuffs: {},
            actedThisTurn: new Set<string>(),
            tauntBuff: { turnsLeft: 0 },
            bakunawaPhase2Active: false,
            currentRound: 1,
            currentTurnIndex: 0,
            gamePhase: 'map',
            activeBanner: banner,
        };
    }),

    reduceHPIgnoringShield: (entity: string, amount: number) => set((state: any) => {
        const stats = { ...state.playersStats };
        const es = { ...stats[entity] };
        const maxHp = es.maxHp || es.hp || 1;
        es.hp = Math.max(0, Math.min(maxHp, (es.hp || 0) - Math.abs(amount)));
        stats[entity] = es;
        return { playersStats: stats };
    }),

    addShield: (entity: string, amount: number, duration = 2, unstackable = false) => set((state: any) => {
        const stats = { ...state.playersStats };
        const es = { ...stats[entity] };
        let stacks = [...(es.shieldStacks || [])];

        if (unstackable) {
            const existingMax = stacks.reduce((m: number, s: any) => Math.max(m, s.amount || 0), 0);
            if (amount > existingMax) {
                stacks = [{ amount, turnsLeft: duration }];
            } else {
                const largest = stacks.reduce((a: any, b: any) => (a.amount >= b.amount ? a : b), stacks[0]);
                if (largest) largest.turnsLeft = duration;
            }
        } else {
            stacks.push({ amount, turnsLeft: duration });
        }

        es.shieldStacks = stacks;
        es.shield = stacks.reduce((s: number, sk: any) => s + (sk.amount || 0), 0);
        stats[entity] = es;
        return { playersStats: stats };
    }),

    applyPreset: (player: string, presetName: string) => {
        const state = get();
        const newStats = (presets as any)[player]?.[presetName];
        if (!newStats) return;

        // ---- Boss categories ----
        const MAIN_BOSSES  = ['Bathala','Mayari','Apolaki','Bakunawa','Minokawa'];
        const MINI_BOSSES  = ['Manananggal','Tiyanak','Siren','Kapre'];
        const isMainBoss   = (n: string) => MAIN_BOSSES.includes(n);
        const isMiniBoss   = (n: string) => MINI_BOSSES.includes(n);

        // ---- Non-boss preset (player stats) — no special logic ----
        if (player !== 'boss') {
            set({
                playersStats: {
                    ...state.playersStats,
                    [player]: { ...state.playersStats[player], ...newStats, maxHp: newStats.hp, shield: 0, shieldStacks: [] },
                },
            });
            return;
        }

        // ---- Boss preset: same boss selected — just update stats ----
        if (state.currentBoss === presetName) {
            const deadBosses = new Set(state.deadBosses);
            const bossHp = deadBosses.has(presetName) ? 0 : newStats.hp;
            set({
                playersStats: {
                    ...state.playersStats,
                    boss: { ...newStats, maxHp: newStats.hp, hp: bossHp, shield: 0, shieldStacks: [] },
                },
            });
            return;
        }

        // ---- Boss switch: determine transition type ----
        const fromMiniBoss = isMiniBoss(state.currentBoss);
        const toMainBoss   = isMainBoss(presetName);
        const miniBossToMainBoss = fromMiniBoss && toMainBoss;

        // Shared reset always applied on any boss switch
        const sharedReset = {
            cooldowns: { player1: {}, player2: {}, player3: {}, player4: {} },
            mandirigmaRageBuff:  { turnsLeft: 0, dmgIncrease: 0, defIgnore: 0 },
            baganiLastStandBuff: { turnsLeft: 0, defIncrease: 0 },
            bathalaMandateBuff:  { turnsLeft: 0, defIncrease: 0 },
            daybreakFuryBuff:    { turnsLeft: 0, atkIncrease: 0, defIgnore: 0 },
            blessingBuff: {}, focusAimBuff: {}, strengthenedBuff: {},
            bossInvulnerable: { turnsLeft: 0 },
            bonecrackedDebuffs: {}, bindDebuffs: {}, moonfallDebuffs: {},
            eyeDragonDebuffs: {}, devouredDebuffs: {},
            bakunawaPhase2Active: false,
            actedThisTurn: new Set<string>(),
            tauntBuff: { turnsLeft: 0 },
            critActive: false,
            currentTurnIndex: state.setupLocked ? 0 : -1,
        };

        // Build updated player stats
        const players = ['player1','player2','player3','player4'];
        const newPlayerStats = { ...state.playersStats };
        const newDead = new Set(state.deadEntities);
        const newDeadPlayers = new Set(state.deadPlayers);

        players.forEach(p => {
            const es = { ...newPlayerStats[p] };
            if (miniBossToMainBoss) {
                // Mini-boss → Boss: keep HP, only clear shields
                es.shield = 0;
                es.shieldStacks = [];
            } else {
                // All other transitions: full HP + shield reset, revive players
                es.hp = es.maxHp;
                es.shield = 0;
                es.shieldStacks = [];
                newDead.delete(p);
                newDeadPlayers.delete(p);
            }
            newPlayerStats[p] = es;
        });

        // Set new boss stats (keep hp=0 if this boss was already defeated)
        const deadBosses = new Set(state.deadBosses);
        const newBossHp = deadBosses.has(presetName) ? 0 : newStats.hp;
        newPlayerStats.boss  = { ...newStats, maxHp: newStats.hp, hp: newBossHp, shield: 0, shieldStacks: [] };
        newPlayerStats.boss2 = { hp: 0, atk: 0, mag: 0, def: 0, maxHp: 0, shield: 0, shieldStacks: [] };
        if (newBossHp <= 0) newDead.add('boss'); else newDead.delete('boss');

        set({
            ...sharedReset,
            playersStats: newPlayerStats,
            currentBoss: presetName,
            deadEntities: newDead,
            deadPlayers: newDeadPlayers,
            // When switching mini→main: show the mainboss battle intro banner
            // When switching anything else: leave activeBanner untouched (don't clear victory/defeat)
            ...(miniBossToMainBoss ? { activeBanner: 'mainboss' } : {}),
            // Append sentinel so viewer clears active skill cards
            actionLog: [...state.actionLog, '[boss_switch]'],
        });

        // Auto-hide the mainboss intro banner after 4 s
        if (miniBossToMainBoss) {
            setTimeout(() => {
                if ((get() as any).activeBanner === 'mainboss') set({ activeBanner: null });
            }, 4000);
        }
    },

    endRound: () => set((state: any) => {
        const newCooldowns = { ...state.cooldowns };
        const players = ['player1','player2','player3','player4'];
        players.forEach(p => {
            if (!state.deadEntities.has(p)) {
                newCooldowns[p] = Object.fromEntries(
                    Object.entries(newCooldowns[p] || {}).map(([k, v]: any) => [k, Math.max(0, v - 1)])
                );
            }
        });

        // Tick shield stacks
        const newStats = { ...state.playersStats };
        [...players, 'boss'].forEach(p => {
            const es = { ...newStats[p] };
            if (!es || !es.shieldStacks?.length) return;
            es.shieldStacks = es.shieldStacks.map((s: any) => ({ ...s, turnsLeft: s.turnsLeft - 1 })).filter((s: any) => s.turnsLeft > 0);
            es.shield = es.shieldStacks.reduce((t: number, s: any) => t + s.amount, 0);
            newStats[p] = es;
        });

        // Tick Devoured DoT
        let actionLog = [...state.actionLog];
        const bossMag = state.playersStats.boss?.mag || 0;
        const updatedStats = { ...newStats };
        const newDevouredDebuffs: any = {};
        Object.entries(state.devouredDebuffs || {}).forEach(([p, d]: any) => {
            const dotDmg = Math.max(1, Math.round(bossMag * (d.dotMagPerc || 0)));
            const es = { ...updatedStats[p] };
            es.hp = Math.max(0, (es.hp || 0) - dotDmg);
            updatedStats[p] = es;
            actionLog.push(`${p} takes ${dotDmg} Devoured DoT damage.`);
            const newTurns = (d.turnsLeft || 0) - 1;
            if (newTurns > 0) newDevouredDebuffs[p] = { ...d, turnsLeft: newTurns };
        });

        return {
            currentRound: state.currentRound + 1,
            actedThisTurn: new Set<string>(),
            cooldowns: newCooldowns,
            playersStats: updatedStats,
            actionLog: actionLog.slice(-99),
            mandirigmaRageBuff: tickBuff(state.mandirigmaRageBuff),
            baganiLastStandBuff: tickBuff(state.baganiLastStandBuff),
            bathalaMandateBuff:  tickBuff(state.bathalaMandateBuff),
            daybreakFuryBuff:    tickBuff(state.daybreakFuryBuff),
            blesssBuff: undefined, // avoid name collision
            blessingBuff:   tickBuffMap(state.blessingBuff),
            focusAimBuff:   tickBuffMap(state.focusAimBuff),
            moonfallDebuffs:    tickDebuffMap(state.moonfallDebuffs),
            bindDebuffs:        tickDebuffMap(state.bindDebuffs),
            eyeDragonDebuffs:   tickDebuffMap(state.eyeDragonDebuffs),
            devouredDebuffs:    newDevouredDebuffs,
            bonecrackedDebuffs: tickDebuffMap(state.bonecrackedDebuffs),
            bossInvulnerable: tickBuff(state.bossInvulnerable),
            tauntBuff: tickBuff(state.tauntBuff),
        };
    }),

    startCooldown: (player: string, skillKey: string, duration: number) => set((state: any) => ({
        cooldowns: { ...state.cooldowns, [player]: { ...state.cooldowns[player], [skillKey]: duration } }
    })),

    clearAllCooldowns: () => set({ cooldowns: { player1: {}, player2: {}, player3: {}, player4: {} } }),

    // Soft Reset: restore HP/CDs/statuses, keep current turn order and dead states
    softReset: () => set((state: any) => {
        const newStats = { ...state.playersStats };
        const players = ['player1','player2','player3','player4'];

        players.forEach(p => {
            const es = { ...newStats[p] };
            if (!state.deadPlayers.has(p)) {
                es.hp = es.maxHp || es.hp; // only restore alive players
            } else {
                es.hp = 0;
            }
            es.shield = 0; es.shieldStacks = [];
            newStats[p] = es;
        });

        // Always restore boss to full HP
        const bosses: any = { ...newStats.boss };
        bosses.hp = bosses.maxHp || bosses.hp;
        bosses.shield = 0; bosses.shieldStacks = [];
        newStats.boss = bosses;

        // Find first alive turn slot to restart from
        const seq = state.turnSequence;
        let startIdx = 0;
        while (startIdx < 4 && state.deadPlayers.has(seq[startIdx])) startIdx++;

        return {
            playersStats: newStats,
            cooldowns: { player1: {}, player2: {}, player3: {}, player4: {} },
            mandirigmaRageBuff: { turnsLeft: 0, dmgIncrease: 0, defIgnore: 0 },
            baganiLastStandBuff: { turnsLeft: 0, defIncrease: 0 },
            bathalaMandateBuff:  { turnsLeft: 0, defIncrease: 0 },
            daybreakFuryBuff:    { turnsLeft: 0, atkIncrease: 0, defIgnore: 0 },
            blessingBuff: {}, focusAimBuff: {}, strengthenedBuff: {},
            bossInvulnerable: { turnsLeft: 0 },
            bonecrackedDebuffs: {}, bindDebuffs: {}, moonfallDebuffs: {},
            eyeDragonDebuffs: {}, devouredDebuffs: {},
            actedThisTurn: new Set<string>(),
            tauntBuff: { turnsLeft: 0 },
            currentRound: 1,
            currentTurnIndex: startIdx,
            // setupLocked, turnSequence, deadEntities, deadPlayers, deadBosses — unchanged
        };
    }),

    // Hard Reset: wipe everything back to before game start, show ConfigPanel again
    hardReset: () => {
        // Flow 0: clear intro flag so the sequence replays from the start
        localStorage.removeItem('botf_intro_done');
        localStorage.removeItem('botf_pending_region');
        set((state: any) => {
        const newStats = { ...state.playersStats };
        const players = ['player1','player2','player3','player4'];

        // Restore all players to full HP, revive them
        players.forEach(p => {
            const es = { ...newStats[p] };
            es.hp = es.maxHp || es.hp;
            es.shield = 0; es.shieldStacks = [];
            newStats[p] = es;
        });

        // Restore boss to full HP
        const bosses: any = { ...newStats.boss };
        bosses.hp = bosses.maxHp || bosses.hp;
        bosses.shield = 0; bosses.shieldStacks = [];
        newStats.boss   = bosses;
        newStats.boss2  = { hp: 0, atk: 0, mag: 0, def: 0, maxHp: 0, shield: 0, shieldStacks: [] };

        return {
            playersStats: newStats,
            deadEntities: new Set<string>(),
            deadPlayers:  new Set<string>(),
            deadBosses:   new Set<string>(),
            cooldowns: { player1: {}, player2: {}, player3: {}, player4: {} },
            mandirigmaRageBuff: { turnsLeft: 0, dmgIncrease: 0, defIgnore: 0 },
            baganiLastStandBuff: { turnsLeft: 0, defIncrease: 0 },
            bathalaMandateBuff:  { turnsLeft: 0, defIncrease: 0 },
            daybreakFuryBuff:    { turnsLeft: 0, atkIncrease: 0, defIgnore: 0 },
            blessingBuff: {}, focusAimBuff: {}, strengthenedBuff: {},
            bossInvulnerable: { turnsLeft: 0 },
            bonecrackedDebuffs: {}, bindDebuffs: {}, moonfallDebuffs: {},
            eyeDragonDebuffs: {}, devouredDebuffs: {},
            actedThisTurn: new Set<string>(),
            tauntBuff: { turnsLeft: 0 },
            bakunawaPhase2Active: false,
            currentRound: 1,
            actionLog: [],
            setupLocked: false,
            turnSequence: ['player1','player2','player3','player4'],
            currentTurnIndex: -1,
            gamePhase: 'setup',
            selectedRegion: null,
            activeBanner: null,
            turnOrderConfig: {
                player1: { preset: 'glassCanon', order: 1 },
                player2: { preset: 'wall',       order: 2 },
                player3: { preset: 'pureHealer', order: 3 },
                player4: { preset: 'sniper',     order: 4 },
            },
        };
    });
    },

    setDungeonBuff: (buffNum: number, value: boolean) => set({ [`dungeonBuff${buffNum}Active`]: value }),
    setCrit: (value: boolean) => set({ critActive: value }),

    enterRegion: (regionId: string) => {
        const REGION_CFG: Record<string,{mini:string;main:string}> = {
            daragangmagayon: { mini: 'Tiyanak',    main: 'Apolaki'  },
            dagatkabisayaan: { mini: 'Siren',       main: 'Bakunawa' },
            bundokpulag:     { mini: 'Manananggal', main: 'Mayari'   },
            kaluwalhatian:   { mini: 'Kapre',       main: 'Bathala'  },
        };
        const cfg = REGION_CFG[regionId];
        if (!cfg) return;
        get().applyPreset('boss', cfg.mini);
        set({ gamePhase: 'battle', selectedRegion: regionId, activeBanner: 'miniboss' });
        setTimeout(() => { if ((get() as any).activeBanner === 'miniboss') set({ activeBanner: null }); }, 4000);
    },
    triggerBanner: (name: string) => set({ activeBanner: name }),
    clearBanner: () => set({ activeBanner: null }),

    // ---- turn order actions ----
    updateSetupConfig: (playerId: string, field: string, value: any) => set((state: any) => ({
        turnOrderConfig: {
            ...state.turnOrderConfig,
            [playerId]: { ...state.turnOrderConfig[playerId], [field]: value },
        },
    })),

    confirmSetup: () => {
        const state = get();
        const config = state.turnOrderConfig;
        const players = ['player1','player2','player3','player4'];
        const sorted = [...players].sort((a, b) => (config[a]?.order ?? 99) - (config[b]?.order ?? 99));
        sorted.forEach(p => get().applyPreset(p, config[p]?.preset || 'glassCanon'));
        const post = get();
        let startIdx = 0;
        while (startIdx < 4 && post.deadEntities.has(sorted[startIdx])) startIdx++;
        set({ setupLocked: true, turnSequence: sorted, currentTurnIndex: startIdx, gamePhase: 'map' });
    },

    advanceTurn: () => {
        if (!get().setupLocked) return;
        let idx = get().currentTurnIndex + 1;
        const seq = get().turnSequence;

        // Returns true if a given turn slot belongs to a dead entity
        const isSlotDead = (i: number): boolean => {
            const dead = get().deadEntities;
            const phase2 = get().bakunawaPhase2Active;
            if (i < 4) return dead.has(seq[i]);
            // index 4 = Minokawa (phase2) or boss attack-1 (normal)
            if (i === 4) return phase2 ? dead.has('boss2') : dead.has('boss');
            // index 5 = Bakunawa (phase2) or boss attack-2 (normal)
            if (i === 5) return dead.has('boss');
            return false;
        };

        // Skip dead slots (players 0-3 AND boss slots 4-5)
        while (idx < 6 && isSlotDead(idx)) idx++;

        if (idx >= 6) {
            // End of round — find first alive slot for next round
            get().endRound();
            let startIdx = 0;
            while (startIdx < 6 && isSlotDead(startIdx)) startIdx++;
            set({ currentTurnIndex: startIdx < 6 ? startIdx : 0 });
            return;
        }
        set({ currentTurnIndex: idx });
    },

    // ---- buff setters ----
    setMandirigmaRage: (turnsLeft: number, dmgIncrease: number, defIgnore: number) =>
        set({ mandirigmaRageBuff: { turnsLeft, dmgIncrease, defIgnore } }),

    setBaganiLastStand: (turnsLeft: number, defIncrease: number) =>
        set({ baganiLastStandBuff: { turnsLeft, defIncrease } }),

    setBathalaMandateBuff: (turnsLeft: number, defIncrease: number) =>
        set({ bathalaMandateBuff: { turnsLeft, defIncrease } }),

    setDaybreakFuryBuff: (turnsLeft: number, atkIncrease: number, defIgnore: number) =>
        set({ daybreakFuryBuff: { turnsLeft, atkIncrease, defIgnore } }),

    setBlessingBuff: (target: string, turns: number) =>
        set((state: any) => ({ blessingBuff: { ...state.blessingBuff, [target]: turns } })),

    setFocusAimBuff: (player: string, turnsLeft: number, defIgnore: number) =>
        set((state: any) => ({ focusAimBuff: { ...state.focusAimBuff, [player]: { turnsLeft, defIgnore } } })),

    setStrengthenedBuff: (bossId: string, attacksLeft: number, multiplier: number) =>
        set((state: any) => ({ strengthenedBuff: { ...state.strengthenedBuff, [bossId]: { attacksLeft, multiplier } } })),

    consumeStrengthened: (bossId: string) => set((state: any) => {
        const sb = { ...state.strengthenedBuff };
        if (sb[bossId]) {
            sb[bossId] = { ...sb[bossId], attacksLeft: sb[bossId].attacksLeft - 1 };
            if (sb[bossId].attacksLeft <= 0) delete sb[bossId];
        }
        return { strengthenedBuff: sb };
    }),

    setBossInvulnerable: (turnsLeft: number) => set({ bossInvulnerable: { turnsLeft } }),

    // ---- debuff setters ----
    setBonecracked: (target: string, turnsLeft: number, defReduce: number) =>
        set((state: any) => ({ bonecrackedDebuffs: { ...state.bonecrackedDebuffs, [target]: { turnsLeft, defReduce } } })),

    setBindDebuff: (target: string, turnsLeft: number, defReduce: number) =>
        set((state: any) => ({ bindDebuffs: { ...state.bindDebuffs, [target]: { turnsLeft, defReduce } } })),

    setMoonfallDebuff: (target: string, turnsLeft: number, defReduce: number) =>
        set((state: any) => ({ moonfallDebuffs: { ...state.moonfallDebuffs, [target]: { turnsLeft, defReduce } } })),

    setEyeDragonDebuff: (target: string, turnsLeft: number, defReduce: number) =>
        set((state: any) => ({ eyeDragonDebuffs: { ...state.eyeDragonDebuffs, [target]: { turnsLeft, defReduce } } })),

    setDevouredDebuff: (target: string, turnsLeft: number, dotMagPerc: number) =>
        set((state: any) => ({ devouredDebuffs: { ...state.devouredDebuffs, [target]: { turnsLeft, dotMagPerc } } })),

    cleansePlayerDebuffs: (player: string) => set((state: any) => {
        const remove = (map: any) => { const m = { ...map }; delete m[player]; return m; };
        return {
            bonecrackedDebuffs: remove(state.bonecrackedDebuffs),
            bindDebuffs: remove(state.bindDebuffs),
            moonfallDebuffs: remove(state.moonfallDebuffs),
            eyeDragonDebuffs: remove(state.eyeDragonDebuffs),
            devouredDebuffs: remove(state.devouredDebuffs),
        };
    }),

    cleanseAllPlayersDebuffs: () => set((state: any) => {
        const players = ['player1','player2','player3','player4'];
        const clear = (map: any) => Object.fromEntries(Object.entries(map).filter(([k]) => !players.includes(k)));
        return {
            bonecrackedDebuffs: clear(state.bonecrackedDebuffs),
            bindDebuffs: clear(state.bindDebuffs),
            moonfallDebuffs: clear(state.moonfallDebuffs),
            eyeDragonDebuffs: clear(state.eyeDragonDebuffs),
            devouredDebuffs: clear(state.devouredDebuffs),
        };
    }),

    cleanseBossDebuffs: () => set((state: any) => {
        const remove = (map: any) => { const m = { ...map }; delete m['boss']; return m; };
        // Also clear Bone Cracked from all players (matches vanilla cleanseBossDebuffs)
        const removePlayers = (map: any) => {
            const m = { ...map };
            ['player1','player2','player3','player4'].forEach(p => delete m[p]);
            return m;
        };
        return {
            bonecrackedDebuffs: removePlayers(remove(state.bonecrackedDebuffs)),
            moonfallDebuffs: remove(state.moonfallDebuffs),
        };
    }),

    broadcastState: () => {
        const s = get();
        const gameState = {
            currentRound: s.currentRound,
            currentBoss: s.currentBoss,
            playersStats: s.playersStats,
            bakunawaPhase2Active: s.bakunawaPhase2Active,
            actionLog: s.actionLog,
            deadEntities: Array.from(s.deadEntities),
            critActive: s.critActive,
            dungeonBuff1Active: s.dungeonBuff1Active,
            dungeonBuff2Active: s.dungeonBuff2Active,
            dungeonBuff3Active: s.dungeonBuff3Active,
            tauntBuff: s.tauntBuff,
            mandirigmaRageBuff: s.mandirigmaRageBuff,
            baganiLastStandBuff: s.baganiLastStandBuff,
            blessingBuff: s.blessingBuff,
            focusAimBuff: s.focusAimBuff,
            bathalaMandateBuff: s.bathalaMandateBuff,
            daybreakFuryBuff: s.daybreakFuryBuff,
            strengthenedBuff: s.strengthenedBuff,
            bossInvulnerable: s.bossInvulnerable,
            bonecrackedDebuffs: s.bonecrackedDebuffs,
            bindDebuffs: s.bindDebuffs,
            moonfallDebuffs: s.moonfallDebuffs,
            eyeDragonDebuffs: s.eyeDragonDebuffs,
            devouredDebuffs: s.devouredDebuffs,
            setupLocked: s.setupLocked,
            turnSequence: s.turnSequence,
            currentTurnIndex: s.currentTurnIndex,
            gamePhase: s.gamePhase,
            selectedRegion: s.selectedRegion,
            activeBanner: s.activeBanner,
            deadBosses: Array.from(s.deadBosses),
            timestamp: Date.now(),
        };
        try { localStorage.setItem('botf_game_state', JSON.stringify(gameState)); } catch (_) {}
    },
}));

// Auto-broadcast on every state change
useGameStore.subscribe(() => {
    (useGameStore.getState() as any).broadcastState();
});

// Broadcast initial state immediately (so viewer doesn't wait)
(useGameStore.getState() as any).broadcastState();
