/**
 * HTTP Client for API communication
 * Abstraction layer for fetch with common configuration
 */

import { config } from '@/config';
import type { ApiError, ApiResponse } from '@/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean>;
    signal?: AbortSignal;
}

class HttpClient {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string, timeout: number) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    private buildUrl(endpoint: string, params?: RequestOptions['params']): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        return url.toString();
    }

    private getHeaders(customHeaders?: Record<string, string>): Headers {
        const headers = new Headers({
            'Content-Type': 'application/json',
            ...customHeaders,
        });

        // Add auth token if available (for future implementation)
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                code: 'UNKNOWN_ERROR',
                message: response.statusText || 'An unknown error occurred',
            }));

            throw error;
        }

        return response.json();
    }

    private async request<T>(
        method: HttpMethod,
        endpoint: string,
        data?: unknown,
        options?: RequestOptions
    ): Promise<ApiResponse<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.buildUrl(endpoint, options?.params), {
                method,
                headers: this.getHeaders(options?.headers),
                body: data ? JSON.stringify(data) : undefined,
                signal: options?.signal || controller.signal,
            });

            return this.handleResponse<T>(response);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('GET', endpoint, undefined, options);
    }

    async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('POST', endpoint, data, options);
    }

    async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', endpoint, data, options);
    }

    async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', endpoint, data, options);
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', endpoint, undefined, options);
    }
}

// Export singleton instance
export const apiClient = new HttpClient(config.api.baseUrl, config.api.timeout);

// Export class for testing
export { HttpClient };
