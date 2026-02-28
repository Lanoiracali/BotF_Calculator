import { collectEffects } from '../../hooks/useBuffs';

const GIF_MAP = {
    player1: '/asset/ANIMATION ON CARDS/MandirigmaCard.gif',
    player2: '/asset/ANIMATION ON CARDS/BaganiCard.gif',
    player3: '/asset/ANIMATION ON CARDS/BabaylanCard.gif',
    player4: '/asset/ANIMATION ON CARDS/MangagayawCard.gif',
};

const SKILL_CARD_MAP = {
    // Mandirigma
    'Attack':          '/asset/ALL CARDS/SKILL CARDS/Mandirigma/MandirigmaAttack.jpg',
    'Heavy Attack':    '/asset/ALL CARDS/SKILL CARDS/Mandirigma/MandirigmaHeavy_Attack.jpg',
    'All-in Attack':   '/asset/ALL CARDS/SKILL CARDS/Mandirigma/MandirigmaAll-In_Attack.jpg',
    'Rest':            '/asset/ALL CARDS/SKILL CARDS/Mandirigma/MandirigmaRest.jpg',
    'Berserk':         '/asset/ALL CARDS/SKILL CARDS/Mandirigma/MandirigmaBerserk.jpg',
    // Bagani
    'Shield Bash':     '/asset/ALL CARDS/SKILL CARDS/Bagani/BaganiShield_Bash.jpg',
    'Fortify':         '/asset/ALL CARDS/SKILL CARDS/Bagani/BaganiFortify.jpg',
    'Last Stand':      '/asset/ALL CARDS/SKILL CARDS/Bagani/BaganiLast_Stand.jpg',
    "Guardian's Oath": '/asset/ALL CARDS/SKILL CARDS/Bagani/BaganiGuardians_Oath.jpg',
    'Taunt':           '/asset/ALL CARDS/SKILL CARDS/Bagani/BaganiTaunt.jpg',
    // Babaylan
    'Heal':            '/asset/ALL CARDS/SKILL CARDS/Babaylan/BabaylanHeal.jpg',
    'Blessing':        '/asset/ALL CARDS/SKILL CARDS/Babaylan/BabaylanBlessing.jpg',
    'Mana Surge':      '/asset/ALL CARDS/SKILL CARDS/Babaylan/BabaylanMana_Surge.jpg',
    'Purify':          '/asset/ALL CARDS/SKILL CARDS/Babaylan/BabaylanPurify.jpg',
    'Sacrifice':       '/asset/ALL CARDS/SKILL CARDS/Babaylan/BabaylanSacrifice.jpg',
    // Mangangayaw
    'Quick Shot':      '/asset/ALL CARDS/SKILL CARDS/Mangangayaw/MangangayawQuick_Shot.jpg',
    'Piercing Arrow':  '/asset/ALL CARDS/SKILL CARDS/Mangangayaw/MangangayawPiercing_Arrow.jpg',
    'Volley':          '/asset/ALL CARDS/SKILL CARDS/Mangangayaw/MangangayawVolley.jpg',
    'Focus Aim':       '/asset/ALL CARDS/SKILL CARDS/Mangangayaw/MangangayawFocus_Aim.jpg',
    'Explosive Arrow': '/asset/ALL CARDS/SKILL CARDS/Mangangayaw/MangangayawExplosive_Arrow.jpg',
};

/** Normalize curly/smart quotes to straight apostrophe for safe comparison */
function normalizeQuotes(str) {
    return str.replace(/[\u2018\u2019\u201A\u201B\u0060]/g, "'");
}

/** Parse the last N log entries to find the most recent skill used by playerId */
function getLastSkill(playerId, actionLog) {
    if (!actionLog?.length) return null;
    const entries = [...actionLog].reverse().slice(0, 30);
    // Sort keys longest-first so 'Heavy Attack' matches before 'Attack', etc.
    const sortedSkillNames = Object.keys(SKILL_CARD_MAP).sort((a, b) => b.length - a.length);
    for (const entry of entries) {
        if (entry === '[boss_switch]') return null; // stop at boss switch boundary
        if (!entry.toLowerCase().startsWith(playerId)) continue;
        const normEntry = normalizeQuotes(entry);
        for (const skillName of sortedSkillNames) {
            if (normEntry.includes(normalizeQuotes(skillName))) return skillName;
        }
    }
    return null;
}

export function HeroCard({ playerId, gameState }) {
    const stats   = gameState?.playersStats?.[playerId];
    const deadList = Array.isArray(gameState?.deadEntities) ? gameState.deadEntities : [];
    const isDead  = deadList.includes(playerId) || (stats?.hp ?? 1) <= 0;
    const effects = collectEffects(playerId, gameState);
    const GLOBAL_BUFFS = ['Balaraw Buff', 'Kalasag Buff', 'Agos-Oras Buff'];
    const buffs   = effects.filter(e => e.type === 'buff' && !GLOBAL_BUFFS.includes(e.name));
    const debuffs = effects.filter(e => e.type === 'debuff');
    const lastSkill = getLastSkill(playerId, gameState?.actionLog);

    const hp     = stats?.hp    ?? 0;
    const maxHp  = stats?.maxHp ?? 1;
    const shield = stats?.shield ?? 0;
    const hpPct  = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const shPct  = Math.max(0, Math.min(100, (shield / maxHp) * 100));

    return (
        <div className={`hero-card${isDead ? ' dead' : ''}`} id={`${playerId}-card`}>
            {/* Active Skill Card */}
            <div className="active-skill-section">
                <div className="active-skill" id={`active-skill-${playerId}`}>
                    {lastSkill && SKILL_CARD_MAP[lastSkill] ? (
                        <>
                            <img src={SKILL_CARD_MAP[lastSkill]} alt={lastSkill} className="skill-image" />
                        </>
                    ) : null}
                </div>
            </div>

            {/* Character portrait GIF */}
            <div className="hero-portrait">
                <img src={GIF_MAP[playerId]} alt={playerId} className="character-image" />
            </div>

            {/* HP Bar */}
            <div className="hero-stats">
                <div className="hp-section">
                    <div className="hp-bar">
                        <div className="hp-fill" style={{ width: `${hpPct}%` }} />
                        {shield > 0 && (
                            <div className="hp-shield" style={{ width: `${Math.min(shPct, 100)}%` }} />
                        )}
                    </div>
                    <div className="hp-text">
                        <span>✚ {isDead ? 'DEAD' : `${hp} / ${maxHp}`}</span>
                        {shield > 0 && <span className="shield-text">🛡 {shield}</span>}
                    </div>
                </div>
            </div>

            {/* Status Effects */}
            <div className="status-effects-section">
                <div className="status-effects buffs">
                    {buffs.map((e, i) => (
                        <div key={i} className="status-effect buff" title={e.description}>
                            {e.name} {e.turns !== '∞' && <span className="turns">({e.turns})</span>}
                        </div>
                    ))}
                </div>
                <div className="status-effects debuffs">
                    {debuffs.map((e, i) => (
                        <div key={i} className="status-effect debuff" title={e.description}>
                            {e.name} {e.turns !== '∞' && <span className="turns">({e.turns})</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
