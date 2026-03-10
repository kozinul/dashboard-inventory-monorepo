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

    // (removed early return to show empty state card)

    const outOfStock = supplies.filter(item => item.quantity === 0);
    const lowStock = supplies.filter(item => item.quantity > 0);

    const renderItem = (item: LowStockSupply) => (
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
    );

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white tracking-tight">Low Stock Supplies</h2>
                <Link to="/inventory/supplies" className="text-sm font-semibold text-primary hover:underline">
                    Manage Supplies
                </Link>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-card border border-slate-200 dark:border-slate-border rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                        <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
                        <p className="mt-2">Checking inventory...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        {supplies.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/20">
                                <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600 mb-2">inventory_2</span>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All Supplies Stocked Up</p>
                                <p className="text-xs text-slate-500 mt-1">Found no supplies running low</p>
                            </div>
                        ) : (
                            <>
                                {outOfStock.length > 0 && (
                                    <div className="bg-rose-50/50 dark:bg-rose-900/10">
                                        <div className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider border-b border-rose-100 dark:border-rose-900/20 bg-rose-50/80 dark:bg-rose-900/20">
                                            Out of Stock
                                        </div>
                                        <div className="divide-y divide-rose-100 dark:divide-rose-900/20">
                                            {outOfStock.map(renderItem)}
                                        </div>
                                    </div>
                                )}

                                {lowStock.length > 0 && (
                                    <div className="bg-amber-50/20 dark:bg-amber-900/5">
                                        <div className="px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider border-b border-amber-100 dark:border-amber-900/20 bg-amber-50/50 dark:bg-amber-900/20">
                                            Running Low
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {lowStock.map(renderItem)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
