import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAppStore } from '@/store/appStore';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Department {
    _id: string;
    name: string;
    code: string;
}

interface Category {
    _id: string;
    name: string;
    code?: string;
    authorizedDepartments: Department[];
    icon?: string;
    branchId?: string;
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        authorizedDepartments: [] as string[],
        icon: 'category',
        technicalSpecsTemplate: {} as Record<string, string>
    });
    const [deptFilter, setDeptFilter] = useState('');
    const [newTemplateKey, setNewTemplateKey] = useState('');

    useEffect(() => {
        fetchData();
        fetchDepartments();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/categories');
            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await axios.put(`/categories/${editingCategory._id}`, formData);
            } else {
                await axios.post('/categories', formData);
            }
            fetchData();
            closeModal();
            showSuccessToast('Category saved successfully');
        } catch (error) {
            console.error('Error saving category:', error);
            showErrorToast('Failed to save category');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            "You won't be able to revert this!",
            'Yes, delete it!',
            'delete'
        );

        if (result.isConfirmed) {
            try {
                await axios.delete(`/categories/${id}`);
                fetchData();
                showSuccessToast('Category has been deleted.');
            } catch (error) {
                console.error('Error deleting category:', error);
                showErrorToast('Failed to delete category');
            }
        }
    };

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                code: category.code || '',
                authorizedDepartments: category.authorizedDepartments.map(d => d._id),
                icon: category.icon || 'category',
                technicalSpecsTemplate: (category as any).technicalSpecsTemplate || {}
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                code: '',
                authorizedDepartments: [],
                icon: 'category',
                technicalSpecsTemplate: {}
            });
        }
        setDeptFilter('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const toggleDepartment = (deptId: string) => {
        setFormData(prev => {
            const newDepts = prev.authorizedDepartments.includes(deptId)
                ? prev.authorizedDepartments.filter(id => id !== deptId)
                : [...prev.authorizedDepartments, deptId];
            return { ...prev, authorizedDepartments: newDepts };
        });
    };

    const { activeBranchId } = useAppStore();

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDept ? cat.authorizedDepartments.some(d => d._id === selectedDept) : true;

        // Filter by Branch (if not ALL)
        const matchesBranch = activeBranchId === 'ALL' || (cat.branchId === activeBranchId);

        return matchesSearch && matchesDept && matchesBranch;
    });

    const handleTemplateFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (typeof json !== 'object' || json === null) {
                    throw new Error('Invalid JSON format');
                }

                // Verify keys are valid strings
                const validTemplate: Record<string, string> = {};
                for (const key of Object.keys(json)) {
                    validTemplate[key] = ''; // We only care about keys for the template
                }

                const result = await showConfirmDialog(
                    'Import Template?',
                    'This will merge/overwrite existing template keys.',
                    'Import',
                    'info'
                );

                if (result.isConfirmed) {
                    setFormData(prev => ({
                        ...prev,
                        technicalSpecsTemplate: { ...prev.technicalSpecsTemplate, ...validTemplate }
                    }));
                    showSuccessToast(`Imported ${Object.keys(validTemplate).length} fields from JSON.`);
                }
            } catch (err) {
                console.error(err);
                showErrorToast('Invalid JSON file.');
            }
            // Reset input
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        if (!formData.technicalSpecsTemplate || Object.keys(formData.technicalSpecsTemplate).length === 0) {
            return;
        }

        const jsonString = JSON.stringify(formData.technicalSpecsTemplate, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formData.name.toLowerCase().replace(/\s+/g, '_')}_template.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full min-w-0 bg-background-dark text-slate-200 font-display">
            {/* Header */}
            <header className="h-16 bg-background-dark/50 backdrop-blur-md border-b border-border-dark px-8 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <h2 className="font-header text-xl font-bold text-white">Category Management</h2>
                    <div className="relative w-80 group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </span>
                        <input
                            className="w-full bg-surface-dark border-border-dark rounded-full py-1.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none h-9 transition-all"
                            placeholder="Filter categories..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="size-9 flex items-center justify-center bg-surface-dark border border-border-dark rounded-full text-text-secondary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="h-9 px-4 bg-accent-indigo text-white text-xs font-bold rounded-full hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create New
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Filter Sidebar */}
                <aside className="w-64 bg-background-dark border-r border-border-dark overflow-y-auto p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Department Filter</h3>
                        <div className="flex flex-col gap-1">
                            <div
                                onClick={() => setSelectedDept(null)}
                                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer shadow-lg transition-all ${!selectedDept ? 'bg-primary text-white shadow-primary/20' : 'text-text-secondary hover:bg-surface-dark hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                                    <span className="text-xs font-semibold">All Entities</span>
                                </div>
                                <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded">{categories.length}</span>
                            </div>
                            {departments.map(dept => {
                                const count = categories.filter(c => c.authorizedDepartments.some(d => d._id === dept._id)).length;
                                return (
                                    <div
                                        key={dept._id}
                                        onClick={() => setSelectedDept(dept._id)}
                                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${selectedDept === dept._id ? 'bg-primary text-white shadow-primary/20' : 'text-text-secondary hover:bg-surface-dark hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[18px]">code</span>
                                            <span className="text-xs font-medium">{dept.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Main Grid */}
                <main className="flex-1 overflow-y-auto bg-[#0A0A1B] flex flex-col">
                    <div className="flex-1 p-8 space-y-8">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {/* Create Card Button */}
                                <div
                                    onClick={() => openModal()}
                                    className="border-2 border-dashed border-border-dark rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                                >
                                    <div className="size-14 rounded-full bg-surface-dark flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:scale-110 transition-all">
                                        <span className="material-symbols-outlined text-4xl">add_circle</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Create Category</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Add new asset classification</p>
                                    </div>
                                </div>

                                {/* Category Cards */}
                                {filteredCategories.map(category => (
                                    <div key={category._id} className="bg-surface-dark border border-border-dark rounded-2xl p-6 hover:border-primary/50 hover:bg-surface-lighter transition-all group relative overflow-visible">
                                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal(category); }} className="text-slate-600 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(category._id); }} className="text-slate-600 hover:text-rose-500 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-3xl">{category.icon || 'category'}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-header text-lg font-bold text-white leading-tight">{category.name}</h3>
                                                <p className="text-xs text-primary font-medium tracking-wide">{category.code}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="relative group/tagarea">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Authorized Access</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-background-dark/30 border border-transparent group-hover/tagarea:border-border-dark transition-colors">
                                                    {category.authorizedDepartments.map(dept => (
                                                        <span key={dept._id} className="px-2 py-1 bg-background-dark text-slate-300 text-[10px] font-bold rounded-lg border border-border-dark flex items-center gap-1.5 cursor-default">
                                                            {dept.name}
                                                        </span>
                                                    ))}
                                                    {category.authorizedDepartments.length === 0 && (
                                                        <span className="text-[10px] text-slate-500 italic">No restrictions</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="font-header text-lg font-bold leading-6 text-white mb-4"
                                    >
                                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                                    </Dialog.Title>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Code</label>
                                            <input
                                                type="text"
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary uppercase"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Icon (Material Symbol)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={formData.icon}
                                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            />
                                            <div className="mt-2 text-xs text-slate-500">
                                                Preview: <span className="material-symbols-outlined align-middle ml-1 text-primary">{formData.icon}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Authorized Departments</label>

                                            {/* Department Search */}
                                            <div className="mb-2 relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">
                                                    <span className="material-symbols-outlined text-[16px]">search</span>
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Filter departments..."
                                                    className="w-full bg-background-dark border border-border-dark rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:ring-primary focus:border-primary placeholder-slate-600"
                                                    value={deptFilter}
                                                    onChange={(e) => setDeptFilter(e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-background-dark rounded-lg border border-border-dark">
                                                {departments
                                                    // Filter departments based on search
                                                    // Note: We need to bind the input value to a state variable 'deptFilter'
                                                    .filter(dept => dept.name.toLowerCase().includes(deptFilter.toLowerCase()))
                                                    .map(dept => (
                                                        <label key={dept._id} className="flex items-center gap-2 cursor-pointer hover:bg-surface-lighter p-1.5 rounded transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary"
                                                                checked={formData.authorizedDepartments.includes(dept._id)}
                                                                onChange={() => toggleDepartment(dept._id)}
                                                            />
                                                            <span className="text-sm text-slate-300">{dept.name}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>


                                        {/* Technical Specs Template Editor */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Technical Specs Template</label>
                                                <div className="flex gap-3">
                                                    {Object.keys(formData.technicalSpecsTemplate).length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleDownloadTemplate}
                                                            className="cursor-pointer text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                                            Download JSON
                                                        </button>
                                                    )}
                                                    <label className="cursor-pointer text-xs font-bold text-primary hover:text-indigo-400 transition-colors flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                                        Import JSON
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept=".json"
                                                            onChange={handleTemplateFileUpload}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="bg-background-dark border border-border-dark rounded-lg p-3 space-y-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Add expectation (e.g. CPU)"
                                                        className="flex-1 bg-surface-dark border border-border-dark rounded px-2 py-1.5 text-xs text-white focus:ring-primary focus:border-primary placeholder-slate-500"
                                                        value={newTemplateKey}
                                                        onChange={(e) => setNewTemplateKey(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                if (newTemplateKey.trim()) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        technicalSpecsTemplate: { ...prev.technicalSpecsTemplate, [newTemplateKey.trim()]: '' }
                                                                    }));
                                                                    setNewTemplateKey('');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (newTemplateKey.trim()) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    technicalSpecsTemplate: { ...prev.technicalSpecsTemplate, [newTemplateKey.trim()]: '' }
                                                                }));
                                                                setNewTemplateKey('');
                                                            }
                                                        }}
                                                        className="px-3 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90"
                                                    >
                                                        Add
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {Object.keys(formData.technicalSpecsTemplate).map(key => (
                                                        <span key={key} className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-lighter rounded text-xs text-slate-200 border border-slate-600">
                                                            {key}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newTmpl = { ...formData.technicalSpecsTemplate };
                                                                    delete newTmpl[key];
                                                                    setFormData(prev => ({ ...prev, technicalSpecsTemplate: newTmpl }));
                                                                }}
                                                                className="text-slate-400 hover:text-rose-500"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {Object.keys(formData.technicalSpecsTemplate).length === 0 && (
                                                        <span className="text-xs text-slate-500 italic">No template fields defined.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                                onClick={closeModal}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-primary/20 transition-all"
                                            >
                                                Save Category
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div >
    );
}
