import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Supply, getSupplyById, updateSupply, getSupplyHistory } from '../../../services/supplyService';
import { EditSupplyModal } from '../components/supplies/EditSupplyModal';
import { useForm } from 'react-hook-form';

export default function SupplyDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [supply, setSupply] = useState<Supply | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Restock Form
    const { register, handleSubmit, reset } = useForm();
    const [isRestocking, setIsRestocking] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [supplyData, historyData] = await Promise.all([
                getSupplyById(id),
                getSupplyHistory(id)
            ]);
            setSupply(supplyData);
            setHistory(historyData);
        } catch (error) {
            console.error('Error fetching supply details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleRestockSubmit = async (data: any) => {
        if (!supply || !id) return;
        try {
            setIsRestocking(true);
            const quantityChange = parseFloat(data.quantity);
            const finalQuantity = data.action === 'remove'
                ? supply.quantity - quantityChange
                : supply.quantity + quantityChange;

            await updateSupply(id, {
                quantity: finalQuantity,
                reason: data.reason
            });

            reset();
            fetchData();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update stock');
        } finally {
            setIsRestocking(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!supply) return <div className="p-8 text-center">Supply not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate('/inventory/supplies')} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Supplies
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {supply.name}
                        {supply.quantity < supply.minimumStock && (
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium border border-red-200">
                                Low Stock
                            </span>
                        )}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                        <span>P/N: <span className="font-mono text-slate-700 dark:text-slate-300">{supply.partNumber}</span></span>
                        <span>•</span>
                        <span>{supply.category}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Details
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Restock */}
                <div className="space-y-6 lg:col-span-1">

                    {/* Key Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Current Stock</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-primary">{supply.quantity}</span>
                            <span className="text-slate-500 dark:text-slate-400 mb-1">
                                {(supply.unitId as any)?.symbol || 'units'}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-2">
                            <div
                                className={clsx("h-2 rounded-full transition-all", supply.quantity < supply.minimumStock ? "bg-red-500" : "bg-primary")}
                                style={{ width: `${Math.min((supply.quantity / (supply.minimumStock * 2)) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500">Minimum required: {supply.minimumStock}</p>
                    </div>

                    {/* Quick Restock Form */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">update</span>
                            Update Stock
                        </h3>
                        <form onSubmit={handleSubmit(handleRestockSubmit)} className="space-y-4">
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                                <label className="flex-1 cursor-pointer">
                                    <input type="radio" value="add" {...register('action', { required: true })} className="peer sr-only" defaultChecked />
                                    <div className="text-center py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                                        Add Stock
                                    </div>
                                </label>
                                <label className="flex-1 cursor-pointer">
                                    <input type="radio" value="remove" {...register('action', { required: true })} className="peer sr-only" />
                                    <div className="text-center py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-red-500 peer-checked:shadow-sm transition-all">
                                        Remove
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    {...register('quantity', { required: true, min: 1 })}
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason / Notes</label>
                                <textarea
                                    {...register('reason')}
                                    rows={2}
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                    placeholder="e.g. Received shipment, used for project X"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isRestocking}
                                className="w-full btn-primary disabled:opacity-50"
                            >
                                {isRestocking ? 'Updating...' : 'Update Stock'}
                            </button>
                        </form>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Details</h3>
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                                <dt className="text-slate-500">Location</dt>
                                <dd className="font-medium">{(supply.locationId as any)?.name || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                                <dt className="text-slate-500">Department</dt>
                                <dd className="font-medium">{(supply.departmentId as any)?.name || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                                <dt className="text-slate-500">Vendor</dt>
                                <dd className="font-medium">{(supply.vendorId as any)?.name || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                                <dt className="text-slate-500">Cost</dt>
                                <dd className="font-medium">Rp {supply.cost?.toLocaleString('id-ID')}</dd>
                            </div>
                        </dl>
                        {supply.description && (
                            <div className="mt-4 pt-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{supply.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400">history</span>
                                Transaction History
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Change</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No history found</td>
                                        </tr>
                                    ) : (
                                        history.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                                    {format(new Date(record.createdAt), 'MMM d, yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={clsx(
                                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                        record.action === 'CREATE' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                                        record.action === 'UPDATE' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                                        record.action === 'RESTOCK' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                                        record.action === 'USE' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                                        record.action === 'DELETE' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    )}>
                                                        {record.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <span className={clsx(
                                                        record.quantityChange > 0 ? 'text-green-600 dark:text-green-400' :
                                                            record.quantityChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                                                    )}>
                                                        {record.quantityChange > 0 ? '+' : ''}{record.quantityChange !== 0 ? record.quantityChange : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                                                    {record.newStock}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                    {record.notes || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <EditSupplyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={fetchData}
                supply={supply}
            />
        </div>
    );
}
