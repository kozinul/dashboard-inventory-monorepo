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
            title: 'Hapus spesifikasi?',
            text: `Apakah Anda yakin ingin menghapus "${key}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            background: 'var(--tw-bg-opacity)',
            customClass: {
                popup: 'rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl'
            }
        });

        if (result.isConfirmed) {
            const updatedSpecs = { ...specs };
            delete updatedSpecs[key];
            saveSpecs(updatedSpecs);
        }
    };

    const handleClearAll = async () => {
        const result = await Swal.fire({
            title: 'Hapus SEMUA spesifikasi?',
            text: "Tindakan ini tidak dapat dibatalkan. Semua data spesifikasi teknis untuk aset ini akan dikosongkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, hapus semua!',
            cancelButtonText: 'Batal',
            background: 'var(--tw-bg-opacity)',
            customClass: {
                popup: 'rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl'
            }
        });

        if (result.isConfirmed) {
            saveSpecs({});
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

                // Process values: stringify objects/arrays to avoid [object Object]
                const validSpecs: Record<string, string> = {};
                for (const [key, value] of Object.entries(json)) {
                    if (typeof value === 'object' && value !== null) {
                        validSpecs[key] = JSON.stringify(value, null, 2);
                    } else {
                        validSpecs[key] = String(value);
                    }
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
                        onClick={handleClearAll}
                        disabled={Object.keys(specs).length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                    >
                        <TrashIcon className="w-4 h-4" /> Clear All
                    </button>
                    <button
                        onClick={() => setIsAddingMode(true)}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                    >
                        <PlusIcon className="w-4 h-4" /> Add Field
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {Object.entries(specs).map(([key, value], index) => (
                        <div
                            key={key}
                            className={`flex flex-col sm:flex-row sm:items-start justify-between p-5 group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${index % 2 === 0 ? 'md:border-r border-slate-100 dark:border-slate-800' : ''
                                } ${index < Object.entries(specs).length - (Object.entries(specs).length % 2 === 0 ? 2 : 1) ? 'border-b border-slate-100 dark:border-slate-800' : ''
                                }`}
                        >
                            <div className="flex flex-col gap-1 max-w-full sm:max-w-[40%]">
                                <dt className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{key}</dt>
                            </div>

                            <dd className="flex items-start gap-3 mt-2 sm:mt-0 text-left sm:text-right flex-1 sm:justify-end">
                                {editingKey === key ? (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            className="h-9 w-full sm:w-48 text-sm px-3 rounded-xl border-2 border-primary bg-white dark:bg-slate-800 focus:outline-none shadow-lg shadow-primary/10"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={() => handleSaveSpec(key, tempValue)} className="p-2 text-white bg-green-500 rounded-lg shadow-lg shadow-green-500/20 hover:scale-110 active:scale-90 transition-all">
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingKey(null)} className="p-2 text-white bg-slate-400 rounded-lg shadow-lg shadow-slate-400/20 hover:scale-110 active:scale-90 transition-all">
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-bold text-slate-700 dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                                            {value}
                                        </span>
                                        <div className="flex sm:opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 ml-auto sm:ml-0">
                                            <button
                                                onClick={() => {
                                                    setEditingKey(key);
                                                    setTempValue(value);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-all hover:scale-110"
                                            >
                                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSpec(key)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg transition-all hover:scale-110"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </dd>
                        </div>
                    ))}
                </div>
                {isAddingMode && (
                    <div className="col-span-1 md:col-span-2 flex items-center gap-4 bg-white dark:bg-slate-700 p-4 rounded-3xl border-2 border-primary/20 shadow-xl m-4 mt-0">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Nama Field</label>
                            <input
                                type="text"
                                placeholder="Misal: Sisa Baterai"
                                className="w-full h-10 text-sm px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Nilai</label>
                            <input
                                type="text"
                                placeholder="Misal: 10 Jam"
                                className="w-full h-10 text-sm px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end gap-2 pb-0.5">
                            <button
                                onClick={handleAddSpec}
                                disabled={!newKey.trim()}
                                className="h-10 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
                            >
                                Simpan
                            </button>
                            <button
                                onClick={() => setIsAddingMode(false)}
                                className="h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {Object.keys(specs).length === 0 && !isAddingMode && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-slate-200/50 dark:shadow-none ring-8 ring-slate-50 dark:ring-slate-900/50">
                        <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                    </div>
                    <p className="font-bold text-slate-500 dark:text-slate-400">Belum ada spesifikasi teknis</p>
                    <p className="text-xs text-slate-400 mt-1">Impor template atau tambahkan manual menggunakan tombol di atas.</p>
                </div>
            )}
        </div>
    );
}
