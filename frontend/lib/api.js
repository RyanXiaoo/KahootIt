// frontend/lib/api.js
const API_BASE_URL = "http://localhost:8000"; // Your FastAPI backend URL

export async function registerUser(username, password) {
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

export async function loginUser(username, password) {
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
        const errorData = await response.json(); // Ensure response is read before throwing
        throw new Error(errorData.detail || "Failed to login");
    }
    return response.json(); // This will return { access_token: "...", token_type: "bearer" }
}

export async function uploadNotes(file, quizCustomTitle, token, options = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quiz_custom_title", quizCustomTitle);
    if (options.start_page) formData.append("start_page", options.start_page);
    if (options.end_page) formData.append("end_page", options.end_page);
    if (options.questions_per_chunk)
        formData.append("questions_per_chunk", options.questions_per_chunk);
    if (options.max_total_questions)
        formData.append("max_total_questions", options.max_total_questions);

    const response = await fetch(`${API_BASE_URL}/upload-notes/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload notes");
    }
    return response.json();
}

export async function fetchQuiz(quizId, token) {
    const response = await fetch(`${API_BASE_URL}/game/${quizId}`, {
        method: "GET",
        headers: {
            // Only include Authorization if your /game/{game_id} endpoint is protected
            // 'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch quiz");
    }
    return response.json();
}

export async function getCurrentUserDetails(token) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch user details");
    }
    return response.json();
}
