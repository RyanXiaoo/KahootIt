/**
 * API Configuration and Utility Functions
 * Automatically uses correct IP for WiFi play
 */

// Dynamic API URL - uses NEXT_PUBLIC_BACKEND_URL in production, falls back to dynamic hostname for local/WiFi dev
const getApiUrl = (): string => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:8000`;
    }
    return 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();
