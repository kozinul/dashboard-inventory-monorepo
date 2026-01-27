import { mockDisposalRecords } from '../data/mock-disposal';
import { AssetCell, ReasonBadge, WorkflowStatusIndicator } from './DisposalTableParts';

export function DisposalTable() {
    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-card-dark">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">Disposal Requests</h3>
                <div className="flex gap-2">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs w-48 focus:ring-1 focus:ring-primary"
                            placeholder="Search requests..."
                            type="text"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark">
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Asset Detail</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Requested By</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                        {mockDisposalRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors group cursor-pointer">
                                <td className="px-6 py-4">
                                    <AssetCell record={record} />
                                </td>
                                <td className="px-6 py-4">
                                    <ReasonBadge reason={record.reason} />
                                </td>
                                <td className="px-6 py-4">
                                    <WorkflowStatusIndicator status={record.status} />
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {record.location}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{record.requestedBy}</span>
                                        <span className="text-[10px] text-slate-400">{record.date}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">more_vert</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 dark:border-border-dark flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50 dark:bg-card-dark">
                <span>5 records found</span>
                <div className="flex gap-2">
                    <button className="hover:text-primary disabled:opacity-50" disabled>Prev</button>
                    <button className="hover:text-primary">Next</button>
                </div>
            </div>
        </div>
    );
}
