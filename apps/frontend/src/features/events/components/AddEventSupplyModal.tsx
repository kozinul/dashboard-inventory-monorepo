import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supplyService, Supply } from '@/services/supplyService';
import { eventService } from '@/services/eventService';
import { getImageUrl } from '@/utils/imageUtils';

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

    // selected items map: supplyId -> { quantity, cost }
    const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number, cost: number }>>({});

    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSupplies();
            setSelectedItems({});
            setSearchTerm('');
            setSelectedCategory('');
        }
    }, [isOpen]);

    const loadSupplies = async () => {
        setLoading(true);
        try {
            const data = await supplyService.getAll();
            setSupplies(data);
        } catch (error) {
            console.error('Failed to fetch supplies:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const uniqueCategories = new Set(supplies.map(s => s.category));
        return Array.from(uniqueCategories).filter(Boolean).sort();
    }, [supplies]);

    const filteredSupplies = useMemo(() => {
        return supplies.filter(supply => {
            const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (supply.partNumber && supply.partNumber.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory ? supply.category === selectedCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [supplies, searchTerm, selectedCategory]);

    const toggleSelection = (supply: Supply) => {
        const id = supply._id as string;
        if (!id) return;

        setSelectedItems(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
            } else {
                next[id] = { quantity: 1, cost: supply.cost || 0 };
            }
            return next;
        });
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) qty = 1;
        setSelectedItems(prev => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: { ...prev[id], quantity: qty }
            };
        });
    };

    const toggleAll = () => {
        const selectedCount = Object.keys(selectedItems).length;
        if (selectedCount === filteredSupplies.length && filteredSupplies.length > 0) {
            setSelectedItems({});
        } else {
            const newSelection: Record<string, { quantity: number, cost: number }> = {};
            filteredSupplies.forEach(supply => {
                const id = supply._id as string;
                if (id) {
                    newSelection[id] = { quantity: 1, cost: supply.cost || 0 };
                }
            });
            setSelectedItems(newSelection);
        }
    };

    const selectedCount = Object.keys(selectedItems).length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCount === 0) return;

        setSubmitting(true);
        try {
            const event = await eventService.getById(eventId);

            const newSupplies = Object.entries(selectedItems).map(([id, data]) => {
                // Cost is saved per unit or total? The existing code did `supply.cost * quantity`
                // But let's follow standard: save total cost or unit cost. 
                // Previous logic: `cost: estimatedCost` where `estimatedCost = supply.cost * quantity`.
                return {
                    supplyId: id,
                    quantity: data.quantity,
                    cost: data.cost * data.quantity
                };
            });

            const updatedSupplies = event.planningSupplies ? [...event.planningSupplies, ...newSupplies] : newSupplies;

            await eventService.update(eventId, { planningSupplies: updatedSupplies });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add supplies to event:', error);
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex flex-col max-h-[90vh] text-left align-middle shadow-xl transition-all">

                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">add_to_queue</span>
                                        Add Planning Supplies
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <span className="material-symbols-outlined text-gray-500">close</span>
                                    </button>
                                </div>

                                {/* Filters */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search by name, part number..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={selectedCategory}
                                                onChange={e => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="">All Categories</option>
                                                {categories.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Body */}
                                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-transparent">
                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 font-bold bg-gray-50/50 dark:bg-gray-800/50">
                                                    <th className="p-4 w-12">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                                            onChange={toggleAll}
                                                            checked={filteredSupplies.length > 0 && selectedCount === filteredSupplies.length}
                                                        />
                                                    </th>
                                                    <th className="p-4">Supply</th>
                                                    <th className="p-4">Part Number</th>
                                                    <th className="p-4 text-center w-32">Quantity</th>
                                                    <th className="p-4 text-right">Unit Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {filteredSupplies.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-gray-500">No planning supplies found matching your criteria.</td>
                                                    </tr>
                                                ) : (
                                                    filteredSupplies.map(supply => {
                                                        const id = supply._id as string;
                                                        if (!id) return null;

                                                        const isSelected = !!selectedItems[id];
                                                        // Supply model image/images check. Assuming images array based on error.
                                                        const imageRaw = (supply as any).images?.[0] || (supply as any).image;
                                                        const imgUrlStr = imageRaw ? (typeof imageRaw === 'string' ? imageRaw : (imageRaw as any)?.url) : null;

                                                        return (
                                                            <tr
                                                                key={id}
                                                                onClick={() => toggleSelection(supply)}
                                                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                                            >
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleSelection(supply)}
                                                                    />
                                                                </td>
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                                                            {imgUrlStr ? (
                                                                                <img src={getImageUrl(imgUrlStr)} alt={supply.name} className="size-full object-cover" />
                                                                            ) : (
                                                                                <span className="material-symbols-outlined text-gray-400">inventory</span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-gray-900 dark:text-white">{supply.name}</div>
                                                                            <div className="text-xs text-gray-500">{supply.category}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-mono text-xs text-gray-500">{supply.partNumber || '-'}</td>

                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-center" onClick={e => e.stopPropagation()}>
                                                                    {isSelected ? (
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            className="w-20 text-center rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-primary focus:border-primary text-sm p-1"
                                                                            value={selectedItems[id]?.quantity || 1}
                                                                            onChange={e => updateQuantity(id, parseInt(e.target.value) || 1)}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>

                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-right">
                                                                    {supply.cost ? (
                                                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">
                                                                            Rp. {supply.cost.toLocaleString('id-ID')}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400 italic">No cost</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-500">
                                        {selectedCount} supplies selected
                                    </span>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            className="px-6 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || selectedCount === 0}
                                            className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Adding...' : 'Add Selected'}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
