export function SkillButton({ skill, onClick, cooldown, dungeonBuff3Active }) {
    const cd = cooldown || 0;
    const onCD = !dungeonBuff3Active && cd > 0;

    return (
        <div className="skill">
            <button
                onClick={onClick}
                className={onCD ? 'on-cooldown' : ''}
                disabled={onCD}
            >
                {skill.name} {onCD ? `(${cd})` : ''}
            </button>
            <div className="skill-description">
                {skill.description} {dungeonBuff3Active ? '(CD: 0)' : `(CD: ${cd})`}
            </div>
        </div>
    );
}
