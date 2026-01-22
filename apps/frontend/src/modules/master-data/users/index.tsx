import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import { PageHeader } from '../../components/common/PageHeader';
import { Section } from '../../components/common/Section';
import { DataTable } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
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

    const columns = [
        { header: 'Name', accessorKey: 'name' },
        { header: 'Title', accessorKey: 'title' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Role', accessorKey: 'role' },
    ];

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
                <p>Form content will go here.</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Save
                    </button>
                </div>
            </Modal>
        </>
    );
}
