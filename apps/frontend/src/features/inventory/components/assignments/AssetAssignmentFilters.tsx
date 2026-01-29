
export function AssetAssignmentFilters() {
    // In a real app, these would be controlled/dynamic
    return (
        <aside className="w-72 bg-background-dark border-r border-border-dark overflow-y-auto p-6 hidden lg:flex flex-col gap-8">
            <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Quick Filters</h3>
                <div className="flex flex-col gap-2">
                    <button className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 text-white group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px] text-primary">all_inbox</span>
                            <span className="text-sm font-medium">All Assignments</span>
                        </div>
                        <span className="text-xs bg-surface-dark px-2 py-0.5 rounded text-text-secondary">158</span>
                    </button>
                    <button className="flex items-center justify-between px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px] text-rose-500">priority_high</span>
                            <span className="text-sm font-medium">Overdue</span>
                        </div>
                        <span className="text-xs bg-surface-dark px-2 py-0.5 rounded text-text-secondary">12</span>
                    </button>
                    <button className="flex items-center justify-between px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px] text-amber-500">today</span>
                            <span className="text-sm font-medium">Due Today</span>
                        </div>
                        <span className="text-xs bg-surface-dark px-2 py-0.5 rounded text-text-secondary">5</span>
                    </button>
                    <button className="flex items-center justify-between px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px] text-emerald-500">outbox</span>
                            <span className="text-sm font-medium">Checked Out</span>
                        </div>
                        <span className="text-xs bg-surface-dark px-2 py-0.5 rounded text-text-secondary">141</span>
                    </button>
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Asset Categories</h3>
                <div className="flex flex-col gap-1">
                    {['Laptops', 'Monitors', 'AV Equipment', 'Mobile Devices'].map((category) => (
                        <label key={category} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-dark rounded-lg group">
                            <input
                                type="checkbox"
                                className="rounded border-border-dark bg-background-dark text-primary focus:ring-primary focus:ring-offset-background-dark"
                            />
                            <span className="text-sm text-text-secondary group-hover:text-white">{category}</span>
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
}
