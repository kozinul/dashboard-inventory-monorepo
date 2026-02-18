import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, Event } from '@/services/eventService';
import { format } from 'date-fns';
import AddEventAssetModal from '@/features/events/components/AddEventAssetModal';
import AddEventSupplyModal from '@/features/events/components/AddEventSupplyModal';
import { showConfirmDialog, showSuccess, showErrorToast, showAlert } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';

export default function EventDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);

    const canManageStatus = user?.role && ['superuser', 'system_admin', 'admin', 'manager', 'dept_admin', 'supervisor'].includes(user.role);

    const fetchEvent = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await eventService.getById(id);
            setEvent(data);
        } catch (error) {
            console.error('Failed to fetch event:', error);
            // navigate('/rental'); // Optional: redirect on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleRemoveAsset = async (assetIndex: number) => {
        if (!event || !id) return;

        const result = await showConfirmDialog(
            'Remove Asset?',
            'Are you sure you want to remove this asset?',
            'Yes, remove it!',
            'delete'
        );

        if (!result.isConfirmed) return;

        try {
            const updatedAssets = [...(event.rentedAssets || [])];
            updatedAssets.splice(assetIndex, 1);

            const payloadAssets = updatedAssets.map(a => ({
                assetId: a.assetId._id,
                rentalRate: a.rentalRate,
                rentalRateUnit: a.rentalRateUnit
            }));

            await eventService.update(id, { rentedAssets: payloadAssets });
            showSuccess('Removed!', 'Asset has been removed.');
            fetchEvent();
        } catch (error) {
            console.error('Failed to remove asset:', error);
            showErrorToast('Failed to remove asset');
        }
    };

    const handleRemoveSupply = async (supplyIndex: number) => {
        if (!event || !id) return;

        const result = await showConfirmDialog(
            'Remove Supply?',
            'Are you sure you want to remove this supply?',
            'Yes, remove it!',
            'delete'
        );

        if (!result.isConfirmed) return;

        try {
            const updatedSupplies = [...(event.planningSupplies || [])];
            updatedSupplies.splice(supplyIndex, 1);

            const payloadSupplies = updatedSupplies.map(s => ({
                supplyId: s.supplyId._id,
                quantity: s.quantity,
                cost: s.cost
            }));

            await eventService.update(id, { planningSupplies: payloadSupplies });
            showSuccess('Removed!', 'Supply has been removed.');
            fetchEvent();
        } catch (error) {
            console.error('Failed to remove supply:', error);
            showErrorToast('Failed to remove supply');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Event not found</h3>
                <button
                    onClick={() => navigate('/rental')}
                    className="mt-4 text-primary hover:underline"
                >
                    Back to Rentals
                </button>
            </div>
        );
    }

    const getStatusStyles = (event: Event) => {
        const now = new Date();
        const isOverdue = new Date(event.endTime) < now && event.status !== 'completed' && event.status !== 'cancelled';

        if (isOverdue) {
            return {
                bg: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
                dot: 'bg-rose-500',
                label: 'Overdue'
            };
        }

        switch (event.status) {
            case 'scheduled':
                return {
                    bg: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                    dot: 'bg-amber-500',
                    label: 'Scheduled'
                };
            case 'ongoing':
                return {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                    dot: 'bg-emerald-500 animate-pulse',
                    label: 'Ongoing'
                };
            case 'planning':
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
                    dot: 'bg-blue-500',
                    label: 'Planning'
                };
            case 'completed':
                return {
                    bg: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
                    dot: 'bg-slate-400',
                    label: 'Completed'
                };
            default:
                return {
                    bg: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
                    dot: 'bg-slate-400',
                    label: event.status.charAt(0).toUpperCase() + event.status.slice(1)
                };
        }
    };

    const statusStyles = getStatusStyles(event);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{event.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {format(new Date(event.startTime), 'MMM dd, yyyy')}
                        </span>
                        <span className="mx-1">•</span>
                        <span>
                            {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                        </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">room</span>
                        {event.room}
                    </p>
                    {event.departmentId && (
                        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">corporate_fare</span>
                            {(event.departmentId as any).name || 'Unknown Department'}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusStyles.bg}`}>
                        <span className={`size-1.5 rounded-full ${statusStyles.dot}`}></span>
                        {statusStyles.label}
                    </span>

                    {canManageStatus && (
                        <div className="flex items-center gap-3">
                            {event.status === 'planning' && (
                                <>
                                    <button
                                        onClick={async () => {
                                            if (!id) return;

                                            const hasItems = (event.rentedAssets && event.rentedAssets.length > 0) ||
                                                (event.planningSupplies && event.planningSupplies.length > 0);

                                            if (hasItems) {
                                                showAlert({
                                                    title: 'Cannot Delete',
                                                    text: 'Please remove all rented assets and planned supplies before deleting the event.',
                                                    icon: 'warning'
                                                });
                                                return;
                                            }

                                            const result = await showConfirmDialog(
                                                'Are you sure?',
                                                "You won't be able to revert this!",
                                                'Yes, delete it!',
                                                'delete'
                                            );

                                            if (result.isConfirmed) {
                                                try {
                                                    await eventService.delete(id);
                                                    showSuccess('Deleted!', 'The event has been deleted.');
                                                    navigate('/rental');
                                                } catch (error: any) {
                                                    console.error('Failed to delete event:', error);
                                                    showErrorToast(error.response?.data?.message || 'Failed to delete event');
                                                }
                                            }
                                        }}
                                        disabled={(event.rentedAssets && event.rentedAssets.length > 0) || (event.planningSupplies && event.planningSupplies.length > 0)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${(event.rentedAssets && event.rentedAssets.length > 0) || (event.planningSupplies && event.planningSupplies.length > 0)
                                            ? 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
                                            : 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'
                                            }`}
                                        title={((event.rentedAssets && event.rentedAssets.length > 0) || (event.planningSupplies && event.planningSupplies.length > 0)) ? "Remove all assets and supplies first" : "Delete Event"}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!id) return;
                                            const result = await showConfirmDialog(
                                                'Book Resources?',
                                                'Are you sure you want to book these resources? This will mark the event as scheduled.',
                                                'Yes, book it!',
                                                'info'
                                            );
                                            if (result.isConfirmed) {
                                                try {
                                                    await eventService.update(id, { status: 'scheduled' });
                                                    fetchEvent();
                                                } catch (error) {
                                                    console.error('Failed to book event:', error);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        Book Resources
                                    </button>
                                </>
                            )}

                            {event.status === 'scheduled' && (
                                <>
                                    <button
                                        onClick={async () => {
                                            if (!id) return;
                                            const result = await showConfirmDialog(
                                                'Release Resources?',
                                                'Are you sure you want to release these resources? This will move the event back to planning.',
                                                'Yes, release!',
                                                'warning'
                                            );
                                            if (result.isConfirmed) {
                                                try {
                                                    await eventService.update(id, { status: 'planning' });
                                                    fetchEvent();
                                                } catch (error) {
                                                    console.error('Failed to release event:', error);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        Release Resources
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!id) return;
                                            const result = await showConfirmDialog(
                                                'Mark as Done?',
                                                'Are you sure you want to mark this event as done? Resources will be freed.',
                                                'Yes, mark as done!',
                                                'info'
                                            );
                                            if (result.isConfirmed) {
                                                try {
                                                    await eventService.update(id, { status: 'completed' });
                                                    fetchEvent();
                                                } catch (error) {
                                                    console.error('Failed to mark event as done:', error);
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        Mark as Done
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/rental')}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Rented Assets Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">devices</span>
                            Rented Assets
                        </h3>
                        <button
                            onClick={() => setIsAssetModalOpen(true)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-1 shadow-sm shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={event.status !== 'planning' && event.status !== 'scheduled'}
                            title={event.status !== 'planning' && event.status !== 'scheduled' ? "Switch to Planning or Booked mode to add assets" : "Add Asset"}
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Add Asset
                        </button>
                    </div>

                    <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-[#F8FAFC] dark:bg-slate-900/50">
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                    <th scope="col" className="py-3 px-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Asset</th>
                                    <th scope="col" className="py-3 px-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Rate</th>
                                    <th scope="col" className="py-3 px-4 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                                {event.rentedAssets && event.rentedAssets.length > 0 ? (
                                    event.rentedAssets.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {item.assetId?.name}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                Rp. {item.rentalRate.toLocaleString('id-ID')} / {item.rentalRateUnit}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveAsset(idx)}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={event.status !== 'planning' && event.status !== 'scheduled'}
                                                    title={event.status !== 'planning' && event.status !== 'scheduled' ? "Switch to Planning or Booked mode to remove assets" : "Remove asset"}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                            No rented assets added.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Supplies Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                            Planned Supplies
                        </h3>
                        <button
                            onClick={() => setIsSupplyModalOpen(true)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-1 shadow-sm shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!['planning', 'scheduled', 'ongoing'].includes(event.status)}
                            title={!['planning', 'scheduled', 'ongoing'].includes(event.status) ? "Event is locked" : "Add Supply"}
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Add Supply
                        </button>
                    </div>

                    <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-[#F8FAFC] dark:bg-slate-900/50">
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                    <th scope="col" className="py-3 px-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Supply</th>
                                    <th scope="col" className="py-3 px-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Qty</th>
                                    <th scope="col" className="py-3 px-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Est. Cost</th>
                                    <th scope="col" className="py-3 px-4 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                                {event.planningSupplies && event.planningSupplies.length > 0 ? (
                                    event.planningSupplies.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {item.supplyId?.name}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                {item.quantity} {item.supplyId?.unit}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                Rp. {item.cost.toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveSupply(idx)}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!['planning', 'scheduled', 'ongoing'].includes(event.status)}
                                                    title={!['planning', 'scheduled', 'ongoing'].includes(event.status) ? "Event is locked" : "Remove supply"}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                            No planning supplies added.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Totals Section */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Event Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rented Assets Subtotal</p>
                        <div className="flex items-end justify-between mt-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                Rp. {event.rentedAssets?.reduce((sum, item) => sum + item.rentalRate, 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {event.rentedAssets?.length || 0} Assets
                            </span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Planned Supplies Subtotal</p>
                        <div className="flex items-end justify-between mt-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                Rp. {event.planningSupplies?.reduce((sum, item) => sum + item.cost, 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {event.planningSupplies?.reduce((sum, item) => sum + item.quantity, 0) || 0} Items
                            </span>
                        </div>
                    </div>
                    <div className="bg-primary p-4 rounded-lg shadow-lg shadow-primary/20 border border-primary/10">
                        <p className="text-sm font-bold text-white/80">Grand Total</p>
                        <div className="flex items-end justify-between mt-1">
                            <span className="text-2xl font-black text-white">
                                Rp. {(
                                    (event.rentedAssets?.reduce((sum, item) => sum + item.rentalRate, 0) || 0) +
                                    (event.planningSupplies?.reduce((sum, item) => sum + item.cost, 0) || 0)
                                ).toLocaleString('id-ID')}
                            </span>
                            <span className="text-sm font-bold text-white/90">
                                {(event.rentedAssets?.length || 0) + (event.planningSupplies?.reduce((sum, item) => sum + item.quantity, 0) || 0)} Total Qty
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {id && (
                <>
                    <AddEventAssetModal
                        isOpen={isAssetModalOpen}
                        onClose={() => setIsAssetModalOpen(false)}
                        eventId={id}
                        onSuccess={fetchEvent}
                    />
                    <AddEventSupplyModal
                        isOpen={isSupplyModalOpen}
                        onClose={() => setIsSupplyModalOpen(false)}
                        eventId={id}
                        onSuccess={fetchEvent}
                    />
                </>
            )}
        </div>
    );
}
