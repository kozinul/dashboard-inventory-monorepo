import { recentReports } from '../data/mock-reports';

export function RecentReportsTable() {
    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
                <h3 className="font-bold text-lg dark:text-white">Recently Generated Reports</h3>
                <button className="text-primary text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-background-dark/50 text-[11px] uppercase tracking-widest font-bold text-slate-500">
                            <th className="px-6 py-3">Report Name</th>
                            <th className="px-6 py-3">Generated Date</th>
                            <th className="px-6 py-3">Created By</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Format</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                        {recentReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">{report.icon}</span>
                                        <span className="font-medium dark:text-slate-200">{report.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{report.date}</td>
                                <td className="px-6 py-4 text-sm dark:text-slate-300">{report.createdBy}</td>
                                <td className="px-6 py-4">
                                    {report.status.type === 'ready' ? (
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase">
                                            {report.status.label}
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-amber-500 animate-pulse"></div>
                                            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-tight">
                                                {report.status.label}
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-mono text-slate-400">{report.format}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        className={`p-2 rounded-lg transition-colors ${report.status.type === 'ready'
                                                ? 'text-primary hover:bg-primary/10'
                                                : 'text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
