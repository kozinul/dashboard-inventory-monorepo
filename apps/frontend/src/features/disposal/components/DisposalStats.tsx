import { DisposalStats as IDisposalStats } from '../services/disposalService';
import { cn } from '@/lib/utils';

interface DisposalStatsProps {
    stats: IDisposalStats | null;
}

export function DisposalStats({ stats }: DisposalStatsProps) {
    if (!stats) return null;

    const statItems = [
        {
            label: "Pending Manager",
            value: stats.pendingManager.toString(),
            icon: "manage_accounts",
            colorClass: "text-amber-500 bg-amber-500/10",
            trend: "up"
        },
        {
            label: "Pending Auditor",
            value: stats.pendingAuditor.toString(),
            icon: "policy",
            colorClass: "text-blue-500 bg-blue-500/10",
            trend: "up"
        },
        {
            label: "Approved & Disposed",
            value: stats.approved.toString(),
            icon: "recycling",
            colorClass: "text-emerald-500 bg-emerald-500/10",
            trend: "up"
        },
        {
            label: "Rejected Requests",
            value: stats.rejected.toString(),
            icon: "cancel",
            colorClass: "text-rose-500 bg-rose-500/10",
            trend: "neutral"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statItems.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark subtle-depth shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-xl", stat.colorClass)}>
                            <span className="material-symbols-outlined !text-[28px]">{stat.icon}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-3xl font-black dark:text-white tracking-tight">{stat.value}</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
