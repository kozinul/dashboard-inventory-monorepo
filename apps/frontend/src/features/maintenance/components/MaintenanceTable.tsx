import { useState, useEffect } from 'react';
import { AssetInfoCell, TechnicianCell, MaintenanceTypeBadge, MaintenanceStatusBadge, VisualProofCell } from './MaintenanceTableParts';
import { userService } from '@/services/userService';

interface MaintenanceTableProps {
    tasks: any[];
    onEdit: (task: any) => void;
    onDelete: (id: string) => void;
    userRole?: string;
}

export function MaintenanceTable({ tasks, onEdit, onDelete, userRole }: MaintenanceTableProps) {
    const isAdmin = ['superuser', 'system_admin', 'admin', 'manager'].includes(userRole || '');
    const canDelete = ['superuser', 'administrator', 'admin'].includes(userRole || '');

    // Filter State
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [filterTechnician, setFilterTechnician] = useState<string>('all');

    // Fetch Technicians on mount
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const users = await userService.getAll();
                // Filter users who have 'technician' role
                const techs = users.filter(u => u.role === 'technician');
                setTechnicians(techs);
            } catch (error) {
                console.error("Failed to fetch technicians for filter", error);
            }
        };

        // Only fetch if admin/manager (since they need to filter)
        if (isAdmin) {
            fetchTechnicians();
        }
    }, [isAdmin]);

    // Apply Filter
    const filteredTasks = tasks.filter(task => {
        if (filterTechnician === 'all') return true;
        if (filterTechnician === 'unassigned') return !task.technician;
        return task.technician?._id === filterTechnician || task.technician === filterTechnician;
    });

    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-border-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card-dark">
                <h3 className="text-lg font-bold dark:text-white">Maintenance Tasks</h3>
                <div className="flex gap-2 items-center">
                    {/* Technician Filter Code */}
                    {isAdmin && (
                        <div className="relative">
                            <select
                                value={filterTechnician}
                                onChange={(e) => setFilterTechnician(e.target.value)}
                                className="pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
                            >
                                <option value="all">All Technicians</option>
                                <option value="unassigned">Unassigned</option>
                                {technicians.map(tech => (
                                    <option key={tech._id} value={tech._id}>{tech.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
                        </div>
                    )}

                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Export">
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
                        {filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No maintenance records found
                                </td>
                            </tr>
                        ) : (
                            filteredTasks.map((task) => (
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
                                                onClick={() => window.location.href = `/maintenance/${task._id || task.id}`}
                                                className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                                title="View Details"
                                            >
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                            </button>

                                            {canDelete && (
                                                <button
                                                    onClick={() => onDelete(task._id || task.id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-border-dark flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest bg-white dark:bg-card-dark">
                <span>Showing {filteredTasks.length} tasks</span>
                <div className="flex gap-4">
                    <button className="hover:text-primary transition-colors">Previous</button>
                    <button className="hover:text-primary text-primary transition-colors">Next</button>
                </div>
            </div>
        </div>
    );
}
