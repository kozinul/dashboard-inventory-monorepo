/**
 * API Endpoints definitions
 * Centralized location for all API endpoint paths
 */

export const endpoints = {
    // Authentication (future)
    auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        me: '/auth/me',
    },

    // Users (future)
    users: {
        list: '/users',
        byId: (id: string) => `/users/${id}`,
        create: '/users',
        update: (id: string) => `/users/${id}`,
        delete: (id: string) => `/users/${id}`,
    },

    // Inventory (example - extend as needed)
    inventory: {
        items: '/inventory/items',
        itemById: (id: string) => `/inventory/items/${id}`,
        categories: '/inventory/categories',
        search: '/inventory/search',
    },

    // Dashboard
    dashboard: {
        stats: '/dashboard/stats',
        recentActivity: '/dashboard/recent-activity',
    },
} as const;

export type Endpoints = typeof endpoints;
