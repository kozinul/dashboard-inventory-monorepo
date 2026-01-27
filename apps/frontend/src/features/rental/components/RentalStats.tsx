import { clsx } from 'clsx';

interface Stat {
    name: string;
    value: string;
    change: string;
    changeType: string;
    icon: string;
}

interface RentalStatsProps {
    stats: Stat[];
}

export function RentalStats({ stats }: RentalStatsProps) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.name}
                    className="relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark p-6 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                >
                    <dt>
                        <div className="absolute rounded-md bg-indigo-500/10 p-3">
                            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">
                                {stat.icon}
                            </span>
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                            {stat.name}
                        </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                        <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                            {stat.value}
                        </p>
                        <p
                            className={clsx(
                                stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                                    stat.changeType === 'negative' ? 'text-rose-600 dark:text-rose-400' :
                                        'text-slate-500 dark:text-slate-400',
                                'ml-2 flex items-baseline text-sm font-semibold'
                            )}
                        >
                            {stat.change}
                        </p>
                    </dd>
                </div>
            ))}
        </div>
    );
}
