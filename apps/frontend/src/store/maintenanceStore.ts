import { create } from 'zustand';
import { maintenanceService, NavCounts } from '../services/maintenanceService';

interface MaintenanceState {
    counts: NavCounts | null;
    isLoading: boolean;
    error: string | null;

    fetchCounts: () => Promise<void>;
    startPolling: (intervalMs?: number) => () => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
    counts: null,
    isLoading: false,
    error: null,

    fetchCounts: async () => {
        try {
            // We don't set global isLoading for background fetches to avoid flickering
            // set({ isLoading: true }); 
            const data = await maintenanceService.getNavCounts();
            set({ counts: data, error: null });
        } catch (error: any) {
            // Silence ECONNABORTED errors
            if (error.code === 'ECONNABORTED' || error.name === 'CanceledError') {
                return;
            }
            console.error('Failed to fetch nav counts', error);
            set({ error: error.message || 'Failed to fetch counts' });
        } finally {
            // set({ isLoading: false });
        }
    },

    startPolling: (intervalMs = 60000) => {
        const fetch = get().fetchCounts;
        fetch(); // Initial fetch
        const interval = setInterval(fetch, intervalMs);
        return () => clearInterval(interval);
    }
}));
