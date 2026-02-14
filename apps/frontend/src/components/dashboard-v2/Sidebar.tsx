import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { maintenanceService, NavCounts } from '@/services/maintenanceService'

export function Sidebar() {
    const location = useLocation()
    const { user } = useAuthStore()
    const [counts, setCounts] = useState<NavCounts | null>(null)

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const data = await maintenanceService.getNavCounts()
                setCounts(data)
            } catch (error) {
                console.error('Failed to fetch nav counts:', error)
            }
        }

        if (user) {
            fetchCounts()
            const interval = setInterval(fetchCounts, 60000)
            return () => clearInterval(interval)
        }
    }, [user])

    // Check if user has permission for a resource
    const hasPermission = (resource: string) => {
        if (user?.role === 'superuser' || user?.role === 'system_admin' || user?.role === 'admin') return true;
        if (user?.role === 'user') {
            return ['dashboard', 'my_tickets', 'disposal'].includes(resource);
        }
        if (user?.role === 'technician') {
            return ['dashboard', 'inventory', 'maintenance', 'my_tickets', 'dept_tickets', 'disposal', 'assignments', 'history', 'transfer'].includes(resource);
        }
        if (resource === 'disposal') return true; // Ensure disposal is always visible for anyone else
        if (!user?.permissions || user.permissions.length === 0) return false;
        const perm = user.permissions.find(p => p.resource === resource);
        return perm?.actions?.['view'] === true;
    };

    const getBadgeCount = (resource: string) => {
        if (!counts) return 0;
        switch (resource) {
            case 'my_tickets': return counts.myTickets.actionable;
            case 'dept_tickets': return counts.deptTickets.actionable;
            case 'maintenance': return counts.assignedTickets.actionable;
            default: return 0;
        }
    };

    const navItems = [
        { name: 'Dashboard', href: '/', icon: 'dashboard', resource: 'dashboard' },
        { name: 'Master Barang', href: '/inventory', icon: 'package_2', resource: 'inventory' },
        { name: 'Barang Masuk', href: '/incoming', icon: 'input', resource: 'incoming' },
        { name: 'Transfer', href: '/transfer', icon: 'move_item', resource: 'transfer' },
        { name: 'Assignments', href: '/assignments', icon: 'assignment_ind', resource: 'assignments' },
        { name: 'Maintenance', href: '/maintenance', icon: 'build', resource: 'maintenance' },
        { name: 'Dept Tickets', href: '/department-tickets', icon: 'business', resource: 'dept_tickets' },
        { name: 'My Tickets', href: '/my-tickets', icon: 'confirmation_number', resource: 'my_tickets' },
        { name: 'Services', href: '/services', icon: 'medical_services', resource: 'services' },
        { name: 'History', href: '/history', icon: 'history', resource: 'history' },
        { name: 'Disposal', href: '/disposal', icon: 'recycling', resource: 'disposal' },
    ]

    const masterDataItems = [
        { name: 'Asset Templates', href: '/master-data/asset-templates', icon: 'inventory_2', resource: 'asset_templates' },
        { name: 'Categories', href: '/master-data/item-categories', icon: 'category', resource: 'categories' },
        { name: 'Locations', href: '/master-data/locations', icon: 'location_on', resource: 'locations' },
        { name: 'Vendors', href: '/master-data/vendors', icon: 'storefront', resource: 'vendors' },
        { name: 'User Management', href: '/users', icon: 'group', resource: 'users' },
    ]

    const systemItems = [
        { name: 'Laporan', href: '/reports', icon: 'description', resource: 'reports' },
        { name: 'Settings', href: '/settings', icon: 'settings', resource: 'settings' },
    ]

    const filteredNavItems = navItems.filter(item => hasPermission(item.resource));
    const filteredMasterDataItems = masterDataItems.filter(item => hasPermission(item.resource));
    const filteredSystemItems = systemItems.filter(item => hasPermission(item.resource));

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
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.href
                    const badgeCount = getBadgeCount(item.resource)
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark"
                            )}
                        >
                            <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
                            <span className={cn("text-sm transition-all flex-1", isActive ? "font-semibold tracking-wide" : "font-medium")}>
                                {item.name}
                            </span>
                            {badgeCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in-50 duration-200">
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                </span>
                            )}
                        </Link>
                    )
                })}

                {filteredMasterDataItems.length > 0 && (
                    <>
                        <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3">Master Data</div>
                        {filteredMasterDataItems.map((item) => {
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
                    </>
                )}

                {filteredSystemItems.length > 0 && (
                    <>
                        <div className="pt-4 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3">System</div>
                        {filteredSystemItems.map((item) => {
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
                    </>
                )}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-200 dark:border-border-dark">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.role || 'Guest'}</p>
                    </div>
                    <button
                        onClick={() => useAuthStore.getState().logout()}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
