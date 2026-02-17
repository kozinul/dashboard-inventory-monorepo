import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Branch, branchService } from '../services/branchService';

interface AppState {
    activeBranchId: string | 'ALL';
    branches: Branch[];
    isLoading: boolean;
    isSwitching: boolean;
    isInitialized: boolean;

    setActiveBranch: (id: string | 'ALL') => void;
    setLoading: (loading: boolean) => void;
    initialize: () => Promise<void>;
    reset: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            activeBranchId: 'ALL',
            branches: [],
            isLoading: false,
            isSwitching: false,
            isInitialized: false,

            setActiveBranch: (id) => {
                set({ isSwitching: true });
                // Simulate a brief delay to show loading state
                setTimeout(() => {
                    set({ activeBranchId: id, isSwitching: false });
                }, 300);
            },
            setLoading: (loading) => set({ isLoading: loading }),

            initialize: async () => {
                const { isInitialized } = get();

                set({ isLoading: true });
                try {
                    const branches = await branchService.getAll();
                    let newActiveId = get().activeBranchId;
                    const headOffice = branches.find(b => b.isHeadOffice);

                    // If not initialized OR currently ALL, default to Head Office
                    // This satisfies "always show head office on new login" 
                    if (!isInitialized || newActiveId === 'ALL') {
                        if (headOffice) {
                            newActiveId = headOffice._id;
                        } else if (branches.length > 0) {
                            newActiveId = branches[0]?._id || 'ALL';
                        }
                    }

                    set({
                        branches,
                        activeBranchId: newActiveId,
                        isInitialized: true
                    });

                } catch (error) {
                    console.error('Failed to initialize branches', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            reset: () => set({ activeBranchId: 'ALL', isInitialized: false })
        }),
        {
            name: 'app-context',
            partialize: (state) => ({ activeBranchId: state.activeBranchId }),
        }
    )
);
