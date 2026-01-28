import axios from 'axios';
import { Department } from './departmentService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
        const response = await axios.get(`${API_URL}/categories`);
        return response.data;
    },

    create: async (data: CreateCategoryDto): Promise<Category> => {
        const response = await axios.post(`${API_URL}/categories`, data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateCategoryDto>): Promise<Category> => {
        const response = await axios.put(`${API_URL}/categories/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/categories/${id}`);
    }
};
