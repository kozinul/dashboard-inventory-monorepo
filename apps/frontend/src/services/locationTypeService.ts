import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') + '/location-types';

export interface LocationType {
    _id: string;
    name: string;
    description?: string;
    level: number;
}

export interface CreateLocationTypeDto {
    name: string;
    description?: string;
    level?: number;
}

export interface UpdateLocationTypeDto extends Partial<CreateLocationTypeDto> { }

export const locationTypeService = {
    getAll: async (): Promise<LocationType[]> => {
        const response = await axios.get<LocationType[]>(API_URL);
        return response.data;
    },

    create: async (data: CreateLocationTypeDto): Promise<LocationType> => {
        const response = await axios.post<LocationType>(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: UpdateLocationTypeDto): Promise<LocationType> => {
        const response = await axios.put<LocationType>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/${id}`);
    }
};
