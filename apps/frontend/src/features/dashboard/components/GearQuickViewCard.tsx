import { GearItem } from '../data/mock-dashboard';
import { cn } from '@/lib/utils';
import { Card } from '@/components/common/Card/Card';
import { Link } from 'react-router-dom';

interface GearQuickViewCardProps {
    gear: GearItem;
}

export function GearQuickViewCard({ gear }: GearQuickViewCardProps) {
    return (
        <Link to={`/inventory/asset-details/${gear.id}`} className="block">
            <Card padding="sm" className="group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex gap-4 mb-4">
                    <div
                        className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 bg-cover bg-center border border-slate-200 dark:border-slate-700"
                        style={{ backgroundImage: `url('${gear.image}')` }}
                    ></div>
                    <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{gear.model}</p>
                        <p className="text-[10px] text-muted-foreground">{gear.assetId}</p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-colors",
                    gear.status.bgClass
                )}>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {gear.status.label}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
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
            </Card>
        </Link>
    );
}
