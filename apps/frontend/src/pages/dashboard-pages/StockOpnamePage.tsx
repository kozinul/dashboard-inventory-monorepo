import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { getStockOpnames, deleteStockOpname, StockOpname } from '@/features/inventory/api/stockOpname.api';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useAuthStore } from '@/store/authStore';
import { showSuccess, showError, showConfirmDelete, showLoading, closeAlert } from '@/utils/swal';
import { CreateStockOpnameModal } from './CreateStockOpnameModal';

export default function StockOpnamePage() {
    const { activeBranchId } = useAppStore();
    const { user } = useAuthStore();
    const [campaigns, setCampaigns] = useState<StockOpname[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const canDelete = ['superuser', 'admin', 'system_admin'].includes(user?.role || '');

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const data = await getStockOpnames({ branchId: activeBranchId });
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to fetch stock opnames', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [activeBranchId]);

    const handleDelete = async (so: StockOpname) => {
        const confirm = await showConfirmDelete(
            'Delete Stock Opname?',
            `Are you sure you want to delete "${so.title}"? This action cannot be undone.`
        );
        if (!confirm) return;

        showLoading('Deleting...', 'Removing stock opname...');
        try {
            await deleteStockOpname(so._id);
            closeAlert();
            showSuccess('Deleted!', `"${so.title}" has been deleted.`);
            fetchCampaigns();
        } catch (err: any) {
            closeAlert();
            showError('Failed to Delete', err.response?.data?.message || 'Something went wrong.');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            case 'ONGOING': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            case 'REVIEW': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Stock Opname / Audit</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">fact_check</span>
                        Manage physical inventory counting and audit
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Stock Opname
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Location/Dept</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center">Loading...</td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No Stock Opname campaigns found.
                                    </td>
                                </tr>
                            ) : campaigns.map(so => (
                                <tr key={so._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {so.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        {so.locationId?.name || so.departmentId?.name || 'All'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {so.type}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusStyle(so.status)}`}>
                                            {so.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {so.startDate ? moment(so.startDate).format('DD MMM YYYY') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link 
                                                to={`/inventory/stock-opname/${so._id}`}
                                                className="text-primary hover:text-primary/80 font-medium"
                                            >
                                                View Details
                                            </Link>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(so)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateStockOpnameModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={fetchCampaigns}
            />
        </div>
    );
}
