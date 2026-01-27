import { ActivityItem as IActivityItem } from '../data/mock-dashboard';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ActivityItemProps {
    item: IActivityItem;
}

export function ActivityItem({ item }: ActivityItemProps) {
    return (
        <Link to={`/inventory/asset-details/${item.id}`} className="block">
            <div className="p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                <div className="flex-shrink-0">
                    {item.image ? (
                        <div
                            className="size-16 rounded-lg bg-slate-100 dark:bg-slate-800 bg-cover bg-center border border-slate-200 dark:border-slate-700"
                            style={{ backgroundImage: `url('${item.image}')` }}
                        ></div>
                    ) : (
                        <div className="flex-shrink-0 flex items-center justify-center size-16 rounded-lg bg-rose-500/10 text-rose-500 border border-transparent">
                            <span className="material-symbols-outlined !text-[32px]">build</span>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                        </h4>
                        <span className={cn(
                            "text-[10px] font-bold py-1 px-2 rounded-md uppercase tracking-wider",
                            item.tag.colorClass
                        )}>
                            {item.tag.label}
                        </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {item.details}
                    </p>

                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <span className="material-symbols-outlined !text-[12px]">schedule</span>
                            {item.time}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <span className="material-symbols-outlined !text-[12px]">person</span>
                            {item.user}
                        </span>
                    </div>
                </div>

                <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>
        </Link>
    );
}
