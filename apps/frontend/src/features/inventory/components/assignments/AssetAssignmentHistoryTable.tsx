import { Assignment } from "@/services/assignmentService";

interface AssetAssignmentHistoryTableProps {
    assignments: Assignment[];
}

export function AssetAssignmentHistoryTable({ assignments }: AssetAssignmentHistoryTableProps) {
    return (
        <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#21213e]/50 border-b border-border-dark">
                        <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Assigned To</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Date Issued</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Returned Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    {assignments.map((assignment) => (
                        <tr key={assignment.id} className="table-row-hover transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {assignment.assignedTo.avatar ? (
                                        <div
                                            className="size-7 rounded-full bg-cover bg-center border border-border-dark"
                                            style={{ backgroundImage: `url('${assignment.assignedTo.avatar}')` }}
                                        ></div>
                                    ) : (
                                        <div className={`size-7 rounded-full ${assignment.assignedTo.color || 'bg-primary'} flex items-center justify-center text-[10px] font-bold text-white border border-white/20`}>
                                            {assignment.assignedTo.initials}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-white">{assignment.assignedTo.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-secondary">{assignment.dateIssued}</td>
                            <td className="px-6 py-4 text-sm text-text-secondary">
                                {assignment.status === 'returned' ? 'Jan 10, 2024' : '-'} {/* Mock logic for return date */}
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge status={assignment.status} />
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-text-secondary">
                                -
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
    switch (status) {
        case 'active':
            return (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    CURRENTLY ASSIGNED
                </span>
            );
        case 'overdue':
            return (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    OVERDUE
                </span>
            );
        case 'returned':
            return (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                    RETURNED
                </span>
            );
        default:
            return (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {status.toUpperCase()}
                </span>
            );
    }
}
