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

// API Utility Functions
export async function registerUser(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to register");
    }
    return response.json();
}

export async function loginUser(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to login");
    }
    return response.json();
}

