import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { showErrorToast, showSuccess, showConfirmDialog, showSelectDialog } from '@/utils/swal'
import { UserRow } from "@/features/users/components/UserRow"
import { StatsGrid } from "@/features/users/components/StatsGrid"
import { userService, CreateUserDto } from "@/services/userService"
import { User } from "@dashboard/schemas"
import { UserModal } from "@/features/users/components/UserModal"
import { DepartmentManager } from "@/features/users/components/DepartmentManager"
import { JobTitleManager } from "@/features/users/components/JobTitleManager"
import { RoleManager } from "@/features/users/components/RoleManager"
import { useAppStore } from "@/store/appStore"

export default function UserManagementPage() {
    const { activeBranchId } = useAppStore();
    const navigate = useNavigate()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'jobtitles' | 'roles'>('users')

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const data = await userService.getAll()
            setUsers(data)
        } catch (error) {
            console.error("Failed to fetch users", error)
            showErrorToast('Failed to fetch users')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = activeBranchId === 'ALL'
        ? users
        : users.filter(u => ((u as any).branchId?._id === activeBranchId || (u as any).branchId === activeBranchId));

    const handleCreateOrUpdate = async (data: CreateUserDto) => {
        try {
            if (editingUser) {
                await userService.update((editingUser as any)._id || (editingUser as any).id, data)
                showSuccess('Updated!', 'User has been updated successfully.')
            } else {
                await userService.create(data)
                showSuccess('Created!', 'User has been created successfully.')
            }
            fetchUsers()
        } catch (error) {
            console.error("Failed to save user", error)
            throw error;
        }
    };

    const handleDelete = async (user: User) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            `You want to delete ${user.name}? This action cannot be undone.`,
            'Yes, delete it!',
            'delete'
        )

        if (result.isConfirmed) {
            try {
                await userService.delete((user as any)._id || (user as any).id)
                showSuccess('Deleted!', 'User has been deleted.')
                fetchUsers()
            } catch (error) {
                console.error("Failed to delete user", error)
                showErrorToast('Failed to delete user')
            }
        }
    }

    const openCreateModal = () => {
        setEditingUser(null)
        setIsModalOpen(true)
    }

    const openEditModal = (user: User) => {
        setEditingUser(user)
        setIsModalOpen(true)
    }

    const handleCopyRole = async (sourceUser: User) => {
        const otherUsers = users.filter(u =>
            ((u as any)._id || (u as any).id) !== ((sourceUser as any)._id || (sourceUser as any).id)
        );

        if (otherUsers.length === 0) {
            showErrorToast('No other users available to copy role to.');
            return;
        }

        const { value: selectedUserId } = await showSelectDialog(
            `Copy role "${sourceUser.role}" to:`,
            Object.fromEntries(otherUsers.map(u => [((u as any)._id || (u as any).id), u.name])),
            'Select a user'
        );

        if (selectedUserId) {
            try {
                await userService.update(selectedUserId, { role: sourceUser.role });
                showSuccess('Copied!', 'Role has been copied successfully.');
                fetchUsers();
            } catch (error) {
                showErrorToast('Failed to copy role.');
            }
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Heading Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tight text-foreground">User & Organization <span className="text-primary">Management</span></h2>
                    <p className="text-muted-foreground max-w-2xl text-lg font-light">
                        Directory and structural hierarchy for the global AV technology teams and local office departments.
                    </p>
                </div>
                {activeTab === 'users' && (
                    <button
                        onClick={openCreateModal}
                        className="bg-gradient-to-br from-[#00d4ff] to-[#008fb3] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                        Add New User
                    </button>
                )}
            </div>

            {/* Tab System */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 p-1 mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-8 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all ${activeTab === 'users'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Users <span className="ml-2 py-0.5 px-2 rounded-full bg-primary/20 text-[10px]">{filteredUsers.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('departments')}
                    className={`px-8 py-3 rounded-t-xl text-sm font-medium border-b-2 transition-all ${activeTab === 'departments'
                        ? 'border-primary text-primary bg-primary/5 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Departments
                </button>
                <button
                    onClick={() => setActiveTab('jobtitles')}
                    className={`px-8 py-3 rounded-t-xl text-sm font-medium border-b-2 transition-all ${activeTab === 'jobtitles'
                        ? 'border-primary text-primary bg-primary/5 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Job Titles
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-8 py-3 rounded-t-xl text-sm font-medium border-b-2 transition-all ${activeTab === 'roles'
                        ? 'border-primary text-primary bg-primary/5 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Roles
                </button>
            </div>

            {activeTab === 'users' && (
                <>
                    {/* Filter & Search Bar - Only for Users currently */}
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
                        <button onClick={fetchUsers} className="bg-slate-200 dark:bg-slate-card text-slate-600 dark:text-slate-300 p-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-hover transition-colors">
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
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found for this branch</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <UserRow
                                                key={(user as any)._id || (user as any).id || user.email}
                                                user={user}
                                                onEdit={openEditModal}
                                                onDelete={handleDelete}
                                                onView={() => navigate(`/users/${(user as any)._id || (user as any).id}`)}
                                                onCopyRole={handleCopyRole}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Table Footer / Pagination */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm text-slate-500">Showing {filteredUsers.length} results</span>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-200 dark:hover:bg-slate-card transition-colors disabled:opacity-50" disabled>Previous</button>
                                <button className="px-4 py-1 rounded bg-primary text-background-dark text-sm font-bold">1</button>
                                <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-200 dark:hover:bg-slate-card transition-colors">Next</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <StatsGrid />
                    </div>
                </>
            )}

            {activeTab === 'departments' && <DepartmentManager />}

            {activeTab === 'jobtitles' && <JobTitleManager />}

            {activeTab === 'roles' && <RoleManager />}

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrUpdate}
                editingUser={editingUser}
                defaultBranchId={activeBranchId !== 'ALL' ? activeBranchId : undefined}
            />
        </div>
    )
}
