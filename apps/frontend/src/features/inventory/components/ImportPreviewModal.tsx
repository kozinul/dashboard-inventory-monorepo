import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface ImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    onConfirm: (data: any[]) => Promise<void>;
}

export default function ImportPreviewModal({ isOpen, onClose, file, onConfirm }: ImportPreviewModalProps) {
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const buffer = e.target?.result as ArrayBuffer;
                const dataArr = new Uint8Array(buffer);
                const wb = XLSX.read(dataArr, { type: 'array' });
                const wsname = wb.SheetNames[0];
                if (!wsname) throw new Error("File Excel kosong.");
                const ws = wb.Sheets[wsname];
                if (!ws) throw new Error("Worksheet tidak valid.");

                // Convert sheet to JSON array
                const parsedData = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (parsedData.length > 0) {
                    setColumns(Object.keys(parsedData[0] as object));
                    // Assign a temporary unique ID for UI handling
                    const formattedData = parsedData.map((row: any, index) => ({
                        _tempId: Date.now() + index,
                        ...row
                    }));
                    setData(formattedData);
                } else {
                    Swal.fire('Oops', 'File Excel kososng atau format tidak sesuai.', 'error');
                    onClose();
                }
            } catch (error) {
                console.error("Error parsing Excel:", error);
                Swal.fire('Error', 'Gagal membaca file Excel.', 'error');
                onClose();
            }
        };

        setIsLoading(true);
        reader.readAsArrayBuffer(file);
        setIsLoading(false);

    }, [isOpen, file]);

    if (!isOpen) return null;

    const handleRemoveRow = (id: number) => {
        setData(prev => prev.filter(row => row._tempId !== id));
    };

    const handleCellChange = (id: number, col: string, value: string) => {
        setData(prev => prev.map(row => {
            if (row._tempId === id) {
                return { ...row, [col]: value };
            }
            return row;
        }));
    };

    const handleConfirm = async () => {
        if (data.length === 0) {
            Swal.fire('Oops', 'Tidak ada data untuk di-import.', 'warning');
            return;
        }

        setIsSaving(true);
        // Clean up temp ID before sending to server
        const payload = data.map(row => {
            const { _tempId, ...cleanRow } = row;
            return cleanRow;
        });

        try {
            await onConfirm(payload);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="text-green-500 size-6" />
                            Review Excel: {file?.name}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Anda dapat mengubah teks secara manual dengan mengklik kolom di bawah ini, atau menghapus baris yang tidak perlu sebelum disimpan ke Database.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="size-6" />
                    </button>
                </div>

                {/* Body Table */}
                <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-4 text-slate-500">Membaca file Excel...</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 w-10 text-center">#</th>
                                            {columns.map(col => (
                                                <th key={col} className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700">
                                                    {col}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 sticky right-0 bg-slate-100 dark:bg-slate-900/50 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.05)]">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {data.map((row, index) => (
                                            <tr key={row._tempId} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                                <td className="px-4 py-3 text-slate-400 text-center">{index + 1}</td>
                                                {columns.map(col => (
                                                    <td key={col} className="px-0 py-0 min-w-[120px]">
                                                        <input
                                                            type="text"
                                                            value={row[col]}
                                                            onChange={(e) => handleCellChange(row._tempId, col, e.target.value)}
                                                            className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-1 focus:ring-inset focus:ring-primary focus:bg-primary/5 outline-none transition-colors text-slate-700 dark:text-slate-300"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-4 py-2 sticky right-0 bg-white group-hover:bg-slate-50 dark:bg-slate-800 dark:group-hover:bg-slate-800/80 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                                                    <button
                                                        onClick={() => handleRemoveRow(row._tempId)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                        title="Hapus baris ini"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && (
                                            <tr>
                                                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                                                    <AlertCircle className="size-6 text-slate-400" />
                                                    Tidak ada data tersisa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <div className="text-sm font-medium text-slate-500">
                        Total baris divalidasi: <span className="text-slate-900 dark:text-white font-bold">{data.length}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving || data.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-lg shadow-primary/20"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>Submit ke Database</>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
