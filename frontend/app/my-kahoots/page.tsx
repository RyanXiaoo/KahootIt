"use client";

import { useState, useEffect } from "react";
// import Link from "next/link"; // No longer needed here if QuizTile handles its own link
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import QuizTile from "../../components/QuizTile"; // Ensure this path is correct

// Define the structure for a quiz fetched from the API
interface ApiQuiz {
    id: number; // Or string, depending on what your API sends and QuizTile expects after potential conversion
    title: string;
    question_count: number;
    created_at: string; // ISO date string
    pdf_filename?: string;
}

// Define the structure QuizTile expects (matching QuizTile.tsx)
interface QuizTileData {
    id: string;
    title: string;
    questionCount: number;
    dateCreated: string;
    pdfFilename?: string; // Optional: if you want to use it in QuizTile
}

export default function MyKahootsPage() {
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizTileData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuizzes = async () => {
            console.log("Auth Token being sent:", token); // Check if token is present and looks like a JWT
            console.log(
                "Fetching from URL:",
                "http://localhost:8000/quizzes/my"
            );
            console.log("Request Headers:", {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            });
            if (!token) {
                setIsLoading(false);
                // setError("Not authenticated. Please log in."); // Or rely on ProtectedRoute
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    "http://localhost:8000/quizzes/my",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                        detail: "Failed to fetch quizzes. Server returned an error.",
                    }));
                    throw new Error(
                        errorData.detail ||
                            `HTTP error! status: ${response.status}`
                    );
                }

                const data: ApiQuiz[] = await response.json();

                // Adapt API data to what QuizTile expects
                const adaptedQuizzes: QuizTileData[] = data.map((apiQuiz) => ({
                    id: String(apiQuiz.id), // Ensure id is a string
                    title: apiQuiz.title,
                    questionCount: apiQuiz.question_count,
                    // Format date string (e.g., "2023-10-26") or pass ISO string if QuizTile handles it
                    dateCreated: new Date(
                        apiQuiz.created_at
                    ).toLocaleDateString("en-CA"), // Example: YYYY-MM-DD
                    pdfFilename: apiQuiz.pdf_filename,
                }));

                setQuizzes(adaptedQuizzes);
            } catch (err: any) {
                console.error("Failed to fetch quizzes:", err);
                setError(
                    err.message ||
                        "An unexpected error occurred while fetching your quizzes."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [token]); // Re-fetch if token changes

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                        {" "}
                        {/* Consider dark mode for text if bg is dark */}
                        My Kahoots
                    </h1>
                    {/* Optional: Add a "Create New" button here */}
                    {/* <Link href="/create-kahoot" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out">
                        + Create New Quiz
                    </Link> */}
                </div>

                {isLoading && (
                    <div className="text-center py-10">
                        <p className="text-xl text-gray-400">
                            Loading your Kahoots...
                        </p>
                        {/* You can add a spinner component here */}
                    </div>
                )}

                {!isLoading && error && (
                    <div
                        className="text-center py-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                        role="alert"
                    >
                        <strong className="font-bold">Oops! </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {!isLoading && !error && quizzes.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-xl text-gray-400 mb-4">
                            You haven't created any Kahoots yet.
                        </p>
                        {/* <Link href="/create-kahoot" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out">
                            Create Your First Kahoot!
                        </Link> */}
                    </div>
                )}

                {!isLoading && !error && quizzes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {quizzes.map((quiz) => (
                            <QuizTile quiz={quiz} key={quiz.id} />
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
