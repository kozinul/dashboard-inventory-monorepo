import { useState } from 'react';
import { Asset, assetService } from '@/services/assetService';
import { formatIDR } from '@/utils/currency';
import { PlusIcon, TrashIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import Swal from 'sweetalert2';

interface RentalRatesTabProps {
    asset: Asset;
    onUpdate?: () => void;
}

interface RentalRate {
    name: string;
    rate: number;
    unit: string;
    notes?: string;
}

export function RentalRatesTab({ asset, onUpdate }: RentalRatesTabProps) {
    const [rates, setRates] = useState<RentalRate[]>(asset.rentalRates || []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Form states
    const [newName, setNewName] = useState('');
    const [newRate, setNewRate] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [newNotes, setNewNotes] = useState('');

    const handleSaveRates = async (updatedRates: RentalRate[]) => {
        try {
            await assetService.update(asset.id || asset._id, { rentalRates: updatedRates });
            setRates(updatedRates);
            showSuccessToast('Rental rates updated!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to update rental rates');
        }
    };

    const handleAddRate = () => {
        if (!newName || !newRate || !newUnit) {
            showErrorToast('Name, Rate, and Unit are required.');
            return;
        }

        const newRateObj: RentalRate = {
            name: newName,
            rate: parseFloat(newRate),
            unit: newUnit,
            notes: newNotes
        };

        const updatedRates = [...rates, newRateObj];
        handleSaveRates(updatedRates);

        // Reset form
        setIsAdding(false);
        setNewName('');
        setNewRate('');
        setNewUnit('');
        setNewNotes('');
    };

    const handleDeleteRate = async (index: number) => {
        const result = await Swal.fire({
            title: 'Remove Rate?',
            text: 'Are you sure you want to remove this rental rate?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it'
        });

        if (result.isConfirmed) {
            const updatedRates = rates.filter((_, i) => i !== index);
            handleSaveRates(updatedRates);
        }
    };

    const startEditing = (index: number) => {
        const rate = rates[index];
        if (!rate) return;
        setNewName(rate.name);
        setNewRate(rate.rate.toString());
        setNewUnit(rate.unit);
        setNewNotes(rate.notes || '');
        setEditingIndex(index);
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setNewName('');
        setNewRate('');
        setNewUnit('');
        setNewNotes('');
    };

    const saveEdit = () => {
        if (editingIndex === null) return;
        if (!newName || !newRate || !newUnit) {
            showErrorToast('Name, Rate, and Unit are required.');
            return;
        }

        const updatedRates = [...rates];
        updatedRates[editingIndex] = {
            name: newName,
            rate: parseFloat(newRate),
            unit: newUnit,
            notes: newNotes
        };

        handleSaveRates(updatedRates);
        setEditingIndex(null);
        setNewName('');
        setNewRate('');
        setNewUnit('');
        setNewNotes('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Rental Rates
                </h4>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition"
                    disabled={isAdding || editingIndex !== null}
                >
                    <PlusIcon className="w-4 h-4" /> Add Rate
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3">Duration Name</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Unit</th>
                            <th className="px-6 py-3">Notes</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.length === 0 && !isAdding && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                                    No rental rates configured.
                                </td>
                            </tr>
                        )}

                        {rates.map((rate, index) => (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                {editingIndex === index ? (
                                    <>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="e.g. Daily"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                                value={newRate}
                                                onChange={(e) => setNewRate(e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                                value={newUnit}
                                                onChange={(e) => setNewUnit(e.target.value)}
                                                placeholder="e.g. Day"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                                value={newNotes}
                                                onChange={(e) => setNewNotes(e.target.value)}
                                                placeholder="Optional notes"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={cancelEditing} className="text-red-500 hover:text-red-600">
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{rate.name}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                                            {formatIDR(rate.rate)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">/{rate.unit}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{rate.notes || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEditing(index)}
                                                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                    disabled={editingIndex !== null || isAdding}
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRate(index)}
                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                    disabled={editingIndex !== null || isAdding}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {isAdding && (
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Daily"
                                        autoFocus
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                        value={newRate}
                                        onChange={(e) => setNewRate(e.target.value)}
                                        placeholder="0"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                        value={newUnit}
                                        onChange={(e) => setNewUnit(e.target.value)}
                                        placeholder="e.g. Day"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:border-slate-600"
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                        placeholder="Optional notes"
                                    />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={handleAddRate} className="h-7 px-3 bg-primary text-white text-xs rounded hover:bg-primary/90">
                                            Save
                                        </button>
                                        <button onClick={() => { setIsAdding(false); setNewName(''); setNewRate(''); setNewUnit(''); setNewNotes(''); }} className="h-7 px-3 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300">
                                            Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
