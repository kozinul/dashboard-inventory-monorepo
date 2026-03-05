export function getImageUrl(url: string | undefined | null): string {
    if (!url) return '';

    // If it's already an absolute URL or a blob/data URI, return it directly
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    // Extract base URL from VITE_API_URL or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    try {
        if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
            const parsedUrl = new URL(apiUrl);
            // We want the origin (e.g. http://localhost:3000) because the file path is typically absolute like /uploads/...
            return `${parsedUrl.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        } else {
            // In production, the API URL is relative, but the backend serves the images directly.
            // So we need to point to the backend container (port 3000) using the current hostname.
            if (typeof window !== 'undefined') {
                return `${window.location.protocol}//${window.location.hostname}:3000${url.startsWith('/') ? '' : '/'}${url}`;
            }
            // Fallback for SSR/Node if window is not defined
            return url.startsWith('/') ? url : `/${url}`;
        }
    } catch (e) {
        // Fallback
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:3000${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url.startsWith('/') ? url : `/${url}`;
    }
}
