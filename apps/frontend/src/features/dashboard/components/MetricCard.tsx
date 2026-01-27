import { MetricStat } from '../data/mock-dashboard';
import { cn } from '@/lib/utils';
import { Card } from '@/components/common/Card/Card';

interface MetricCardProps {
    stat: MetricStat;
}

export function MetricCard({ stat }: MetricCardProps) {
    return (
        <Card className="hover:border-primary/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">
                    {stat.title}
                </p>
                <span className={cn("p-2 rounded-lg material-symbols-outlined !text-[20px]", stat.iconColorClass)}>
                    {stat.icon}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight text-foreground leading-none">{stat.value}</h3>
                {stat.trend && (
                    <span className={cn("text-xs font-bold flex items-center", stat.trend.colorClass)}>
                        <span className="material-symbols-outlined !text-[14px]">
                            {stat.trend.direction === 'up' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        {stat.trend.value}
                    </span>
                )}
            </div>

            {stat.progressBar ? (
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <div
                        className="h-full bg-primary"
                        style={{ width: `${stat.progressBar.percentage}%` }}
                    ></div>
                </div>
            ) : (
                <p className="text-[10px] text-muted-foreground mt-2">{stat.description}</p>
            )}
        </Card>
    );
}
