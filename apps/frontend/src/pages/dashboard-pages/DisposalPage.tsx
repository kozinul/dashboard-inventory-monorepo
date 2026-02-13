import { useState, useEffect } from 'react';
import { DisposalStats } from '@/features/disposal/components/DisposalStats';
import { DisposalTable } from '@/features/disposal/components/DisposalTable';
import { DocumentationPanel } from '@/features/disposal/components/DocumentationPanel';
import { disposalService, DisposalStats as IDisposalStats } from '@/features/disposal/services/disposalService';
import { ScheduleDisposalModal } from '@/features/disposal/components/ScheduleDisposalModal';
import { useAuthStore } from '@/store/authStore';

export default function DisposalPage() {
    const [stats, setStats] = useState<IDisposalStats | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuthStore();

    const fetchStats = async () => {
        try {
            const data = await disposalService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch disposal stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const canRequest = user?.role === 'technician' || user?.role === 'superuser' || user?.role === 'system_admin';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Asset Disposal</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">recycling</span>
                        Decommissioning and E-Waste Management
                    </p>
                </div>
                {canRequest && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-rose-500/20"
                    >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        Schedule Disposal
                    </button>
                )}
            </div>

            <DisposalStats stats={stats} />

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <DisposalTable />
                </div>

                {/* Right Sidebar */}
                <div className="hidden xl:block w-80 shrink-0">
                    <DocumentationPanel />
                </div>
            </div>

            <ScheduleDisposalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchStats();
                    // Table will refresh via its own state or we could pass a refresh signal
                    window.location.reload(); // Simple refresh for now to sync everything
                }}
            />
        </div>
    );
}
