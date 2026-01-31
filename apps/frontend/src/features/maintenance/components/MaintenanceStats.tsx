import { cn } from '@/lib/utils';

interface MaintenanceStatsProps {
    stats: any[];
}

export function MaintenanceStats({ stats }: MaintenanceStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                    {/* Watermark Icon */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <span className="material-symbols-outlined text-6xl dark:text-white">{stat.icon}</span>
                    </div>

                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                        <h2 className={cn(
                            "text-4xl font-bold mt-2",
                            stat.type === 'pending' ? 'text-amber-500' :
                                stat.type === 'completed' ? 'text-primary' :
                                    'dark:text-white'
                        )}>{stat.value}</h2>
                    </div>

                    {/* Footer Content */}
                    <div className="mt-4">
                        {stat.type === 'active' && (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                                    <span className="material-symbols-outlined text-xs mr-1">trending_up</span> {stat.trendValue}
                                </span>
                                <span className="text-slate-400 text-xs">{stat.trendLabel}</span>
                            </div>
                        )}

                        {stat.type === 'pending' && (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                                    <span className="material-symbols-outlined text-xs mr-1">priority_high</span> {stat.trendValue}
                                </span>
                                <span className="text-slate-400 text-xs">{stat.trendLabel}</span>
                            </div>
                        )}

                        {stat.type === 'completed' && stat.progressBar && (
                            <>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${stat.progressBar}%` }}></div>
                                </div>
                                <p className="text-slate-400 text-[10px] mt-2 font-medium">82% OF MONTHLY GOAL REACHED</p>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
