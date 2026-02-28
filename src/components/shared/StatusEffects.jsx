export function StatusEffects({ effects }) {
    if (!effects || !Array.isArray(effects)) return <div className="status-effects" />;
    return (
        <div className="status-effects">
            {effects.map((effect, i) => (
                <div key={i} className={`status-effect ${effect.type}`} title={effect.description}>
                    {effect.name} {effect.turns !== '∞' && <span className="turns">({effect.turns})</span>}
                </div>
            ))}
        </div>
    );
}