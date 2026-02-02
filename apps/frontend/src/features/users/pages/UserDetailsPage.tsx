import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { departmentService, Department } from '@/services/departmentService';
import { jobTitleService, JobTitle } from '@/services/jobTitleService';
import { User } from '@dashboard/schemas';
import Swal from 'sweetalert2';
import UserPermissionEditor from '../components/UserPermissionEditor';

export default function UserDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'assignments' | 'permissions' | 'logs'>('info');

    // Edit Form State
    const [editFormData, setEditFormData] = useState({
        username: '',
        name: '',
        email: '',
        department: '',
        designation: '',
        status: 'Active',
        role: 'user',
        password: '',
        departmentId: ''
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (!id) return;
            const [userData, assignmentData, departmentsData, jobTitlesData] = await Promise.all([
                userService.getById(id),
                assignmentService.getUserAssignments(id),
                departmentService.getAll(),
                jobTitleService.getAll()
            ]);
            setUser(userData);
            setAssignments(assignmentData);
            setDepartments(departmentsData);
            setJobTitles(jobTitlesData);

            // Initialize edit form
            setEditFormData({
                username: (userData as any).username || '',
                name: userData.name,
                email: userData.email,
                department: userData.department || '',
                departmentId: userData.departmentId || '',
                designation: userData.designation || '',
                status: userData.status || 'Active',
                role: userData.role || 'user',
                password: ''
            });
        } catch (error) {
            console.error("Failed to fetch user details", error);
            Swal.fire('Error', 'Failed to load user data', 'error');
            navigate('/users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            await userService.update(id, editFormData);
            Swal.fire('Success', 'User profile updated', 'success');
            // Refresh data to ensure UI syncs
            fetchData();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to update user', 'error');
        }
    };

    const handleReturn = async (assignmentId: string) => {
        const result = await Swal.fire({
            title: 'Return Asset?',
            text: "Confirm return of this asset",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, return it'
        });

        if (result.isConfirmed) {
            try {
                await assignmentService.returnAsset(assignmentId, {});
                Swal.fire('Returned!', 'Asset has been returned.', 'success');
                fetchData();
            } catch (error) {
                console.error("Failed to return asset", error);
                Swal.fire('Error', 'Failed to return asset', 'error');
            }
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!user) return <div className="p-8">User not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/users')} className="p-2 hover:bg-slate-100 rounded-full">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Identity Card (Left) */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark h-fit">
                    <div className="flex flex-col items-center text-center">
                        <img
                            src={user.avatarUrl || 'https://www.gravatar.com/avatar?d=mp'}
                            alt={user.name}
                            className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-slate-100 dark:border-slate-800"
                        />
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-slate-500 mb-4">{user.email}</p>

                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {user.status || 'Active'}
                        </div>
                    </div>
                </div>

                {/* Main Content Sections (Tabs) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Tabs Navigation */}
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex gap-6">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                User Information
                            </button>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assignments'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                Assigned Assets
                            </button>
                            <button
                                onClick={() => setActiveTab('permissions')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'permissions'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                Permissions
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'logs'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                User Log
                            </button>
                        </nav>
                    </div>

                    {/* Content: User Information (Editable) */}
                    {activeTab === 'info' && (
                        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                            <form onSubmit={handleUpdateUser} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Username */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Username</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.username}
                                            onChange={e => setEditFormData({ ...editFormData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.name}
                                            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.email}
                                            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {/* Department */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Department</label>
                                        <select
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.departmentId || ''}
                                            onChange={e => {
                                                const selectedDept = departments.find(d => d._id === e.target.value);
                                                setEditFormData({
                                                    ...editFormData,
                                                    departmentId: e.target.value,
                                                    department: selectedDept?.name || ''
                                                });
                                            }}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>
                                                    {dept.name} ({dept.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            Password <span className="text-slate-300 font-normal normal-case">(Set new to change)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                                                value={editFormData.password}
                                                onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                                                placeholder="Leave blank to keep current"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {showPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Designation */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Designation</label>
                                        <select
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.designation}
                                            onChange={e => setEditFormData({ ...editFormData, designation: e.target.value })}
                                            disabled={!editFormData.departmentId}
                                        >
                                            <option value="">{editFormData.departmentId ? 'Select Designation' : 'Select Department First'}</option>
                                            {jobTitles
                                                .filter(job => {
                                                    if (!editFormData.departmentId) return false;
                                                    const jobDeptId = typeof job.departmentId === 'object' ? (job.departmentId as any)._id : job.departmentId;
                                                    return jobDeptId === editFormData.departmentId;
                                                })
                                                .map(job => (
                                                    <option key={job._id} value={job.title}>
                                                        {job.title}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    {/* Role */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Role</label>
                                        <select
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.role}
                                            onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                        >
                                            <option value="user">User</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                            <option value="superuser">Super User</option>
                                            <option value="auditor">Auditor</option>
                                        </select>
                                    </div>
                                    {/* Status (Deactivate) */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status</label>
                                        <select
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={editFormData.status}
                                            onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="submit"
                                        className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Content: Assigned Assets */}
                    {activeTab === 'assignments' && (
                        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Asset</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Assigned Date</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Notes</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {assignments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No active assignments</td>
                                        </tr>
                                    ) : (
                                        assignments.map(assignment => (
                                            <tr key={assignment._id}>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold">{assignment.assetId?.name || 'Unknown Asset'}</p>
                                                        <p className="text-xs text-slate-500">{assignment.assetId?.serial || ''}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(assignment.assignedDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    {assignment.notes || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {assignment.status === 'assigned' ? (
                                                        <button
                                                            onClick={() => handleReturn(assignment._id)}
                                                            className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded"
                                                        >
                                                            Return
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">Returned</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Content: Activity Logs */}
                    {activeTab === 'logs' && (
                        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                <span className="material-symbols-outlined text-3xl text-slate-400">history</span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Activity Logs</h3>
                            <p className="text-slate-500">There are no activity logs available for this user yet.</p>
                        </div>
                    )}

                    {/* Content: Permissions */}
                    {activeTab === 'permissions' && id && (
                        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">User Permissions</h3>
                            <UserPermissionEditor userId={id} userRole={user.role} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
