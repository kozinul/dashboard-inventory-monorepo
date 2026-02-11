import axios from '@/lib/axios';

export interface Branch {
    _id: string;
    name: string;
    code: string;
    address?: string;
    isHeadOffice: boolean;
    status: 'Active' | 'Inactive';
}

const API_URL = '/branches';

export const branchService = {
    getAll: async () => {
        const response = await axios.get<Branch[]>(API_URL);
        return response.data;
    },

    create: async (data: Partial<Branch>) => {
        const response = await axios.post<Branch>(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: Partial<Branch>) => {
        const response = await axios.put<Branch>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
