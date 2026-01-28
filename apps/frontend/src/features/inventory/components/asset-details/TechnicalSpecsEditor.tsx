import { useState, useRef } from 'react';
import { Asset, assetService } from '@/services/assetService';
import { categoryService } from '@/services/categoryService';
import { PencilSquareIcon, CheckIcon, XMarkIcon, PlusIcon, ArrowUpTrayIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import Swal from 'sweetalert2';

interface TechnicalSpecsEditorProps {
    asset: Asset;
    onUpdate?: () => void; // Callback to refresh parent
}

export function TechnicalSpecsEditor({ asset, onUpdate }: TechnicalSpecsEditorProps) {
    const [specs, setSpecs] = useState<Record<string, string>>(asset.technicalSpecifications || {});
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveSpec = async (key: string, value: string) => {
        const updatedSpecs = { ...specs, [key]: value };
        saveSpecs(updatedSpecs);
        setEditingKey(null);
    };

    const handleDeleteSpec = async (key: string) => {
        const result = await Swal.fire({
            title: 'Remove specification?',
            text: `Are you sure you want to remove "${key}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it'
        });

        if (result.isConfirmed) {
            const updatedSpecs = { ...specs };
            delete updatedSpecs[key];
            saveSpecs(updatedSpecs);
        }
    };

    const handleAddSpec = () => {
        if (!newKey.trim()) return;
        const updatedSpecs = { ...specs, [newKey]: newValue };
        saveSpecs(updatedSpecs);
        setIsAddingMode(false);
        setNewKey('');
        setNewValue('');
    };

    const saveSpecs = async (updatedSpecs: Record<string, string>) => {
        try {
            await assetService.update(asset.id || asset._id, { technicalSpecifications: updatedSpecs });
            setSpecs(updatedSpecs);
            showSuccessToast('Specifications updated!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to update specifications');
        }
    };

    const handleLoadCategoryTemplate = async () => {
        try {
            const categories = await categoryService.getAll();
            const category = categories.find(c => c.name === asset.category);

            if (!category || !category.technicalSpecsTemplate || Object.keys(category.technicalSpecsTemplate).length === 0) {
                showErrorToast('No template found for this category.');
                return;
            }

            const result = await Swal.fire({
                title: 'Load Category Template?',
                text: `This will merge specifications from the "${asset.category}" category template. Existing values will be preserved.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Load Template'
            });

            if (result.isConfirmed) {
                // Merge template with existing specs. Existing specs take precedence if they already exist, 
                // BUT we want to add keys from template that are missing.
                const template = category.technicalSpecsTemplate;
                const mergedSpecs = { ...template, ...specs };
                // Actually, wait. If I want to preserve existing values, I should do {...template, ...specs}.
                // If template has "CPU": "" and specs has "CPU": "M1", result is "M1". Correct.

                saveSpecs(mergedSpecs);
            }
        } catch (error) {
            console.error("Failed to load category template", error);
            showErrorToast('Failed to load template.');
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (typeof json !== 'object' || json === null) {
                    throw new Error('Invalid JSON format');
                }

                // Verify values are strings
                const validSpecs: Record<string, string> = {};
                for (const [key, value] of Object.entries(json)) {
                    validSpecs[key] = String(value);
                }

                const result = await Swal.fire({
                    title: 'Import Template?',
                    text: 'This will merge/overwrite existing specifications.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Import'
                });

                if (result.isConfirmed) {
                    const mergedSpecs = { ...specs, ...validSpecs };
                    saveSpecs(mergedSpecs);
                }
            } catch (err) {
                showErrorToast('Invalid JSON file. Please allow simple key-value pairs.');
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Technical Specifications
                </h4>
                <div className="flex gap-2">
                    <button
                        onClick={handleLoadCategoryTemplate}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> Load Template
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4" /> Import JSON
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => setIsAddingMode(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition"
                    >
                        <PlusIcon className="w-4 h-4" /> Add Field
                    </button>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {Object.entries(specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2 group">
                            <dt className="text-sm text-slate-500 font-medium">{key}</dt>
                            <dd className="flex items-center gap-3">
                                {editingKey === key ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="h-7 w-40 text-sm px-2 rounded border border-primary bg-white dark:bg-slate-800 focus:outline-none"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => handleSaveSpec(key, tempValue)} className="text-green-500 hover:text-green-600">
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setEditingKey(null)} className="text-red-500 hover:text-red-600">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-semibold dark:text-slate-200">{value}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingKey(key);
                                                    setTempValue(value);
                                                }}
                                                className="p-1 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSpec(key)}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </dd>
                        </div>
                    ))}

                    {isAddingMode && (
                        <div className="col-span-1 md:col-span-2 flex items-center gap-4 bg-white dark:bg-slate-700 p-3 rounded-lg border border-primary/30 shadow-lg">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase text-slate-400 font-bold">Field Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Battery Life"
                                    className="w-full h-8 text-sm px-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-1 focus:ring-primary"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase text-slate-400 font-bold">Value</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 10 Hours"
                                    className="w-full h-8 text-sm px-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-1 focus:ring-primary"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end gap-2 pb-0.5">
                                <button
                                    onClick={handleAddSpec}
                                    disabled={!newKey.trim()}
                                    className="h-8 px-3 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsAddingMode(false)}
                                    className="h-8 px-3 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </dl>

                {Object.keys(specs).length === 0 && !isAddingMode && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        No technical specifications added yet. Import a template or add manually.
                    </div>
                )}
            </div>
        </div>
    );
}
