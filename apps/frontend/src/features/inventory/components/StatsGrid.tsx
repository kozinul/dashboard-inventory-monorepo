import { AssetStat } from '../data/mock-inventory';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    stat: AssetStat;
}

export function StatsCard({ stat }: StatsCardProps) {
    return (
        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark subtle-depth">
            <div className="flex justify-between items-start mb-4">
                <span className={cn("p-2 rounded-lg material-symbols-outlined !text-[24px]", stat.iconColor)}>
                    {stat.icon}
                </span>
                {stat.delta && (
                    <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        stat.trend === 'success' ? 'text-emerald-500 bg-emerald-500/10' :
                            stat.trend === 'danger' ? 'text-rose-500 bg-rose-500/10' :
                                stat.trend === 'warning' ? 'text-amber-500 bg-amber-500/10' :
                                    'text-slate-500 bg-slate-100 dark:bg-slate-800'
                    )}>
                        {stat.delta}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold dark:text-white mb-1">{stat.value}</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
        </div>
    );
}

interface StatsGridProps {
    stats: AssetStat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
                <StatsCard key={stat.label} stat={stat} />
            ))}
        </div>
    );
}
