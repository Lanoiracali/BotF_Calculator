import { useGameStore } from '../../store/gameStore';

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

const PLAYERS = ['player1', 'player2', 'player3', 'player4'];

export function ConfigPanel() {
    const setupLocked     = useGameStore((s: any) => s.setupLocked);
    const config          = useGameStore((s: any) => s.turnOrderConfig);
    const updateSetup     = useGameStore((s: any) => s.updateSetupConfig);
    const confirmSetup    = useGameStore((s: any) => s.confirmSetup);

    if (setupLocked) return null;

    const orders = PLAYERS.map(p => config[p]?.order);
    const allSet = orders.every(o => o >= 1 && o <= 4) && new Set(orders).size === 4;

    const tdStyle: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'middle' };

    return (
        <div style={{
            border: '2px solid goldenrod', borderRadius: 8,
            padding: '14px 18px', marginBottom: 16,
            background: 'rgba(255,215,0,0.07)',
        }}>
            <h2 style={{ color: 'goldenrod', margin: '0 0 12px 0' }}>⚙ Round 0 — Setup Turn Order</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ color: '#ccc', fontSize: 13 }}>
                        <th style={{ ...tdStyle, textAlign: 'left' }}>Player</th>
                        <th style={{ ...tdStyle, textAlign: 'left' }}>Preset</th>
                        <th style={{ ...tdStyle, textAlign: 'left' }}>Turn Order</th>
                    </tr>
                </thead>
                <tbody>
                    {PLAYERS.map(p => (
                        <tr key={p}>
                            <td style={{ ...tdStyle, color: 'goldenrod', fontWeight: 'bold' }}>{PLAYER_NAMES[p]}</td>
                            <td style={tdStyle}>
                                <select
                                    value={config[p]?.preset ?? ''}
                                    onChange={e => updateSetup(p, 'preset', e.target.value)}
                                >
                                    {Object.entries(PRESET_LABELS[p]).map(([k, label]) => (
                                        <option key={k} value={k}>{label as string}</option>
                                    ))}
                                </select>
                            </td>
                            <td style={tdStyle}>
                                <select
                                    value={config[p]?.order ?? ''}
                                    onChange={e => updateSetup(p, 'order', Number(e.target.value))}
                                >
                                    <option value="">—</option>
                                    <option value="1">1st</option>
                                    <option value="2">2nd</option>
                                    <option value="3">3rd</option>
                                    <option value="4">4th</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    disabled={!allSet}
                    onClick={confirmSetup}
                    style={{
                        padding: '8px 22px',
                        background: allSet ? 'goldenrod' : '#555',
                        color: allSet ? '#000' : '#999',
                        border: 'none', borderRadius: 4,
                        cursor: allSet ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold', fontSize: 14,
                    }}
                >
                    Confirm &amp; Start Round 1
                </button>
                {!allSet && (
                    <span style={{ color: '#aaa', fontSize: 12 }}>
                        Assign all 4 unique turn orders (1st–4th) to proceed.
                    </span>
                )}
            </div>
        </div>
    );
}
