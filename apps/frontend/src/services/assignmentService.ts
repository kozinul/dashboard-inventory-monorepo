import axios from '@/lib/axios';
import { Asset } from './assetService';
import { User } from './userService';

const API_URL = '/assignments';

export interface Assignment {
    _id: string;
    assetId: Asset;
    userId?: User; // Optional because it might be a manual assignment
    assignedTo?: string; // Manual name
    assignedToTitle?: string; // Manual title
    assignedDate: string;
    returnedDate?: string;
    status: 'assigned' | 'returned' | 'overdue' | 'active' | 'due-today';
    notes?: string;
    locationId?: any; // Populated Location object or ID
}

// Mock data store removed
export const assignmentService = {
    create: async (data: {
        assetId: string;
        assignedTo?: string;
        assignedToTitle?: string;
        locationId?: string;
        notes?: string;
        assignedDate?: Date
    }) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: {
        assignedTo?: string;
        assignedToTitle?: string;
        locationId?: string;
        notes?: string;
        assignedDate?: Date
    }) => {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    bulkUpdateRecipient: async (data: {
        currentName: string;
        newName?: string;
        newTitle?: string;
        newLocationId?: string;
    }) => {
        const response = await axios.post(`${API_URL}/bulk-update`, data);
        return response.data;
    },

    bulkDeleteRecipient: async (currentName: string) => {
        const response = await axios.post(`${API_URL}/bulk-delete`, { currentName });
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
        const response = await axios.get<Assignment[]>(API_URL);
        return response.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/${id}`);
        return true;
    }
};
