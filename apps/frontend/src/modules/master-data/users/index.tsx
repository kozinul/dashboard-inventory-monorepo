import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import { PageHeader } from '../../../components/common/PageHeader';
import { Section } from '../../../components/common/Section';
import { DataTable } from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { ImageUploader } from '../../../components/common/ImageUploader';
// import { UserForm } from './components/UserForm'; // To be implemented

// Mock data
const mockUsers = [
    { id: '1', name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' },
    { id: '2', name: 'Courtney Henry', title: 'Designer', email: 'courtney.henry@example.com', role: 'Admin' },
    { id: '3', name: 'Tom Cook', title: 'Director of Product', email: 'tom.cook@example.com', role: 'Member' },
    { id: '4', name: 'Whitney Francis', title: 'Copywriter', email: 'whitney.francis@example.com', role: 'Admin' },
    { id: '5', name: 'Leonard Krasner', title: 'Senior Designer', email: 'leonard.krasner@example.com', role: 'Owner' },
    { id: '6', name: 'Floyd Miles', title: 'Principal Designer', email: 'floyd.miles@example.com', role: 'Member' },
];

export function UsersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data] = useState(mockUsers);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        title: '',
        role: 'Member',
        avatar: null as File | null
    });

    const columns = [
        { header: 'Name', accessorKey: 'name' as const },
        { header: 'Title', accessorKey: 'title' as const },
        { header: 'Email', accessorKey: 'email' as const },
        { header: 'Role', accessorKey: 'role' as const },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Here you would typically send data to backend
        setIsModalOpen(false);
        // Reset form
        setFormData({
            name: '',
            email: '',
            title: '',
            role: 'Member',
            avatar: null
        });
    };

    return (
        <>
            <PageHeader
                title="Users"
                description="A list of all the users in your account including their name, title, email and role."
                action={
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add User
                    </button>
                }
            />

            <Section>
                <DataTable
                    data={data}
                    columns={columns}
                    actions={(user) => (
                        <button className="text-indigo-600 hover:text-indigo-900">
                            Edit<span className="sr-only">, {user.name}</span>
                        </button>
                    )}
                />
            </Section>

            <Modal
                open={isModalOpen}
                setOpen={setIsModalOpen}
                title="Create User"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Image Uploader */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                Profile Photo
                            </label>
                            <ImageUploader
                                onChange={(file) => setFormData({ ...formData, avatar: file })}
                            />
                        </div>

                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                placeholder="john@example.com"
                            />
                        </div>

                        {/* Title Field */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Job Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                placeholder="Software Engineer"
                            />
                        </div>

                        {/* Role Field */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
                        >
                            Save User
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
