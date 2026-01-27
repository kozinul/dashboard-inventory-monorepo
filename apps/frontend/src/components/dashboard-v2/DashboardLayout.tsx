import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export default function DashboardLayout() {
    return (
        <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden relative">
                <Header />
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 scroll-smooth will-change-transform">
                    <div className="mx-auto max-w-[1600px] animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
