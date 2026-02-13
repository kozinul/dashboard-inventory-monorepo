import axios from '@/lib/axios';

export type ImportResult = {
    message: string;
    results: {
        success: number;
        failed: number;
        errors: string[];
    };
};

export const importExportService = {
    downloadTemplate: async (type: 'asset' | 'supply', columns?: string[]): Promise<void> => {
        const params = new URLSearchParams();
        params.append('type', type);
        if (columns && columns.length > 0) {
            params.append('columns', columns.join(','));
        }

        const response = await axios.get(`/data/template?${params.toString()}`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `template_${type}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    exportData: async (type: 'asset' | 'supply', columns?: string[]): Promise<void> => {
        const params = new URLSearchParams();
        params.append('type', type);
        if (columns && columns.length > 0) {
            params.append('columns', columns.join(','));
        }

        const response = await axios.get(`/data/export?${params.toString()}`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    importData: async (type: 'asset' | 'supply', file: File): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post<ImportResult>(`/data/import?type=${type}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }
};
