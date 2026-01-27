interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MaintenanceModal({ isOpen, onClose }: MaintenanceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background-dark/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold tracking-tight dark:text-white">Log New Maintenance</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asset Selection</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2">
                                <option>Search for asset...</option>
                                <option>Sony Bravia 4K (AV-7742-SB)</option>
                                <option>Cisco Nexus C9318 (IT-1102-CS)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Maintenance Type</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2">
                                <option>Routine Checkup</option>
                                <option>Emergency Repair</option>
                                <option>Firmware Update</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Issue Description</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-500 dark:text-white px-3 py-2"
                            placeholder="Briefly describe the maintenance performed..."
                            rows={3}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">photo_camera</span> Before Maintenance
                            </label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl aspect-video flex flex-col items-center justify-center text-slate-500 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                <span className="text-[10px] font-bold">UPLOAD PHOTO</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">photo_camera</span> After Maintenance
                            </label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl aspect-video flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer">
                                <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                <span className="text-[10px] font-bold">UPLOAD PHOTO</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            type="button"
                        >
                            Cancel
                        </button>
                        <button className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all" type="submit">
                            Submit Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
