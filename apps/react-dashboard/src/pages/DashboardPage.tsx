import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardMetrics } from '@/features/dashboard/components/DashboardMetrics';
import { VisualActivityFeed } from '@/features/dashboard/components/VisualActivityFeed';
import { HighPriorityGearPanel } from '@/features/dashboard/components/HighPriorityGearPanel';

export default function DashboardPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <Sidebar />
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-[1400px] mx-auto w-full space-y-8">
                    {/* Metrics Section */}
                    <DashboardMetrics />

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <VisualActivityFeed />
                        <HighPriorityGearPanel />
                    </div>
                </div>
            </main>
        </div>
    );
}
