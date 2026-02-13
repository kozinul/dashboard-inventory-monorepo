import { MaintenanceDetailContent } from './MaintenanceDetailContent';

interface MaintenanceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string | null;
    onSuccess?: () => void;
}

export function MaintenanceDetailModal({ isOpen, onClose, ticketId, onSuccess }: MaintenanceDetailModalProps) {
    if (!isOpen || !ticketId) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-card-dark w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-10 animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Maintenance Workspace</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Full detail and activity management</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/20 px-4 md:px-8 py-6">
                    <MaintenanceDetailContent
                        ticketId={ticketId}
                        isModal={true}
                        onSuccess={onSuccess}
                    />
                </div>
            </div>
        </div>
    );
}
