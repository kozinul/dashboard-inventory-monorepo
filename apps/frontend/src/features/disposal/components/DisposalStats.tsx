import { DisposalStat } from '../data/mock-disposal';
import { cn } from '@/lib/utils';

interface DisposalStatsProps {
    stats: DisposalStat[];
}

export function DisposalStats({ stats }: DisposalStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark subtle-depth">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-xl", stat.colorClass)}>
                            <span className="material-symbols-outlined !text-[28px]">{stat.icon}</span>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                            stat.trend === 'up' ? "text-emerald-500 bg-emerald-500/10" :
                                stat.trend === 'down' ? "text-rose-500 bg-rose-500/10" :
                                    "text-slate-500 bg-slate-100 dark:bg-slate-800"
                        )}>
                            <span className="material-symbols-outlined !text-[14px]">
                                {stat.trend === 'up' ? 'trending_up' : stat.trend === 'down' ? 'trending_down' : 'remove'}
                            </span>
                            {stat.trendValue}
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
