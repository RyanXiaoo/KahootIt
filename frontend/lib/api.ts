/**
 * API Configuration - Dynamic URL for WiFi play
 */

// Automatically uses correct IP (localhost on PC, network IP on iPad/phone)
export const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();

