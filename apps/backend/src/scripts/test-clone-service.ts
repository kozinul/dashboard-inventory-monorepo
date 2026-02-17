import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
});

const cloneAsset = async (id: string, serial: string) => {
    try {
        console.log(`Cloning asset ${id} with serial ${serial}...`);
        // Match the service call exactly
        const response = await instance.post(`/inventory/items/${id}/clone`, { serial });
        console.log('Success:', response.data);
    } catch (error: any) {
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Full URL:', error.config?.url);
    }
};

// Use one of the IDs found earlier
cloneAsset('697b1c1ad850f3b8a3f030ef', 'SERIAL-' + Date.now());
