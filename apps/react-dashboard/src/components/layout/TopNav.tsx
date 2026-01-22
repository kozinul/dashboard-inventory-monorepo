import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { mockProfile } from '@/features/profile/data/mock-profile';

export function TopNav() {
    const location = useLocation();

    const links = [
        { name: 'Dashboard', href: '/' },
        { name: 'Reports', href: '/reports' },
        { name: 'Inventory', href: '/inventory' },
        { name: 'Maintenance', href: '/maintenance' },
    ];

    return (
        <header className="border-b border-slate-200 dark:border-border-dark bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="size-8 bg-primary/10 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight dark:text-white">Nexus<span className="text-primary">AV</span></h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        {links.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors",
                                        isActive ? "text-primary" : "text-slate-500 hover:text-primary dark:text-slate-400"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className="bg-slate-100 dark:bg-card-dark border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                            placeholder="Search data..."
                            type="text"
                        />
                    </div>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-card-dark text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-600 border border-white/20 bg-cover bg-center cursor-pointer"
                        style={{ backgroundImage: `url('${mockProfile.avatarUrl}')` }}
                    ></div>
                </div>
            </div>
        </header>
    );
}
