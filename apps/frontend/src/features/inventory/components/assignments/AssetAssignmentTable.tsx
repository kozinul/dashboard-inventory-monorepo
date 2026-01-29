import { Assignment } from "@/services/assignmentService";

interface AssetAssignmentTableProps {
    assignments: Assignment[];
}

export function AssetAssignmentTable({ assignments }: AssetAssignmentTableProps) {
    return (
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-16">Asset</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Details</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Assigned To</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Location</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Return Date</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {assignments.map((assignment) => (
                            <tr key={assignment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                        {assignment.assetImage ? (
                                            <img
                                                alt={assignment.assetName}
                                                className="object-cover size-full"
                                                src={assignment.assetImage}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-400">
                                                {assignment.category === 'Laptop' ? 'laptop_mac' :
                                                    assignment.category === 'Camera' ? 'videocam' :
                                                        'devices'}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{assignment.assetName}</p>
                                        <p className="text-[11px] text-slate-500 font-mono">{assignment.serialNumber}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {assignment.assignedTo.avatar ? (
                                            <div
                                                className="size-8 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700"
                                                style={{ backgroundImage: `url('${assignment.assignedTo.avatar}')` }}
                                            ></div>
                                        ) : (
                                            <div className={`size-8 rounded-full ${assignment.assignedTo.color || 'bg-primary'} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                                                {assignment.assignedTo.initials}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{assignment.assignedTo.name}</p>
                                            <p className="text-[11px] text-slate-500">{assignment.assignedTo.department || 'Employee'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                        <span className="text-sm">{assignment.location}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${assignment.status === 'overdue' ? 'text-rose-500' :
                                            assignment.status === 'due-today' ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {assignment.expectedReturn}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={assignment.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Showing {assignments.length} assignments</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-muted-foreground disabled:opacity-50 transition-colors" disabled>Previous</button>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-muted-foreground transition-colors">Next</button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
    switch (status) {
        case 'active':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                </span>
            );
        case 'overdue':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Overdue
                </span>
            );
        case 'due-today':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Due Today
                </span>
            );
        default:
            return null;
    }
}
