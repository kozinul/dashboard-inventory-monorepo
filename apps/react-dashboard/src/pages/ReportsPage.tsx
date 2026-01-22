import { TopNav } from '@/components/layout/TopNav';
import { SummaryBarChart } from '@/features/reports/components/SummaryBarChart';
import { AssetDistributionChart } from '@/features/reports/components/AssetDistributionChart';
import { MaintenanceTrendChart } from '@/features/reports/components/MaintenanceTrendChart';
import { RecentReportsTable } from '@/features/reports/components/RecentReportsTable';

export default function ReportsPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display">
            <TopNav />
            <main className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Page Heading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory & Maintenance Reports</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">sync</span>
                            Last data sync: Today at 09:42 AM
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-card-dark rounded-lg font-medium text-sm hover:bg-slate-200 dark:hover:bg-border-dark transition-all dark:text-slate-200">
                            <span className="material-symbols-outlined text-sm">file_upload</span>
                            Export CSV
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Generate New Report
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-card-dark p-2 rounded-xl border border-slate-200 dark:border-border-dark flex flex-wrap gap-2 mb-8">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-background-dark rounded-lg text-sm font-medium dark:text-slate-300">
                        <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                        Last 30 Days
                        <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-background-dark rounded-lg text-sm font-medium dark:text-slate-300">
                        <span className="material-symbols-outlined text-primary text-sm">corporate_fare</span>
                        All Departments
                        <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-background-dark rounded-lg text-sm font-medium dark:text-slate-300">
                        <span className="material-symbols-outlined text-primary text-sm">category</span>
                        Asset Type: All
                        <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                    </button>
                    <div className="ml-auto flex items-center gap-2 pr-2">
                        <div className="flex items-center gap-1 bg-slate-200 dark:bg-background-dark p-1 rounded-md">
                            <button className="px-3 py-1 bg-white dark:bg-card-dark rounded text-xs font-bold shadow-sm dark:text-white">Grid</button>
                            <button className="px-3 py-1 text-xs font-medium text-slate-500">List</button>
                        </div>
                    </div>
                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                    <SummaryBarChart />
                    <AssetDistributionChart />
                    <MaintenanceTrendChart />
                </div>

                {/* Recent Reports Table */}
                <RecentReportsTable />
            </main>

            {/* Footer */}
            <footer className="max-w-[1440px] mx-auto px-6 py-12 flex justify-between items-center text-slate-500 text-xs">
                <div>© 2023 NexusAV Systems. Internal Enterprise Portal.</div>
                <div className="flex items-center gap-6">
                    <button className="hover:text-primary transition-colors">Documentation</button>
                    <button className="hover:text-primary transition-colors">System Status</button>
                    <button className="hover:text-primary transition-colors">Support</button>
                </div>
            </footer>
        </div>
    );
}
