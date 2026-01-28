import axios from 'axios';

// Ensure this matches the backend route prefix: /api/v1/locations
const API_URL = '/api/v1/locations';

export interface BoxLocation {
    _id: string;
    name: string;
    type: string;
    parentId: string | null;
    description?: string;
    status: 'Active' | 'Inactive' | 'Maintenance';
    children?: BoxLocation[];
}

export interface CreateLocationDto {
    name: string;
    type: string;
    parentId?: string | null;
    description?: string;
    status?: 'Active' | 'Inactive' | 'Maintenance';
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> { }

export const locationService = {
    getAll: async (): Promise<BoxLocation[]> => {
        const response = await axios.get<BoxLocation[]>(API_URL);
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
