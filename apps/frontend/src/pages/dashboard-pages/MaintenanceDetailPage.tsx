import { useEffect, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { showErrorToast, showConfirmDialog, showSuccessToast, showInputDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { TicketWorkModal } from '@/features/maintenance/components/TicketWorkModal';
import { EscalateTicketModal } from '@/features/maintenance/components/EscalateTicketModal'; // Need to verify if file is indexed
import { supplyService, Supply } from '@/services/supplyService';


export default function MaintenanceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

    // Supply Management
    const [availableSupplies, setAvailableSupplies] = useState<Supply[]>([]);
    const [selectedSupply, setSelectedSupply] = useState('');
    const [supplyQty, setSupplyQty] = useState(1);

    // Server URL for images
    const SERVER_URL = 'http://localhost:3000';
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
        // Handle windows paths if any
        const cleanPath = path.replace(/\\/g, '/');
        // Check if path already starts with /uploads but not full URL
        if (cleanPath.startsWith('uploads/')) return `${SERVER_URL}/${cleanPath}`;
        if (cleanPath.startsWith('/uploads/')) return `${SERVER_URL}${cleanPath}`;
        return `${SERVER_URL}/${cleanPath}`;
    };

    // Upload Progress State
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const isTechnician = user?.role === 'technician';
    const isAdmin = user?.role === 'superuser' || user?.role === 'admin' || user?.role === 'administrator';

    // Load supplies when needed (e.g. status is In Progress)
    useEffect(() => {
        if (ticket?.status === 'In Progress') {
            loadSupplies();
        }
    }, [ticket?.status]);

    const loadSupplies = async () => {
        try {
            const data = await supplyService.getAll();
            console.log('DEBUG: User Full Object:', user);
            console.log('DEBUG: User Dept ID:', user?.departmentId);
            console.log('DEBUG: All Supplies:', data);
            setAvailableSupplies(data);
        } catch (error) {
            console.error('Failed to load supplies', error);
        }
    };

    const handleAddSupply = async () => {
        if (!ticket || !selectedSupply || supplyQty <= 0) return;
        const supply = availableSupplies.find(s => s._id === selectedSupply);
        if (!supply) return;

        try {
            // We use updateTicketWork to add supplies incrementally. 
            // Note: The backend logic for updateTicketWork usually REPLACES suppliesUsed array.
            // So we need to send EXISTING + NEW.
            // Let's check if we can reuse the same logic

            const currentSupplies = ticket.suppliesUsed || [];
            const newItem = {
                supply: supply._id,
                name: supply.name,
                quantity: supplyQty,
                cost: supply.cost
            };

            const updatedSupplies = [...currentSupplies, newItem];

            // We need to send minimal data to updateTicketWork to just update supplies?
            // updateTicketWork updates: status, beforePhotos, afterPhotos, suppliesUsed, logs notes.
            // We should keep current status, photos, etc.

            await maintenanceService.updateTicketWork(ticket._id!, {
                status: ticket.status,
                suppliesUsed: updatedSupplies,
                notes: `Added supply: ${supply.name} x${supplyQty}`
            });

            showSuccessToast('Supply added');
            setSelectedSupply('');
            setSupplyQty(1);
            fetchTicket(ticket._id!);
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to add supply');
        }
    };

    const handleAction = async (action: 'Pending' | 'Service' | 'Done') => {
        if (!ticket) return;

        if (action === 'Pending') {
            const result = await showInputDialog(
                'Set to Pending',
                'Reason for Pending',
                'text',
                'Waiting for parts...'
            );
            if (result.isConfirmed && result.value) {
                try {
                    await maintenanceService.updateStatus(ticket._id!, 'Pending', result.value);
                    showSuccessToast('Status updated to Pending');
                    fetchTicket(ticket._id!);
                } catch (error) {
                    showErrorToast('Failed to update status');
                }
            }
        } else if (action === 'Service') {
            try {
                // Set external service
                await maintenanceService.updateStatus(ticket._id!, 'External Service', 'Marked for External Service');
                showSuccessToast('Marked for External Service');
                navigate('/service'); // Redirect to service page
            } catch (error) {
                showErrorToast('Failed to update status');
            }
        } else if (action === 'Done') {
            // Check if afterPhotos are present before allowing completion? 
            // The modal handles this check, but here we might want to warn or just allow.
            // Let's keep it simple for now as per "Add upload before and upload after" request.

            const result = await showConfirmDialog('Complete Maintenance?', 'Are you sure you developed a finish?', 'Yes, complete it!');
            if (!result.isConfirmed) return;

            try {
                await maintenanceService.updateStatus(ticket._id!, 'Done', 'Maintenance Completed');
                showSuccessToast('Maintenance Completed');
                fetchTicket(ticket._id!);
            } catch (error: any) {
                showErrorToast(error.response?.data?.message || 'Failed to complete');
            }
        }
    };

    const handleDeletePhoto = async (type: 'before' | 'after', index: number) => {
        if (!ticket) return;

        const result = await showConfirmDialog('Delete Photo?', 'This action cannot be undone.');
        if (!result.isConfirmed) return;

        try {
            const currentPhotos = type === 'before' ? [...(ticket.beforePhotos || [])] : [...(ticket.afterPhotos || [])];
            currentPhotos.splice(index, 1);

            // We need to send the updated array. 
            // The backend replaces the array if provided in the body (and no files are uploaded).
            const updateData: any = {};
            if (type === 'before') {
                updateData.beforePhotos = currentPhotos;
            } else {
                updateData.afterPhotos = currentPhotos;
            }

            await maintenanceService.updateTicketWork(ticket._id!, updateData);
            showSuccessToast('Photo deleted');
            fetchTicket(ticket._id!);
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to delete photo');
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        if (!ticket || !e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const formData = new FormData();

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Compress images
            const compressedFiles = await Promise.all(
                files.map(async (file) => {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true
                    };
                    try {
                        const compressedFile = await imageCompression(file, options);
                        return new File([compressedFile], file.name, { type: file.type });
                    } catch (error) {
                        console.error('Compression failed for', file.name, error);
                        return file; // Fallback to original
                    }
                })
            );

            // Append files to correct field
            if (type === 'before') {
                compressedFiles.forEach(file => formData.append('beforePhotos', file));
            } else {
                compressedFiles.forEach(file => formData.append('afterPhotos', file));
            }

            await maintenanceService.updateTicketWork(
                ticket._id!,
                formData,
                (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            showSuccessToast(`${type === 'before' ? 'Before' : 'After'} photos uploaded`);
            fetchTicket(ticket._id!);
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to upload photos');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }

        // Reset input
        e.target.value = '';
    };

    useEffect(() => {
        if (id) {
            fetchTicket(id);
        }
    }, [id]);

    const fetchTicket = async (ticketId: string) => {
        try {
            setLoading(true);
            const data = await maintenanceService.getById(ticketId);
            setTicket(data);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            showErrorToast('Failed to load ticket details');
            navigate('/maintenance');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (!ticket) return;

        // Logic: specific action based on Role & Status
        if (isTechnician) {
            // Technicians only edit "Work" on assigned tickets
            if ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id) {
                setIsWorkModalOpen(true);
                return;
            }
        }

        // Default to admin/manager edit or if technician is viewing unrelated ticket (fallback)
        setIsCreateModalOpen(true);
    };

    const handleDelete = async () => {
        if (!ticket) return;
        const result = await showConfirmDialog('Are you sure?', 'You wont be able to revert this!');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.delete(ticket._id!);
            showSuccessToast('Record deleted successfully');
            navigate('/maintenance');
        } catch (error) {
            console.error('Failed to delete record:', error);
            showErrorToast('Failed to delete record');
        }
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setIsWorkModalOpen(false);
    };

    const handleSuccess = () => {
        if (id) fetchTicket(id);
        handleModalClose();
    };

    if (loading) return <div className="p-8 text-center">Loading ticket details...</div>;
    if (!ticket) return <div className="p-8 text-center">Ticket not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 relative">
            {/* Global Upload Progress Bar Overlay */}
            {isUploading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Uploading Photos...</h3>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-center text-slate-500">{uploadProgress}%</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Ticket #{ticket.ticketNumber}</h1>
                        <p className="text-slate-500 dark:text-slate-400">Maintenace Detail View</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Technicians/Admins: Start Work */}
                    {['Accepted', 'Pending', 'Draft', 'Sent'].includes(ticket.status) && (isAdmin || (isTechnician && (!ticket.technician || (ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id))) && (
                        <button
                            onClick={async () => {
                                try {
                                    await maintenanceService.startTicket(ticket._id!);
                                    showSuccessToast('Work started');
                                    fetchTicket(ticket._id!);
                                } catch (error) {
                                    console.error(error);
                                    showErrorToast('Failed to start work');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            Start Work
                        </button>
                    )}

                    {/* Close Ticket: Admin, Manager, or Requester */}
                    {(isAdmin || user?.role === 'manager' || (ticket.requestedBy as any)?._id === user?._id || (ticket.requestedBy as any) === user?._id) && ticket.status === 'Done' && (
                        <button
                            onClick={async () => {
                                const result = await showConfirmDialog('Close Ticket?', 'This will finalize the maintenance record.');
                                if (!result.isConfirmed) return;
                                try {
                                    await maintenanceService.update(ticket._id!, { status: 'Closed' });
                                    showSuccessToast('Ticket closed');
                                    fetchTicket(ticket._id!);
                                } catch (error) {
                                    console.error(error);
                                    showErrorToast('Failed to close ticket');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Close Ticket
                        </button>
                    )}

                    {/* In Progress Actions */}
                    {ticket.status === 'In Progress' && (isAdmin || (isTechnician && ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id))) && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction('Pending')}
                                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold text-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-sm align-bottom mr-1">pending</span>
                                Pending
                            </button>
                            <button
                                onClick={() => setIsEscalateModalOpen(true)}
                                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-bold text-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-sm align-bottom mr-1">forward</span>
                                Escalate
                            </button>
                            <button
                                onClick={() => handleAction('Service')}
                                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-bold text-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-sm align-bottom mr-1">design_services</span>
                                Service
                            </button>
                            <button
                                onClick={() => handleAction('Done')}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-green-600/20"
                            >
                                <span className="material-symbols-outlined text-sm align-bottom mr-1">check_circle</span>
                                Done
                            </button>
                        </div>
                    )}

                    {/* Edit Action - Hide for Technicians as they work inline */}
                    {(ticket.status === 'Draft' || ticket.status === 'Accepted') && isAdmin && (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Asset Details</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                            <p className="font-bold text-lg dark:text-white">{ticket.asset?.name || 'Unknown Asset'}</p>
                            <p className="text-sm text-slate-500">Serial: {ticket.asset?.serial || 'N/A'}</p>
                            <p className="text-sm text-slate-500">Dept: {ticket.asset?.department || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Request Info</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Requested By:</span>
                                <span className="font-medium dark:text-slate-300">{ticket.requestedBy?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date:</span>
                                <span className="font-medium dark:text-slate-300">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Status:</span>
                                <span className="font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">{ticket.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Type:</span>
                                <span className="font-medium dark:text-slate-300">{ticket.type || 'Unspecified'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Description</h3>
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                        {ticket.description || 'No description provided.'}
                    </p>
                </div>

                {/* Supplies Used Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase">Supplies Used</h3>
                    </div>

                    {/* Add Supply Form (Only when In Progress) */}
                    {ticket.status === 'In Progress' && (
                        <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Select Part/Supply</label>
                                <select
                                    value={selectedSupply}
                                    onChange={(e) => setSelectedSupply(e.target.value)}
                                    className="w-full text-sm p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                >
                                    <option value="">Choose item...</option>
                                    {availableSupplies
                                        .filter(s => {
                                            const userDeptId = user?.departmentId;
                                            const userDeptObjId = user?.department && typeof user.department === 'object' ? (user.department as any)._id : undefined;
                                            const userDeptName = user?.department && typeof user.department === 'object' ? (user.department as any).name : user?.department;

                                            // If no user dept info, show all
                                            if (!userDeptId && !userDeptObjId && !userDeptName) return true;

                                            // Robust ID extraction (handles string ID, populated object, or nested fields)
                                            const sDeptId = s.departmentId && typeof s.departmentId === 'object' ? (s.departmentId as any)._id : s.departmentId;
                                            const sDeptRef = s.department && typeof s.department === 'object' ? (s.department as any)._id : s.department;

                                            // Create comprehensive list of potential IDs from the supply record
                                            const validSupplyIds = [sDeptId, sDeptRef, s.department?._id, s.department].filter(Boolean);

                                            let match = false;
                                            // Check against User IDs
                                            if (userDeptId && validSupplyIds.some(id => String(id) === String(userDeptId))) match = true;
                                            if (userDeptObjId && validSupplyIds.some(id => String(id) === String(userDeptObjId))) match = true;

                                            // Name Match Fallback
                                            const sName = s.departmentId && typeof s.departmentId === 'object' ? (s.departmentId as any).name : (s.department as any)?.name;
                                            if (!match && userDeptName && sName === userDeptName) match = true;
                                            if (!match && userDeptName && s.department?.name === userDeptName) match = true;

                                            console.log(`DEBUG: Supply ${s.name} match? ${match}. IDs: ${validSupplyIds.join(',')}`);
                                            return match;
                                        })
                                        .map(s => (
                                            <option key={s._id} value={s._id} disabled={s.quantity <= 0}>
                                                {s.name} ({s.quantity} avail)
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={supplyQty}
                                    onChange={(e) => setSupplyQty(parseInt(e.target.value))}
                                    className="w-full text-sm p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <button
                                onClick={handleAddSupply}
                                disabled={!selectedSupply}
                                className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    {ticket.suppliesUsed && ticket.suppliesUsed.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Item Name</th>
                                        <th className="px-4 py-3 font-medium">Quantity</th>
                                        <th className="px-4 py-3 font-medium text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-card-dark">
                                    {ticket.suppliesUsed.map((item: any, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.cost * item.quantity)}
                                            </td>
                                            {/* Delete Action (only if In Progress) */}
                                            {ticket.status === 'In Progress' && (
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await maintenanceService.removeSupply(ticket._id!, item._id);
                                                                showSuccessToast('Supply removed');
                                                                fetchTicket(ticket._id!);
                                                            } catch (error) {
                                                                showErrorToast('Failed to remove supply');
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Remove supply"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                                        <td className="px-4 py-3" colSpan={2}>Total Cost</td>
                                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                                                ticket.suppliesUsed.reduce((acc, item) => acc + (item.cost * item.quantity), 0)
                                            )}
                                        </td>
                                        {ticket.status === 'In Progress' && <td></td>}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No supplies used yet.</p>
                    )}
                </div>

                {/* Technician Note Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase">Technician Notes</h3>
                        {ticket.status === 'In Progress' && (
                            <button
                                onClick={async () => {
                                    const result = await showInputDialog(
                                        'Add Note',
                                        'Note Content',
                                        'textarea'
                                    );
                                    if (result.isConfirmed && result.value) {
                                        try {
                                            await maintenanceService.addNote(ticket._id!, result.value);
                                            showSuccessToast('Note added');
                                            fetchTicket(ticket._id!);
                                        } catch (e) { showErrorToast('Failed to add note'); }
                                    }
                                }}
                                className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 rounded flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add</span> Add Note
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {/* Display Pending Note if exists - kept separately as it is status related */}
                        {ticket.status === 'Pending' && ticket.pendingNote && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                <span className="font-bold block mb-1">Pending/Hold Note:</span>
                                {ticket.pendingNote}
                            </div>
                        )}

                        {/* Display Editable Notes */}
                        {ticket.notes && ticket.notes.length > 0 ? (
                            ticket.notes.map((note: any) => (
                                <div key={note._id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span className="font-bold">{(note.addedBy as any)?.name || 'Unknown'}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                                            {/* Edit/Delete Actions */}
                                            <div className="hidden group-hover:flex gap-1 ml-2">
                                                <button
                                                    onClick={async () => {
                                                        const result = await showInputDialog(
                                                            'Edit Note',
                                                            'Edit note content',
                                                            'textarea',
                                                            note.content
                                                        );
                                                        if (result.isConfirmed && result.value) {
                                                            try {
                                                                await maintenanceService.updateNote(ticket._id!, note._id, result.value);
                                                                showSuccessToast('Note updated');
                                                                fetchTicket(ticket._id!);
                                                            } catch (e) { showErrorToast('Failed to update note'); }
                                                        }
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700" title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const result = await showConfirmDialog(
                                                            'Delete Note?',
                                                            'This cannot be undone.',
                                                            'Yes, delete it',
                                                            'delete'
                                                        );
                                                        if (result.isConfirmed) {
                                                            try {
                                                                await maintenanceService.deleteNote(ticket._id!, note._id);
                                                                showSuccessToast('Note deleted');
                                                                fetchTicket(ticket._id!);
                                                            } catch (e) { showErrorToast('Failed to delete note'); }
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700" title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 italic">No notes added yet.</p>
                        )}
                    </div>
                </div>

                {/* Before Maintenance Photos */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase">Before Maintenance Photos</h3>
                        {['In Progress', 'Accepted'].includes(ticket.status) && (isAdmin || (isTechnician && ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id))) && (
                            <div>
                                <input
                                    type="file"
                                    id="upload-before-photos"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handlePhotoUpload(e, 'before')}
                                />
                                <label
                                    htmlFor="upload-before-photos"
                                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 rounded flex items-center gap-1 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">add_a_photo</span> Add Photo
                                </label>
                            </div>
                        )}
                    </div>
                    {ticket.beforePhotos && ticket.beforePhotos.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {ticket.beforePhotos.map((img, idx) => (
                                <div key={`before-${idx}`} className="relative group shrink-0 w-32 h-32">
                                    <img
                                        src={getImageUrl(img)}
                                        alt={`Before ${idx}`}
                                        className="w-full h-full rounded-lg border border-slate-200 dark:border-border-dark object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(getImageUrl(img), '_blank')}
                                    />
                                    {['In Progress', 'Accepted'].includes(ticket.status) && (isAdmin || (isTechnician && ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id))) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePhoto('before', idx);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete photo"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No before photos added.</p>
                    )}
                </div>

                {/* After Maintenance Photos */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase">After Maintenance Photos</h3>
                        {['In Progress', 'Accepted'].includes(ticket.status) && (isAdmin || (isTechnician && ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id))) && (
                            <div>
                                <input
                                    type="file"
                                    id="upload-after-photos"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handlePhotoUpload(e, 'after')}
                                />
                                <label
                                    htmlFor="upload-after-photos"
                                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 rounded flex items-center gap-1 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">add_a_photo</span> Add Photo
                                </label>
                            </div>
                        )}
                    </div>
                    {ticket.afterPhotos && ticket.afterPhotos.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {ticket.afterPhotos.map((img, idx) => (
                                <div key={`after-${idx}`} className="relative group shrink-0 w-32 h-32">
                                    <img
                                        src={getImageUrl(img)}
                                        alt={`After ${idx}`}
                                        className="w-full h-full rounded-lg border border-slate-200 dark:border-border-dark object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(getImageUrl(img), '_blank')}
                                    />
                                    {['In Progress', 'Accepted'].includes(ticket.status) && (isAdmin || (isTechnician && ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id))) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePhoto('after', idx);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete photo"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No after photos added.</p>
                    )}
                </div>

                {/* Initial Request Visual Proof - Keep existing logic but maybe move it up or differentiate */}
                {ticket.visualProof && ticket.visualProof.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Original Request Proof</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                            {ticket.visualProof.map((img, idx) => (
                                <img key={idx} src={getImageUrl(img)} alt={`Proof ${idx}`} className="h-32 rounded-lg border border-slate-200 dark:border-border-dark" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                <h3 className="text-lg font-bold dark:text-white mb-4">History</h3>
                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                    {ticket.history?.map((event: any, idx: number) => (
                        <div key={idx} className="mb-6 ml-6">
                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-card-dark dark:bg-blue-900">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            </span>
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{event.status}</h4>
                                <time className="text-xs text-slate-500">{new Date(event.changedAt).toLocaleString()}</time>
                            </div>
                            <p className="text-sm text-slate-500">{event.notes}</p>
                            {event.changedBy && (
                                <p className="text-xs text-slate-400 mt-1">By: {event.changedBy.name || 'System'}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            <MaintenanceModal
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                initialData={ticket}
            />

            {ticket && (
                <EscalateTicketModal
                    isOpen={isEscalateModalOpen}
                    onClose={() => setIsEscalateModalOpen(false)}
                    onSuccess={handleSuccess}
                    ticket={ticket}
                />
            )}

            {ticket && (
                <TicketWorkModal
                    isOpen={isWorkModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                    ticket={ticket}
                />
            )}
        </div>
    );
}
