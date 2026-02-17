import { useState, useRef } from "react";
import { DocumentIcon, ArrowDownTrayIcon, TrashIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Asset, assetService } from "@/services/assetService";
import { uploadService } from "@/services/uploadService";
import { showSuccessToast, showErrorToast } from "@/utils/swal";
import Swal from "sweetalert2";

interface AssetDocumentsProps {
    asset: Asset;
    onUpdate?: () => void;
}

export function AssetDocuments({ asset, onUpdate }: AssetDocumentsProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!asset) return null;

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const result = await uploadService.upload(file);

            const newDoc = {
                name: file.name,
                url: result.url,
                filename: result.filename,
                type: file.type.includes('pdf') ? 'pdf' : 'document',
                uploadDate: new Date().toISOString()
            };

            const updatedDocs = [...(asset.documents || []), newDoc];
            await assetService.update(asset._id, { documents: updatedDocs });

            showSuccessToast('Document uploaded successfully!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to upload document');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (docId: string) => {
        const result = await Swal.fire({
            title: 'Delete document?',
            text: 'Are you sure you want to remove this document?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const updatedDocs = asset.documents?.filter(d => d._id !== docId);
                await assetService.update(asset._id, { documents: updatedDocs });
                showSuccessToast('Document removed');
                if (onUpdate) onUpdate();
            } catch (error) {
                showErrorToast('Failed to delete document');
            }
        }
    };

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Documents & Manuals
                </h4>
                <div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                    >
                        {isUploading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleUpload}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {asset.documents && asset.documents.length > 0 ? (
                    asset.documents.map((doc) => (
                        <div key={doc._id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                    <DocumentIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold dark:text-white truncate max-w-[180px]" title={doc.name}>{doc.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{doc.type || 'FILE'} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDownload(doc.url, doc.filename)}
                                    className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                                    title="Download"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => doc._id && handleDelete(doc._id)}
                                    className="w-8 h-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        No documents uploaded for this asset yet.
                    </div>
                )}
            </div>
        </section>
    );
}
