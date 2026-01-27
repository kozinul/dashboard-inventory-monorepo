

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-slate-950 px-8 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Dashboard Overview</h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative mr-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-64 h-9 pl-9 pr-4 rounded-md bg-slate-100 dark:bg-slate-900 border-none text-sm text-foreground focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">
                        search
                    </span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                <button className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
                </button>
                <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">help</span>
                </button>
            </div>
        </header>
    )
}
