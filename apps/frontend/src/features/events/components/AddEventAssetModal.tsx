import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { assetService, Asset } from '@/services/assetService';
import { eventService } from '@/services/eventService';

interface AddEventAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    onSuccess: () => void;
}

export default function AddEventAssetModal({ isOpen, onClose, eventId, onSuccess }: AddEventAssetModalProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [selectedRate, setSelectedRate] = useState<{ rate: number, unit: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
            setSelectedAssetId('');
            setSelectedRate(null);
        }
    }, [isOpen]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            // Fetch event details first to get dates
            const event = await eventService.getById(eventId);
            if (!event) return;

            const response = await assetService.getAvailable({
                startTime: event.startTime.toString(),
                endTime: event.endTime.toString(),
                excludeEventId: eventId
            });

            // Filter assets that have rental rates (just in case backend doesn't filter perfectly or we want double safety)
            const rentalAssets = response.filter(asset => asset.rentalRates && asset.rentalRates.length > 0);
            setAssets(rentalAssets);
        } catch (error) {
            console.error('Failed to fetch available assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssetChange = (assetId: string) => {
        setSelectedAssetId(assetId);
        const asset = assets.find(a => a._id === assetId || a.id === assetId);
        if (asset && asset.rentalRates && asset.rentalRates.length > 0) {
            // Default to first rate
            setSelectedRate({
                rate: asset.rentalRates![0]!.rate,
                unit: asset.rentalRates![0]!.unit
            });
        } else {
            setSelectedRate(null);
        }
    };

    const getSelectedAsset = () => {
        return assets.find(a => a._id === selectedAssetId || a.id === selectedAssetId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId || !selectedRate) return;

        setSubmitting(true);
        try {
            // We need to fetch the current event to add to the array (or use a specific add endpoint if we created one)
            // For now, I'll assume we pull the event, push to array, and update. 
            // Better: use a dedicated endpoint or carefully construct the update.
            // Since we updated the service to take `any`, we can try pushing via specific update if backed supports $push,
            // but Mongoose findByIdAndUpdate with req.body usually replaces arrays if passed directly, or merges?
            // Safer to use $push if generic update, OR fetch-modify-save pattern on backend (which standard controller might not do for arrays specifically).
            // Given the generic update controller: `findByIdAndUpdate(id, req.body, { new: true })`
            // If we send `{ rentedAssets: [...existing, new] }` it works.
            // But we don't have existing here.
            // So we might need to fetch event first or rely on the parent to pass existing?
            // Or - let's fetch event here quickly to ensure atomicity-ish.

            const event = await eventService.getById(eventId);
            const newAsset = {
                assetId: selectedAssetId,
                rentalRate: selectedRate.rate,
                rentalRateUnit: selectedRate.unit
            };

            const updatedAssets = event.rentedAssets ? [...event.rentedAssets, newAsset] : [newAsset];

            await eventService.update(eventId, { rentedAssets: updatedAssets });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add asset to event:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedAsset = getSelectedAsset();

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
                    <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
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
                                    <span className="material-symbols-outlined text-primary">add_to_queue</span>
                                    Add Rental Asset
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Select Asset
                                        </label>
                                        <select
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                            value={selectedAssetId}
                                            onChange={(e) => handleAssetChange(e.target.value)}
                                            required
                                        >
                                            <option value="">Select an asset...</option>
                                            {loading ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                assets.map((asset) => (
                                                    <option key={asset._id || asset.id} value={asset._id || asset.id}>
                                                        {asset.name} ({asset.model})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {selectedAsset && selectedAsset.rentalRates && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Rental Rate
                                            </label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedAsset.rentalRates.map((rate, idx) => (
                                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedRate?.rate === rate.rate && selectedRate?.unit === rate.unit
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                                        }`}
                                                        onClick={() => setSelectedRate({ rate: rate.rate, unit: rate.unit })}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedRate?.rate === rate.rate && selectedRate?.unit === rate.unit
                                                                ? 'border-primary'
                                                                : 'border-slate-400'
                                                                }`}>
                                                                {selectedRate?.rate === rate.rate && selectedRate?.unit === rate.unit && (
                                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-slate-700 dark:text-slate-200">{rate.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Rp. {rate.rate.toLocaleString('id-ID')} / {rate.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || !selectedAssetId || !selectedRate}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Adding...' : 'Add Asset'}
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
