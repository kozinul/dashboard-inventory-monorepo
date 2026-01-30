import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { cloneAsset } from '../../../services/assetTemplateService';

interface CloneAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string | null;
    assetName: string;
    onSuccess: () => void;
}

export function CloneAssetModal({ isOpen, onClose, assetId, assetName, onSuccess }: CloneAssetModalProps) {
    const [serial, setSerial] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetId || !serial.trim()) return;

        setLoading(true);
        try {
            await cloneAsset(assetId, serial.trim());
            Swal.fire({
                icon: 'success',
                title: 'Asset Cloned!',
                text: `New asset created with serial: ${serial}`,
                timer: 2000,
                showConfirmButton: false
            });
            setSerial('');
            onClose();
            onSuccess();
        } catch (error: any) {
            console.error('Error cloning asset:', error);
            Swal.fire({
                icon: 'error',
                title: 'Clone Failed',
                text: error.response?.data?.message || 'Failed to clone asset',
                confirmButtonColor: '#6366F1'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSerial('');
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
                                        Create a duplicate of <span className="font-semibold text-white">{assetName}</span> with a new serial number.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                                            disabled={loading || !serial.trim()}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                                    Cloning...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                                    Clone Asset
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
