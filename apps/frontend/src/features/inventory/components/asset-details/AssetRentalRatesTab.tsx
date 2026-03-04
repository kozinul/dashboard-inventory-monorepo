import { useState } from 'react';
import { Asset, assetService } from '@/services/assetService';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import Swal from 'sweetalert2';

interface AssetRentalRatesTabProps {
    asset: Asset;
    onUpdate?: () => void;
}

export function AssetRentalRatesTab({ asset, onUpdate }: AssetRentalRatesTabProps) {
    const [rates, setRates] = useState(asset.rentalRates || []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Form states for adding/editing
    const [name, setName] = useState('');
    const [rate, setRate] = useState('');
    const [unit, setUnit] = useState('day');
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setName('');
        setRate('');
        setUnit('day');
        setNotes('');
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleSave = async () => {
        if (!name || !rate) {
            showErrorToast('Name and rate are required');
            return;
        }

        const newRate = {
            name,
            rate: parseFloat(rate),
            unit,
            notes: notes || undefined
        };

        let updatedRates = [...rates];
        if (editingIndex !== null) {
            updatedRates[editingIndex] = newRate;
        } else {
            updatedRates.push(newRate);
        }

        try {
            const assetId = asset.id || asset._id;
            if (!assetId) throw new Error('Asset ID is missing');

            await assetService.update(assetId, { rentalRates: updatedRates });
            setRates(updatedRates);
            showSuccessToast('Rental rates updated');
            resetForm();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to update rental rates');
        }
    };

    const handleDelete = async (index: number) => {
        const rateToDelete = rates[index];
        if (!rateToDelete) return;

        const result = await Swal.fire({
            title: 'Delete Rental Rate?',
            text: `Are you sure you want to delete "${rateToDelete.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete'
        });

        if (result.isConfirmed) {
            const updatedRates = rates.filter((_, i) => i !== index);
            try {
                const assetId = asset.id || asset._id;
                if (!assetId) throw new Error('Asset ID is missing');

                await assetService.update(assetId, { rentalRates: updatedRates });
                setRates(updatedRates);
                showSuccessToast('Rental rate deleted');
                if (onUpdate) onUpdate();
            } catch (error) {
                console.error(error);
                showErrorToast('Failed to delete rental rate');
            }
        }
    };

    const handleEdit = (index: number) => {
        const r = rates[index];
        if (!r) return;

        setName(r.name);
        setRate(r.rate.toString());
        setUnit(r.unit);
        setNotes(r.notes || '');
        setEditingIndex(index);
        setIsAdding(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Rental Rates
                </h4>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition shadow-sm"
                    >
                        <PlusIcon className="w-4 h-4" /> Add Rate
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-primary/20 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Rate Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Daily Rate"
                                className="w-full h-10 text-sm px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Price</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-10 text-sm px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Unit</label>
                            <select
                                className="w-full h-10 text-sm px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            >
                                <option value="hour">Per Hour</option>
                                <option value="day">Per Day</option>
                                <option value="week">Per Week</option>
                                <option value="month">Per Month</option>
                                <option value="event">Per Event</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Notes (Optional)</label>
                            <input
                                type="text"
                                placeholder="..."
                                className="w-full h-10 text-sm px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            {editingIndex !== null ? 'Update Rate' : 'Save Rate'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[100px]">
                {rates.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rates.map((r, index) => (
                                    <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700 dark:text-white uppercase">{r.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-primary">
                                                Rp {r.rate.toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md uppercase tracking-wider">
                                                {r.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                                                {r.notes || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleEdit(index)}
                                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(index)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">payments</span>
                        <p className="text-sm italic">No rental rates defined for this asset.</p>
                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 text-xs font-bold text-primary hover:underline"
                            >
                                + Add first rate
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
