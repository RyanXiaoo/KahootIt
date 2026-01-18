/**
 * API Configuration and Utility Functions
 * Automatically uses correct IP for WiFi play
 */

// Dynamic API URL - works on localhost AND network devices
export const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:8000`;
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

