import { useState } from 'react';
import { Asset } from "@/services/assetService";
import { TechnicalSpecsEditor } from './TechnicalSpecsEditor';

interface AssetTabsProps {
    asset: Asset;
}

export function AssetTabs({ asset }: AssetTabsProps) {
    const [activeTab, setActiveTab] = useState('technical');

    return (
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['Technical Info', 'Documents', 'Usage History', 'Maintenance'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.toLowerCase()
                            ? 'border-b-2 border-primary text-primary font-bold'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="p-8">
                {activeTab.includes('technical') && (
                    <TechnicalSpecsEditor asset={asset} />
                )}
                {/* Placeholders for other tabs */}
                {!activeTab.includes('technical') && (
                    <div className="flex items-center justify-center py-12 text-slate-400">
                        Content for {activeTab} is not implemented yet.
                    </div>
                )}
            </div>
        </section>
    );
}
