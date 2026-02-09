import { format } from 'date-fns';

interface ServiceTableProps {
    records: any[];
    loading: boolean;
    onEdit?: (record: any) => void;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, status: string) => void;
}

export function ServiceTable({ records, loading, onEdit, onDelete, onStatusChange }: ServiceTableProps) {
    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading services...</div>;
    }

    if (records.length === 0) {
        return <div className="p-8 text-center text-slate-500">No external services found.</div>;
    }

    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-widest text-slate-500 font-bold bg-slate-50/50 dark:bg-background-dark/50 border-b border-slate-200 dark:border-border-dark">
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Cost</th>
                            <th className="px-6 py-4">Expected Date</th>
                            {(onEdit || onDelete || onStatusChange) && (
                                <th className="px-6 py-4 text-right">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                        {records.map((record) => (
                            <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors">
                                <td className="px-6 py-4">
                                    {record.asset ? (
                                        <div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200">{record.asset.name}</div>
                                            <div className="text-xs text-slate-400">{record.asset.serial}</div>
                                        </div>
                                    ) : <span className="text-slate-400">Unknown Asset</span>}
                                </td>
                                <td className="px-6 py-4">
                                    {record.vendor ? (
                                        <div className="font-medium text-slate-700 dark:text-slate-300">{record.vendor.name}</div>
                                    ) : <span className="text-slate-400">-</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={record.description}>
                                        {record.description || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold dark:bg-slate-800 dark:text-slate-400">
                                        {record.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'Done' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                        record.status === 'In Progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                            'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                        }`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                                    {record.cost ? `Rp. ${record.cost.toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                    {record.expectedCompletionDate ? format(new Date(record.expectedCompletionDate), 'MMM d, yyyy') : '-'}
                                </td>
                                {(onEdit || onDelete || onStatusChange) && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {record.status !== 'Done' && onStatusChange && (
                                                <button
                                                    onClick={() => onStatusChange(record._id, 'Done')}
                                                    className="p-1 hover:bg-emerald-50 text-emerald-500 rounded tooltip"
                                                    title="Mark as Done"
                                                >
                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                </button>
                                            )}
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(record)}
                                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-primary rounded"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(record._id)}
                                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
