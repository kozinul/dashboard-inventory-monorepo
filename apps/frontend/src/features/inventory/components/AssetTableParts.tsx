import { Asset } from '../../../services/assetService';
import { cn } from '@/lib/utils';

import { Link } from 'react-router-dom';

export function AssetImageCell({ asset }: { asset: Asset }) {
    if (asset.images && asset.images.length > 0) {
        return (
            <div
                className="size-10 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-700"
                style={{ backgroundImage: `url('${asset.images[0]}')` }}
            ></div>
        );
    }
    return (
        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined !text-[20px]">image_not_supported</span>
        </div>
    );
}

export function AssetNameCell({ asset }: { asset: Asset }) {
    return (
        <div>
            <p className="text-sm font-bold dark:text-slate-100">{asset.name}</p>
            <p className="text-[11px] text-slate-500">{asset.model}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.serial}</p>
        </div>
    );
}

export function AssetLocationCell({ asset }: { asset: Asset }) {
    if (!asset.location) {
        return <span className="text-xs text-slate-400 italic">No Location</span>;
    }

    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary/70">location_on</span>
                {asset.location}
            </p>
            {asset.locationDetail && (
                <p className="text-[10px] text-slate-400 italic flex items-center gap-1 px-1 border-l border-slate-200 dark:border-slate-800 ml-2">
                    {asset.locationDetail}
                </p>
            )}
        </div>
    );
}

export function AssetMetaCell({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <div>
            <p className="text-xs font-semibold dark:text-slate-300">{title}</p>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide">{subtitle}</p>
        </div>
    );
}

export function AssetStatusBadge({ status }: { status: Asset['status'] }) {
    const styles = {
        active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        maintenance: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        storage: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        retired: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        assigned: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        "request maintenance": "bg-rose-500/10 text-rose-500 border-rose-500/20",
        disposed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        in_use: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            styles[status]
        )}>
            {status}
        </span>
    );
}

export function AssetRowActions({ assetId, onEdit, onDelete, onClone }: { assetId: string, onEdit?: (id: string) => void, onDelete?: (id: string) => void, onClone?: (id: string) => void }) {
    return (
        <div className="flex items-center gap-1 justify-end">
            <Link
                to={`/inventory/asset-details/${assetId}`}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors flex items-center justify-center"
            >
                <span className="material-symbols-outlined !text-[18px]">visibility</span>
            </Link>
            {onEdit && (
                <button
                    onClick={() => onEdit(assetId)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                >
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                </button>
            )}
            {onClone && (
                <button
                    onClick={() => onClone(assetId)}
                    className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors"
                    title="Clone Asset"
                >
                    <span className="material-symbols-outlined !text-[18px]">content_copy</span>
                </button>
            )}
            {onDelete && (
                <button
                    onClick={() => onDelete(assetId)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                    <span className="material-symbols-outlined !text-[18px]">delete</span>
                </button>
            )}
        </div>
    );
}

