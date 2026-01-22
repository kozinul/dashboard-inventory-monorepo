import { TopNav } from '@/components/layout/TopNav';
import { StatsGrid } from '@/features/inventory/components/StatsGrid';
import { AssetTable } from '@/features/inventory/components/AssetTable';
import { inventoryStats, mockAssets } from '@/features/inventory/data/mock-inventory';

export default function InventoryPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display">
            <TopNav />
            <main className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Master Asset List Management</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">database</span>
                            Centralized Inventory Database
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">filter_list</span>
                            <select className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-9 pr-8 py-2 text-sm font-medium focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                                <option>All Categories</option>
                                <option>Laptops</option>
                                <option>AV Gear</option>
                                <option>Furniture</option>
                            </select>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add New Asset
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <StatsGrid stats={inventoryStats} />

                {/* Table */}
                <AssetTable assets={mockAssets} />
            </main>
        </div>
    );
}
