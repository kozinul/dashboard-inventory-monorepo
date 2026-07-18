import { useState, useEffect, Fragment } from 'react';
import { useAppStore } from '@/store/appStore';
import { getCategorySummary } from '@/features/reports/api/reports.api';

export default function CategorySummaryReportPage() {
    const { activeBranchId } = useAppStore();
    const [data, setData] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = activeBranchId === 'ALL' ? undefined : { branchId: activeBranchId };
            const res = await getCategorySummary(params);
            setData(res.data);
            setStatuses(res.statuses);
        } catch (error) {
            console.error('Failed to fetch category summary', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeBranchId]);

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
            in_use: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
            maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
            storage: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
            disposed: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
            rental: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
            broken: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        };
        return map[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Category Summary</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">category</span>
                        Asset count grouped by category and status
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold">
                            <tr>
                                <th className="px-6 py-4">Category / Asset Name</th>
                                {statuses.map(s => (
                                    <th key={s} className="px-4 py-4 text-center capitalize">{s.replace('_', ' ')}</th>
                                ))}
                                <th className="px-4 py-4 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={statuses.length + 2} className="px-6 py-8 text-center">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={statuses.length + 2} className="px-6 py-8 text-center text-slate-500">
                                        No assets found.
                                    </td>
                                </tr>
                            ) : data.map((group) => (
                                <Fragment key={group.category}>
                                    <tr className="bg-slate-100 dark:bg-slate-700/30 font-semibold text-slate-900 dark:text-white">
                                        <td className="px-6 py-3">{group.category}</td>
                                        {statuses.map(s => (
                                            <td key={s} className="px-4 py-3 text-center">
                                                {group.items.reduce((sum: number, item: any) => sum + (item[s] || 0), 0)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center font-bold">
                                            {group.items.reduce((sum: number, item: any) => sum + item.total, 0)}
                                        </td>
                                    </tr>
                                    {group.items.map((item: any) => (
                                        <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-3 pl-12 text-slate-700 dark:text-slate-300">
                                                {item.name}
                                            </td>
                                            {statuses.map(s => (
                                                <td key={s} className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${item[s] > 0 ? getStatusColor(s) : ''}`}>
                                                        {item[s] || 0}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                                                {item.total}
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
