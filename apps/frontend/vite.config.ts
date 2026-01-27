import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    // Path aliases for clean imports
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@components': resolve(__dirname, './src/components'),
            '@pages': resolve(__dirname, './src/pages'),
            '@services': resolve(__dirname, './src/services'),
            '@hooks': resolve(__dirname, './src/hooks'),
            '@store': resolve(__dirname, './src/store'),
            '@types': resolve(__dirname, './src/types'),
            '@utils': resolve(__dirname, './src/utils'),
            '@assets': resolve(__dirname, './src/assets'),
        },
    },

    // Development server configuration optimized for Docker
    server: {
        host: '0.0.0.0', // Allow connections from outside container
        port: 5173,
        strictPort: true, // Fail if port is already in use

        // Hot Module Replacement configuration for Docker
        watch: {
            usePolling: true, // Required for Docker volumes
            interval: 1000, // Polling interval in ms
        },

        // CORS configuration for development
        cors: true,

        // Proxy API requests to backend
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },

    // Preview server configuration (for production preview)
    preview: {
        host: '0.0.0.0',
        port: 4173,
    },

    // Build configuration
    build: {
        outDir: 'dist',
        sourcemap: true,
        // Chunk splitting for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                },
            },
        },
    },

    // Environment variable prefix
    envPrefix: 'VITE_',
});
