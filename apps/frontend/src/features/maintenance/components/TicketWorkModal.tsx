import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { supplyService, Supply } from '@/services/supplyService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import Swal from 'sweetalert2';

export interface TicketWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ticket: MaintenanceTicket;
}

export function TicketWorkModal({ isOpen, onClose, onSuccess, ticket }: TicketWorkModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'photos' | 'supplies' | 'status'>('photos');

    // Form States
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [selectedSupply, setSelectedSupply] = useState('');
    const [supplyQty, setSupplyQty] = useState(1);
    const [addedSupplies, setAddedSupplies] = useState<any[]>([]);

    const [workNotes, setWorkNotes] = useState('');
    const navigate = useNavigate();

    // Load existing data
    useEffect(() => {
        if (ticket) {
            setBeforePhotos(ticket.beforePhotos || []);
            setAfterPhotos(ticket.afterPhotos || []);
            setAddedSupplies(ticket.suppliesUsed || []);
        }
    }, [ticket]);

    // Load available supplies
    useEffect(() => {
        if (isOpen) {
            loadSupplies();
        }
    }, [isOpen]);

    const loadSupplies = async () => {
        try {
            const data = await supplyService.getAll();
            setSupplies(data);
        } catch (error) {
            console.error('Failed to load supplies', error);
        }
    };

    const handleAddSupply = () => {
        if (!selectedSupply || supplyQty <= 0) return;

        const supply = supplies.find(s => s._id === selectedSupply);
        if (!supply) return;

        const newItem = {
            supply: supply._id,
            name: supply.name,
            quantity: supplyQty,
            cost: supply.cost
        };

        setAddedSupplies([...addedSupplies, newItem]);
        setSelectedSupply('');
        setSupplyQty(1);
    };

    const removeSupply = (index: number) => {
        const newSupplies = [...addedSupplies];
        newSupplies.splice(index, 1);
        setAddedSupplies(newSupplies);
    };

    // New File Upload State
    const [newBeforeFiles, setNewBeforeFiles] = useState<File[]>([]);
    const [newAfterFiles, setNewAfterFiles] = useState<File[]>([]);

    // Preview URLs separately to avoid mixing with existing URLs logic until saved
    const [previewBefore, setPreviewBefore] = useState<string[]>([]);
    const [previewAfter, setPreviewAfter] = useState<string[]>([]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file) return;

            const url = URL.createObjectURL(file);

            if (type === 'before') {
                setNewBeforeFiles([...newBeforeFiles, file]);
                setPreviewBefore([...previewBefore, url]);
            } else {
                setNewAfterFiles([...newAfterFiles, file]);
                setPreviewAfter([...previewAfter, url]);
            }

            // Reset input
            e.target.value = '';
        }
    };

    const handleRemoveNewPhoto = (type: 'before' | 'after', index: number) => {
        if (type === 'before') {
            const updatedFiles = [...newBeforeFiles];
            updatedFiles.splice(index, 1);
            setNewBeforeFiles(updatedFiles);

            const updatedPreviews = [...previewBefore];
            if (updatedPreviews[index]) {
                URL.revokeObjectURL(updatedPreviews[index]); // Cleanup
            }
            updatedPreviews.splice(index, 1);
            setPreviewBefore(updatedPreviews);
        } else {
            const updatedFiles = [...newAfterFiles];
            updatedFiles.splice(index, 1);
            setNewAfterFiles(updatedFiles);

            const updatedPreviews = [...previewAfter];
            if (updatedPreviews[index]) {
                URL.revokeObjectURL(updatedPreviews[index]); // Cleanup
            }
            updatedPreviews.splice(index, 1);
            setPreviewAfter(updatedPreviews);
        }
    };

    // Keep existing URL removal logic for already saved photos (handled by just updating state passed to backend?)
    // Note: Backend logic currently might NOT handle removing existing photos explicitly unless we pass the full list of "kept" photos.
    // The current backend implementation:
    // `if (beforePhotos && Array.isArray(beforePhotos)) record.beforePhotos = beforePhotos;`
    // So if we pass the array of STRINGS (existing URLs), it updates the record.
    // So we should pass existing URLs in `beforePhotos` field of body, AND new files in `beforePhotos` field of files?
    // Multer handles files, body handles text fields. We can have same field name.
    // But usually it's cleaner to separate or just rely on the fact that `req.body.beforePhotos` will contain the strings, and `req.files.beforePhotos` contains files.

    // BUT wait, `record.beforePhotos = [...(record.beforePhotos || []), ...newPhotos];` in backend implementation I just wrote APPENDS new photos.
    // It does NOT replace existing ones if files are uploaded.
    // AND `if (req.files) ... else { if (beforePhotos) ... }`
    // This logic means if I upload files, the `else` block (which updates from URL list) is SKIPPED.
    // I should fix backend or handle it here?
    // Actually, my backend code:
    // if (req.files) { ... append new ... }
    // else { override with list ... }
    // This is problematic if I want to DELETE an existing photo AND ADD a new one in same request.
    // For now, let's assume we just ADD via this modal. Deleting existing photos might ideally be a separate action or we need to refine backend logic.
    // Given the user request "can add photo", simply adding is key.

    const handleSaveWork = async (newStatus?: string) => {
        setIsLoading(true);
        try {
            let pendingNote = '';

            if (newStatus === 'Pending') {
                const { value: note } = await Swal.fire({
                    title: 'Reason for Pending',
                    input: 'textarea',
                    inputLabel: 'Note',
                    inputPlaceholder: 'Waiting for spare parts...',
                    showCancelButton: true,
                    inputValidator: (value) => {
                        if (!value) return 'You need to write a reason!';
                        return null;
                    }
                });
                if (!note) {
                    setIsLoading(false);
                    return;
                }
                pendingNote = note;
            }

            if (newStatus === 'Done') {
                if (afterPhotos.length === 0 && newAfterFiles.length === 0) {
                    const result = await showConfirmDialog(
                        'No After Photos?',
                        'Are you sure you want to complete without after photos?'
                    );
                    if (!result.isConfirmed) {
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // Filter out supplies that were already in the ticket to send only NEW ones
            const initialSuppliesCount = ticket.suppliesUsed?.length || 0;
            const newSuppliesToSend = addedSupplies.slice(initialSuppliesCount);

            const formData = new FormData();
            if (newStatus) formData.append('status', newStatus);
            if (pendingNote) formData.append('pendingNote', pendingNote);
            if (workNotes) formData.append('notes', workNotes);

            // Append Files
            newBeforeFiles.forEach(file => {
                formData.append('beforePhotos', file);
            });
            newAfterFiles.forEach(file => {
                formData.append('afterPhotos', file);
            });

            // Append Supplies (as JSON string)
            // Note: If no supplies added, we might skip or send empty array
            formData.append('suppliesUsed', JSON.stringify(newSuppliesToSend));

            // To support removing existing photos (if we implemented that logic in UI), we'd usually need to send the 'kept' URLs.
            // But current backend logic for 'req.files' branch APPENDS.
            // So existing photos are safe even if not sent.
            // If we want to support deleting existing photos, we should probably do that via a separate API call or separate field 'deletedPhotos'.
            // For now, let's focus on ADDING.

            await maintenanceService.updateTicketWork(ticket._id, formData);

            showSuccessToast('Work updated successfully');
            onSuccess();
            onClose();

            if (newStatus === 'External Service') {
                navigate('/service');
            }
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to update work');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-card-dark w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">Ticket Work: {ticket.ticketNumber}</h2>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {ticket.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{ticket.title} - {ticket.asset?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'photos'
                                ? 'bg-white dark:bg-card-dark text-primary shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            Photos
                        </button>
                        <button
                            onClick={() => setActiveTab('supplies')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'supplies'
                                ? 'bg-white dark:bg-card-dark text-primary shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">inventory_2</span>
                            Supplies & Parts
                        </button>
                        <button
                            onClick={() => setActiveTab('status')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'status'
                                ? 'bg-white dark:bg-card-dark text-primary shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">fact_check</span>
                            Status & Completion
                        </button>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

                        {/* PHOTOS TAB */}
                        {activeTab === 'photos' && (
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined">image</span>
                                            Before Photos
                                        </h3>
                                        <div>
                                            <input
                                                type="file"
                                                id="before-photo-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileSelect(e, 'before')}
                                            />
                                            <label
                                                htmlFor="before-photo-upload"
                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                                                Add Photo
                                            </label>
                                        </div>
                                    </div>
                                    {beforePhotos.length === 0 && previewBefore.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500">
                                            No photos added yet
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {/* Existing Photos */}
                                            {beforePhotos.map((url, idx) => (
                                                <div key={`existing-${idx}`} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={url} alt={`Before ${idx}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {/* New Preview Photos */}
                                            {previewBefore.map((url, idx) => (
                                                <div key={`new-${idx}`} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 border-primary">
                                                    <img src={url} alt={`New Before ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">New</div>
                                                    <button
                                                        onClick={() => handleRemoveNewPhoto('before', idx)}
                                                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-100 transition-opacity z-20"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined">broken_image</span>
                                            After Photos
                                        </h3>
                                        <div>
                                            <input
                                                type="file"
                                                id="after-photo-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileSelect(e, 'after')}
                                            />
                                            <label
                                                htmlFor="after-photo-upload"
                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                                                Add Photo
                                            </label>
                                        </div>
                                    </div>
                                    {afterPhotos.length === 0 && previewAfter.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500">
                                            No photos added yet
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {/* Existing Photos */}
                                            {afterPhotos.map((url, idx) => (
                                                <div key={`existing-after-${idx}`} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={url} alt={`After ${idx}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {/* New Preview Photos */}
                                            {previewAfter.map((url, idx) => (
                                                <div key={`new-after-${idx}`} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 border-primary">
                                                    <img src={url} alt={`New After ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">New</div>
                                                    <button
                                                        onClick={() => handleRemoveNewPhoto('after', idx)}
                                                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-100 transition-opacity z-20"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SUPPLIES TAB */}
                        {activeTab === 'supplies' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold">Used Supplies</h3>

                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Items</label>
                                        <select
                                            value={selectedSupply}
                                            onChange={(e) => setSelectedSupply(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark"
                                        >
                                            <option value="">Select supply...</option>
                                            {supplies.map(s => (
                                                <option key={s._id} value={s._id} disabled={s.quantity <= 0}>
                                                    {s.name} ({s.quantity} {s.unit} avail)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={supplyQty}
                                            onChange={(e) => setSupplyQty(parseInt(e.target.value) || 1)}
                                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddSupply}
                                        disabled={!selectedSupply}
                                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-left">
                                            <tr>
                                                <th className="p-3 font-semibold text-slate-500">Item Name</th>
                                                <th className="p-3 font-semibold text-slate-500">Quantity</th>
                                                <th className="p-3 font-semibold text-slate-500 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {addedSupplies.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="p-8 text-center text-slate-500">No supplies recorded</td>
                                                </tr>
                                            ) : (
                                                addedSupplies.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3">{item.name}</td>
                                                        <td className="p-3">{item.quantity}</td>
                                                        <td className="p-3 text-right">
                                                            {idx >= (ticket.suppliesUsed?.length || 0) && (
                                                                <button
                                                                    onClick={() => removeSupply(idx)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* STATUS TAB */}
                        {activeTab === 'status' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold">Update Status</h3>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Work Notes / Comments
                                    </label>
                                    <textarea
                                        value={workNotes}
                                        onChange={(e) => setWorkNotes(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Describe the work done or any observations..."
                                        rows={4}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSaveWork('External Service')}
                                        disabled={isLoading}
                                        className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined text-3xl text-purple-600 mb-2 group-hover:scale-110 transition-transform">construction</span>
                                        <div className="font-bold text-slate-900 dark:text-white">External Service</div>
                                        <div className="text-sm text-slate-500">Submit for 3rd party repair</div>
                                    </button>



                                    <button
                                        onClick={() => handleSaveWork('Done')}
                                        disabled={isLoading}
                                        className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 text-left transition-all group md:col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined text-3xl text-green-600 mb-2 group-hover:scale-110 transition-transform">check_circle</span>
                                        <div className="font-bold text-slate-900 dark:text-white">Complete Job</div>
                                        <div className="text-sm text-slate-500">Mark ticket as resolved</div>
                                    </button>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                    <button
                                        onClick={() => handleSaveWork()}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            'Save Changes (Keep In Progress)'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
