/**
 * Common types used throughout the application
 */

// Generic API response wrapper
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp: string;
}

// Paginated response
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

// Error response
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

// Base entity with common fields
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// User entity (for future auth)
export interface User extends BaseEntity {
    email: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'user' | 'viewer';
}

// Component prop types
export interface WithChildren {
    children: React.ReactNode;
}

export interface WithClassName {
    className?: string;
}

// Form states
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// Theme types
export type Theme = 'light' | 'dark' | 'system';
