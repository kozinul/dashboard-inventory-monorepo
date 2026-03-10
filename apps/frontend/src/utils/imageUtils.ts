export function getImageUrl(url: string | undefined | null): string {
    if (!url) return '';

    // If it's already an absolute URL or a blob/data URI, return it directly
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    // If it's a relative path starting with /uploads, return it as is to use the Vite proxy
    // This is the most reliable way in development as it uses the same origin as the frontend
    if (url.startsWith('/uploads')) {
        return url;
    }

    // Extract base URL from VITE_API_URL or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    try {
        if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
            const parsedUrl = new URL(apiUrl);
            return `${parsedUrl.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
    } catch (e) {
        console.error('Error parsing API URL in getImageUrl', e);
    }

    // Fallback: return relative path if we can't determine a full URL
    return url.startsWith('/') ? url : `/${url}`;
}
