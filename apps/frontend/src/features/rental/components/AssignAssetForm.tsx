import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService, Asset } from '@/services/assetService';
import { userService } from '@/services/userService';
import { locationService, BoxLocation as Location } from '@/services/locationService';
import { rentalService } from '@/services/rentalService';

interface User {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    department?: string;
    designation?: string;
    [key: string]: any;
}

export function AssignAssetForm() {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedAsset, setSelectedAsset] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(''); // Kept for future use if location tracking is added to rental
    const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [assetsResponse, usersData, locationsData] = await Promise.all([
                    assetService.getAll(),
                    userService.getAll(),
                    locationService.getAll()
                ]);
                setAssets(assetsResponse.data || []);
                setUsers(usersData);
                setLocations(locationsData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await rentalService.create({
                assetId: selectedAsset,
                userId: selectedUser,
                rentalDate: checkoutDate,
                expectedReturnDate: dueDate,
                notes: notes,
                status: 'active'
            });
            navigate('/rental');
        } catch (error) {
            console.error('Failed to create rental:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Loading form data...</div>;
    }

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
                        {assets.map(asset => (
                            <option key={asset._id} value={asset._id}>
                                {asset.name} ({asset.serial || 'No Serial'})
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
                        {users.map((user: User) => (
                            <option key={user._id || user.id || user.email} value={user._id || user.id}>
                                {user.name} {user.department ? `(${user.department})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Location Selection (Optional) */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Assign Location (Optional)
                    </label>
                    <select
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:focus:ring-primary"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="">Select a location...</option>
                        {locations.map(location => (
                            <option key={location._id} value={location._id}>
                                {location.name} {location.description ? `(${location.description})` : ''}
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                    disabled={submitting}
                    className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                    {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
            </div>
        </form>
    );
}
