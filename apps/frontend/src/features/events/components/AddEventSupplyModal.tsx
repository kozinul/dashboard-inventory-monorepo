import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getSupplies, Supply } from '@/services/supplyService';
import { eventService } from '@/services/eventService';

interface AddEventSupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    onSuccess: () => void;
}

export default function AddEventSupplyModal({ isOpen, onClose, eventId, onSuccess }: AddEventSupplyModalProps) {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedSupplyId, setSelectedSupplyId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [estimatedCost, setEstimatedCost] = useState(0);

    const loadSupplies = async () => {
        setLoading(true);
        try {
            const data = await getSupplies();
            setSupplies(data);
        } catch (error) {
            console.error('Failed to fetch supplies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadSupplies();
            setSelectedSupplyId('');
            setQuantity(1);
            setEstimatedCost(0);
        }
    }, [isOpen]);

    const handleSupplyChange = (supplyId: string) => {
        setSelectedSupplyId(supplyId);
        const supply = supplies.find(s => s._id === supplyId);
        // Default cost could be unit cost if available in supply model, 
        // but supply model has specific fields. Let's check ISupply interface in previous turn.
        // It has `cost`.
        if (supply && supply.cost) {
            setEstimatedCost(supply.cost * quantity);
        } else {
            setEstimatedCost(0);
        }
    };

    const handleQuantityChange = (qty: number) => {
        setQuantity(qty);
        const supply = supplies.find(s => s._id === selectedSupplyId);
        if (supply && supply.cost) {
            setEstimatedCost(supply.cost * qty);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplyId || quantity < 1) return;

        setSubmitting(true);
        try {
            const event = await eventService.getById(eventId);
            const newSupply = {
                supplyId: selectedSupplyId,
                quantity: quantity,
                cost: estimatedCost // Snapshot cost
            };

            const updatedSupplies = event.planningSupplies ? [...event.planningSupplies, newSupply] : [newSupply];

            // Using 'any' for update as the interface might be partial
            await eventService.update(eventId, { planningSupplies: updatedSupplies });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add supply to event:', error);
        } finally {
            setSubmitting(false);
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
                                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                                    Add Planning Supply
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Select Supply
                                        </label>
                                        <select
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                            value={selectedSupplyId}
                                            onChange={(e) => handleSupplyChange(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a supply...</option>
                                            {loading ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                supplies.map((supply) => (
                                                    <option key={supply._id} value={supply._id}>
                                                        {supply.name} ({supply.partNumber})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Estimated Cost (Rp.)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                value={estimatedCost}
                                                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

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
                                            disabled={submitting || !selectedSupplyId || quantity < 1}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Adding...' : 'Add Supply'}
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
