import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { cloneAsset, bulkCloneAsset } from '../../../services/assetTemplateService';
import * as XLSX from 'xlsx';

interface CloneAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string | null;
    assetName: string;
    onSuccess: () => void;
}

export function CloneAssetModal({ isOpen, onClose, assetId, assetName, onSuccess }: CloneAssetModalProps) {
    const [cloneMode, setCloneMode] = useState<'single' | 'bulk'>('single');
    const [serial, setSerial] = useState('');

    // Bulk state
    const [serials, setSerials] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                if (!wsname) {
                    throw new Error("No sheets found in the Excel file");
                }
                const ws = wb.Sheets[wsname];
                if (!ws) {
                    throw new Error("Worksheet is undefined");
                }

                // Convert to array of arrays
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                if (data.length === 0) {
                    throw new Error("Excel file is empty");
                }

                // Try to find a column named 'Serial', 'SerialNumber', 'SN', etc.
                const headers = (data[0] || []).map((h: any) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
                let serialColIdx = headers.findIndex((h: string) => h.includes('serial') || h === 'sn');

                // Fallback to first column if no explicit header found
                let startIndex = 1; // Assume row 0 is header
                if (serialColIdx === -1) {
                    serialColIdx = 0;
                    // If the first cell looks like a header, skip it, otherwise include it
                    const firstCell = String(data[0]?.[0] || '').toLowerCase();
                    if (!firstCell.includes('serial') && !firstCell.includes('sn')) {
                        startIndex = 0; // No header row
                    }
                }

                const extractedSerials: string[] = [];
                for (let i = startIndex; i < data.length; i++) {
                    const row = data[i];
                    if (row && row.length > serialColIdx && row[serialColIdx] !== undefined) {
                        const val = String(row[serialColIdx]).trim();
                        if (val) extractedSerials.push(val);
                    }
                }

                if (extractedSerials.length === 0) {
                    throw new Error("No valid serial numbers found in the Excel file");
                }

                // Remove duplicates within the file itself
                const uniqueSerials = [...new Set(extractedSerials)];
                setSerials(uniqueSerials);

            } catch (err: any) {
                console.error("Excel parse error:", err);
                Swal.fire('Error', err.message || 'Failed to parse Excel file', 'error');
                setSerials([]);
                setFileName('');
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
            }
        };
        reader.onerror = () => {
            Swal.fire('Error', 'Failed to read file', 'error');
            setLoading(false);
        };
        reader.readAsBinaryString(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetId) return;

        if (cloneMode === 'single' && !serial.trim()) return;
        if (cloneMode === 'bulk' && serials.length === 0) return;

        setLoading(true);
        try {
            if (cloneMode === 'single') {
                await cloneAsset(assetId, serial.trim());
                Swal.fire({
                    icon: 'success',
                    title: 'Asset Cloned!',
                    text: `New asset created with serial: ${serial}`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                await bulkCloneAsset(assetId, serials);
                Swal.fire({
                    icon: 'success',
                    title: 'Bulk Clone Successful!',
                    text: `Successfully created ${serials.length} new assets.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error('Error cloning asset(s):', error);
            Swal.fire({
                icon: 'error',
                title: 'Clone Failed',
                text: error.response?.data?.message || 'Failed to clone asset(s)',
                confirmButtonColor: '#6366F1'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSerial('');
        setSerials([]);
        setFileName('');
        setCloneMode('single');
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                                    <span className="material-symbols-outlined text-primary">content_copy</span>
                                    Clone Asset
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Create a duplicate of <span className="font-semibold text-white">{assetName}</span> with new serial number(s).
                                    </p>
                                </div>

                                <div className="mt-4 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setCloneMode('single')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${cloneMode === 'single' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Single Asset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCloneMode('bulk')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${cloneMode === 'bulk' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Bulk via Excel
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                    {cloneMode === 'single' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                New Serial Number
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={serial}
                                                onChange={(e) => setSerial(e.target.value)}
                                                placeholder="Enter unique serial number"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary px-4 py-2 text-slate-900 dark:text-white"
                                            />
                                            <p className="mt-1 text-xs text-slate-500">
                                                This must be a unique serial number not used by any other asset.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div
                                                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    accept=".xlsx,.xls,.csv"
                                                    className="hidden"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                />
                                                <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {fileName ? fileName : 'Click to upload Excel file'}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">.xlsx, .xls, .csv accepted</p>
                                            </div>

                                            {serials.length > 0 && (
                                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg p-3 flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-indigo-500 mt-0.5">info</span>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Ready to clone {serials.length} assets</h4>
                                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                                            Found {serials.length} unique serial numbers in the uploaded file.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || (cloneMode === 'single' ? !serial.trim() : serials.length === 0)}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                                        >
                                            {loading && cloneMode !== 'bulk' ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                                    Clone Asset{cloneMode === 'bulk' ? 's' : ''}
                                                </>
                                            )}
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
