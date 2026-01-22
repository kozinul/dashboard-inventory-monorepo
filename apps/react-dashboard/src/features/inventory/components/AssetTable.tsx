import { Asset } from '../data/mock-inventory';
import { AssetImageCell, AssetNameCell, AssetMetaCell, AssetStatusBadge, AssetRowActions } from './AssetTableParts';

interface AssetTableProps {
    assets: Asset[];
}

export function AssetTable({ assets }: AssetTableProps) {
    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-background-dark/50 border-b border-slate-200 dark:border-border-dark">
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-16">Image</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Asset Details</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Identity</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                        {assets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <AssetImageCell asset={asset} />
                                </td>
                                <td className="px-6 py-4">
                                    <AssetNameCell asset={asset} />
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {asset.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <AssetMetaCell title={asset.id} subtitle={asset.serial} />
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs font-semibold dark:text-slate-300 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                        {asset.location}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <AssetStatusBadge status={asset.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <AssetRowActions />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-border-dark bg-slate-50/50 dark:bg-background-dark/30 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">Showing 5 of 2,450 assets</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-dark hover:bg-slate-100 dark:hover:bg-background-dark text-xs font-bold text-slate-500 disabled:opacity-50 transition-colors" disabled>Previous</button>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-dark hover:bg-slate-100 dark:hover:bg-background-dark text-xs font-bold text-slate-500 transition-colors">Next</button>
                </div>
            </div>
        </div>
    );
}
