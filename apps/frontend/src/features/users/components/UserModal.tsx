import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { CreateUserDto } from '@/services/userService';
import { departmentService, Department } from '@/services/departmentService';
import { jobTitleService, JobTitle } from '@/services/jobTitleService';
import { branchService, Branch } from '@/services/branchService';
import { User } from '@dashboard/schemas';
import { z } from 'zod';
import { useRoleStore } from '@/store/roleStore';

const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
    role: z.enum(['user', 'admin', 'manager', 'auditor', 'technician', 'superuser', 'system_admin']),
    department: z.string().optional(),
    designation: z.string().optional(),
    status: z.enum(['Active', 'Offline', 'Away']),
    avatarUrl: z.string().optional(),
    id: z.string().optional(),
}).refine(data => {
    // Password is required for new users
    if (!data.password && !data.id) return false;
    return true;
}, {
    message: "Password is required",
    path: ["password"]
});

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserDto) => Promise<void>;
    editingUser?: User | null;
}

export function UserModal({ isOpen, onClose, onSubmit, editingUser }: UserModalProps) {
    const [showPassword, setShowPassword] = useState(false);
    const roles = useRoleStore(state => state.roles);
    const [formData, setFormData] = useState<CreateUserDto & { branchId?: string }>({
        username: '',
        name: '',
        email: '',
        role: 'user',
        department: '',
        branchId: '',
        designation: '',
        status: 'Active',
        avatarUrl: ''
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptData, jobData, branchData] = await Promise.all([
                    departmentService.getAll(),
                    jobTitleService.getAll(),
                    branchService.getAll()
                ]);
                setDepartments(deptData);
                setJobTitles(jobData);
                setBranches(branchData);
            } catch (error) {
                console.error("Failed to fetch dropdown data", error);
            }
        };
        fetchData();

        if (editingUser) {
            setFormData({
                username: (editingUser as any).username || '',
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                department: editingUser.department || '',
                branchId: (editingUser as any).branchId || '',
                designation: editingUser.designation || '',
                status: (editingUser.status as any) || 'Active',
                avatarUrl: editingUser.avatarUrl || ''
            });
        } else {
            setFormData({
                username: '',
                name: '',
                email: '',
                password: 'password123',
                role: 'user',
                department: '',
                branchId: '',
                designation: '',
                status: 'Active',
                avatarUrl: ''
            });
        }
    }, [editingUser, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Client-side validation
        try {
            // For client-side check we might need to adjust schema based on edit mode manually or ignore password logic if it's tricky in schema
            const validationResult = userSchema.safeParse({
                ...formData,
                id: editingUser ? 'exists' : undefined // Hack to flag edit mode for schema
            });

            if (!validationResult.success) {
                const newErrors: Record<string, string> = {};
                validationResult.error.errors.forEach(err => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
                return;
            }

            await onSubmit(formData);
            onClose();
        } catch (error: any) {
            console.error("Submission error:", error);
            if (error.response && error.response.data && error.response.data.errors) {
                const apiErrors: Record<string, string> = {};
                error.response.data.errors.forEach((err: any) => {
                    if (err.path && err.path[0]) {
                        apiErrors[err.path[0]] = err.message;
                    }
                });
                setErrors(apiErrors);
            } else {
                // Fallback generic error
                setErrors({ form: 'An unexpected error occurred. Please try again.' });
            }
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                            {editingUser ? 'Edit User' : 'Add New User'}
                                        </Dialog.Title>
                                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                    placeholder="e.g. john_doe"
                                                />
                                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                            </div>
                                            {!editingUser && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                                    <div className="relative mt-1">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            required
                                                            className="block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border pr-10"
                                                            value={formData.password}
                                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                                            ) : (
                                                                <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                                    <select
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                        value={formData.role}
                                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    >
                                                        {roles.map(role => (
                                                            <option key={role.id} value={role.slug}>
                                                                {role.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                                    <select
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                        value={formData.status}
                                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Offline">Offline</option>
                                                        <option value="Away">Away</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Branch <span className="text-red-500">*</span></label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.branchId || ''}
                                                    onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select Branch</option>
                                                    {branches.filter(b => b.status === 'Active').map(branch => (
                                                        <option key={branch._id} value={branch._id}>{branch.name} ({branch.code})</option>
                                                    ))}
                                                </select>
                                                {errors.branchId && <p className="mt-1 text-sm text-red-600">{errors.branchId}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.department}
                                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.filter(d => d.status === 'Active').map(dept => (
                                                        <option key={dept._id} value={dept.name}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Designation / Job Title</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.designation}
                                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                                >
                                                    <option value="">Select Job Title</option>
                                                    {jobTitles
                                                        .filter(job => job.status === 'Active')
                                                        .filter(job => !formData.department || (typeof job.departmentId === 'object' ? job.departmentId?.name === formData.department : true)) // Optional: Filter by department if selected
                                                        .map(job => (
                                                            <option key={job._id} value={job.title}>{job.title}</option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar URL</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.avatarUrl}
                                                    onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                                />
                                            </div>
                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button
                                                    type="submit"
                                                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                                >
                                                    {editingUser ? 'Save Changes' : 'Create User'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
                                                    onClick={onClose}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
