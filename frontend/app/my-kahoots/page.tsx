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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
                            My Kahoots
                        </h1>
                        <p className="text-white/70 text-lg">
                            {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} ready to play
                        </p>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-4"></div>
                        <p className="text-2xl text-white font-semibold">
                            Loading your Kahoots...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div
                        className="text-center py-10 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 text-white px-6 py-6 rounded-2xl shadow-xl"
                        role="alert"
                    >
                        <div className="text-5xl mb-4">⚠️</div>
                        <strong className="font-bold text-xl block mb-2">Oops!</strong>
                        <span className="text-lg">{error}</span>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && quizzes.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 max-w-2xl mx-auto border-2 border-white/20">
                            <div className="text-7xl mb-6">📚</div>
                            <h2 className="text-3xl font-bold text-white mb-4">
                                No Kahoots Yet
                            </h2>
                            <p className="text-xl text-white/80 mb-8">
                                Create your first quiz to get started!
                            </p>
                        </div>
                    </div>
                )}

                {/* Quiz Grid */}
                {!isLoading && !error && quizzes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {quizzes.map((quiz) => (
                            <QuizTile quiz={quiz} key={quiz.id} />
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
