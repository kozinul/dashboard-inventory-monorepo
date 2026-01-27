import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') + '/inventory/items';

export interface Asset {
    _id: string;
    name: string;
    model: string;
    category: string;
    serial: string;
    locationId?: string;
    location?: string; // legacy
    status: 'active' | 'maintenance' | 'storage' | 'retired';
    value: number;
}

export const assetService = {
    getAll: async (params?: any) => {
        const response = await axios.get<{ data: Asset[], pagination: any }>(API_URL, { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await axios.get<Asset>(`${API_URL}/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await axios.post<Asset>(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await axios.put<Asset>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
