import axios from '@/lib/axios';

export type ImportResult = {
    message: string;
    results: {
        success: number;
        failed: number;
        errors: string[];
    };
};

export type ExportOptions = {
    type: 'asset' | 'supply' | 'maintenance' | 'rental';
    format?: 'excel' | 'pdf';
    branchId?: string;
    departmentId?: string;
    status?: string;
    category?: string;
    maintenanceType?: string;
    groupBy?: string;
    startDate?: string;
    endDate?: string;
    columns?: string[];
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

    exportData: async (options: ExportOptions): Promise<void> => {
        const params = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    params.append(key, value.join(','));
                } else {
                    params.append(key, value.toString());
                }
            }
        });

        const response = await axios.get(`/data/export?${params.toString()}`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const extension = options.format === 'pdf' ? 'pdf' : 'xlsx';
        link.setAttribute('download', `export_${options.type}_${new Date().getTime()}.${extension}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    previewData: async (options: Omit<ExportOptions, 'format'>): Promise<any> => {
        const params = new URLSearchParams();
        Object.entries({ ...options, format: 'json' }).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    params.append(key, value.join(','));
                } else {
                    params.append(key, value.toString());
                }
            }
        });

        const response = await axios.get(`/data/export?${params.toString()}`);
        return response.data;
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
