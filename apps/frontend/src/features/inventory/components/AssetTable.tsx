import { Asset } from '../../../services/assetService';
import { AssetImageCell, AssetNameCell, AssetLocationCell, AssetStatusBadge, AssetRowActions } from './AssetTableParts';

interface AssetTableProps {
    assets: Asset[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onClone?: (id: string) => void;
    onSelect?: (asset: Asset) => void;
    actionLabel?: string;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

export function AssetTable({ assets, onEdit, onDelete, onClone, onSelect, actionLabel = 'Select', selectedIds = [], onSelectionChange }: AssetTableProps) {
    const isAllSelected = assets.length > 0 && selectedIds.length === assets.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < assets.length;

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        if (isAllSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(assets.map(a => a.id || a._id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (!onSelectionChange) return;
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    return (
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            {onSelectionChange && (
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                        checked={isAllSelected}
                                        ref={input => {
                                            if (input) input.indeterminate = isSomeSelected;
                                        }}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-16">Image</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Asset Details</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Location</th>
                            {!onSelect && <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Department</th>}
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {assets.map((asset) => {
                            const assetId = asset.id || asset._id;
                            const isSelected = selectedIds.includes(assetId);
                            return (
                                <tr key={assetId} className={`transition-colors group ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                    {onSelectionChange && (
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                                checked={isSelected}
                                                onChange={() => handleSelectOne(assetId)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <AssetImageCell asset={asset} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <AssetNameCell asset={asset} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                            {asset.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <AssetLocationCell asset={asset} />
                                    </td>
                                    {!onSelect && (
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm text-muted-foreground">business</span>
                                                {asset.department || 'Unassigned'}
                                            </p>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <AssetStatusBadge status={asset.status} />
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {onSelect ? (
                                            <button
                                                onClick={() => onSelect(asset)}
                                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-md text-xs font-bold transition-all"
                                            >
                                                {actionLabel}
                                            </button>
                                        ) : (
                                            <AssetRowActions
                                                assetId={asset.id || asset._id}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                                onClone={onClone}
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Showing {assets.length} assets</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-muted-foreground disabled:opacity-50 transition-colors" disabled>Previous</button>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-muted-foreground transition-colors">Next</button>
                </div>
            </div>
        </div>
    );
}
