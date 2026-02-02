import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            // Error is handled in store
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8 border border-slate-100 dark:border-border-dark">
                <div className="text-center mb-8">
                    <div className="size-12 tech-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 mx-auto mb-4">
                        <span className="material-symbols-outlined text-2xl">inventory_2</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">error</span>
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-6 overflow-hidden">
                        <div className="bg-primary h-1.5 rounded-full animate-progress-indeterminate origin-left"></div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pl-10"
                                placeholder="Enter your username"
                                required
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">person</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pl-10"
                                placeholder="••••••••"
                                required
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">lock</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full tech-gradient text-white font-bold py-2.5 rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-xs text-slate-400">
                            Default Superuser: superuser / password123
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
