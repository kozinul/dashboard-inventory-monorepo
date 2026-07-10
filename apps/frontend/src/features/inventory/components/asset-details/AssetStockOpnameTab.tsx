import { useState, useEffect } from 'react';
import { Asset } from '@/services/assetService';
import { getStockOpnameByAsset } from '../../api/stockOpname.api';
import { format } from 'date-fns';

interface AssetStockOpnameTabProps {
    asset: Asset | null;
}

export function AssetStockOpnameTab({ asset }: AssetStockOpnameTabProps) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        if (!asset?._id && !asset?.id) return;
        setLoading(true);
        try {
            const assetId = (asset._id || asset.id)!;
            const data = await getStockOpnameByAsset(assetId);
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch stock opname history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [asset]);

    if (!asset) return null;

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading stock opname history...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Stock Opname History</h3>
                <div className="text-sm text-slate-500">
                    Total Records: {records.length}
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Opname Title</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Found</th>
                            <th className="px-6 py-3">Checker</th>
                            <th className="px-6 py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <p className="text-base font-medium">No Stock Opname History</p>
                                    <p className="text-sm mt-1">This asset has not been included in any stock opname yet.</p>
                                </td>
                            </tr>
                        ) : (
                            records.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        {item.stockOpnameId?.title || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            item.status === 'MATCH' || item.status === 'FOUND'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : item.status === 'MISSING'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : item.status === 'DISCREPANCY'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.isAssetFound !== undefined ? (
                                            item.isAssetFound
                                                ? <span className="text-emerald-600 font-bold text-lg">&#10003;</span>
                                                : <span className="text-red-500 font-bold text-lg">&#10007;</span>
                                        ) : item.supplyId ? (
                                            <span>{item.physicalQuantity} / {item.systemQuantity}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {item.checkedBy?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                                        {item.notes || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}