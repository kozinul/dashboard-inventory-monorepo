import { AssetInfoCell, TechnicianCell, MaintenanceTypeBadge, MaintenanceStatusBadge, VisualProofCell } from './MaintenanceTableParts';

interface MaintenanceTableProps {
    tasks: any[];
    onEdit: (task: any) => void;
    onDelete: (id: string) => void;
}

export function MaintenanceTable({ tasks, onEdit, onDelete }: MaintenanceTableProps) {
    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-border-dark flex justify-between items-center bg-white dark:bg-card-dark">
                <h3 className="text-lg font-bold dark:text-white">Maintenance Tasks</h3>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <span className="material-symbols-outlined text-sm font-bold">filter_list</span>
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <span className="material-symbols-outlined text-sm font-bold">download</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-widest text-slate-500 font-bold bg-slate-50/50 dark:bg-background-dark/50 border-b border-slate-200 dark:border-border-dark">
                            <th className="px-6 py-4">Asset Detail</th>
                            <th className="px-6 py-4">Technician</th>
                            <th className="px-6 py-4 text-center">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Visual Proof</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No maintenance records found
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task) => (
                                <tr key={task._id || task.id} className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <AssetInfoCell task={task} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <TechnicianCell technician={task.technician} />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <MaintenanceTypeBadge type={task.type} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <MaintenanceStatusBadge status={task.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <VisualProofCell task={task} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(task)}
                                                className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                title="Edit"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => onDelete(task._id || task.id)}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-border-dark flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest bg-white dark:bg-card-dark">
                <span>Showing {tasks.length} tasks</span>
                <div className="flex gap-4">
                    <button className="hover:text-primary transition-colors">Previous</button>
                    <button className="hover:text-primary text-primary transition-colors">Next</button>
                </div>
            </div>
        </div>
    );
}
