import { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface SpecRow {
    id: string; // Unique ID for key management
    field: string;
    value: string;
}

interface TechnicalSpecsImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (specs: Record<string, string>) => void;
    initialData: Record<string, string>;
}

export default function TechnicalSpecsImportModal({
    isOpen,
    onClose,
    onConfirm,
    initialData
}: TechnicalSpecsImportModalProps) {
    const [rows, setRows] = useState<SpecRow[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Convert Record<string, string> to array of SpecRow objects
            const initialRows = Object.entries(initialData).map(([field, value], index) => ({
                id: `row-${index}-${Date.now()}`,
                field,
                value
            }));
            setRows(initialRows);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleDeleteRow = (id: string) => {
        setRows(rows.filter(row => row.id !== id));
    };

    const handleConfirm = () => {
        // Convert array back to Record<string, string>
        const finalData: Record<string, string> = {};
        rows.forEach(row => {
            if (row.field.trim() !== '') {
                finalData[row.field.trim()] = row.value.trim();
            }
        });

        onConfirm(finalData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Review Technical Specifications
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Review the data below before confirming. You can remove rows that you don't need to import.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                        {/* Status Bar */}
                        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium">
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>{rows.length} specifications ready to import</span>
                            </div>
                            {rows.length === 0 && (
                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-xs font-bold">
                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                    No data to import
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-5/12">Field Name</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-6/12">Value</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/12 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {rows.map((row) => (
                                        <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">
                                                {row.field}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 break-words">
                                                {row.value}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDeleteRow(row.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all mx-auto opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Delete row"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500 italic">
                                                No specifications available in the preview.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 rounded-b-2xl shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={rows.length === 0}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Confirm Import
                    </button>
                </div>

            </div>
        </div>
    );
}
