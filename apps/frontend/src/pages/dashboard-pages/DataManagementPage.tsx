import { useState } from 'react';
import { importExportService, ImportResult } from '@/services/importExportService';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import {
    CloudArrowDownIcon,
    CloudArrowUpIcon,
    DocumentDuplicateIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function DataManagementPage() {
    const [isImportingAsset, setIsImportingAsset] = useState(false);
    const [isImportingSupply, setIsImportingSupply] = useState(false);
    const [assetFile, setAssetFile] = useState<File | null>(null);
    const [supplyFile, setSupplyFile] = useState<File | null>(null);
    const [importResults, setImportResults] = useState<{ asset?: ImportResult, supply?: ImportResult }>({});

    // Column selection state
    const assetColumns = [
        { id: 'name', label: 'Nama' },
        { id: 'model', label: 'Model' },
        { id: 'category', label: 'Kategori' },
        { id: 'serial', label: 'Serial' },
        { id: 'department', label: 'Departemen' },
        { id: 'branch', label: 'Cabang' },
        { id: 'location', label: 'Lokasi' },
        { id: 'status', label: 'Status' },
        { id: 'value', label: 'Nilai' },
        { id: 'purchaseDate', label: 'Tgl Beli' },
        { id: 'warrantyDate', label: 'Tgl Garansi' }
    ];

    const supplyColumns = [
        { id: 'name', label: 'Nama' },
        { id: 'partNumber', label: 'Part Number' },
        { id: 'category', label: 'Kategori' },
        { id: 'unit', label: 'Satuan' },
        { id: 'quantity', label: 'Jumlah' },
        { id: 'minimumStock', label: 'Stok Min' },
        { id: 'location', label: 'Lokasi' },
        { id: 'cost', label: 'Biaya' },
        { id: 'compatibleModels', label: 'Kompatibilitas' }
    ];

    const [selectedAssetCols, setSelectedAssetCols] = useState<string[]>(assetColumns.map(c => c.id));
    const [selectedSupplyCols, setSelectedSupplyCols] = useState<string[]>(supplyColumns.map(c => c.id));

    const toggleColumn = (type: 'asset' | 'supply', colId: string) => {
        if (type === 'asset') {
            setSelectedAssetCols(prev =>
                prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
            );
        } else {
            setSelectedSupplyCols(prev =>
                prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
            );
        }
    };

    const handleDownloadTemplate = async (type: 'asset' | 'supply') => {
        try {
            const cols = type === 'asset' ? selectedAssetCols : selectedSupplyCols;
            await importExportService.downloadTemplate(type, cols);
            showSuccessToast('Template downloaded successfully.');
        } catch (error) {
            showErrorToast('Failed to download template.');
        }
    };

    const handleExportData = async (type: 'asset' | 'supply') => {
        try {
            const cols = type === 'asset' ? selectedAssetCols : selectedSupplyCols;
            await importExportService.exportData({ type, columns: cols });
            showSuccessToast('Data exported successfully.');
        } catch (error) {
            showErrorToast('Failed to export data.');
        }
    };

    const handleImport = async (type: 'asset' | 'supply') => {
        const file = type === 'asset' ? assetFile : supplyFile;
        if (!file) return;

        if (type === 'asset') setIsImportingAsset(true);
        else setIsImportingSupply(true);

        try {
            const result = await importExportService.importData(type, file);
            setImportResults(prev => ({ ...prev, [type]: result }));
            showSuccessToast(`Import completed: ${result.results.success} successes, ${result.results.failed} failures.`);
            if (type === 'asset') setAssetFile(null);
            else setSupplyFile(null);
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Import failed.');
        } finally {
            if (type === 'asset') setIsImportingAsset(false);
            else setIsImportingSupply(false);
        }
    };

    const ColumnSelector = ({ type, columns, selected }: { type: 'asset' | 'supply', columns: any[], selected: string[] }) => (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Custom Columns</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                {columns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={selected.includes(col.id)}
                            onChange={() => toggleColumn(type, col.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {col.label}
                        </span>
                    </label>
                ))}
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => type === 'asset' ? setSelectedAssetCols(columns.map(c => c.id)) : setSelectedSupplyCols(columns.map(c => c.id))}
                    className="text-[10px] font-bold text-primary hover:underline"
                >
                    Select All
                </button>
                <button
                    onClick={() => type === 'asset' ? setSelectedAssetCols([]) : setSelectedSupplyCols([])}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:underline"
                >
                    Clear All
                </button>
            </div>
        </div>
    );

    const ResultDisplay = ({ result }: { result: ImportResult }) => (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-bold">{result.results.success} Success</span>
                </div>
                {result.results.failed > 0 && (
                    <div className="flex items-center gap-1.5 text-rose-600">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span className="text-sm font-bold">{result.results.failed} Failed</span>
                    </div>
                )}
            </div>
            {result.results.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {result.results.errors.map((err, i) => (
                        <p key={i} className="text-xs text-rose-500 font-medium">• {err}</p>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Data Management</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <CloudArrowUpIcon className="h-5 w-5 text-primary" />
                    Import and export your data using Excel files for efficiency.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Asset Management Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <DocumentDuplicateIcon className="h-5 w-5 text-indigo-500" />
                            Asset Management
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Bulk manage fixed assets and equipment.</p>
                    </div>

                    <div className="p-6 space-y-6 flex-1">
                        {/* Column Selection */}
                        <ColumnSelector type="asset" columns={assetColumns} selected={selectedAssetCols} />

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDownloadTemplate('asset')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <CloudArrowDownIcon className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary">Template</span>
                            </button>
                            <button
                                onClick={() => handleExportData('asset')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-500/5 transition-all group"
                            >
                                <CloudArrowUpIcon className="h-6 w-6 text-slate-400 group-hover:text-green-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-green-500">Export All</span>
                            </button>
                        </div>

                        {/* Import Section */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Import Assets</label>
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                                <button
                                    onClick={() => handleImport('asset')}
                                    disabled={!assetFile || isImportingAsset}
                                    className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isImportingAsset ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CloudArrowUpIcon className="h-4 w-4" />
                                    )}
                                    Start Import
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        {importResults.asset && <ResultDisplay result={importResults.asset} />}
                    </div>
                </div>

                {/* Supply Management Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <DocumentDuplicateIcon className="h-5 w-5 text-amber-500" />
                            Supply Management
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Bulk manage consumables and stock levels.</p>
                    </div>

                    <div className="p-6 space-y-6 flex-1">
                        {/* Column Selection */}
                        <ColumnSelector type="supply" columns={supplyColumns} selected={selectedSupplyCols} />

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDownloadTemplate('supply')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <CloudArrowDownIcon className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary">Template</span>
                            </button>
                            <button
                                onClick={() => handleExportData('supply')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-500/5 transition-all group"
                            >
                                <CloudArrowUpIcon className="h-6 w-6 text-slate-400 group-hover:text-green-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-green-500">Export All</span>
                            </button>
                        </div>

                        {/* Import Section */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Import Supplies</label>
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setSupplyFile(e.target.files?.[0] || null)}
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                                <button
                                    onClick={() => handleImport('supply')}
                                    disabled={!supplyFile || isImportingSupply}
                                    className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isImportingSupply ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CloudArrowUpIcon className="h-4 w-4" />
                                    )}
                                    Start Import
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        {importResults.supply && <ResultDisplay result={importResults.supply} />}
                    </div>
                </div>
            </div>

            {/* Information Section */}
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex gap-4">
                    <InformationCircleIcon className="h-6 w-6 text-indigo-500 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Important Instructions</h4>
                        <ul className="mt-2 text-sm text-indigo-800 dark:text-indigo-400 space-y-2 list-disc ml-4">
                            <li>Always use the official template to ensure the headers match the system requirements.</li>
                            <li>For **Assets**, the Serial Number must be unique. Duplicates will be skipped.</li>
                            <li>The system will attempt to match Department, Branch, and Location names. Please ensure they match exactly with the database records.</li>
                            <li>Large files may take a few moments to process. Do not refresh the page during import.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
