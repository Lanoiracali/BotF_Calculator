import { collectEffects } from '../../hooks/useBuffs';

const BASE = import.meta.env.BASE_URL;

const TURN_OUTLINE = `${BASE}asset/turnOutline.gif`;

const BOSS_IMAGE_MAP = {
    Bathala:     `${BASE}asset/ANIMATION ON CARDS/Bathala.gif`,
    Mayari:      `${BASE}asset/ANIMATION ON CARDS/Mayari.gif`,
    Apolaki:     `${BASE}asset/ANIMATION ON CARDS/Apolak.gif`,
    Bakunawa:    `${BASE}asset/ANIMATION ON CARDS/Bakunawa.gif`,
    Minokawa:    `${BASE}asset/ANIMATION ON CARDS/Minokawa.gif`,
    Manananggal: `${BASE}asset/ANIMATION ON CARDS/Mananangal.gif`,
    Tiyanak:     `${BASE}asset/ANIMATION ON CARDS/Tiyanak.gif`,
    Siren:       `${BASE}asset/ANIMATION ON CARDS/Sirena.gif`,
    Kapre:       `${BASE}asset/ANIMATION ON CARDS/Kapre.gif`,
};

function HPSection({ stats, bossId }) {
    const hp     = stats?.hp    ?? 0;
    const maxHp  = stats?.maxHp ?? 1;
    const shield = stats?.shield ?? 0;
    const hpPct  = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const shPct  = Math.max(0, Math.min(100, (shield / maxHp) * 100));
    return (
        <div className="hp-section" id={`hp-section-${bossId}`}>
            <div className="hp-bar">
                <div className="boss-hp-fill" style={{ width: `${hpPct}%` }} />
                {shield > 0 && (
                    <div className="hp-shield" style={{ width: `${Math.min(shPct, 100)}%` }} />
                )}
            </div>
            <div className="hp-text">
                <span>{hp} / {maxHp}</span>
                {shield > 0 && <span className="shield-text">🛡 {shield}</span>}
            </div>
        </div>
    );
}

function EffectTags({ effects }) {
    const buffs   = effects.filter(e => e.type === 'buff');
    const debuffs = effects.filter(e => e.type === 'debuff');
    return (
        <>
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
        </>
    );
}

function extractSkillName(logEntry) {
    if (!logEntry) return '';
    const match = logEntry.match(/used (.+?):/);
    if (!match) return '';
    return match[1].replace(/ on \S+$/, '').trim();
}

export function BossCard({ gameState }) {
    const phase2      = gameState?.bakunawaPhase2Active;
    const currentBoss = gameState?.currentBoss ?? 'Bathala';
    const setupLocked = gameState?.setupLocked ?? false;
    const turnIdx     = gameState?.currentTurnIndex ?? -1;
    // Turn active flags
    const isBakuActiveTurn  = setupLocked && (phase2 ? turnIdx === 5 : (turnIdx === 4 || turnIdx === 5));
    const isMinoActiveTurn  = setupLocked && turnIdx === 4;
    const bossStats   = gameState?.playersStats?.boss;
    const boss2Stats  = gameState?.playersStats?.boss2;
    const deadList    = Array.isArray(gameState?.deadEntities) ? gameState.deadEntities : [];
    const isBossDead  = deadList.includes('boss')  || (bossStats?.hp  ?? 1) <= 0;
    const isBoss2Dead = deadList.includes('boss2') || (boss2Stats?.hp ?? 1) <= 0;
    const bossEffects  = collectEffects('boss',  gameState);
    const boss2Effects = collectEffects('boss2', gameState);

    const actionLog   = gameState?.actionLog ?? [];
    const bossName    = currentBoss.toLowerCase();
    // Only scan entries since the last boss switch
    const switchIdx   = [...actionLog].reverse().indexOf('[boss_switch]');
    const reversedLog = [...actionLog].reverse().slice(0, switchIdx >= 0 ? switchIdx : undefined);

    const lastFullBossEntry = reversedLog.find(l => l.toLowerCase().startsWith(bossName + ' used'));
    const lastFullMinoEntry = reversedLog.find(l => l.toLowerCase().startsWith('minokawa used'));
    const lastBossAction = extractSkillName(lastFullBossEntry);
    const lastMinoAction = extractSkillName(lastFullMinoEntry);

    // For dual mode: show most recent action with boss name prefix (matches vanilla)
    const bossLogIdx = lastFullBossEntry ? actionLog.lastIndexOf(lastFullBossEntry) : -1;
    const minoLogIdx = lastFullMinoEntry ? actionLog.lastIndexOf(lastFullMinoEntry) : -1;
    const dualSkillDisplay = (minoLogIdx > bossLogIdx && lastMinoAction)
        ? `Minokawa: ${lastMinoAction}`
        : lastBossAction ? `${currentBoss}: ${lastBossAction}` : '';

    if (phase2) {
        return (
            <div className="dual-boss-grid">
                {/* Bakunawa card — left column */}
                <div className={`boss-card${isBossDead ? ' dead' : ''}`} id="boss-card">
                    <div className="boss-portrait-dual">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={BOSS_IMAGE_MAP.Bakunawa} alt="Bakunawa" className="boss-image-dual" />
                            {isBakuActiveTurn && (
                                <img src={TURN_OUTLINE} alt="active turn"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 10 }} />
                            )}
                        </div>
                    </div>
                    <div className="boss-stats-dual">
                        <HPSection stats={bossStats} bossId="boss" />
                        <div className="def-text">{isBossDead ? '💀 DEAD' : `DEF: ${bossStats?.def ?? 0}`}</div>
                    </div>
                    <div className="status-effects-section-dual">
                        <EffectTags effects={bossEffects} />
                    </div>
                </div>

                {/* Minokawa card — right column */}
                <div className={`boss-card${isBoss2Dead ? ' dead' : ''}`} id="boss2-card">
                    <div className="boss-portrait-dual">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={BOSS_IMAGE_MAP.Minokawa} alt="Minokawa" className="boss-image-dual" />
                            {isMinoActiveTurn && (
                                <img src={TURN_OUTLINE} alt="active turn"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 10 }} />
                            )}
                        </div>
                    </div>
                    <div className="boss-stats-dual">
                        <HPSection stats={boss2Stats} bossId="boss2" />
                        <div className="def-text">{isBoss2Dead ? '💀 DEAD' : `DEF: ${boss2Stats?.def ?? 0}`}</div>
                    </div>
                    <div className="status-effects-section-dual">
                        <EffectTags effects={boss2Effects} />
                    </div>
                </div>

                {/* Unified active skill — spans both columns */}
                <div className="boss-active-skill-unified">
                    <div className="active-skill-section">
                        <div className="active-skill">
                            <span className="skill-name">
                                {dualSkillDisplay || 'No recent boss action'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`boss-card${isBossDead ? ' dead' : ''}`} id="boss-card">
            <div className="boss-portrait">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={BOSS_IMAGE_MAP[currentBoss] || BOSS_IMAGE_MAP.Bathala}
                        alt={currentBoss}
                        className="boss-image"
                        id="boss-image"
                    />
                    {isBakuActiveTurn && (
                        <img src={TURN_OUTLINE} alt="active turn"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 10 }} />
                    )}
                </div>
            </div>

            <div className="boss-stats">
                <HPSection stats={bossStats} bossId="boss" />
                <div className="def-text">{isBossDead ? '💀 DEAD' : `DEF: ${bossStats?.def ?? 0}`}</div>
            </div>

            <div className="active-skill-section">
                <div className="active-skill" id="active-skill-boss">
                    <span className="skill-name">{lastBossAction || ''}</span>
                </div>
            </div>

            <div className="status-effects-section">
                <EffectTags effects={bossEffects} />
            </div>
        </div>
    );
}
