import { useNavigate } from 'react-router-dom';
import { AssignAssetForm } from '@/features/rental/components/AssignAssetForm';

export default function AssignAssetPage() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Page Header */}
            <div>
                <button
                    onClick={() => navigate('/rental')}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Back to Rentals
                </button>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">New Asset Assignment</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Check out an asset to a user and set loan terms.
                </p>
            </div>

            <AssignAssetForm />
        </div>
    );
}
