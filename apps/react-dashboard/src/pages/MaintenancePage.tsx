import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { MaintenanceTable } from '@/features/maintenance/components/MaintenanceTable';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { maintenanceStats } from '@/features/maintenance/data/mock-maintenance';

export default function MaintenancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display pb-12">
            <TopNav />
            <main className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Maintenance Management</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">engineering</span>
                            Technician logs and task tracking
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                            <input
                                className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary"
                                placeholder="Search ticket # or issue..."
                                type="text"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            New Ticket
                        </button>
                    </div>
                </div>

                {/* Bento Stats */}
                <MaintenanceStats stats={maintenanceStats} />

                {/* Main Table */}
                <MaintenanceTable />
            </main>

            {/* Modal */}
            <MaintenanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
