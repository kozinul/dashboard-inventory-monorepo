import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { assetService, Asset } from '@/services/assetService';
import { disposalService } from '../services/disposalService';
import { showSuccessToast, showErrorToast } from '@/utils/swal';

interface ScheduleDisposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface DisposalFormInputs {
    assetId: string;
    reason: 'End of Life' | 'Damaged' | 'Upgrade' | 'Lost/Stolen';
    location: string;
    date: string;
}

export function ScheduleDisposalModal({ isOpen, onClose, onSuccess }: ScheduleDisposalModalProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<DisposalFormInputs>();

    useEffect(() => {
        if (isOpen) {
            assetService.getAll().then(res => {
                // Only show active assets for disposal
                setAssets(res.data.filter((a: Asset) => a.status !== 'disposed'));
            }).catch(err => console.error("Failed to fetch assets:", err));
        }
    }, [isOpen]);

    const onSubmit = async (data: DisposalFormInputs) => {
        setIsLoading(true);
        try {
            await disposalService.createRecord({
                asset: data.assetId,
                reason: data.reason,
                location: data.location,
                date: data.date
            });
            showSuccessToast('Disposal request submitted successfully!');
            onSuccess();
            reset();
        } catch (error) {
            console.error("Failed to submit disposal request:", error);
            showErrorToast('Failed to submit request. Asset might already be in disposal process.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-rose-500">delete_forever</span>
                                    Schedule Asset Disposal
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Submit a request to decommission an asset. This requires multi-level approval.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Asset</label>
                                        <select
                                            {...register('assetId', { required: 'Asset is required' })}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Choose an asset...</option>
                                            {assets.map(asset => (
                                                <option key={asset._id} value={asset._id}>
                                                    {asset.name} ({asset.serial})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.assetId && <span className="text-xs text-rose-500 mt-1">{errors.assetId.message}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Disposal</label>
                                        <select
                                            {...register('reason', { required: 'Reason is required' })}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="End of Life">End of Life</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Upgrade">Upgrade</option>
                                            <option value="Lost/Stolen">Lost/Stolen</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Storage Location / Branch</label>
                                        <input
                                            {...register('location', { required: 'Location is required' })}
                                            type="text"
                                            placeholder="e.g. IT Warehouse"
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proposed Date</label>
                                        <input
                                            {...register('date', { required: 'Date is required' })}
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-4 py-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600 shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {isLoading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
