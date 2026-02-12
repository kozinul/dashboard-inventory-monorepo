import axios from '@/lib/axios';
import { Department } from './departmentService';

// Ensure this matches the backend route prefix: /api/v1/categories
const API_URL = '/categories';

export interface Category {
    _id: string;
    name: string;
    code?: string;
    authorizedDepartments: Department[];
    icon?: string;
    description?: string;
    technicalSpecsTemplate?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryDto {
    name: string;
    code?: string;
    authorizedDepartments: string[]; // IDs
    icon?: string;
    description?: string;
}

export const categoryService = {
    getAll: async (): Promise<Category[]> => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    create: async (data: CreateCategoryDto): Promise<Category> => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateCategoryDto>): Promise<Category> => {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
