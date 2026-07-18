import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Download, FileJson, Loader2, X, AlertCircle, FileSpreadsheet } from 'lucide-react';

import Swal from 'sweetalert2';

const toast = {
    error: (msg: string) => Swal.fire({ icon: 'error', title: 'Oops...', text: msg }),
    success: (msg: string) => Swal.fire({ icon: 'success', title: 'Success!', text: msg, timer: 2000, showConfirmButton: false })
};

export default function ToolsPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ success: number; fail: number } | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const jsonFiles = acceptedFiles.filter(file => file.name.endsWith('.json') || file.type === 'application/json');

        if (jsonFiles.length !== acceptedFiles.length) {
            toast.error('Some files were rejected. Only .json files are allowed.');
        }

        setFiles(prev => {
            const newFiles = [...prev];
            jsonFiles.forEach(file => {
                // Prevent duplicate by name
                if (!newFiles.find(f => f.name === file.name)) {
                    newFiles.push(file);
                }
            });
            return newFiles;
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json']
        }
    });

    const removeFile = (name: string) => {
        setFiles(files => files.filter(f => f.name !== name));
        setUploadStats(null); // Reset stats if user changes files
    };

    const clearAll = () => {
        setFiles([]);
        setUploadStats(null);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadStats(null);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            Swal.fire({
                title: 'Processing Data...',
                text: 'Please wait, cleaning format and converting JSON.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Need to use native fetch or specialized api caller for blob response
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/tools/convert-json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth implementation
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'An error occurred while converting data');
            }

            // Get headers for stats
            const successCount = parseInt(response.headers.get('X-Success-Count') || '0', 10);
            const failCount = parseInt(response.headers.get('X-Fail-Count') || '0', 10);

            setUploadStats({ success: successCount, fail: failCount });

            // Download Blob
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PowerShell_Export_${new Date().getTime()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            Swal.close();

            if (failCount > 0) {
                toast.error(`${failCount} JSON file(s) failed to parse or validate`);
            } else {
                toast.success('Successfully converted JSON to Excel!');
                // Auto clear files on full success
                setFiles([]);
            }

        } catch (error: any) {
            console.error('Upload error:', error);
            Swal.close();
            toast.error(error.message || 'Failed to upload file.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FileSpreadsheet className="size-6" />
                        </div>
                        JSON to Excel Converter
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Administrator tool to upload JSON export files (from PowerShell) and instantly convert them to Excel format.
                        Each JSON file will be automatically fixed (autofix) if syntax errors are found, then placed into its own worksheet.
                    </p>
                </div>

                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="mx-auto size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FileJson className="size-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        {isDragActive ? 'Drop files here...' : 'Drag & drop .json files here'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Or click to select files from your computer (supports multiple files)
                    </p>
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors pointer-events-none">
                        Select JSON Files
                    </button>
                </div>

                {uploadStats && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                        <AlertCircle className="size-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Last Processing Result</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Success: <b>{uploadStats.success}</b> files, Failed: <b>{uploadStats.fail}</b> files.
                            </p>
                        </div>
                    </div>
                )}

                {files.length > 0 && (
                    <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between bg-slate-50 dark:bg-surface-dark">
                            <h3 className="font-medium flex items-center gap-2">
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    {files.length}
                                </span>
                                File selected
                            </h3>
                            <button
                                onClick={clearAll}
                                className="text-sm text-red-500 hover:text-red-600 font-medium"
                            >
                                Clear All
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[300px] overflow-y-auto">
                            {files.map((file) => (
                                <li key={file.name} className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                    <FileJson className="size-5 text-primary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.name)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="p-4 bg-slate-50 dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark">
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || files.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="size-4" />
                                        Convert to Excel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
