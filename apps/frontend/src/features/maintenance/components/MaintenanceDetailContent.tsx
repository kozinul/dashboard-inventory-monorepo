import { useEffect, useState } from 'react';
import { formatIDR } from '@/utils/currency';
import imageCompression from 'browser-image-compression';
import { useNavigate } from 'react-router-dom';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { showErrorToast, showConfirmDialog, showSuccessToast, showInputDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { TicketWorkModal } from '@/features/maintenance/components/TicketWorkModal';
import { EscalateTicketModal } from '@/features/maintenance/components/EscalateTicketModal';
import { supplyService, Supply } from '@/services/supplyService';
import { userService, User } from '@/services/userService';

interface MaintenanceDetailContentProps {
    ticketId: string;
    onSuccess?: () => void;
    onDelete?: () => void;
    isModal?: boolean;
}

export function MaintenanceDetailContent({ ticketId, onSuccess, onDelete, isModal }: MaintenanceDetailContentProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
    const [technicians, setTechnicians] = useState<User[]>([]);

    // Supply Management
    const [availableSupplies, setAvailableSupplies] = useState<Supply[]>([]);
    const [selectedSupply, setSelectedSupply] = useState('');
    const [supplyQty, setSupplyQty] = useState(1);

    // Accept/Reject State
    const [assignData, setAssignData] = useState({
        technicianId: '',
        type: 'Repair'
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // Server URL for images
    const SERVER_URL = 'http://localhost:3000';
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        if (cleanPath.startsWith('uploads/')) return `${SERVER_URL}/${cleanPath}`;
        if (cleanPath.startsWith('/uploads/')) return `${SERVER_URL}${cleanPath}`;
        return `${SERVER_URL}/${cleanPath}`;
    };

    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const isTechnician = user?.role === 'technician';
    const isAdmin = user?.role === 'superuser' || user?.role === 'admin' || user?.role === 'administrator';
    const isManager = user?.role === 'manager';

    useEffect(() => {
        if (ticketId) {
            fetchTicket(ticketId);
        }
        fetchTechnicians();
    }, [ticketId]);

    useEffect(() => {
        if (ticket?.status === 'In Progress') {
            loadSupplies();
        }
    }, [ticket?.status]);

    useEffect(() => {
        if (ticket) {
            setAssignData({
                technicianId: (ticket.technician as any)?._id || '',
                type: ticket.type || 'Repair'
            });
        }
    }, [ticket]);

    const fetchTicket = async (id: string) => {
        try {
            setLoading(true);
            const data = await maintenanceService.getById(id);
            setTicket(data);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            showErrorToast('Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const users = await userService.getAll();
            setTechnicians(users.filter(u => u.role === 'technician'));
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        }
    };

    const loadSupplies = async () => {
        try {
            const data = await supplyService.getAll();
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
            const currentSupplies = ticket.suppliesUsed || [];
            const newItem = {
                supply: supply._id,
                name: supply.name,
                quantity: supplyQty,
                cost: supply.cost
            };

            const updatedSupplies = [...currentSupplies, newItem];

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
            showErrorToast('Failed to add supply');
        }
    };

    const handleAction = async (action: 'Pending' | 'Service' | 'Done') => {
        if (!ticket) return;

        if (action === 'Pending') {
            const result = await showInputDialog('Set to Pending', 'Reason for Pending', 'text', 'Waiting for parts...');
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
                await maintenanceService.updateStatus(ticket._id!, 'External Service', 'Marked for External Service');
                showSuccessToast('Marked for External Service');
                if (!isModal) navigate('/service');
                else fetchTicket(ticket._id!);
            } catch (error) {
                showErrorToast('Failed to update status');
            }
        } else if (action === 'Done') {
            const result = await showConfirmDialog('Complete Maintenance?', 'Are you sure maintenance is finished?', 'Yes, complete it!');
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        if (!ticket || !e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const formData = new FormData();
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const compressedFiles = await Promise.all(
                files.map(async (file) => {
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                    try {
                        const compressedFile = await imageCompression(file, options);
                        return new File([compressedFile], file.name, { type: file.type });
                    } catch (error) {
                        return file;
                    }
                })
            );

            if (type === 'before') {
                compressedFiles.forEach(file => formData.append('beforePhotos', file));
            } else {
                compressedFiles.forEach(file => formData.append('afterPhotos', file));
            }

            await maintenanceService.updateTicketWork(ticket._id!, formData, (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            showSuccessToast(`${type === 'before' ? 'Before' : 'After'} photos uploaded`);
            fetchTicket(ticket._id!);
        } catch (error) {
            showErrorToast('Failed to upload photos');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
        e.target.value = '';
    };

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticket) return;
        setIsProcessing(true);
        try {
            await maintenanceService.acceptTicket(ticket._id, assignData.technicianId, assignData.type);
            showSuccessToast('Ticket accepted and technician assigned');
            fetchTicket(ticket._id);
            onSuccess?.();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to accept ticket');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!ticket) return;
        const result = await showInputDialog('Reject Ticket', 'Reason for rejection', 'text');
        if (result.isConfirmed && result.value) {
            try {
                await maintenanceService.rejectTicket(ticket._id, result.value);
                showSuccessToast('Ticket rejected');
                fetchTicket(ticket._id);
                onSuccess?.();
            } catch (error: any) {
                showErrorToast(error.response?.data?.message || 'Failed to reject');
            }
        }
    };

    const handleClose = async () => {
        if (!ticket) return;
        const result = await showConfirmDialog('Close Ticket?', 'This will finalize the maintenance record.');
        if (!result.isConfirmed) return;
        try {
            await maintenanceService.update(ticket._id!, { status: 'Closed' });
            showSuccessToast('Ticket closed');
            fetchTicket(ticket._id!);
            onSuccess?.();
        } catch (error) {
            showErrorToast('Failed to close ticket');
        }
    };



    const handleDelete = async () => {
        if (!ticket) return;
        const result = await showConfirmDialog('Are you sure?', 'You wont be able to revert this!');
        if (!result.isConfirmed) return;
        try {
            await maintenanceService.delete(ticket._id!);
            showSuccessToast('Record deleted successfully');
            if (!isModal) navigate('/maintenance');
            onDelete?.();
        } catch (error) {
            showErrorToast('Failed to delete record');
        }
    };

    if (loading) return <div className="p-8 text-center bg-white dark:bg-card-dark rounded-xl">Loading ticket details...</div>;
    if (!ticket) return <div className="p-8 text-center bg-white dark:bg-card-dark rounded-xl">Ticket not found</div>;

    return (
        <div className="space-y-6 pb-6 p-1">
            {/* Global Upload Progress Bar Overlay */}
            {isUploading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Uploading Photos...</h3>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p className="text-sm text-center text-slate-500">{uploadProgress}%</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">Ticket #{ticket.ticketNumber}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${ticket.status === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                                ticket.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800'
                            }`}>
                            {ticket.status}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">• {ticket.type}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* START WORK */}
                    {['Accepted', 'Pending', 'Draft', 'Sent'].includes(ticket.status) && (isAdmin || (isTechnician && (!ticket.technician || (ticket.technician as any)?._id === user?._id))) && (
                        <button
                            onClick={async () => {
                                try {
                                    await maintenanceService.startTicket(ticket._id!);
                                    showSuccessToast('Work started');
                                    fetchTicket(ticket._id!);
                                } catch (error) { showErrorToast('Failed to start work'); }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <span className="material-symbols-outlined text-sm">play_arrow</span> Start
                        </button>
                    )}

                    {/* CLOSE TICKET */}
                    {(isAdmin || isManager || (ticket.requestedBy as any)?._id === user?._id) && ticket.status === 'Done' && (
                        <button
                            onClick={handleClose}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">check_circle</span> Close
                        </button>
                    )}

                    {/* IN PROGRESS ACTIONS */}
                    {ticket.status === 'In Progress' && (isAdmin || (isTechnician && (ticket.technician as any)?._id === user?._id)) && (
                        <>
                            <button onClick={() => handleAction('Pending')} className="px-3 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold text-sm transition-all">Pending</button>
                            <button onClick={() => setIsEscalateModalOpen(true)} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-bold text-sm transition-all">Escalate</button>
                            <button onClick={() => handleAction('Service')} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-sm transition-all">Service</button>
                            <button onClick={() => handleAction('Done')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-600/20">Finish</button>
                        </>
                    )}

                    {/* MANAGER: ACCEPT / REJECT (Only for 'Sent' status) */}
                    {ticket.status === 'Sent' && (isAdmin || isManager) && (
                        <div className="flex gap-2">
                            <button onClick={handleReject} className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-sm">Reject</button>
                            {/* Accept triggers form or simple button? Let's use logic from action modal if technicians are needed */}
                        </div>
                    )}

                    {isAdmin && (
                        <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><span className="material-symbols-outlined">delete</span></button>
                    )}
                </div>
            </div>

            {/* Accept Form if status is Sent */}
            {ticket.status === 'Sent' && (isAdmin || isManager) && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">assignment_ind</span>
                        Process & Assign Request
                    </h3>
                    <form onSubmit={handleAccept} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="block text-[10px] font-bold text-indigo-500 uppercase mb-1">Type</label>
                            <select
                                className="w-full text-sm p-2 rounded-lg border border-indigo-200 dark:bg-slate-800 dark:border-slate-700"
                                value={assignData.type}
                                onChange={(e) => setAssignData({ ...assignData, type: e.target.value })}
                            >
                                <option value="Repair">Repair</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Emergency">Emergency</option>
                                <option value="Installation">Installation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-indigo-500 uppercase mb-1">Technician</label>
                            <select
                                className="w-full text-sm p-2 rounded-lg border border-indigo-200 dark:bg-slate-800 dark:border-slate-700"
                                value={assignData.technicianId}
                                onChange={(e) => setAssignData({ ...assignData, technicianId: e.target.value })}
                                required
                            >
                                <option value="">Select Technician...</option>
                                {technicians.map(t => (
                                    <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isProcessing || !assignData.technicianId}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Accept & Assign'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Asset Details</h3>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg dark:text-white">{ticket.asset?.name}</p>
                                    <p className="text-sm text-slate-500 font-mono">{ticket.asset?.serial}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                                        <span className="material-symbols-outlined text-sm">business</span>
                                        {ticket.asset?.department}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Request Info</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Requested By</span>
                                        <span className="font-bold dark:text-slate-300">{ticket.requestedBy?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-bold dark:text-slate-300">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Technician</span>
                                        <span className="font-bold text-blue-600">{ticket.technician?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Problem Description</h3>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed italic">
                                "{ticket.description}"
                            </div>
                        </div>
                    </div>

                    {/* Supplies Used */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold dark:text-white">Supplies & Parts</h3>
                            {ticket.status === 'In Progress' && (isAdmin || isTechnician) && (
                                <div className="flex gap-2">
                                    <select value={selectedSupply} onChange={(e) => setSelectedSupply(e.target.value)} className="text-xs p-1.5 rounded-lg border dark:bg-slate-800">
                                        <option value="">Selectitem...</option>
                                        {availableSupplies.map(s => <option key={s._id} value={s._id}>{s.name} ({s.quantity})</option>)}
                                    </select>
                                    <button onClick={handleAddSupply} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg">Add</button>
                                </div>
                            )}
                        </div>

                        {ticket.suppliesUsed && ticket.suppliesUsed.length > 0 ? (
                            <div className="space-y-2">
                                {ticket.suppliesUsed.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                                        <div>
                                            <span className="font-bold dark:text-white">{item.name}</span>
                                            <span className="text-slate-500 ml-2">x{item.quantity}</span>
                                        </div>
                                        <span className="font-mono text-slate-600">{formatIDR(item.cost * item.quantity)}</span>
                                    </div>
                                ))}
                                <div className="pt-3 flex justify-between font-bold text-lg dark:text-white">
                                    <span>Total Cost</span>
                                    <span>{formatIDR(ticket.suppliesUsed.reduce((acc, i) => acc + (i.cost * i.quantity), 0))}</span>
                                </div>
                            </div>
                        ) : <p className="text-sm text-slate-500 italic">No supplies used yet.</p>}
                    </div>

                    {/* Work Progress (Before/After) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Before Photos</h3>
                                {ticket.status === 'In Progress' && <label className="text-primary hover:underline cursor-pointer text-xs font-bold"><input type="file" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'before')} />Upload</label>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {ticket.beforePhotos?.map((p, i) => <img key={i} src={getImageUrl(p)} className="w-full h-20 object-cover rounded-lg border dark:border-slate-700" onClick={() => window.open(getImageUrl(p))} />)}
                                {(!ticket.beforePhotos || ticket.beforePhotos.length === 0) && <div className="col-span-3 py-8 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">No photos</div>}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">After Photos</h3>
                                {ticket.status === 'In Progress' && <label className="text-primary hover:underline cursor-pointer text-xs font-bold"><input type="file" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'after')} />Upload</label>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {ticket.afterPhotos?.map((p, i) => <img key={i} src={getImageUrl(p)} className="w-full h-20 object-cover rounded-lg border dark:border-slate-700" onClick={() => window.open(getImageUrl(p))} />)}
                                {(!ticket.afterPhotos || ticket.afterPhotos.length === 0) && <div className="col-span-3 py-8 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">No photos</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Notes Section */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold dark:text-white">Internal Notes</h3>
                            <button onClick={async () => {
                                const res = await showInputDialog('Add Note', 'Content', 'textarea');
                                if (res.isConfirmed && res.value) await maintenanceService.addNote(ticket._id, res.value), fetchTicket(ticket._id);
                            }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-primary"><span className="material-symbols-outlined text-sm">add</span></button>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {ticket.notes?.map(note => (
                                <div key={note._id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1">
                                    <div className="flex justify-between font-bold text-slate-400">
                                        <span>{(note.addedBy as any)?.name}</span>
                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{note.content}</p>
                                </div>
                            ))}
                            {(!ticket.notes || ticket.notes.length === 0) && <p className="text-xs text-slate-500 italic text-center py-4">No notes yet.</p>}
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold dark:text-white mb-4">History</h3>
                        <div className="space-y-4 relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 pl-4">
                            {ticket.history?.map((h, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-card-dark shadow-sm"></div>
                                    <p className="text-xs font-bold dark:text-white">{h.status}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(h.changedAt).toLocaleString()}</p>
                                    {h.notes && <p className="text-[10px] text-slate-400 mt-1 italic">"{h.notes}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals from original detail page */}
            <MaintenanceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchTicket(ticketId)} initialData={ticket} />
            <EscalateTicketModal isOpen={isEscalateModalOpen} onClose={() => setIsEscalateModalOpen(false)} onSuccess={() => fetchTicket(ticketId)} ticket={ticket} />
            <TicketWorkModal isOpen={isWorkModalOpen} onClose={() => setIsWorkModalOpen(false)} onSuccess={() => fetchTicket(ticketId)} ticket={ticket} />
        </div>
    );
}
