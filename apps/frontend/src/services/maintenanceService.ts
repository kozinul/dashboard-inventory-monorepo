import axios from 'axios';

const API_URL = '/api/maintenance';

export const maintenanceService = {
    getAll: async (params?: any) => {
        const response = await axios.get(API_URL, { params });
        return response.data;
    },

    create: async (data: any) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    }
};
