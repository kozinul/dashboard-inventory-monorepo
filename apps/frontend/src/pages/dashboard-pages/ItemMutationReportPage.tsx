import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { getSupplyMutationReport, exportSupplyMutationExcel } from '@/features/reports/api/reports.api';
import moment from 'moment';

export default function ItemMutationReportPage() {
    const { activeBranchId } = useAppStore();
    const [mutations, setMutations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [itemTypeFilter, setItemTypeFilter] = useState('ALL');

    // Filters
    const [startDate, setStartDate] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getSupplyMutationReport({
                branchId: activeBranchId,
                startDate,
                endDate,
                itemType: itemTypeFilter === 'ALL' ? undefined : itemTypeFilter
            });
            setMutations(data);
        } catch (error) {
            console.error('Failed to fetch mutation report', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeBranchId]);

    const getActionStyle = (action: string) => {
        switch (action) {
            case 'RESTOCK': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10';
            case 'USE': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10';
            case 'ADJUST': return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10';
            case 'MOVE': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10';
            case 'ASSIGN': return 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-500/10';
            case 'RETURN': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-500/10';
            case 'TRANSFER': return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10';
            default: return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Item Mutation Report</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                        Track item movements & stock changes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={itemTypeFilter}
                        onChange={(e) => setItemTypeFilter(e.target.value)}
                        className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="ALL">All Items</option>
                        <option value="Supply">Supplies</option>
                        <option value="Asset">Assets</option>
                    </select>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-slate-500">to</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm"
                    />
                    <button 
                        onClick={fetchData}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                    >
                        Filter
                    </button>
                    <button onClick={() => exportSupplyMutationExcel({ branchId: activeBranchId, startDate, endDate })} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">From Location</th>
                                <th className="px-6 py-4">To Location</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
                                </tr>
                            ) : mutations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        No mutations found in this period.
                                    </td>
                                </tr>
                            ) : mutations.map((m, idx) => (
                                <tr key={m._id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {moment(m.createdAt).format('DD MMM YYYY HH:mm')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {m.alias && <div className="text-xs font-bold text-primary dark:text-primary uppercase tracking-wide">{m.alias}</div>}
                                        <div className="font-medium text-slate-900 dark:text-white">{m.itemName}</div>
                                        <div className="text-xs text-slate-500 font-normal">
                                            {m.partNumber || m.serial || ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                            m.itemType === 'Asset'
                                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {m.itemType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getActionStyle(m.action)}`}>
                                            {m.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate" title={m.fromLocation || ''}>
                                        {m.fromLocation || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate font-medium text-slate-700 dark:text-slate-300" title={m.toLocation || ''}>
                                        {m.toLocation || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {m.userName || 'System'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {m.itemType === 'Supply' && m.quantityChange != null ? (
                                            <span>
                                                <span className="text-xs text-slate-400 mr-1">{m.previousStock || 0} &rarr;</span>
                                                <span className={m.quantityChange > 0 ? 'text-emerald-600 font-bold' : m.quantityChange < 0 ? 'text-red-500 font-bold' : 'font-semibold'}>
                                                    {m.newStock}
                                                </span>
                                                <div className={`text-xs font-bold ${m.quantityChange > 0 ? 'text-emerald-500' : m.quantityChange < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                                                </div>
                                            </span>
                                        ) : m.itemType === 'Asset' ? (
                                            <span className="text-slate-700 dark:text-slate-300 font-semibold">1</span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
