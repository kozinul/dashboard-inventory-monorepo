import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Asset, assetService } from '../../../services/assetService';
import { departmentService, Department } from '../../../services/departmentService';
import { branchService, Branch } from '../../../services/branchService';
import { transferService, Transfer } from '../../../services/transferService';
import { AssetTable } from '../../inventory/components/AssetTable';
import { showSuccessToast, showErrorToast } from '../../../utils/swal';
import { useAuthStore } from '../../../store/authStore';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTransfer?: Transfer | null;
}

export function TransferModal({ isOpen, onClose, onSuccess, editingTransfer }: TransferModalProps) {
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [targetDeptId, setTargetDeptId] = useState('');
    const [targetBranchId, setTargetBranchId] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Initialize form when editingTransfer changes or modal opens
    useEffect(() => {
        if (isOpen && editingTransfer) {
            setStep(2); // Skip straight to details
            setSelectedAsset(editingTransfer.assetId as Asset);
            setTargetDeptId((editingTransfer.toDepartmentId as any)._id || editingTransfer.toDepartmentId);
            setTargetBranchId((editingTransfer.toBranchId as any)?._id || editingTransfer.toBranchId || '');
            setNotes(editingTransfer.notes || '');
        } else if (isOpen && !editingTransfer) {
            // Reset for create mode
            setStep(1);
            setSelectedAsset(null);
            setTargetDeptId('');
            if (user?.branchId) setTargetBranchId(user.branchId.toString());
            setNotes('');
        }
    }, [isOpen, editingTransfer, user]);

    // ... fetchData
    const fetchData = async () => {
        try {
            const [assetsData, deptsData, branchesData] = await Promise.all([
                assetService.getAll({ limit: 100 }),
                departmentService.getAll(),
                branchService.getAll()
            ]);
            setAssets(assetsData.data);
            setDepartments(deptsData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Failed to load transfer data", error);
        }
    };

    const handleSelectAsset = (asset: Asset) => {
        setSelectedAsset(asset);
        // Default target branch to asset's current branch if available, else user's
        if (asset.branchId) {
            setTargetBranchId(asset.branchId.toString());
        } else if (user?.branchId) {
            setTargetBranchId(user.branchId.toString());
        }
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!selectedAsset || !targetDeptId) return;

        setIsLoading(true);
        try {
            if (editingTransfer) {
                await transferService.update(editingTransfer._id, {
                    toDepartmentId: targetDeptId,
                    toBranchId: targetBranchId,
                    notes
                });
                showSuccessToast('Transfer request updated!');
            } else {
                await transferService.create({
                    assetId: selectedAsset._id,
                    toDepartmentId: targetDeptId,
                    toBranchId: targetBranchId,
                    notes
                });
                showSuccessToast('Transfer request submitted!');
            }
            onSuccess();
            handleClose();
        } catch (error) {
            console.error("Failed to submit transfer", error);
            showErrorToast('Failed to submit transfer request.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedAsset(null);
        setTargetDeptId('');
        if (user?.branchId) setTargetBranchId(user.branchId.toString());
        setNotes('');
        onClose();
    };

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serial.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-primary">move_item</span>
                                    {editingTransfer ? 'Edit Transfer Request' : (step === 1 ? 'Select Asset to Move' : 'Request Asset Transfer')}
                                </Dialog.Title>

                                {step === 1 ? (
                                    <div className="mt-6 space-y-4">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search assets by name or serial..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                            <AssetTable
                                                assets={filteredAssets}
                                                onSelect={handleSelectAsset}
                                                actionLabel="Select"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 space-y-6">
                                        {/* Asset Summary Card */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                            <div className="size-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">inventory_2</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{selectedAsset?.name}</h4>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">{selectedAsset?.serial} • {selectedAsset?.department}</p>
                                            </div>
                                            <button
                                                onClick={() => setStep(1)}
                                                className="ml-auto text-xs font-bold text-primary hover:underline"
                                            >
                                                Change Asset
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Branch</label>
                                                <select
                                                    value={targetBranchId}
                                                    onChange={(e) => setTargetBranchId(e.target.value)}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Target Branch</option>
                                                    {branches.map(branch => (
                                                        <option key={branch._id} value={branch._id}>{branch.name} ({branch.code})</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-500 mt-1">Select the destination site/branch.</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Department</label>
                                                <select
                                                    value={targetDeptId}
                                                    onChange={(e) => setTargetDeptId(e.target.value)}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Target Department</option>
                                                    {departments
                                                        // Filter out "current" dept ONLY if target branch is also "current" branch
                                                        // Otherwise it's valid to transfer to same department at different branch (e.g. IT HO -> IT JSO)
                                                        .filter(d => {
                                                            const isSameBranch = targetBranchId === (selectedAsset?.branchId?.toString() || user?.branchId?.toString());
                                                            const isSameDept = d._id === selectedAsset?.departmentId;
                                                            return !(isSameBranch && isSameDept);
                                                        })
                                                        .map(dept => (
                                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transfer Notes</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Reason for transfer..."
                                                rows={3}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div className="p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl flex gap-3">
                                            <span className="material-symbols-outlined text-blue-500">info</span>
                                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                                This will create a transfer request. The asset will remain in its current location until a manager from the destination branch/department approves the request.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        onClick={handleClose}
                                    >
                                        Cancel
                                    </button>
                                    {step === 2 && (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading || !targetDeptId || !targetBranchId}
                                            className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            ) : (
                                                editingTransfer ? 'Update Request' : 'Submit Request'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
