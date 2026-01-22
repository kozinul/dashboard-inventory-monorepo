export function TopNavbar() {
    return (
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark sticky top-0 z-50">
            <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#008fb3] rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-none tracking-tight">AV Inventory</h1>
                            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Admin Console</span>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-1">
                        <a className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-card transition-colors" href="#">Dashboard</a>
                        <a className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-card transition-colors" href="#">Inventory</a>
                        <a className="px-4 py-2 rounded-lg text-sm font-bold text-primary bg-primary/10" href="#">Management</a>
                        <a className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-card transition-colors" href="#">Logs</a>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="bg-slate-100 dark:bg-slate-card border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                            placeholder="Quick search..."
                            type="text"
                        />
                    </div>
                    <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-card relative transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                    </button>
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-card overflow-hidden border border-slate-300 dark:border-slate-600">
                        <img
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuaN8cqLrSCjmK43Ok4paZtlZeJMV0lFIvKSZInWuGSbm5Yg4wO1bFUjST6XReFWgCf0y6ckuDonl6-eJ3gxLgpUCRWgzWEyWyTbb4uspAlXsJqNYAneIAHwlHQHn7q47_nyu0M6K6lEk7DHgx5f2Oe0rs5vostmwVCR-s75kpNabF-c4_6wQAa93fYffbrcd8kbSKY01rgQU7E7GyziQR0bBVwUhFou0CfSEOnGSxQXGauePxifJIYoecgBAI0P7iGzqnTylLqC0"
                            alt="Profile avatar"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}
