import axios from '@/lib/axios';
import { User } from '@dashboard/schemas'; // Type import
export type { User };

const API_URL = '/users';

export interface CreateUserDto {
    username: string;
    email: string;
    name: string;
    role: string;
    department?: string;
    departmentId?: string;
    branchId?: any;
    designation?: string;
    avatarUrl?: string;
    phone?: string;
    permissions?: any[];
    status: 'Active' | 'Offline' | 'Away' | 'Inactive';
    password?: string;
}

export const userService = {
    getAll: async () => {
        const response = await axios.get<User[]>(API_URL);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await axios.get<User>(`${API_URL}/${id}`);
        return response.data;
    },

    create: async (data: CreateUserDto) => {
        const response = await axios.post<User>(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: any): Promise<User> => {
        const response = await axios.put<User>(`${API_URL}/${id}`, data);
        return response.data;
    },

    async updateMe(data: any): Promise<User> {
        const response = await axios.put('/auth/me', data);
        return response.data;
    },

    async uploadAvatar(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
