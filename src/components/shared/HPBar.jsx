export function HPBar({ current, max, shield = 0, id }) {
    const hpPercent = Math.max(0, Math.min(100, (current / (max || 1)) * 100));
    const shieldPercent = Math.min(100, (shield / (max || 1)) * 100);

    return (
        <div className="hp-bar" style={{ position: 'relative' }}>
            <div className="hp-fill" style={{ width: `${hpPercent}%`, position: 'absolute', zIndex: 1 }} />
            {shield > 0 && (
                <div className="hp-shield" style={{ width: `${shieldPercent}%`, position: 'absolute', left: 0, zIndex: 2 }} />
            )}
        </div>
    );
}