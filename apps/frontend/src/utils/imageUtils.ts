export function getImageUrl(url: string | undefined | null): string {
    if (!url) return '';

    // If it's already an absolute URL or a blob/data URI, return it directly
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    // Extract base URL from VITE_API_URL or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    try {
        const parsedUrl = new URL(apiUrl);
        // We want the origin (e.g. http://localhost:3000) because the file path is typically absolute like /uploads/...
        return `${parsedUrl.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    } catch (e) {
        // Fallback in case VITE_API_URL is somehow invalid or just relative
        return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
    }
}
