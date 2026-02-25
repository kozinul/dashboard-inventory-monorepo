import axios from '@/lib/axios';

// Ensure this matches the backend route prefix: /api/v1/locations
const API_URL = '/locations';

export interface BoxLocation {
    _id: string;
    name: string;
    type: string;
    parentId?: string | { _id: string, name: string } | null;
    description?: string;
    status: 'Active' | 'Inactive' | 'Maintenance';
    children?: BoxLocation[];
    departmentId?: any; // Populated or ID
    isWarehouse?: boolean;
    branchId?: string;
    capacity?: number;
    usedCapacity?: number;
}

export interface CreateLocationDto {
    name: string;
    type: string;
    parentId?: string | null;
    description?: string;
    status?: 'Active' | 'Inactive' | 'Maintenance';
    departmentId?: string;
    isWarehouse?: boolean;
    capacity?: number;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> { }

export const locationService = {
    getAll: async (): Promise<BoxLocation[]> => {
        const response = await axios.get<BoxLocation[]>(API_URL);
        return response.data;
    },

    getById: async (id: string): Promise<BoxLocation> => {
        const response = await axios.get<BoxLocation>(`${API_URL}/${id}`);
        return response.data;
    },

    create: async (data: CreateLocationDto): Promise<BoxLocation> => {
        const response = await axios.post<BoxLocation>(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: UpdateLocationDto): Promise<BoxLocation> => {
        const response = await axios.put<BoxLocation>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
