import { useEffect, useState } from 'react';
import { dashboardService, LowStockSupply } from '@/services/dashboardService';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export function LowStockSuppliesCard() {
    const { activeBranchId } = useAppStore();
    const [supplies, setSupplies] = useState<LowStockSupply[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupplies = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getLowStockSupplies(activeBranchId);
                setSupplies(data);
            } catch (err) {
                console.error('Failed to fetch low stock supplies:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSupplies();
    }, [activeBranchId]);

    if (!loading && supplies.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">inventory_2</span>
                    Low Stock Supplies
                </h2>
                <Link to="/inventory/supplies" className="text-xs font-semibold text-primary hover:underline">
                    Manage Supplies
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-card border border-slate-200 dark:border-slate-border rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">
                            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-xs">Checking inventory...</p>
                        </div>
                    ) : (
                        supplies.map((item) => (
                            <div key={item._id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {item.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                                {item.partNumber}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                {item.locationId?.name || item.location || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={cn(
                                            "text-sm font-black",
                                            item.quantity === 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                                        )}>
                                            {item.quantity} <span className="text-[10px] font-medium opacity-70">{item.unitId?.name || item.unit || 'pcs'}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            Min: {item.minimumStock}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            item.quantity === 0 ? "bg-rose-500" : "bg-amber-500"
                                        )}
                                        style={{ width: `${Math.min(100, (item.quantity / (item.minimumStock || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
