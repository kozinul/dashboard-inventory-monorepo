import { useState, useEffect } from 'react';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { MaintenanceTable } from '@/features/maintenance/components/MaintenanceTable';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { TicketWorkModal } from '@/features/maintenance/components/TicketWorkModal';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export default function MaintenancePage() {
    const { user } = useAuthStore();
    const { activeBranchId } = useAppStore();
    const isTechnician = user?.role === 'technician';

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

    // Data Stats
    const [tasks, setTasks] = useState<MaintenanceTicket[]>([]);
    // Removed stats state, calculating on the fly from filtered tasks
    const [loading, setLoading] = useState(true);

    // Selection
    const [selectedTask, setSelectedTask] = useState<MaintenanceTicket | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            let tasksData: MaintenanceTicket[] = [];

            // const statsData = await maintenanceService.getStats();
            // setStats(statsData);

            if (isTechnician) {
                // Fetch BOTH assigned and department tickets
                const [assigned, department] = await Promise.all([
                    maintenanceService.getAssignedTickets(),
                    maintenanceService.getDepartmentTickets()
                ]);

                // Merge and Filter
                const map = new Map();

                // Add department tickets mostly because they might be unassigned
                department.forEach(t => {
                    // Only add if Unassigned OR Assigned to Me
                    const techId = t.technician && typeof t.technician === 'object' ? t.technician._id : t.technician;

                    // Logic: Include unassigned (techId falsy) OR assigned to me
                    if (!techId || techId === user?._id) {
                        map.set(t._id, t);
                    }
                });

                // Add assigned tickets (these are definitely mine)
                assigned.forEach(t => map.set(t._id, t));

                tasksData = Array.from(map.values());
            } else {
                // Admin / Manager Logic
                tasksData = await maintenanceService.getAll();
            }

            setTasks(tasksData);
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

    // Filter tasks based on activeBranchId
    const filteredTasks = activeBranchId === 'ALL'
        ? tasks
        : tasks.filter(t => {
            // Check ticket branch (populated object or ID)
            // Fallback to asset branch if ticket branch is missing (legacy)
            const branchId = (typeof t.branchId === 'object' ? t.branchId?._id : t.branchId) ||
                (typeof t.asset?.branchId === 'object' ? t.asset?.branchId?._id : t.asset?.branchId);

            return branchId === activeBranchId;
        });

    // Recalculate stats based on filteredTasks
    const displayedStats = {
        activeRepairs: filteredTasks.filter(t => ['In Progress', 'Service', 'Accepted'].includes(t.status)).length,
        pending: filteredTasks.filter(t => ['Draft', 'Sent', 'Pending', 'Escalated'].includes(t.status)).length,
        completed: filteredTasks.filter(t => ['Done', 'Closed'].includes(t.status)).length
    };



    const handleEdit = (task: MaintenanceTicket) => {
        setSelectedTask(task);

        // Logic: specific action based on Role & Status
        if (isTechnician) {
            // If the ticket is assigned to THIS technician, open work modal
            if (task.technician?._id === user?._id) {
                setIsWorkModalOpen(true);
                return;
            }
            // else fall through to MaintenanceModal (view/edit details if allowed) or maybe show "Take Job" modal later?
            // For now, let's allow them to view details via MaintenanceModal
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
            console.error('Failed to complete ticket:', error);
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
            console.error('Failed to delete record:', error);
            showErrorToast('Failed to delete record');
        }
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setIsWorkModalOpen(false);
        setSelectedTask(null);
    };

    const handleSuccess = () => {
        fetchData();
        handleModalClose();
    };

    const statsArray = [
        {
            label: 'Active Repairs',
            value: displayedStats.activeRepairs,
            icon: 'engineering',
            type: 'active' as const,
            trendValue: '+12%',
            trendLabel: 'vs last month'
        },
        {
            label: 'Pending Requests',
            value: displayedStats.pending,
            icon: 'pending_actions',
            type: 'pending' as const,
            trendValue: 'High Priority',
            trendLabel: 'Needs attention'
        },
        {
            label: 'Completed Tasks',
            value: displayedStats.completed,
            icon: 'task_alt',
            type: 'completed' as const,
            progressBar: 82
        }
    ];

    if (loading && tasks.length === 0) {
        return <div className="p-8 text-center">Loading maintenance data...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Maintenance Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">engineering</span>
                        {isTechnician ? 'Manage assigned jobs and department requests' : 'Technician logs and task tracking'}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                    {/* New Ticket button removed from here, centralized in My Tickets */}
                </div>
            </div>

            {/* Bento Stats */}
            <MaintenanceStats stats={statsArray} />

            {/* Main Table */}
            <MaintenanceTable
                tasks={filteredTasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
                userRole={user?.role}
            />

            {/* Create/Edit Modal */}
            <MaintenanceModal
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                initialData={selectedTask}
            />

            {/* Work Modal */}
            {selectedTask && (
                <TicketWorkModal
                    isOpen={isWorkModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                    ticket={selectedTask}
                />
            )}
        </div>
    );
}
