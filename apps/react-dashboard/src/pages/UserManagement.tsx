import { TopNavbar } from "@/components/layout/TopNavbar"
import { UserRow } from "@/features/users/components/UserRow"
import { StatsGrid } from "@/features/users/components/StatsGrid"
import { mockUsers } from "@/data/mock-users"

export default function UserManagementPage() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white pb-20">
            <TopNavbar />

            <main className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Page Heading Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tight">User & Organization <span className="text-primary">Management</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg font-light">
                            Directory and structural hierarchy for the global AV technology teams and local office departments.
                        </p>
                    </div>
                    <button className="bg-gradient-to-br from-[#00d4ff] to-[#008fb3] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <span className="material-symbols-outlined text-xl">person_add</span>
                        Add New User
                    </button>
                </div>

                {/* Tab System */}
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 p-1">
                    <button className="px-8 py-3 rounded-t-xl text-sm font-bold border-b-2 border-primary text-primary bg-primary/5 transition-all">
                        Users <span className="ml-2 py-0.5 px-2 rounded-full bg-primary/20 text-[10px]">124</span>
                    </button>
                    <button className="px-8 py-3 rounded-t-xl text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                        Departments
                    </button>
                    <button className="px-8 py-3 rounded-t-xl text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                        Job Titles
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex-1 min-w-[300px] relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">filter_list</span>
                        <input
                            className="w-full bg-white dark:bg-slate-card border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 focus:ring-primary outline-none"
                            placeholder="Filter by name, email or keyword..."
                            type="text"
                        />
                    </div>
                    <select className="bg-white dark:bg-slate-card border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary min-w-[160px] outline-none">
                        <option>All Departments</option>
                        <option>IT Infrastructure</option>
                        <option>AV Operations</option>
                        <option>Creative Services</option>
                    </select>
                    <select className="bg-white dark:bg-slate-card border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary min-w-[140px] outline-none">
                        <option>All Statuses</option>
                        <option>Active</option>
                        <option>Away</option>
                        <option>Offline</option>
                    </select>
                    <button className="bg-slate-200 dark:bg-slate-card text-slate-600 dark:text-slate-300 p-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-hover transition-colors">
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>

                {/* Main Data Table */}
                <div className="bg-white dark:bg-slate-card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Member</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Designation</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {mockUsers.map(user => (
                                    <UserRow key={user.id} user={user} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Table Footer / Pagination */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-slate-500">Showing 5 of 124 results</span>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-200 dark:hover:bg-slate-card transition-colors disabled:opacity-50" disabled>Previous</button>
                            <button className="px-4 py-1 rounded bg-primary text-background-dark text-sm font-bold">1</button>
                            <button className="px-4 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-card text-sm transition-colors">2</button>
                            <button className="px-4 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-card text-sm transition-colors">3</button>
                            <span className="text-slate-400 mx-1">...</span>
                            <button className="px-4 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-card text-sm transition-colors">25</button>
                            <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-200 dark:hover:bg-slate-card transition-colors">Next</button>
                        </div>
                    </div>
                </div>

                <StatsGrid />
            </main>
        </div>
    )
}
