import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute() {
    const { user, isLoading } = useAuthStore();
    const token = localStorage.getItem('token'); // Check token directly to avoid flash of login if verifying

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (!token && !user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
