import { Assignment } from "@/services/assignmentService";

interface AssetAssignmentHistoryTableProps {
    assignments: Assignment[];
    onReturn?: (assignmentId: string) => void;
}

export function AssetAssignmentHistoryTable({ assignments, onReturn }: AssetAssignmentHistoryTableProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

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
                        <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    {assignments.map((assignment) => {
                        const name = assignment.assignedTo || (typeof assignment.userId === 'object' ? (assignment.userId as any).name : '') || 'Unknown User';
                        const initials = name !== 'Unknown User' ? getInitials(name) : '??';

                        return (
                            <tr key={assignment._id} className="table-row-hover transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {assignment.userId?.avatarUrl ? (
                                            <div
                                                className="size-7 rounded-full bg-cover bg-center border border-border-dark"
                                                style={{ backgroundImage: `url('${assignment.userId.avatarUrl}')` }}
                                            ></div>
                                        ) : (
                                            <div className={`size-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white border border-white/20`}>
                                                {initials}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-white">{name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-text-secondary">
                                    {assignment.returnedDate ? new Date(assignment.returnedDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={assignment.status} />
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-text-secondary">
                                    {assignment.notes || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {assignment.status === 'assigned' && onReturn && (
                                        <button
                                            onClick={() => onReturn(assignment._id)}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors border border-rose-400/20 shadow-lg shadow-rose-500/10"
                                        >
                                            Release
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
    switch (status) {
        case 'assigned':
            return (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ASSIGNED
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
                    {(status as string).toUpperCase()}
                </span>
            );
    }
}
