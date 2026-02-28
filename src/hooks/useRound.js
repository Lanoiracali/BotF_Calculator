import { useGameStore } from '../store/gameStore';

export function useRound() {
    const currentRound = useGameStore(s => s.currentRound);
    const endRound     = useGameStore(s => s.endRound);
    const resetAll     = useGameStore(s => s.resetAll);

    return { currentRound, endRound, resetAll };
}
