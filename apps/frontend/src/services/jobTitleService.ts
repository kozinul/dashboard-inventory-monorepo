import axios from '@/lib/axios';
import { Department } from './departmentService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface JobTitle {
    _id: string;
    title: string;
    departmentId: Department | string; // Populated or ID
    status: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
    branchId?: string;
}

export interface CreateJobTitleDto {
    title: string;
    departmentId?: string;
    status: 'Active' | 'Inactive';
}

export const jobTitleService = {
    getAll: async (): Promise<JobTitle[]> => {
        const response = await axios.get(`${API_URL}/job-titles`);
        return response.data;
    },

    create: async (data: CreateJobTitleDto): Promise<JobTitle> => {
        const response = await axios.post(`${API_URL}/job-titles`, data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateJobTitleDto>): Promise<JobTitle> => {
        const response = await axios.put(`${API_URL}/job-titles/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/job-titles/${id}`);
    }
};
