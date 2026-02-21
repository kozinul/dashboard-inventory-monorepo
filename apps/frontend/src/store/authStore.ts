import { create } from 'zustand';
import axios from '../lib/axios';

interface Permission {
    resource: string;
    actions: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

interface User {
    _id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    department?: string;
    departmentId?: string;
    managedDepartments?: string[];
    permissions?: Permission[];
    avatarUrl?: string;
    phone?: string;
    designation?: string;
    branchId?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    initialize: () => Promise<void>;
    setUser: (user: User) => void;
}

// Helper to safely parse JSON
const getStoredUser = () => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const useAuthStore = create<AuthState>((set) => ({
    user: getStoredUser(),
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
            // Must use direct axios import or fetch to avoid circular dependency if axios.ts imports store
            const response = await axios.post('/auth/login', { username, password });
            const { token, ...user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Clear any other potential keys or just clear everything to be safe
        localStorage.clear();
        sessionStorage.clear();
        set({ user: null, token: null });
        // Force reload to clear in-memory state
        window.location.href = '/login';
    },

    initialize: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Verify token and get user data
                const response = await axios.get('/auth/me');
                const user = response.data;
                // Update storage with latest
                localStorage.setItem('user', JSON.stringify(user));
                set({ user, token });
            } catch (error: any) {
                // Only clear session if specifically unauthorized
                if (error.response?.status === 401) {
                    console.error('Session expired - 401', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    set({ user: null, token: null });
                } else {
                    console.error('Session check failed but token preserved', error);
                    // Don't clear session for network errors/aborts
                }
            }
        }
    },

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
}));
