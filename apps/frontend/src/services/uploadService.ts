import axios from 'axios';
import { config } from '@/config';

export const uploadService = {
    upload: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        // Using axios directly here to support upload progress, 
        // as the fetch wrapper does not easily support it without streams.
        const response = await axios.post<{ message: string; data: { url: string; filename: string } }>(`${config.api.baseUrl}/v1/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            }
        });

        return response.data.data;
    },

    uploadMultiple: async (files: File[]): Promise<string[]> => {
        // ... (keep existing implementation or switch if needed, but priority is single upload)
        if (files.length === 0) return [];

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await axios.post<{ urls: string[] }>(`${config.api.baseUrl}/v1/upload/multiple`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.urls;
    },

    delete: async (filename: string): Promise<void> => {
        await axios.delete(`${config.api.baseUrl}/v1/upload/${filename}`);
    }
};
