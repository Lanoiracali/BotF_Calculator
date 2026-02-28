// Re-export for viewer consumers
export function StatusEffect({ effect }) {
    return (
        <div className={`status-effect ${effect.type}`} title={effect.description}>
            {effect.name} {effect.turns !== '∞' && <span className="turns">({effect.turns})</span>}
        </div>
    );
}
