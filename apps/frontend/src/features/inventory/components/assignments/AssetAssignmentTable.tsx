import { Assignment } from "@/services/assignmentService";

interface AssetAssignmentTableProps {
    assignments: Assignment[];
    onReturn?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (assignment: Assignment) => void;
}

export function AssetAssignmentTable({ assignments, onReturn, onDelete, onEdit }: AssetAssignmentTableProps) {
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
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Assigned Date</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {assignments.map((assignment) => {
                            // Helper to get user details (either from object or manual fields)
                            const userName = assignment.assignedTo || 'Unknown';
                            const userRole = assignment.assignedToTitle || 'Staff';
                            const userAvatar = undefined; // No avatar for manual assignments
                            const userInitials = userName.substring(0, 2).toUpperCase();
                            const assetName = assignment.assetId?.name || 'Unknown Asset';
                            const assetSerial = assignment.assetId?.serial || '-';
                            const assetImage = (assignment.assetId as any)?.image; // Cast if type mismatch
                            const locationName = (assignment.assetId as any)?.locationId?.name || 'General';


                            return (
                                <tr key={assignment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                            {assetImage ? (
                                                <img
                                                    alt={assetName}
                                                    className="object-cover size-full"
                                                    src={assetImage}
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400">devices</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{assetName}</p>
                                            <p className="text-[11px] text-slate-500 font-mono">{assetSerial}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {userAvatar ? (
                                                <div
                                                    className="size-8 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700"
                                                    style={{ backgroundImage: `url('${userAvatar}')` }}
                                                ></div>
                                            ) : (
                                                <div className={`size-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                                                    {userInitials}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName}</p>
                                                <p className="text-[11px] text-slate-500">{userRole}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                            <span className="text-sm">{locationName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(assignment.assignedDate).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={assignment.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {assignment.status === 'assigned' && onEdit && (
                                                <button
                                                    onClick={() => onEdit(assignment)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                    title="Edit Assignment"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                            )}
                                            {assignment.status === 'assigned' && onReturn && (
                                                <button
                                                    onClick={() => onReturn(assignment._id)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                                                    title="Return Asset"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">assignment_return</span>
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(assignment._id)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                                    title="Delete Assignment"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
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
        case 'returned':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/10">
                    <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                    Returned
                </span>
            );
        default:
            return null;
    }
}
