export function SystemInfoCard() {
    return (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h4 className="text-sm font-bold dark:text-white flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary !text-[18px]">cloud_sync</span>
                Storage Health
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Asset documentation server is currently syncing with backup nodes. High-res photo capacity at 82%.
            </p>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected
                </span>
                <span className="text-[10px] text-slate-400">Ver. 2.4.0-Stable</span>
            </div>
        </div>
    );
}
