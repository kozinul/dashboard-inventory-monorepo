import { Assignment } from '@/services/assignmentService';

export interface RecipientGroup {
    name: string;
    title: string;
    department?: string; // Potential future use
    location?: string;
    activeCount: number;
    assignments: Assignment[];
}

interface RecipientListTableProps {
    recipients: RecipientGroup[];
    onManage: (recipient: RecipientGroup) => void;
    onEdit: (recipient: RecipientGroup) => void;
    onDelete: (recipient: RecipientGroup) => void;
}

export function RecipientListTable({ recipients, onManage, onEdit, onDelete }: RecipientListTableProps) {
    return (
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Recipient Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-center">Active Assets</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recipients.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No recipients found.
                                </td>
                            </tr>
                        ) : (
                            recipients.map((recipient, index) => (
                                <tr
                                    key={recipient.name + index}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {recipient.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {recipient.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {recipient.title || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                        {recipient.location || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {recipient.activeCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(recipient)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                title="Edit Details"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => onManage(recipient)}
                                                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline px-3 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                                            >
                                                Manage Assets
                                            </button>
                                            <button
                                                onClick={() => onDelete(recipient)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete All Assignments"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
