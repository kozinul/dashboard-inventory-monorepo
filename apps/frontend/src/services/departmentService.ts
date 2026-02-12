import axios from '@/lib/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Department {
    _id: string;
    name: string;
    code: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
    branchId?: string;
}

export interface CreateDepartmentDto {
    name: string;
    code: string;
    status: 'Active' | 'Inactive';
}

export const departmentService = {
    getAll: async (): Promise<Department[]> => {
        const response = await axios.get(`${API_URL}/departments`);
        return response.data;
    },

    create: async (data: CreateDepartmentDto): Promise<Department> => {
        const response = await axios.post(`${API_URL}/departments`, data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateDepartmentDto>): Promise<Department> => {
        const response = await axios.put(`${API_URL}/departments/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/departments/${id}`);
    }
};
