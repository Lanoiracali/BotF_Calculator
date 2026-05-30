import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { AdminPanel } from '../components/AdminPanel/AdminPanel';

export function Admin() {
    useEffect(() => {
        document.title = 'Balangay of the Forgotten - Admin';
        const store = useGameStore.getState() as any;
        // Apply default presets on mount so real stat values show immediately
        store.applyPreset('player1', 'glassCanon');
        store.applyPreset('player2', 'wall');
        store.applyPreset('player3', 'pureHealer');
        store.applyPreset('player4', 'sniper');
        store.applyPreset('boss', 'Bathala');
        // broadcastState fires automatically via the store's subscribe
    }, []);

    return <AdminPanel />;
}
