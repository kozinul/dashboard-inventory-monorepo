import { GearItem } from '../data/mock-dashboard';
import { cn } from '@/lib/utils';

interface GearQuickViewCardProps {
    gear: GearItem;
}

export function GearQuickViewCard({ gear }: GearQuickViewCardProps) {
    return (
        <div className="p-4 bg-white dark:bg-slate-card border border-slate-200 dark:border-slate-border rounded-xl subtle-depth group hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex gap-4 mb-4">
                <div
                    className="size-12 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center"
                    style={{ backgroundImage: `url('${gear.image}')` }}
                ></div>
                <div>
                    <p className="text-xs font-bold dark:text-white group-hover:text-primary transition-colors">{gear.model}</p>
                    <p className="text-[10px] text-slate-500">{gear.assetId}</p>
                </div>
            </div>
            <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                gear.status.bgClass
            )}>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                        {gear.status.label}
                    </span>
                    <span className="text-xs font-semibold dark:text-slate-300">
                        {gear.status.value}
                    </span>
                </div>
                <span className={cn(
                    "material-symbols-outlined !text-[18px]",
                    gear.status.colorClass
                )}>
                    {gear.status.icon}
                </span>
            </div>
        </div>
    );
}
