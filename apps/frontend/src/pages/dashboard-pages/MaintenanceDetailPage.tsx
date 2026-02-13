import { useParams, useNavigate } from 'react-router-dom';
import { MaintenanceDetailContent } from '@/features/maintenance/components/MaintenanceDetailContent';

export default function MaintenanceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    if (!id) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">No ticket ID provided.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-bold dark:text-white">Maintenance Workspace</h1>
                    <p className="text-sm text-slate-500 italic">Full system detail view</p>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <MaintenanceDetailContent
                    ticketId={id}
                    onDelete={() => navigate('/maintenance')}
                />
            </div>
        </div>
    );
}
