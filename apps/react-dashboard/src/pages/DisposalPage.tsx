import { TopNav } from '@/components/layout/TopNav';
import { DisposalStats } from '@/features/disposal/components/DisposalStats';
import { DisposalTable } from '@/features/disposal/components/DisposalTable';
import { DocumentationPanel } from '@/features/disposal/components/DocumentationPanel';
import { disposalStats } from '@/features/disposal/data/mock-disposal';

export default function DisposalPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen flex flex-col font-display overflow-hidden">
            <TopNav />
            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-[1440px] mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight dark:text-white">Asset Disposal</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">recycling</span>
                                    Decommissioning and E-Waste Management
                                </p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-rose-500/20">
                                <span className="material-symbols-outlined text-sm">delete_forever</span>
                                Schedule Disposal
                            </button>
                        </div>

                        <DisposalStats stats={disposalStats} />

                        <div className="flex h-[calc(100vh-340px)] gap-6">
                            <DisposalTable />
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <div className="hidden xl:block h-full shadow-xl z-10 w-80 shrink-0">
                    <DocumentationPanel />
                </div>
            </div>
        </div>
    );
}
