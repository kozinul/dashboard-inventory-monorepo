import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const instance = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'),
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import Swal from 'sweetalert2';

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        } else if (error.response?.status === 403) {
            Swal.fire({
                icon: 'error',
                title: 'Akses Ditolak',
                text: error.response?.data?.message || 'Anda tidak memiliki hak akses untuk melakukan tindakan ini.',
                confirmButtonColor: '#6366F1'
            });
        }
        return Promise.reject(error);
    }
);

export default instance;
