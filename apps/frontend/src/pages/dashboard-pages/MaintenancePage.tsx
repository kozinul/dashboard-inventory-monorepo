import { useState, useEffect } from 'react';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { MaintenanceTable } from '@/features/maintenance/components/MaintenanceTable';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { TicketWorkModal } from '@/features/maintenance/components/TicketWorkModal';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';

export default function MaintenancePage() {
    const { user } = useAuthStore();
    const isTechnician = user?.role === 'technician';

    const [viewMode, setViewMode] = useState<'all' | 'assigned' | 'department'>(isTechnician ? 'assigned' : 'all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

    // Data Stats
    const [tasks, setTasks] = useState<MaintenanceTicket[]>([]);
    const [stats, setStats] = useState({
        activeRepairs: 0,
        pending: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);

    // Selection
    const [selectedTask, setSelectedTask] = useState<MaintenanceTicket | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            let tasksData = [];

            // Stats always fetched general for now, or we can fetch personal stats if needed
            const statsData = await maintenanceService.getStats();
            setStats(statsData);

            if (isTechnician) {
                if (viewMode === 'assigned') {
                    tasksData = await maintenanceService.getAssignedTickets();
                } else if (viewMode === 'department') {
                    // Start with empty or fetch if endpoint exists logic is tricky without dedicated endpoint for "unassigned department tickets"
                    // But getDepartmentTickets usually returns ALL department tickets.
                    // We can filter on client side for "Available" if needed, but let's just show all for "Department Tickets" view
                    tasksData = await maintenanceService.getDepartmentTickets();
                }
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
    }, [viewMode]);

    const handleCreate = () => {
        setSelectedTask(null);
        setIsCreateModalOpen(true);
    };

    const handleEdit = (task: MaintenanceTicket) => {
        setSelectedTask(task);

        // Logic: specific action based on Role & Status
        if (isTechnician) {
            // Technicians only edit "Work" on assigned tickets
            // If ticket is not assigned to them (e.g. viewMode department), maybe they can't edit or they "Accept" it?
            // "Accept" logic is usually for managers to assign, but maybe tech can self-assign?
            // For now, if they are viewing 'assigned', they open WorkModal.
            if (viewMode === 'assigned') {
                setIsWorkModalOpen(true);
                return;
            }
        }

        // Default to admin/manager edit or if technician is viewing unrelated ticket (fallback)
        setIsCreateModalOpen(true);
    };

    // Custom action handler for "Accept" if we want to add self-assignment later
    // For now we stick to handleEdit being the entry point

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
            value: stats.activeRepairs,
            icon: 'engineering',
            type: 'active' as const,
            trendValue: '+12%',
            trendLabel: 'vs last month'
        },
        {
            label: 'Pending Requests',
            value: stats.pending,
            icon: 'pending_actions',
            type: 'pending' as const,
            trendValue: 'High Priority',
            trendLabel: 'Needs attention'
        },
        {
            label: 'Completed Tasks',
            value: stats.completed,
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
                        {isTechnician ? 'Manage your assigned jobs and department requests' : 'Technician logs and task tracking'}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                    {/* View Toggles for Technician */}
                    {isTechnician && (
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('assigned')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'assigned'
                                    ? 'bg-white dark:bg-card-dark text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                My Tickets
                            </button>
                            <button
                                onClick={() => setViewMode('department')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'department'
                                    ? 'bg-white dark:bg-card-dark text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Department Tickets
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {/* Search could go here */}
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            New Ticket
                        </button>
                    </div>
                </div>
            </div>

            {/* Bento Stats */}
            <MaintenanceStats stats={statsArray} />

            {/* Main Table */}
            <MaintenanceTable
                tasks={tasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                userRole={user?.role}
            />

            {/* Create/Edit Modal (Admin/Manager usually, or Technician creating new Request) */}
            <MaintenanceModal
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                initialData={selectedTask}
            />

            {/* Work Modal (Technician working on ticket) */}
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
