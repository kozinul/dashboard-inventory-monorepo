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
    designation?: string;
    status: 'Active' | 'Offline' | 'Away' | 'Inactive';
    avatarUrl?: string;
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

    update: async (id: string, data: Partial<CreateUserDto>) => {
        const response = await axios.put<User>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
