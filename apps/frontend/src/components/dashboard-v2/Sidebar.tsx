import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Sidebar() {
    const location = useLocation()

    const navItems = [
        { name: 'Dashboard', href: '/', icon: 'dashboard' },
        { name: 'Master Barang', href: '/inventory', icon: 'package_2' },
        { name: 'Barang Masuk', href: '/incoming', icon: 'input' },
        { name: 'Transfer', href: '/transfer', icon: 'move_item' },
        { name: 'Maintenance', href: '/maintenance', icon: 'build' },
        { name: 'Services', href: '/services', icon: 'medical_services' },
        { name: 'History', href: '/history', icon: 'history' },
    ]

    const masterDataItems = [
        { name: 'Asset Templates', href: '/master-data/asset-templates', icon: 'inventory_2' },
        { name: 'Categories', href: '/master-data/item-categories', icon: 'category' },
        { name: 'Locations', href: '/master-data/locations', icon: 'location_on' },
        { name: 'Vendors', href: '/master-data/vendors', icon: 'storefront' },
    ]

    const systemItems = [
        { name: 'Laporan', href: '/reports', icon: 'description' },
        { name: 'Settings', href: '/settings', icon: 'settings' },
    ]

    return (
        <aside className="w-64 border-r border-slate-200 dark:border-border-dark flex flex-col bg-white dark:bg-background-dark z-20 flex-shrink-0 h-screen transition-all duration-300 ease-in-out">
            <div className="p-6 flex items-center gap-3">
                <div className="size-10 tech-gradient rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">IT & AV Ops</h1>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase">Visual Inventory</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark"
                            )}
                        >
                            <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
                            <span className={cn("text-sm transition-all", isActive ? "font-semibold tracking-wide" : "font-medium")}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}

                <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3">Master Data</div>

                {masterDataItems.map((item) => {
                    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark"
                            )}
                        >
                            <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
                            <span className={cn("text-sm transition-all", isActive ? "font-semibold tracking-wide" : "font-medium")}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}

                <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3">System</div>

                {systemItems.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark"
                            )}
                        >
                            <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
                            <span className={cn("text-sm transition-all", isActive ? "font-semibold tracking-wide" : "font-medium")}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-200 dark:border-border-dark">
                <button className="w-full flex items-center justify-center gap-2 tech-gradient text-white rounded-lg py-2.5 text-sm font-bold subtle-depth hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined !text-[18px]">add</span>
                    Quick Add
                </button>
            </div>
        </aside>
    )
}
