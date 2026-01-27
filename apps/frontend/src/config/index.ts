/**
 * Environment configuration with type safety
 */
export const config = {
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
        timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    },
    app: {
        name: import.meta.env.VITE_APP_NAME || 'Dashboard Inventory',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    },
    features: {
        devTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
        mockApi: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
    },
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
} as const;

export type AppConfig = typeof config;
