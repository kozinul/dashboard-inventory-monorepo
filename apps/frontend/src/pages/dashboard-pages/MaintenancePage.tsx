import { useState, useEffect } from 'react';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { MaintenanceTable } from '@/features/maintenance/components/MaintenanceTable';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { TicketWorkModal } from '@/features/maintenance/components/TicketWorkModal';
import { maintenanceService, MaintenanceTicket, NavCounts } from '@/services/maintenanceService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export default function MaintenancePage() {
    const { user } = useAuthStore();
    const { activeBranchId } = useAppStore();
    const isTechnician = user?.role === 'technician';

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [tasks, setTasks] = useState<MaintenanceTicket[]>([]);
    const [counts, setCounts] = useState<NavCounts | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<MaintenanceTicket | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, countsData] = await Promise.all([
                isTechnician
                    ? (async () => {
                        const [assigned, department] = await Promise.all([
                            maintenanceService.getAssignedTickets(),
                            maintenanceService.getDepartmentTickets()
                        ]);
                        const map = new Map();
                        department.forEach(t => {
                            const techId = t.technician && typeof t.technician === 'object' ? t.technician._id : t.technician;
                            if (!techId || techId === user?._id) map.set(t._id, t);
                        });
                        assigned.forEach(t => map.set(t._id, t));
                        return Array.from(map.values()) as MaintenanceTicket[];
                    })()
                    : maintenanceService.getAll(),
                maintenanceService.getNavCounts()
            ]);

            setTasks(tasksData);
            setCounts(countsData);
        } catch (error) {
            console.error('Failed to fetch maintenance data:', error);
            showErrorToast('Failed to load maintenance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTasks = activeBranchId === 'ALL'
        ? tasks
        : tasks.filter(t => {
            const branchId = (typeof t.branchId === 'object' ? t.branchId?._id : t.branchId) ||
                (typeof t.asset?.branchId === 'object' ? t.asset?.branchId?._id : t.asset?.branchId);
            return branchId === activeBranchId;
        });

    const displayedStats = {
        activeRepairs: filteredTasks.filter(t => ['In Progress', 'Service', 'Accepted'].includes(t.status)).length,
        pending: filteredTasks.filter(t => ['Draft', 'Sent', 'Pending', 'Escalated'].includes(t.status)).length,
        completed: filteredTasks.filter(t => ['Done', 'Closed'].includes(t.status)).length
    };

    const handleEdit = (task: MaintenanceTicket) => {
        setSelectedTask(task);
        if (isTechnician && task.technician?._id === user?._id) {
            setIsWorkModalOpen(true);
            return;
        }
        setIsCreateModalOpen(true);
    };

    const handleComplete = async (id: string) => {
        const result = await showConfirmDialog('Complete Ticket?', 'This will mark the ticket as Done and update asset status.');
        if (!result.isConfirmed) return;
        try {
            await maintenanceService.completeTicket(id);
            showSuccessToast('Ticket completed successfully');
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to complete ticket');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await showConfirmDialog('Are you sure?', 'You wont be able to revert this!');
        if (!result.isConfirmed) return;
        try {
            await maintenanceService.delete(id);
            showSuccessToast('Record deleted successfully');
            fetchData();
        } catch (error) {
            showErrorToast('Failed to delete record');
        }
    };

    const statsArray = [
        {
            label: 'Active Repairs',
            value: isTechnician ? counts?.assignedTickets.total : counts?.deptTickets.breakdown['In Progress'] || displayedStats.activeRepairs,
            icon: 'engineering',
            type: 'active' as const,
            trendValue: counts?.assignedTickets.actionable ? `${counts.assignedTickets.actionable} New` : '+12%',
            trendLabel: counts?.assignedTickets.actionable ? 'Actionable items' : 'vs last month'
        },
        {
            label: 'Pending Requests',
            value: isTechnician ? counts?.deptTickets.actionable : counts?.deptTickets.breakdown['Sent'] || displayedStats.pending,
            icon: 'pending_actions',
            type: 'pending' as const,
            trendValue: counts?.deptTickets.actionable ? 'New' : 'High Priority',
            trendLabel: 'Needs attention'
        },
        {
            label: 'Completed Tasks',
            value: counts?.deptTickets.breakdown['Done'] || displayedStats.completed,
            icon: 'task_alt',
            type: 'completed' as const,
            progressBar: 82
        }
    ];

    if (loading && tasks.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading maintenance data...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Maintenance Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">engineering</span>
                        {isTechnician ? 'Manage assigned jobs and department requests' : 'Technician logs and task tracking'}
                    </p>
                </div>
            </div>

            <MaintenanceStats stats={statsArray} />

            <MaintenanceTable
                tasks={filteredTasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
                userRole={user?.role}
            />

            <MaintenanceModal
                isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => { setIsCreateModalOpen(false); fetchData(); }}
                initialData={selectedTask}
            />

            {selectedTask && (
                <TicketWorkModal
                    isOpen={isWorkModalOpen} onClose={() => setIsWorkModalOpen(false)}
                    onSuccess={() => { setIsWorkModalOpen(false); fetchData(); }}
                    ticket={selectedTask}
                />
            )}
        </div>
    );
}
