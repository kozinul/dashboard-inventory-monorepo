import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { assetTemplateService, AssetTemplate, GenerateAssetsPayload } from '../../services/assetTemplateService';
import { departmentService, Department } from '../../services/departmentService';
import { locationService, BoxLocation } from '../../services/locationService';

export default function AssetTemplatesPage() {
    const [templates, setTemplates] = useState<AssetTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AssetTemplate | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        model: '',
        category: '',
        defaultValue: '',
        serialPrefix: '',
        isActive: true,
        technicalSpecifications: {} as Record<string, string>
    });
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');

    // Generate Modal State
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [generateTemplateId, setGenerateTemplateId] = useState<string | null>(null);
    const [generateForm, setGenerateForm] = useState<GenerateAssetsPayload>({
        quantity: 1,
        startingSerial: '',
        departmentId: '',
        department: '',
        locationId: '',
        location: '',
        status: 'storage',
        purchaseDate: new Date().toISOString().split('T')[0]
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [locations, setLocations] = useState<BoxLocation[]>([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await assetTemplateService.getAll();
            setTemplates(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching templates:', error);
            setLoading(false);
        }
    };

    const fetchDepartmentsAndLocations = async () => {
        try {
            const [depts, locs] = await Promise.all([
                departmentService.getAll(),
                locationService.getAll()
            ]);
            setDepartments(depts);
            setLocations(locs);
        } catch (error) {
            console.error('Error fetching departments/locations:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                defaultValue: Number(formData.defaultValue)
            };

            if (editingTemplate) {
                await assetTemplateService.update(editingTemplate._id, payload);
            } else {
                await assetTemplateService.create(payload as any);
            }
            fetchTemplates();
            closeModal();
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Template saved successfully',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error saving template:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save template',
                confirmButtonColor: '#6366F1'
            });
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366F1',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await assetTemplateService.delete(id);
                fetchTemplates();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Template has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting template:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete template',
                    confirmButtonColor: '#6366F1'
                });
            }
        }
    };

    const openModal = (template?: AssetTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                code: template.code,
                name: template.name,
                model: template.model,
                category: template.category,
                defaultValue: template.defaultValue.toString(),
                serialPrefix: template.serialPrefix,
                isActive: template.isActive,
                technicalSpecifications: template.technicalSpecifications || {}
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                code: '',
                name: '',
                model: '',
                category: '',
                defaultValue: '',
                serialPrefix: '',
                isActive: true,
                technicalSpecifications: {}
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const openGenerateModal = async (templateId: string) => {
        setGenerateTemplateId(templateId);
        setGenerateForm({
            quantity: 1,
            startingSerial: '',
            departmentId: '',
            department: '',
            locationId: '',
            location: '',
            status: 'storage',
            purchaseDate: new Date().toISOString().split('T')[0]
        });
        await fetchDepartmentsAndLocations();
        setIsGenerateModalOpen(true);
    };

    const closeGenerateModal = () => {
        setIsGenerateModalOpen(false);
        setGenerateTemplateId(null);
    };

    const handleGenerateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!generateTemplateId) return;

        try {
            // Find selected department/location names
            const selectedDept = departments.find(d => d._id === generateForm.departmentId);
            const selectedLoc = locations.find(l => l._id === generateForm.locationId);

            const payload: GenerateAssetsPayload = {
                ...generateForm,
                department: selectedDept?.name || '',
                location: selectedLoc?.name || ''
            };

            const result = await assetTemplateService.generateAssets(generateTemplateId, payload);
            closeGenerateModal();
            Swal.fire({
                icon: 'success',
                title: 'Assets Created!',
                text: result.message,
                confirmButtonColor: '#6366F1'
            });
        } catch (error) {
            console.error('Error generating assets:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to generate assets',
                confirmButtonColor: '#6366F1'
            });
        }
    };

    const addSpec = () => {
        if (newSpecKey.trim()) {
            setFormData(prev => ({
                ...prev,
                technicalSpecifications: {
                    ...prev.technicalSpecifications,
                    [newSpecKey.trim()]: newSpecValue.trim()
                }
            }));
            setNewSpecKey('');
            setNewSpecValue('');
        }
    };

    const removeSpec = (key: string) => {
        const newSpecs = { ...formData.technicalSpecifications };
        delete newSpecs[key];
        setFormData(prev => ({ ...prev, technicalSpecifications: newSpecs }));
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full min-w-0 bg-background-dark text-slate-200 font-display">
            {/* Header */}
            <header className="h-16 bg-background-dark/50 backdrop-blur-md border-b border-border-dark px-8 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <h2 className="font-header text-xl font-bold text-white">Asset Templates</h2>
                    <div className="relative w-80 group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </span>
                        <input
                            className="w-full bg-surface-dark border-border-dark rounded-full py-1.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none h-9 transition-all"
                            placeholder="Search templates..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openModal()}
                        className="h-9 px-4 bg-accent-indigo text-white text-xs font-bold rounded-full hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Template
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#0A0A1B] p-8">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Create Card Button */}
                        <div
                            onClick={() => openModal()}
                            className="border-2 border-dashed border-border-dark rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group min-h-[200px]"
                        >
                            <div className="size-14 rounded-full bg-surface-dark flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:scale-110 transition-all">
                                <span className="material-symbols-outlined text-4xl">add_circle</span>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Create Template</p>
                                <p className="text-[11px] text-slate-500 font-medium">Add new asset template</p>
                            </div>
                        </div>

                        {/* Template Cards */}
                        {filteredTemplates.map(template => (
                            <div key={template._id} className="bg-surface-dark border border-border-dark rounded-2xl p-6 hover:border-primary/50 hover:bg-surface-lighter transition-all group relative">
                                {/* Actions */}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button
                                        onClick={() => openGenerateModal(template._id)}
                                        className="text-slate-600 hover:text-green-500 transition-colors"
                                        title="Generate Assets"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">deployed_code</span>
                                    </button>
                                    <button onClick={() => openModal(template)} className="text-slate-600 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(template._id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>

                                {/* Template Info */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                    </div>
                                    <div>
                                        <h3 className="font-header text-lg font-bold text-white leading-tight">{template.name}</h3>
                                        <p className="text-xs text-primary font-medium tracking-wide">{template.code}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Model</span>
                                        <span className="text-white font-medium">{template.model}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Category</span>
                                        <span className="text-white font-medium">{template.category}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Default Value</span>
                                        <span className="text-white font-medium">Rp {template.defaultValue.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Serial Prefix</span>
                                        <span className="text-primary font-mono">{template.serialPrefix}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Generated</span>
                                        <span className="text-white font-medium">{template.lastSerialNumber} units</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-4 pt-4 border-t border-border-dark">
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${template.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create/Edit Modal */}
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
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-6 shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="font-header text-lg font-bold text-white mb-4">
                                        {editingTemplate ? 'Edit Template' : 'Create New Template'}
                                    </Dialog.Title>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Code</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary uppercase"
                                                    placeholder="TPL-001"
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                                                <select
                                                    required
                                                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Laptops">Laptops</option>
                                                    <option value="AV Gear">AV Gear</option>
                                                    <option value="Workstations">Workstations</option>
                                                    <option value="Audio">Audio</option>
                                                    <option value="Lighting">Lighting</option>
                                                    <option value="Furniture">Furniture</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Template Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                placeholder="Dell Latitude 5520"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model / Specs</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                placeholder="i7-1185G7, 16GB RAM, 512GB SSD"
                                                value={formData.model}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Value</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                    placeholder="15000000"
                                                    value={formData.defaultValue}
                                                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Serial Prefix</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary uppercase"
                                                    placeholder="DL5520-"
                                                    value={formData.serialPrefix}
                                                    onChange={(e) => setFormData({ ...formData, serialPrefix: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Technical Specifications */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Specifications</label>
                                            <div className="bg-background-dark border border-border-dark rounded-lg p-3 space-y-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Key (e.g. CPU)"
                                                        className="flex-1 bg-surface-dark border border-border-dark rounded px-2 py-1.5 text-xs text-white"
                                                        value={newSpecKey}
                                                        onChange={(e) => setNewSpecKey(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value"
                                                        className="flex-1 bg-surface-dark border border-border-dark rounded px-2 py-1.5 text-xs text-white"
                                                        value={newSpecValue}
                                                        onChange={(e) => setNewSpecValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                addSpec();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addSpec}
                                                        className="px-3 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                                    {Object.entries(formData.technicalSpecifications).map(([key, value]) => (
                                                        <span key={key} className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-lighter rounded text-xs text-slate-200 border border-slate-600">
                                                            <strong>{key}:</strong> {value}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSpec(key)}
                                                                className="text-slate-400 hover:text-rose-500"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {Object.keys(formData.technicalSpecifications).length === 0 && (
                                                        <span className="text-xs text-slate-500 italic">No specs defined</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                className="rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label htmlFor="isActive" className="text-sm text-slate-300">Active Template</label>
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
                                                Save Template
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Generate Assets Modal */}
            <Transition appear show={isGenerateModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeGenerateModal}>
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
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-6 shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="font-header text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">deployed_code</span>
                                        Generate Assets
                                    </Dialog.Title>
                                    <form onSubmit={handleGenerateSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                required
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={generateForm.quantity}
                                                onChange={(e) => setGenerateForm({ ...generateForm, quantity: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Starting Serial (Optional)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                placeholder="Leave empty for auto-generate"
                                                value={generateForm.startingSerial}
                                                onChange={(e) => setGenerateForm({ ...generateForm, startingSerial: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                                            <select
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={generateForm.departmentId}
                                                onChange={(e) => setGenerateForm({ ...generateForm, departmentId: e.target.value })}
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                                            <select
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={generateForm.locationId}
                                                onChange={(e) => setGenerateForm({ ...generateForm, locationId: e.target.value })}
                                            >
                                                <option value="">Select Location</option>
                                                {locations.map(loc => (
                                                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                            <select
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={generateForm.status}
                                                onChange={(e) => setGenerateForm({ ...generateForm, status: e.target.value as any })}
                                            >
                                                <option value="storage">Storage</option>
                                                <option value="active">Active</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Purchase Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary"
                                                value={generateForm.purchaseDate}
                                                onChange={(e) => setGenerateForm({ ...generateForm, purchaseDate: e.target.value })}
                                            />
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                                onClick={closeGenerateModal}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-500 shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                                Generate {generateForm.quantity} Assets
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
