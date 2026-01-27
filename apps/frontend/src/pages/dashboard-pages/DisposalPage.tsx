
import { DisposalStats } from '@/features/disposal/components/DisposalStats';
import { DisposalTable } from '@/features/disposal/components/DisposalTable';
import { DocumentationPanel } from '@/features/disposal/components/DocumentationPanel';
import { disposalStats } from '@/features/disposal/data/mock-disposal';

export default function DisposalPage() {
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
                <button className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-rose-500/20">
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Schedule Disposal
                </button>
            </div>

            <DisposalStats stats={disposalStats} />

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <DisposalTable />
                </div>

                {/* Right Sidebar */}
                <div className="hidden xl:block w-80 shrink-0">
                    <DocumentationPanel />
                </div>
            </div>
        </div>
    );
}
