import { ChevronRightIcon, MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";
import { AssetHero } from "../../features/inventory/components/asset-details/AssetHero";
import { AssetGallery } from "../../features/inventory/components/asset-details/AssetGallery";
import { AssetTabs } from "../../features/inventory/components/asset-details/AssetTabs";
import { AssetDocuments } from "../../features/inventory/components/asset-details/AssetDocuments";

// Simplified layout to allow document scroll
export default function AssetDetailsPage() {
    return (
        <div className="flex flex-col bg-background-light dark:bg-[#0b1421]">
            {/* Top Header */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-2">
                    <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors" href="/inventory">Inventory</a>
                    <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                    <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors" href="#">Audio Visual</a>
                    <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium text-slate-900 dark:text-white">HDMI Splitter 4-Port</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-primary w-64 text-slate-900 dark:text-white placeholder-slate-500"
                            placeholder="Search assets..."
                            type="text"
                        />
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary rounded-lg border border-slate-200 dark:border-slate-700">
                        <BellIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="px-8 py-6 space-y-8">
                <AssetHero />
                <AssetGallery />
                <AssetTabs />
                <AssetDocuments />
            </div>
        </div>
    );
}
