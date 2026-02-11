import axios from '@/lib/axios';
import { Asset } from './assetService';

export interface Transfer {
    _id: string;
    assetId: Asset | string;
    fromDepartmentId: any;
    toDepartmentId: any;
    fromBranchId?: any;
    toBranchId?: any;
    requestedBy: any;
    approvedBy?: any;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
    notes?: string;
    transferDate: string;
    completedAt?: string;
    createdAt: string;
}

const API_URL = '/transfers';

export const transferService = {
    getAll: async () => {
        const response = await axios.get<Transfer[]>(API_URL);
        return response.data;
    },

    create: async (data: { assetId: string, toDepartmentId: string, notes?: string }) => {
        const response = await axios.post<Transfer>(API_URL, data);
        return response.data;
    },

    approve: async (id: string) => {
        const response = await axios.post<Transfer>(`${API_URL}/${id}/approve`);
        return response.data;
    },

    reject: async (id: string) => {
        const response = await axios.post<Transfer>(`${API_URL}/${id}/reject`);
        return response.data;
    },

    update: async (id: string, data: { toDepartmentId: string, toBranchId: string, notes?: string }) => {
        const response = await axios.put<Transfer>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
