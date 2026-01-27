export default function TransferPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
                <span className="material-symbols-outlined">move_item</span>
                <span className="text-sm font-medium uppercase tracking-widest">Asset Transfers</span>
            </div>
            <div className="w-full h-96 bg-card border border-border rounded-xl flex items-center justify-center flex-col gap-4">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300">construction</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">Under Construction</h3>
                <p className="text-muted-foreground text-sm">This module is currently being built.</p>
            </div>
        </div>
    )
}
