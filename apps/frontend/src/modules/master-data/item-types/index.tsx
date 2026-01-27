import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import { PageHeader } from '../../../components/common/PageHeader';
import { Section } from '../../../components/common/Section';
import { DataTable } from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';

const mockItemTypes = [
    { id: '1', name: 'Laptop', category: 'Electronics', description: 'Portable computers' },
    { id: '2', name: 'Monitor', category: 'Electronics', description: 'Display screens' },
    { id: '3', name: 'Desk Chair', category: 'Furniture', description: 'Office chairs' },
];

export function ItemTypesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data] = useState(mockItemTypes);

    const columns = [
        { header: 'Type Name', accessorKey: 'name' as const },
        { header: 'Category', accessorKey: 'category' as const },
        { header: 'Description', accessorKey: 'description' as const },
    ];

    return (
        <>
            <PageHeader
                title="Item Types"
                description="Define types of items in inventory."
                action={
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add Item Type
                    </button>
                }
            />

            <Section>
                <DataTable
                    data={data}
                    columns={columns}
                    actions={() => (
                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    )}
                />
            </Section>

            <Modal
                open={isModalOpen}
                setOpen={setIsModalOpen}
                title="Add Item Type"
            >
                <div className="space-y-4">
                    {/* Form fields stub */}
                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Name</label>
                        <input type="text" className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button type="button" className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:col-start-2" onClick={() => setIsModalOpen(false)}>Save</button>
                    <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0" onClick={() => setIsModalOpen(false)}>Cancel</button>
                </div>
            </Modal>
        </>
    );
}
