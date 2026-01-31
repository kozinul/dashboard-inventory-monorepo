import { useState, useEffect } from 'react';
import { maintenanceService } from '@/services/maintenanceService';
import { ServiceTable } from '@/features/service/components/ServiceTable';
import { ServiceModal } from '@/features/service/components/ServiceModal';

export default function ServicePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await maintenanceService.getAll({ serviceProviderType: 'Vendor' });
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch service records', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service record?')) return;
        try {
            await maintenanceService.delete(id);
            fetchRecords();
        } catch (error) {
            console.error('Failed to delete record', error);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await maintenanceService.update(id, { status });
            fetchRecords();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    const activeServices = records.filter((r: any) => r.status === 'In Progress').length;
    const completedServices = records.filter((r: any) => r.status === 'Done').length;
    const totalCost = records.reduce((acc: number, r: any) => acc + (r.cost || 0), 0);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">External Services</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">build_circle</span>
                        Track vendor repairs and off-site services
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Register Service
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg">
                            <span className="material-symbols-outlined text-2xl">timelapse</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Services</p>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{activeServices}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg">
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Services</p>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{completedServices}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg">
                            <span className="material-symbols-outlined text-2xl">attach_money</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Cost</p>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">${totalCost.toLocaleString()}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <ServiceTable
                records={records}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
            />

            {/* Modal */}
            <ServiceModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={fetchRecords}
                editData={editingRecord}
            />
        </div>
    );
}
