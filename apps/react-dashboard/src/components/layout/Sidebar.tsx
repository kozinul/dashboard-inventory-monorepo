import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Sidebar() {
    const location = useLocation()

    // Navigation links from HTML
    const navigation = [
        { name: 'Dashboard', href: '/', icon: 'dashboard' },
        { name: 'Inventory', href: '/inventory', icon: 'inventory_2' },
        { name: 'Maintenance', href: '/maintenance', icon: 'engineering' },
        { name: 'Account Settings', href: '/settings', icon: 'settings' },
    ]

    return (
        <aside className="w-72 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col justify-between py-8 px-6 text-white h-screen">
            <div className="flex flex-col gap-10">
                {/* Branding */}
                <div className="flex items-center gap-3 px-2">
                    <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-background-dark">
                        <span className="material-symbols-outlined font-bold">account_tree</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                        V-Doc <span className="text-primary">Sys</span>
                    </h2>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={isActive && item.icon === 'settings' ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Logout Bottom */}
            <div>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-all">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-bold">Logout</span>
                </button>
            </div>
        </aside>
    )
}
