import { useState, useRef } from 'react';
import { Asset, assetService } from '@/services/assetService';
import { categoryService } from '@/services/categoryService';
import { PencilSquareIcon, CheckIcon, XMarkIcon, PlusIcon, ArrowUpTrayIcon, TrashIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

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
            title: 'Hapus Spesifikasi?',
            text: `Apakah Anda yakin ingin menghapus "${key}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            const updatedSpecs = { ...specs };
            delete updatedSpecs[key];
            saveSpecs(updatedSpecs);
        }
    };

    const handleClearAll = async () => {
        const result = await Swal.fire({
            title: 'Bersihkan Semua Spesifikasi?',
            text: "Tindakan ini akan menghapus semua spesifikasi teknis aset ini.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Bersihkan Semua',
            cancelButtonText: 'Batal'
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
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) throw new Error('No sheets found in workbook');
                const worksheet = workbook.Sheets[firstSheetName]!;
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (!jsonData || jsonData.length === 0) {
                    throw new Error('File is empty or invalid format');
                }

                const validSpecs: Record<string, string> = {};
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (Array.isArray(row) && row.length >= 2) {
                        const key = String(row[0] || '').trim();
                        let value = row[1];

                        // Handle object values gracefully if any
                        if (typeof value === 'object' && value !== null) {
                            value = JSON.stringify(value);
                        } else {
                            value = String(value || '').trim();
                        }

                        // Skip empty keys or typical header names in first row
                        if (!key || (i === 0 && (key.toLowerCase().includes('field') || key.toLowerCase() === 'key'))) {
                            continue;
                        }

                        validSpecs[key] = value;
                    }
                }

                if (Object.keys(validSpecs).length === 0) {
                    showErrorToast('No valid data found. Make sure the file has 2 columns: Field and Value.');
                    return;
                }

                const result = await Swal.fire({
                    title: 'Import Specifications?',
                    text: `Found ${Object.keys(validSpecs).length} specs. This will merge/overwrite existing specifications.`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Import'
                });

                if (result.isConfirmed) {
                    const mergedSpecs = { ...specs, ...validSpecs };
                    saveSpecs(mergedSpecs);
                }
            } catch (err) {
                console.error('File parsing error:', err);
                showErrorToast('Invalid file format. Please upload a valid Excel or CSV file.');
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadTemplate = async () => {
        try {
            // First try to get category template if specs are empty
            let templateKeys: string[] = [];

            if (Object.keys(specs).length === 0 && asset.category) {
                const categories = await categoryService.getAll();
                const category = categories.find(c => c.name === asset.category);
                if (category && category.technicalSpecsTemplate) {
                    templateKeys = Object.keys(category.technicalSpecsTemplate);
                }
            } else {
                templateKeys = Object.keys(specs);
            }

            // If still empty, provide a default template
            if (templateKeys.length === 0) {
                templateKeys = ['Field', 'Key 1', 'Key 2'];
            }

            // Create worksheet data (Keys in col 1, empty values in col 2)
            const wsData = [
                ['Field Name (Do Not Edit)', 'Value (Fill Here)'], // Header
                ...templateKeys.map(key => [key, '']) // Data rows
            ];

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Auto-size columns slightly
            ws['!cols'] = [{ wch: 30 }, { wch: 40 }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');

            // Generate Excel file
            const fileName = `${asset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_specs_template.xlsx`;
            XLSX.writeFile(wb, fileName);

            showSuccessToast('Template downloaded successfully');
        } catch (error) {
            console.error('Failed to generate template', error);
            showErrorToast('Failed to generate template download');
        }
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
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4" /> Download Template
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4" /> Import Excel/CSV
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={handleClearAll}
                        disabled={Object.keys(specs).length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    >
                        <TrashIcon className="w-4 h-4" /> Clear All
                    </button>
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
                        <div key={key} className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700/50 pb-2 group">
                            <dt className="text-sm text-slate-500 font-medium pt-0.5">{key}</dt>
                            <dd className="flex items-start gap-3 text-right max-w-[70%]">
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
                                        <span className="text-sm font-semibold dark:text-slate-200 whitespace-pre-wrap break-words">{value}</span>
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
                </dl>
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

                {Object.keys(specs).length === 0 && !isAddingMode && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        No technical specifications added yet. Import a template or add manually.
                    </div>
                )}
            </div>
        </div>
    );
}
