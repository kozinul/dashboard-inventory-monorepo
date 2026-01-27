import { useState, useEffect, Fragment } from "react";
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { jobTitleService, JobTitle, CreateJobTitleDto } from "@/services/jobTitleService";
import { departmentService, Department } from "@/services/departmentService";

export function JobTitleManager() {
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
    const [formData, setFormData] = useState<CreateJobTitleDto>({
        title: '',
        departmentId: '',
        status: 'Active'
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [jobTitlesData, departmentsData] = await Promise.all([
                jobTitleService.getAll(),
                departmentService.getAll()
            ]);
            setJobTitles(jobTitlesData);
            setDepartments(departmentsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            Swal.fire('Error', 'Failed to fetch data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (job?: JobTitle) => {
        if (job) {
            setEditingJobTitle(job);
            setFormData({
                title: job.title,
                departmentId: typeof job.departmentId === 'object' ? job.departmentId?._id : job.departmentId || '',
                status: job.status
            });
        } else {
            setEditingJobTitle(null);
            setFormData({
                title: '',
                departmentId: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingJobTitle) {
                await jobTitleService.update(editingJobTitle._id, formData);
                Swal.fire('Updated!', 'Job Title has been updated.', 'success');
            } else {
                await jobTitleService.create(formData);
                Swal.fire('Created!', 'Job Title has been created.', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error("Failed to save job title", error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to save job title', 'error');
        }
    };

    const handleDelete = async (job: JobTitle) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete ${job.title}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await jobTitleService.delete(job._id);
                Swal.fire('Deleted!', 'Job Title has been deleted.', 'success');
                fetchData();
            } catch (error) {
                console.error("Failed to delete job title", error);
                Swal.fire('Error', 'Failed to delete job title', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Job Titles List</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    Add Job Title
                </button>
            </div>

            <div className="bg-white dark:bg-slate-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                        ) : jobTitles.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No job titles found</td></tr>
                        ) : (
                            jobTitles.map(job => (
                                <tr key={job._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{job.title}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {typeof job.departmentId === 'object' ? job.departmentId?.name : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'Active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(job)}
                                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(job)}
                                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Transition.Root show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setIsModalOpen}>
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
                                            className="rounded-md bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                                            onClick={() => setIsModalOpen(false)}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                                {editingJobTitle ? 'Edit Job Title' : 'Add New Job Title'}
                                            </Dialog.Title>
                                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                        value={formData.title}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                                                    <select
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                        value={formData.departmentId}
                                                        onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                                    >
                                                        <option value="">No Department</option>
                                                        {departments.map(dept => (
                                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
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
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                </div>
                                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="submit"
                                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                                    >
                                                        {editingJobTitle ? 'Save Changes' : 'Create Job Title'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
                                                        onClick={() => setIsModalOpen(false)}
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
        </div>
    );
}
