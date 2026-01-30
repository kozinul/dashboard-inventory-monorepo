import axios from 'axios';
import { Asset } from './assetService';
import { User } from './userService';

const API_URL = '/api/v1/assignments';

export interface Assignment {
    _id: string;
    assetId: Asset;
    userId: User;
    assignedDate: string;
    returnedDate?: string;
    status: 'assigned' | 'returned';
    notes?: string;
}

export const assignmentService = {
    // Create new assignment
    create: async (data: { assetId: string; userId: string; notes?: string; assignedDate?: Date }) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    // Return an asset
    returnAsset: async (id: string, data: { returnedDate?: Date; notes?: string }) => {
        const response = await axios.put(`${API_URL}/${id}/return`, data);
        return response.data;
    },

    // Get assignments for a specific user
    getUserAssignments: async (userId: string) => {
        const response = await axios.get<Assignment[]>(`${API_URL}/user/${userId}`);
        return response.data;
    },

    // Get assignment history for a specific asset
    getAssetHistory: async (assetId: string) => {
        const response = await axios.get<Assignment[]>(`${API_URL}/asset/${assetId}`);
        return response.data;
    },

    getAll: async () => {
        // Current UI might call this, let's return empty or implement if needed. 
        // For user-based flow, we likely don't need all assignments at once unless for admin view.
        // Let's leave it as TODO or return empty array to prevent break.
        return [];
    }
};
