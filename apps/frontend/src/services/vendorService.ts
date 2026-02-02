import axios from '@/lib/axios';
import { config } from '../config';

const API_URL = `${config.api.baseUrl}/v1/vendors`;

export interface Vendor {
    _id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    tags?: string[];
    status: 'active' | 'inactive';
}

export const vendorService = {
    getAll: async (): Promise<Vendor[]> => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    getOne: async (id: string): Promise<Vendor> => {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    },

    create: async (data: Omit<Vendor, '_id'>): Promise<Vendor> => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: Partial<Vendor>): Promise<Vendor> => {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
