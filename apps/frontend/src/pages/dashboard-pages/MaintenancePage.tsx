import { useState, useEffect } from 'react';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { MaintenanceTable } from '@/features/maintenance/components/MaintenanceTable';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { maintenanceService } from '@/services/maintenanceService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';

export default function MaintenancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({
        activeRepairs: 0,
        pending: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, statsData] = await Promise.all([
                maintenanceService.getAll(),
                maintenanceService.getStats()
            ]);
            setTasks(tasksData);
            setStats(statsData);
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

    const handleCreate = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleEdit = (task: any) => {
        setSelectedTask(task);
        setIsModalOpen(true);
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
        setIsModalOpen(false);
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
            type: 'active',
            trendValue: '+12%',
            trendLabel: 'vs last month'
        },
        {
            label: 'Pending Requests',
            value: stats.pending,
            icon: 'pending_actions',
            type: 'pending',
            trendValue: 'High Priority',
            trendLabel: 'Needs attention'
        },
        {
            label: 'Completed Tasks',
            value: stats.completed,
            icon: 'task_alt',
            type: 'completed',
            progressBar: 82
        }
    ];

    if (loading) {
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
                        Technician logs and task tracking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary"
                            placeholder="Search ticket # or issue..."
                            type="text"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Ticket
                    </button>
                </div>
            </div>

            {/* Bento Stats */}
            <MaintenanceStats stats={statsArray} />

            {/* Main Table */}
            <MaintenanceTable
                tasks={tasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modal */}
            <MaintenanceModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                initialData={selectedTask}
            />
        </div>
    );
}
