import { apiClient as api } from './api/client';

export const uploadService = {
    upload: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ url: string }>('/v1/upload', formData);
        return response.data.url;
    },

    uploadMultiple: async (files: File[]): Promise<string[]> => {
        if (files.length === 0) return [];

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post<{ urls: string[] }>('/v1/upload/multiple', formData);
        return response.data.urls;
    }
};
