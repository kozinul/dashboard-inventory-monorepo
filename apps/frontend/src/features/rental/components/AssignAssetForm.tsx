import { useState } from 'react';
import { mockAssets } from '@/features/inventory/data/mock-inventory';
import { mockUsers } from '@/data/mock-users';
import { mockLocations } from '@/modules/master-data/locations/data/mock-locations';
import { useNavigate } from 'react-router-dom';

export function AssignAssetForm() {
    const navigate = useNavigate();
    const [selectedAsset, setSelectedAsset] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would submit to API
        console.log({ selectedAsset, selectedUser, selectedLocation, checkoutDate, dueDate });
        navigate('/rental');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select Asset
                    </label>
                    <select
                        required
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary"
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                    >
                        <option value="">Select an asset...</option>
                        {mockAssets.map(asset => (
                            <option key={asset.id} value={asset.id}>
                                {asset.name} ({asset.id})
                            </option>
                        ))}
                    </select>
                </div>

                {/* User Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Assign To
                    </label>
                    <select
                        required
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="">Select a user...</option>
                        {mockUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} - {user.designation}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Location Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Assign Location
                    </label>
                    <select
                        required
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="">Select a location...</option>
                        {mockLocations.map(location => (
                            <option key={location.id} value={location.id}>
                                {location.name} ({location.building}, {location.floor})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Check-out Date
                    </label>
                    <input
                        type="date"
                        required
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary"
                        value={checkoutDate}
                        onChange={(e) => setCheckoutDate(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Due Date
                    </label>
                    <input
                        type="date"
                        required
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notes
                </label>
                <textarea
                    rows={4}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary resize-none"
                    placeholder="Add condition notes or purpose of loan..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => navigate('/rental')}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20 transition-all"
                >
                    Confirm Assignment
                </button>
            </div>
        </form>
    );
}
