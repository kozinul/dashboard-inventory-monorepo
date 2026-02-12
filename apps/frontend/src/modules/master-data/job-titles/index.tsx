import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import { PageHeader } from '../../../components/common/PageHeader';
import { Section } from '../../../components/common/Section';
import { DataTable } from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { jobTitleService, JobTitle } from '@/services/jobTitleService';
import { Department } from '@/services/departmentService';
import { useAppStore } from '@/store/appStore';

export function JobTitlesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const { activeBranchId } = useAppStore();

    const fetchJobTitles = async () => {
        try {
            setLoading(true);
            const data = await jobTitleService.getAll();

            // Filter by branch
            const filteredData = activeBranchId === 'ALL'
                ? data
                : data.filter(j => j.branchId === activeBranchId);

            setJobTitles(filteredData);
        } catch (error) {
            console.error("Failed to fetch job titles", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobTitles();
    }, [activeBranchId]);

    const columns = [
        { header: 'Job Title', accessorKey: 'title' as const },
        {
            header: 'Department',
            cell: (item: JobTitle) => {
                if (!item.departmentId) return '-';
                if (typeof item.departmentId === 'string') return item.departmentId;
                return (item.departmentId as Department).name || '-';
            }
        },
        { header: 'Status', accessorKey: 'status' as const },
    ];

    return (
        <>
            <PageHeader
                title="Job Titles"
                description="Manage job titles and codes."
                action={
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add Job Title
                    </button>
                }
            />

            <Section>
                {loading ? (
                    <div className="text-center py-4">Loading job titles...</div>
                ) : (
                    <DataTable
                        data={jobTitles}
                        columns={columns}
                        actions={() => (
                            <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        )}
                    />
                )}
            </Section>

            <Modal
                open={isModalOpen}
                setOpen={setIsModalOpen}
                title="Add Job Title"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">Title</label>
                        <div className="mt-2">
                            <input type="text" name="title" id="title" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Software Engineer" />
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        </>
    );
}
